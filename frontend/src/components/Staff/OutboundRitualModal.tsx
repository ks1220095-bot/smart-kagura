import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Edit3, Trash2, ExternalLink } from 'lucide-react';
import type { CalendarEvent } from '../../types';
import { getApiUrl } from '../../config/api';
import { getInitialSaishuPresets, saveCustomSaishuPreset } from './Dashboard';

// ==========================================
// 1. 軽量インメモリ＆ローカルストレージ キャッシュ
// ==========================================
const EVENTS_CACHE_KEY = 'smart_kagura_events_cache_v1';
let memoryEventsCache: CalendarEvent[] | null = null;
let lastFetchTimestamp = 0;

export const isOutboundRitual = (e: CalendarEvent): boolean => {
  return e.event_type === 'outbound_ritual';
};

export const getCachedEventsSync = (): CalendarEvent[] => {
  if (memoryEventsCache) return memoryEventsCache;
  try {
    const raw = localStorage.getItem(EVENTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryEventsCache = parsed;
        return parsed;
      }
    }
  } catch (e) {}
  return [];
};

export const updateEventsCache = (list: CalendarEvent[]) => {
  memoryEventsCache = list;
  lastFetchTimestamp = Date.now();
  try {
    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(list));
  } catch (e) {}
};

export const fetchAllEventsCached = async (forceRefresh = false): Promise<CalendarEvent[]> => {
  const now = Date.now();
  if (!forceRefresh && memoryEventsCache && now - lastFetchTimestamp < 15000) {
    return memoryEventsCache;
  }
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/events`);
    if (res.ok) {
      const data: CalendarEvent[] = await res.json();
      updateEventsCache(data);
      return data;
    }
  } catch (e) {
    console.warn('Events fetch fallback to cache:', e);
  }
  return getCachedEventsSync();
};

// ==========================================
// 2. 出張祭プリセット定義
// ==========================================
export const OUTBOUND_RITUAL_PRESETS = [
  '地鎮祭',
  '家祓・新宅祭（入居清祓）',
  '竣工祭・落成祭',
  '解体清祓',
  '店舗・事務所清祓',
  '神棚奉斎・清祓',
  '井戸埋清祓',
  '伐木清祓',
  '上棟祭',
  '月次祭・邸内社祭',
  'その他（自由入力）'
];

export const OUTBOUND_FEE_PRESETS = [0, 10000, 20000, 30000, 35000, 50000];

export const OUTBOUND_PREP_TAGS = [
  '祭壇一式持参',
  '竹・縄・砂は業者手配',
  '竹・縄・砂も神社持参',
  '神饌（お供え）神社用意',
  '神饌は施主様用意',
  'お札・鎮物準備済',
  '送迎あり',
  '自車移動',
  '雨天時テントあり'
];

// 30分刻み＋15分刻み対応の時刻選択肢
export const OUTBOUND_TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 19; h++) {
  const hh = String(h).padStart(2, '0');
  ['00', '15', '30', '45'].forEach(mm => {
    OUTBOUND_TIME_OPTIONS.push(`${hh}:${mm}`);
  });
}

// 祭典時刻から移動を含む拘束時間（前後）を自動算出するヘルパー
const calcDefaultRangeFromCeremony = (ceremonyTime: string): { start: string; end: string } => {
  const parts = ceremonyTime.split(':');
  if (parts.length !== 2) return { start: '09:30', end: '11:30' };
  const totalMin = Number(parts[0]) * 60 + Number(parts[1]);
  const startMin = Math.max(7 * 60, totalMin - 30); // 30分前（移動開始）
  const endMin = Math.min(19 * 60 + 45, totalMin + 90); // 90分後（帰社目安）
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return { start: fmt(startMin), end: fmt(endMin) };
};

// ==========================================
// 3. 出張祭（外のお祓い）登録・編集モーダル
// ==========================================
interface OutboundRitualModalProps {
  isOpen: boolean;
  initialDate?: string;
  editingRitual?: CalendarEvent | null;
  onClose: () => void;
  onSaved: (savedEvent: CalendarEvent) => void;
}

export const OutboundRitualModal: React.FC<OutboundRitualModalProps> = ({
  isOpen,
  initialDate,
  editingRitual,
  onClose,
  onSaved
}) => {
  const getTodayStr = () => {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  };

  const [eventDate, setEventDate] = useState(initialDate || getTodayStr());
  const [ritualPreset, setRitualPreset] = useState('地鎮祭');
  const [customRitualName, setCustomRitualName] = useState('');
  const [ceremonyTime, setCeremonyTime] = useState('10:00');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('11:30');
  const [manualRangeTouched, setManualRangeTouched] = useState(false);
  const [isClosedSlot, setIsClosedSlot] = useState(true);

  const [applicantName, setApplicantName] = useState('');
  const [applicantKana, setApplicantKana] = useState('');
  const [builderName, setBuilderName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [saishu, setSaishu] = useState('');
  const [hatsuhoryo, setHatsuhoryo] = useState<number>(30000);
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid'>('unpaid');
  const [preparationNotes, setPreparationNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const saishuPresets = getInitialSaishuPresets();

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (editingRitual) {
      setEventDate(editingRitual.event_date);
      const rName = editingRitual.ritual_name || editingRitual.title || '地鎮祭';
      if (OUTBOUND_RITUAL_PRESETS.includes(rName) && rName !== 'その他（自由入力）') {
        setRitualPreset(rName);
        setCustomRitualName('');
      } else {
        setRitualPreset('その他（自由入力）');
        setCustomRitualName(rName);
      }
      setCeremonyTime(editingRitual.ceremony_time || editingRitual.start_time || '10:00');
      setStartTime(editingRitual.start_time || '09:30');
      setEndTime(editingRitual.end_time || '11:30');
      setManualRangeTouched(true);
      setIsClosedSlot(editingRitual.is_closed_slot === 1);
      setApplicantName(editingRitual.applicant_name || '');
      setApplicantKana(editingRitual.applicant_kana || '');
      setBuilderName(editingRitual.builder_name || '');
      setLocationAddress(editingRitual.location_address || '');
      setContactPhone(editingRitual.contact_phone || '');
      setSaishu(editingRitual.saishu || '');
      setHatsuhoryo(typeof editingRitual.hatsuhoryo === 'number' ? editingRitual.hatsuhoryo : 30000);
      setPaymentStatus(editingRitual.payment_status === 'paid' ? 'paid' : 'unpaid');
      setPreparationNotes(editingRitual.preparation_notes || editingRitual.description || '');
    } else {
      setEventDate(initialDate || getTodayStr());
      setRitualPreset('地鎮祭');
      setCustomRitualName('');
      setCeremonyTime('10:00');
      setStartTime('09:30');
      setEndTime('11:30');
      setManualRangeTouched(false);
      setIsClosedSlot(true);
      setApplicantName('');
      setApplicantKana('');
      setBuilderName('');
      setLocationAddress('');
      setContactPhone('');
      setSaishu('');
      setHatsuhoryo(30000);
      setPaymentStatus('unpaid');
      setPreparationNotes('');
    }
  }, [isOpen, initialDate, editingRitual]);

  if (!isOpen) return null;

  const handleCeremonyTimeChange = (newTime: string) => {
    setCeremonyTime(newTime);
    if (!manualRangeTouched) {
      const range = calcDefaultRangeFromCeremony(newTime);
      setStartTime(range.start);
      setEndTime(range.end);
    }
  };

  const handleAppendPrepTag = (tag: string) => {
    if (preparationNotes.includes(tag)) return;
    setPreparationNotes(prev => (prev.trim() ? `${prev.trim()} / ${tag}` : tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const resolvedRitualName = ritualPreset === 'その他（自由入力）'
      ? (customRitualName.trim() || '出張祭')
      : ritualPreset;

    if (!eventDate || !startTime || !endTime) {
      setErrorMsg('日付と時間を入力してください。');
      return;
    }
    if (startTime >= endTime) {
      setErrorMsg('拘束時間の終了時刻は開始時刻より後の時間を選択してください。');
      return;
    }

    // カレンダー表示用の簡潔なタイトルを自動生成
    const displayApplicant = applicantName.trim() || builderName.trim() || '';
    const autoTitle = displayApplicant
      ? `【出張祭】${resolvedRitualName}（${displayApplicant} 様）`
      : `【出張祭】${resolvedRitualName}`;

    const payload: CalendarEvent = {
      title: autoTitle,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      description: preparationNotes.trim() || undefined,
      is_closed_slot: isClosedSlot ? 1 : 0,
      event_type: 'outbound_ritual',
      ritual_name: resolvedRitualName,
      ceremony_time: ceremonyTime,
      applicant_name: applicantName.trim() || undefined,
      applicant_kana: applicantKana.trim() || undefined,
      builder_name: builderName.trim() || undefined,
      location_address: locationAddress.trim() || undefined,
      contact_phone: contactPhone.trim() || undefined,
      saishu: saishu.trim() || undefined,
      hatsuhoryo: Number(hatsuhoryo) || 0,
      payment_status: paymentStatus,
      preparation_notes: preparationNotes.trim() || undefined
    };

    setSaving(true);
    try {
      const apiUrl = getApiUrl();
      const url = editingRitual?.id
        ? `${apiUrl}/api/events/${editingRitual.id}`
        : `${apiUrl}/api/events`;
      const method = editingRitual?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '出張祭の保存に失敗しました。');
      }

      const data = await res.json();
      const savedItem: CalendarEvent = editingRitual?.id
        ? (data.updatedEvent || { ...payload, id: editingRitual.id })
        : data;

      if (payload.saishu) {
        saveCustomSaishuPreset(payload.saishu);
      }

      // キャッシュを即座に更新
      const currentCache = getCachedEventsSync();
      const nextCache = editingRitual?.id
        ? currentCache.map(item => (item.id === editingRitual.id ? savedItem : item))
        : [...currentCache, savedItem];
      updateEventsCache(nextCache);

      onSaved(savedItem);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '通信エラーが発生しました。');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      padding: '1rem',
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '92vh',
        boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3b2d54 0%, #231934 100%)',
          color: '#ffffff',
          padding: '0.95rem 1.35rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid var(--color-gold)'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🚗</span>
            {editingRitual?.id ? '出張祭（外のお祓い）の編集' : '出張祭（外のお祓い）の新規記録'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '50%',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {errorMsg && (
            <div style={{
              padding: '0.65rem 0.9rem',
              backgroundColor: '#ffebee',
              color: '#c62828',
              border: '1px solid #ef9a9a',
              borderRadius: '4px',
              fontSize: '0.85rem'
            }}>
              {errorMsg}
            </div>
          )}

          {/* 1. 祭典名・願意 */}
          <div style={{ backgroundColor: '#faf8fc', padding: '0.9rem 1rem', borderRadius: '6px', border: '1px solid #e2d9f3' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', color: '#3b2d54', marginBottom: '0.45rem' }}>
              ⛩️ 祭典名・お祓いの種類 <span style={{ color: 'var(--color-shu)' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: ritualPreset === 'その他（自由入力）' ? '0.6rem' : 0 }}>
              {OUTBOUND_RITUAL_PRESETS.map(preset => {
                const active = ritualPreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRitualPreset(preset)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.78rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: active ? 'bold' : 'normal',
                      backgroundColor: active ? '#5e4388' : '#ffffff',
                      color: active ? '#ffffff' : '#333333',
                      border: active ? '1px solid #5e4388' : '1px solid #d0c4e2',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
            {ritualPreset === 'その他（自由入力）' && (
              <input
                type="text"
                value={customRitualName}
                onChange={(e) => setCustomRitualName(e.target.value)}
                placeholder="祭典名を入力（例：起工式、安全祈願祭、船魂祭など）"
                required
                style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.85rem', border: '1px solid #b8a6d9', borderRadius: '4px', backgroundColor: '#fff' }}
              />
            )}
          </div>

          {/* 2. 日時・移動拘束時間・予約枠ロック */}
          <div style={{ backgroundColor: 'var(--color-washi)', padding: '0.9rem 1rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  📅 祭典日 <span style={{ color: 'var(--color-shu)' }}>*</span>
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.42rem 0.55rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#5e4388' }}>
                  ⏰ 現地 祭典開始時刻 <span style={{ color: 'var(--color-shu)' }}>*</span>
                </label>
                <select
                  value={ceremonyTime}
                  onChange={(e) => handleCeremonyTimeChange(e.target.value)}
                  style={{ width: '100%', padding: '0.42rem 0.55rem', fontSize: '0.88rem', fontWeight: 'bold', border: '1px solid #5e4388', borderRadius: '4px', backgroundColor: '#fff', color: '#3b2d54' }}
                >
                  {OUTBOUND_TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{t} 開始</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  🚗 移動を含む拘束時間（出発〜帰社）
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <select
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setManualRangeTouched(true);
                    }}
                    style={{ flex: 1, padding: '0.42rem 0.35rem', fontSize: '0.82rem', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
                  >
                    {OUTBOUND_TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>〜</span>
                  <select
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setManualRangeTouched(true);
                    }}
                    style={{ flex: 1, padding: '0.42rem 0.35rem', fontSize: '0.82rem', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
                  >
                    {OUTBOUND_TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{
              padding: '0.55rem 0.75rem',
              backgroundColor: isClosedSlot ? 'rgba(50, 136, 163, 0.08)' : '#ffffff',
              border: `1px solid ${isClosedSlot ? 'var(--color-mizuiro)' : '#ddd'}`,
              borderRadius: '4px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-urushi)' }}>
                <input
                  type="checkbox"
                  checked={isClosedSlot}
                  onChange={(e) => setIsClosedSlot(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>
                  🔒 この拘束時間帯（{startTime} 〜 {endTime}）の社内ご祈祷予約枠を自動クローズ（受付不可）にする
                </span>
              </label>
              <div style={{ fontSize: '0.73rem', color: 'var(--color-accent-gray)', marginLeft: '1.6rem', marginTop: '0.15rem' }}>
                ※他の神職が社内に残り、通常通り社内ご祈祷も受け付ける場合はチェックを外してください。
              </div>
            </div>
          </div>

          {/* 3. 施主・施工会社・現地住所・連絡先 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  👤 施主名・申込者名（個人名または法人名）
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="例：清瀧 太郎 / 株式会社〇〇"
                  style={{ width: '100%', padding: '0.42rem 0.6rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  フリガナ（任意）
                </label>
                <input
                  type="text"
                  value={applicantKana}
                  onChange={(e) => setApplicantKana(e.target.value)}
                  placeholder="例：セイリュウ タロウ"
                  style={{ width: '100%', padding: '0.42rem 0.6rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  🏢 施工会社・ハウスメーカー・担当者名（任意）
                </label>
                <input
                  type="text"
                  value={builderName}
                  onChange={(e) => setBuilderName(e.target.value)}
                  placeholder="例：〇〇工務店（担当：佐藤様）"
                  style={{ width: '100%', padding: '0.42rem 0.6rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  📞 当日連絡先電話番号
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="例：090-1234-5678"
                  style={{ width: '100%', padding: '0.42rem 0.6rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>
                  📍 出張先・現地住所（斎場場所）
                </label>
                {locationAddress.trim() && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationAddress.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--color-mizuiro)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 'bold' }}
                  >
                    <ExternalLink size={12} />
                    Googleマップで確認
                  </a>
                )}
              </div>
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="例：千葉県浦安市堀江4-1-5（〇〇様邸 新築工事現場）"
                style={{ width: '100%', padding: '0.42rem 0.6rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          </div>

          {/* 4. 担当神職（斎主）・初穂料・納付状況 */}
          <div style={{ backgroundColor: '#fcfaf5', padding: '0.9rem 1rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              {/* 斎主 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  👔 担当神職（斎主・奉仕者）
                </label>
                <input
                  type="text"
                  value={saishu}
                  onChange={(e) => setSaishu(e.target.value)}
                  placeholder="神職名を入力または下から選択"
                  style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', marginBottom: '0.35rem' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {saishuPresets.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSaishu(p)}
                      style={{
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.72rem',
                        borderRadius: '3px',
                        border: saishu === p ? '1px solid var(--color-gold)' : '1px solid #ddd',
                        backgroundColor: saishu === p ? '#fff9e6' : '#fff',
                        color: 'var(--color-urushi)',
                        fontWeight: saishu === p ? 'bold' : 'normal',
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* 初穂料＆支払ステータス */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  💴 初穂料（玉串料）＆ 納付状況
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <input
                    type="number"
                    step={1000}
                    min={0}
                    value={hatsuhoryo}
                    onChange={(e) => setHatsuhoryo(Number(e.target.value))}
                    style={{ flex: 1, padding: '0.4rem 0.55rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>円</span>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'unpaid' | 'paid')}
                    style={{
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      backgroundColor: paymentStatus === 'paid' ? '#e8f5e9' : '#fff3e0',
                      color: paymentStatus === 'paid' ? '#2e7d32' : '#e65100',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="unpaid">未納（当日拝受）</option>
                    <option value="paid">納め済</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {OUTBOUND_FEE_PRESETS.map(fee => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setHatsuhoryo(fee)}
                      style={{
                        padding: '0.15rem 0.4rem',
                        fontSize: '0.7rem',
                        borderRadius: '3px',
                        border: hatsuhoryo === fee ? '1px solid var(--color-mizuiro)' : '1px solid #ddd',
                        backgroundColor: hatsuhoryo === fee ? 'var(--color-mizuiro-light)' : '#fff',
                        color: hatsuhoryo === fee ? 'var(--color-mizuiro)' : '#555',
                        cursor: 'pointer'
                      }}
                    >
                      {fee === 0 ? '未定/0円' : `¥${fee.toLocaleString()}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. 準備物・現地手配メモ */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
              📝 準備物・現地手配・送迎メモ
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
              {OUTBOUND_PREP_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAppendPrepTag(tag)}
                  style={{
                    padding: '0.18rem 0.5rem',
                    fontSize: '0.72rem',
                    borderRadius: '12px',
                    border: '1px solid #d0c4e2',
                    backgroundColor: '#faf8fc',
                    color: '#4a356b',
                    cursor: 'pointer'
                  }}
                >
                  ＋ {tag}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={preparationNotes}
              onChange={(e) => setPreparationNotes(e.target.value)}
              placeholder="例：竹・縄・砂は施工業者が手配。神社からは祭壇・神饌・お札を持参。9:30に担当者様が社務所へお迎え。"
              style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.83rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'inherit' }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', borderTop: '1px solid #eee', paddingTop: '0.85rem', marginTop: '0.2rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{
                padding: '0.45rem 1.4rem',
                fontSize: '0.85rem',
                backgroundColor: '#5e4388',
                borderColor: '#5e4388',
                color: '#ffffff',
                fontWeight: 'bold'
              }}
            >
              {saving ? '保存中...' : editingRitual?.id ? '変更を保存する' : '🚗 出張祭を登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ==========================================
// 4. 出張祭 表示カードコンポーネント（ダッシュボード＆カレンダー共通）
// ==========================================
interface OutboundRitualCardProps {
  ritual: CalendarEvent;
  showDate?: boolean;
  compact?: boolean;
  onEdit: (ritual: CalendarEvent) => void;
  onDelete: (ritual: CalendarEvent) => void;
  onTogglePaid?: (ritual: CalendarEvent) => void;
}

export const OutboundRitualCard: React.FC<OutboundRitualCardProps> = ({
  ritual,
  showDate = false,
  compact = false,
  onEdit,
  onDelete,
  onTogglePaid
}) => {
  const ritualLabel = ritual.ritual_name || ritual.title.replace(/^【出張祭】/, '');
  const ceremonyTime = ritual.ceremony_time || ritual.start_time;
  const isPaid = ritual.payment_status === 'paid';
  const fee = ritual.hatsuhoryo || 0;

  return (
    <div style={{
      backgroundColor: '#fdfcfe',
      border: '1px solid #dcd0ec',
      borderLeft: '4px solid #5e4388',
      borderRadius: '4px',
      padding: compact ? '0.6rem 0.8rem' : '0.8rem 1rem',
      boxShadow: '0 1px 4px rgba(94, 67, 136, 0.06)'
    }}>
      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span style={{
            backgroundColor: '#5e4388',
            color: '#ffffff',
            fontSize: '0.72rem',
            fontWeight: 'bold',
            padding: '2px 7px',
            borderRadius: '3px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            🚗 出張祭
          </span>

          {showDate && (
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#3b2d54', backgroundColor: '#f3eef9', padding: '1px 6px', borderRadius: '3px' }}>
              {ritual.event_date.replace(/-/g, '/')}
            </span>
          )}

          <span style={{
            fontSize: '0.85rem',
            fontWeight: 'bold',
            fontFamily: 'var(--font-serif)',
            color: '#3b2d54'
          }}>
            祭典 {ceremonyTime}
          </span>

          <span style={{
            fontSize: '0.72rem',
            color: '#666',
            backgroundColor: '#f5f5f5',
            padding: '1px 6px',
            borderRadius: '3px',
            border: '1px solid #e0e0e0'
          }}>
            拘束 {ritual.start_time}〜{ritual.end_time}
          </span>

          {ritual.is_closed_slot === 1 && (
            <span style={{
              fontSize: '0.68rem',
              backgroundColor: 'rgba(50, 136, 163, 0.12)',
              color: 'var(--color-mizuiro)',
              padding: '1px 5px',
              borderRadius: '3px',
              fontWeight: 'bold'
            }}>
              🔒 社内枠ロック中
            </span>
          )}

          <strong style={{ fontSize: '0.92rem', color: 'var(--color-urushi)' }}>
            {ritualLabel}
          </strong>
          {ritual.applicant_name && (
            <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--color-urushi)' }}>
              — {ritual.applicant_name} 様
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {onTogglePaid && (
            <button
              type="button"
              onClick={() => onTogglePaid(ritual)}
              title="クリックで支払済/未納を切り替え"
              style={{
                padding: '0.15rem 0.5rem',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                borderRadius: '3px',
                cursor: 'pointer',
                border: isPaid ? '1px solid #81c784' : '1px solid #ffb74d',
                backgroundColor: isPaid ? '#e8f5e9' : '#fff3e0',
                color: isPaid ? '#2e7d32' : '#e65100'
              }}
            >
              {isPaid ? '✓ 納め済' : '未納'} (¥{fee.toLocaleString()})
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(ritual)}
            style={{
              padding: '0.2rem 0.45rem',
              fontSize: '0.72rem',
              backgroundColor: '#fff',
              border: '1px solid var(--color-gold)',
              color: 'var(--color-urushi)',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}
          >
            <Edit3 size={11} />
            編集
          </button>
          <button
            type="button"
            onClick={() => onDelete(ritual)}
            style={{
              padding: '0.2rem 0.4rem',
              fontSize: '0.72rem',
              backgroundColor: '#fff',
              border: '1px solid #e0b4b4',
              color: '#c93a3a',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.15rem'
            }}
          >
            <Trash2 size={11} />
            削除
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '0.35rem 0.85rem',
        fontSize: '0.78rem',
        color: '#444',
        backgroundColor: '#f8f5fc',
        padding: '0.45rem 0.7rem',
        borderRadius: '4px'
      }}>
        {ritual.location_address && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>
              <strong>📍 現地住所：</strong>{ritual.location_address}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ritual.location_address)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.72rem',
                backgroundColor: '#ffffff',
                border: '1px solid #5e4388',
                color: '#5e4388',
                padding: '1px 7px',
                borderRadius: '3px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                whiteSpace: 'nowrap'
              }}
            >
              <MapPin size={11} />
              地図を開く
            </a>
          </div>
        )}
        {ritual.builder_name && (
          <div><strong>🏢 施工・担当：</strong>{ritual.builder_name}</div>
        )}
        {ritual.contact_phone && (
          <div>
            <strong>📞 連絡先：</strong>
            <a href={`tel:${ritual.contact_phone}`} style={{ color: 'var(--color-mizuiro)', textDecoration: 'none', fontWeight: 'bold' }}>
              {ritual.contact_phone}
            </a>
          </div>
        )}
        {ritual.saishu && (
          <div><strong>👔 担当神職：</strong><span style={{ color: '#3b2d54', fontWeight: 'bold' }}>{ritual.saishu}</span></div>
        )}
        {(ritual.preparation_notes || ritual.description) && (
          <div style={{ gridColumn: '1 / -1', color: '#555', borderTop: '1px dashed #e2d9f3', paddingTop: '0.25rem', marginTop: '0.1rem' }}>
            <strong>📝 準備・手配メモ：</strong>{ritual.preparation_notes || ritual.description}
          </div>
        )}
      </div>
    </div>
  );
};
