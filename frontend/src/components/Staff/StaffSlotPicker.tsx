import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, CheckCircle2, AlertTriangle, XCircle, Lock, Plus } from 'lucide-react';
import type { Booking } from '../../types';
import { getApiUrl } from '../../config/api';
import { getRokuyoAndInu } from '../Visitor/SlotSelector';

export const ALL_STAFF_TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00'
];

export const REGULAR_STAFF_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

export function getJstTodayString(): string {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
    .toLocaleDateString('sv-SE');
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

export interface ComputedSlotStatus {
  time: string;
  count: number;
  orgCount: number;
  maxCapacity: number;
  remaining: number;
  isClosedEvent: boolean;
  closedEventTitle?: string;
  hasOrg: boolean;
  orgNames: string[];
  isFull: boolean;
  isOrgConflict: boolean;
  statusCode: 'OPEN' | 'FEW' | 'FULL' | 'ORG_FULL' | 'INDIV_EXISTS' | 'LOCK';
  shortBadge: string;
  optionLabel: string;
  detailText: string;
}

export function computeSlotStatusesForDate(
  date: string,
  bookings: Booking[],
  events: any[],
  maxCapacity: number,
  bookingType: 'individual' | 'organization' = 'individual',
  excludeBookingIds: number[] = []
): ComputedSlotStatus[] {
  return ALL_STAFF_TIME_SLOTS.map(slot => {
    const slotBookings = bookings.filter(
      b =>
        b.booking_date === date &&
        b.booking_time === slot &&
        Number(b.is_cancelled) === 0 &&
        !(b.id && excludeBookingIds.includes(b.id))
    );

    const count = slotBookings.length;
    const orgBookings = slotBookings.filter(b => b.booking_type === 'organization');
    const orgCount = orgBookings.length;
    const hasOrg = orgCount > 0;
    const orgNames = orgBookings.map(b => b.company_name || '団体').filter(Boolean);

    const closedEvent = events.find((event: any) => {
      if (Number(event.is_closed_slot) !== 1) return false;
      const slotMin = timeToMinutes(slot);
      const startMin = timeToMinutes(event.start_time);
      const endMin = timeToMinutes(event.end_time);
      return slotMin >= startMin && slotMin < endMin;
    });
    const isClosedEvent = !!closedEvent;
    const closedEventTitle = closedEvent?.title || '祭典・行事';

    const rawRemaining = hasOrg ? 0 : Math.max(0, maxCapacity - count);
    const remaining = isClosedEvent ? 0 : rawRemaining;
    const isOrgConflict = bookingType === 'organization' && count > 0 && !hasOrg;
    const isFull = remaining === 0 || isClosedEvent || hasOrg || isOrgConflict;

    let statusCode: ComputedSlotStatus['statusCode'] = 'OPEN';
    let shortBadge = `〇 空き${remaining}枠 (${count}/${maxCapacity})`;
    let optionLabel = `${slot} ── 〇 空き ${remaining}枠 （現在 ${count}/${maxCapacity}組）`;
    let detailText = `空き ${remaining} 枠（現在 ${count} / ${maxCapacity} 組予約）`;

    if (isClosedEvent) {
      statusCode = 'LOCK';
      shortBadge = `🔒 受付停止 (予約${count})`;
      optionLabel = `${slot} ── 🔒 受付停止 [${closedEventTitle}] （現在 ${count}組）`;
      detailText = `受付停止中（${closedEventTitle} / 現在 ${count} 組予約）`;
    } else if (hasOrg) {
      statusCode = 'ORG_FULL';
      shortBadge = `× 団体貸切 (空き0枠)`;
      optionLabel = `${slot} ── × 空き 0枠 [団体貸切] （現在 ${count}組）`;
      detailText = `空き 0 枠・団体貸切枠（${orgNames.join('・')} 様 / 計 ${count} 件）`;
    } else if (isOrgConflict) {
      statusCode = 'INDIV_EXISTS';
      shortBadge = `⚠️ 個人${count}組あり`;
      optionLabel = `${slot} ── ⚠️ 個人予約あり（現在 ${count}組 ※団体貸切は空枠推奨）`;
      detailText = `個人予約が ${count} 組入っています（団体参拝は空枠推奨・例外登録可）`;
    } else if (remaining === 0) {
      statusCode = 'FULL';
      shortBadge = `× 空き0枠 (${count}/${maxCapacity})`;
      optionLabel = `${slot} ── × 空き 0枠 [満席] （現在 ${count}/${maxCapacity}組）`;
      detailText = `空き 0 枠・満席（現在 ${count} / ${maxCapacity} 組予約）`;
    } else if (remaining <= 3) {
      statusCode = 'FEW';
      shortBadge = `▲ 残り${remaining}枠 (${count}/${maxCapacity})`;
      optionLabel = `${slot} ── ▲ 残り ${remaining}枠 （現在 ${count}/${maxCapacity}組）`;
      detailText = `残りわずか：空き ${remaining} 枠（現在 ${count} / ${maxCapacity} 組予約）`;
    }

    return {
      time: slot,
      count,
      orgCount,
      maxCapacity,
      remaining,
      isClosedEvent,
      closedEventTitle,
      hasOrg,
      orgNames,
      isFull,
      isOrgConflict,
      statusCode,
      shortBadge,
      optionLabel,
      detailText
    };
  });
}

interface StaffSlotPickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
  bookings: Booking[];
  bookingType?: 'individual' | 'organization';
  excludeBookingIds?: number[];
  dateLabel?: string;
  timeLabel?: string;
  required?: boolean;
}

export const StaffSlotPicker: React.FC<StaffSlotPickerProps> = ({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  bookings,
  bookingType = 'individual',
  excludeBookingIds = [],
  dateLabel = '希望参拝日',
  timeLabel = '希望時間割',
  required = true
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [maxCapacity, setMaxCapacity] = useState<number>(8);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
  const [showExtendedSlots, setShowExtendedSlots] = useState<boolean>(false);

  // Fetch max_groups_per_slot setting
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/settings`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.max_groups_per_slot) {
            setMaxCapacity(parseInt(data.max_groups_per_slot, 10) || 8);
          }
        }
      } catch (_) {}
    };
    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch closed events for selectedDate
  useEffect(() => {
    if (!selectedDate) {
      setEvents([]);
      return;
    }
    let isMounted = true;
    const fetchDateEvents = async () => {
      setLoadingEvents(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/events?date=${selectedDate}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch (_) {
        if (isMounted) setEvents([]);
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    };
    fetchDateEvents();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Automatically show extended slots if selectedTime is outside 09:00-16:30
  useEffect(() => {
    if (selectedTime && !REGULAR_STAFF_TIME_SLOTS.includes(selectedTime)) {
      setShowExtendedSlots(true);
    }
  }, [selectedTime]);

  const slotStatuses = selectedDate
    ? computeSlotStatusesForDate(selectedDate, bookings, events, maxCapacity, bookingType, excludeBookingIds)
    : [];

  const currentSlot = slotStatuses.find(s => s.time === selectedTime);
  const { rokuyo, isInu } = selectedDate ? getRokuyoAndInu(selectedDate) : { rokuyo: '', isInu: false };

  const visibleGridSlots = showExtendedSlots
    ? slotStatuses
    : slotStatuses.filter(s => REGULAR_STAFF_TIME_SLOTS.includes(s.time) || s.count > 0 || s.time === selectedTime);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.65rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span>
              {dateLabel} {required && <span className="required">*</span>}
            </span>
            {selectedDate && rokuyo && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 'normal' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  backgroundColor: rokuyo === '大安' ? 'rgba(62, 122, 92, 0.12)' : 'rgba(125, 122, 116, 0.12)',
                  color: rokuyo === '大安' ? 'var(--color-accent-green)' : 'var(--color-accent-gray)',
                  border: `1px solid ${rokuyo === '大安' ? 'var(--color-accent-green)' : 'var(--color-border)'}`,
                  padding: '0.05rem 0.4rem',
                  borderRadius: '3px'
                }}>
                  {rokuyo}
                </span>
                {isInu && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(200, 122, 45, 0.12)',
                    color: 'var(--color-accent-orange)',
                    border: '1px solid var(--color-accent-orange)',
                    padding: '0.05rem 0.4rem',
                    borderRadius: '3px'
                  }}>
                    🐕 戌の日
                  </span>
                )}
              </span>
            )}
          </label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            required={required}
            style={{ border: '1px solid var(--color-gold)', backgroundColor: '#fcfaf5', fontWeight: 600 }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>
            {timeLabel} {required && <span className="required">*</span>}
            <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--color-accent-gray)', marginLeft: '0.35rem' }}>
              （空き枠数表示）
            </span>
          </label>
          <select
            className="form-control"
            value={selectedTime}
            onChange={(e) => onTimeChange(e.target.value)}
            required={required}
            style={{ border: '1px solid var(--color-gold)', backgroundColor: '#fcfaf5', fontWeight: 600 }}
          >
            {!ALL_STAFF_TIME_SLOTS.includes(selectedTime) && selectedTime && (
              <option value={selectedTime}>{selectedTime}</option>
            )}
            {selectedDate
              ? slotStatuses.map(s => (
                  <option key={s.time} value={s.time}>
                    {s.optionLabel}
                  </option>
                ))
              : ALL_STAFF_TIME_SLOTS.map(t => (
                  <option key={t} value={t}>
                    {t} （日付を選択すると空き枠が表示されます）
                  </option>
                ))}
          </select>
        </div>
      </div>

      {/* 日付未選択時の案内 */}
      {!selectedDate ? (
        <div style={{
          padding: '0.65rem 0.85rem',
          backgroundColor: '#f8fafc',
          border: '1px dashed var(--color-gold)',
          borderRadius: '4px',
          fontSize: '0.8rem',
          color: 'var(--color-urushi)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <span>📅 参拝日を選択すると、各時間枠の空き枠数（残り枠数・予約件数・祭典ロック）が一覧表示されます。</span>
          <button
            type="button"
            onClick={() => onDateChange(getJstTodayString())}
            className="btn btn-outline-gold"
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', backgroundColor: '#fff' }}
          >
            今日の日付をセット
          </button>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#faf7f0',
          border: '1px solid var(--color-gold)',
          borderRadius: '6px',
          padding: '0.75rem',
          fontSize: '0.8rem'
        }}>
          {/* 現在選択中の日時に対する空き枠サマリーバー */}
          {currentSlot && (
            <div style={{
              marginBottom: '0.65rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              backgroundColor:
                currentSlot.statusCode === 'OPEN'
                  ? '#ecfdf5'
                  : currentSlot.statusCode === 'FEW'
                    ? '#fffbeb'
                    : '#fff1f0',
              border:
                currentSlot.statusCode === 'OPEN'
                  ? '1px solid #6ee7b7'
                  : currentSlot.statusCode === 'FEW'
                    ? '1px solid #fcd34d'
                    : '1px solid #ffa39e',
              color:
                currentSlot.statusCode === 'OPEN'
                  ? '#065f46'
                  : currentSlot.statusCode === 'FEW'
                    ? '#92400e'
                    : '#cf1322'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 'bold', fontSize: '0.84rem' }}>
                {currentSlot.statusCode === 'OPEN' && <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />}
                {currentSlot.statusCode === 'FEW' && <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />}
                {currentSlot.statusCode === 'LOCK' && <Lock size={16} style={{ color: '#cf1322', flexShrink: 0 }} />}
                {(currentSlot.statusCode === 'FULL' || currentSlot.statusCode === 'ORG_FULL' || currentSlot.statusCode === 'INDIV_EXISTS') && (
                  <XCircle size={16} style={{ color: '#cf1322', flexShrink: 0 }} />
                )}
                <span>
                  選択中：【{selectedDate} {selectedTime}の回】 {currentSlot.detailText}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                {loadingEvents ? '行事確認中...' : `上限設定: 1枠最大${maxCapacity}組`}
              </span>
            </div>
          )}

          {/* 時間枠別空き状況グリッドヘッダー */}
          <div style={{
            fontWeight: 'bold',
            color: 'var(--color-urushi)',
            marginBottom: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={14} style={{ color: 'var(--color-gold)' }} />
              {selectedDate} の時間枠別 空き枠一覧（クリックで時間を選択）
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowExtendedSlots(prev => !prev)}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: '3px',
                  padding: '0.15rem 0.5rem',
                  fontSize: '0.7rem',
                  color: 'var(--color-urushi)',
                  cursor: 'pointer'
                }}
              >
                {showExtendedSlots ? '定常時間枠（09:00〜16:30）のみ表示' : '＋ 早朝・夕方枠（07:00〜08:30 / 17:00）も表示'}
              </button>
            </div>
          </div>

          {/* 時間枠ボタングリッド（スクロール隠れなし・全枠一目で確認可能） */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))',
            gap: '0.4rem'
          }}>
            {visibleGridSlots.map(s => {
              const isSelected = selectedTime === s.time;

              let btnBg = '#ffffff';
              let btnColor = 'var(--color-urushi)';
              let btnBorder = '1px solid #d9d9d9';
              let statusBadgeColor = 'var(--color-accent-green)';

              if (s.statusCode === 'OPEN') {
                statusBadgeColor = '#137333';
                btnBorder = '1px solid #b7eb8f';
              } else if (s.statusCode === 'FEW') {
                btnBg = '#fffdf5';
                statusBadgeColor = '#d46b08';
                btnBorder = '1px solid #ffe58f';
              } else if (s.statusCode === 'LOCK') {
                btnBg = '#f0f5ff';
                btnColor = '#1d39c4';
                statusBadgeColor = '#1d39c4';
                btnBorder = '1px solid #adc6ff';
              } else {
                btnBg = '#fff1f0';
                btnColor = '#cf1322';
                statusBadgeColor = '#cf1322';
                btnBorder = '1px solid #ffa39e';
              }

              if (isSelected) {
                if (s.isFull) {
                  btnBg = '#cf1322';
                  btnColor = '#ffffff';
                  statusBadgeColor = '#ffffff';
                  btnBorder = '2px solid #820014';
                } else {
                  btnBg = 'var(--color-mizuiro)';
                  btnColor = '#ffffff';
                  statusBadgeColor = '#ffffff';
                  btnBorder = '2px solid #1f5f75';
                }
              }

              return (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => onTimeChange(s.time)}
                  title={`${s.time}の回：${s.detailText}`}
                  style={{
                    backgroundColor: btnBg,
                    color: btnColor,
                    border: btnBorder,
                    borderRadius: '4px',
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: '0.15rem',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.82rem', fontFamily: 'var(--font-serif)' }}>
                      {s.time}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 'bold',
                      color: statusBadgeColor
                    }}>
                      {s.statusCode === 'LOCK'
                        ? '🔒停止'
                        : s.statusCode === 'ORG_FULL'
                          ? '×団体貸切'
                          : s.statusCode === 'INDIV_EXISTS'
                            ? `⚠️個人${s.count}組`
                            : s.statusCode === 'FULL'
                              ? '×空き0枠'
                              : s.statusCode === 'FEW'
                                ? `▲残${s.remaining}枠`
                                : `〇空き${s.remaining}枠`}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.64rem',
                    textAlign: 'right',
                    opacity: isSelected ? 0.95 : 0.75
                  }}>
                    {s.statusCode === 'LOCK'
                      ? `${s.closedEventTitle} (予約${s.count}組)`
                      : s.statusCode === 'ORG_FULL'
                        ? `団体予約済 (${s.count}件)`
                        : `現在 ${s.count}/${s.maxCapacity}組 予約`}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 満席枠・受付停止枠・団体重複枠への職員例外登録インジケータ */}
          {currentSlot && currentSlot.isFull && (
            <div style={{
              marginTop: '0.65rem',
              padding: '0.55rem 0.75rem',
              backgroundColor: '#fff2e8',
              border: '1px solid #ffbb96',
              borderRadius: '4px',
              fontSize: '0.78rem',
              color: '#d4380d',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              lineHeight: '1.45'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, color: '#fa541c' }} />
              <div>
                <strong>【職員例外枠】</strong>
                選択された <strong>{selectedTime}</strong> の枠は現在{' '}
                <strong>{currentSlot.detailText}</strong> ですが、職員権限により<strong>特別枠として登録・変更が可能</strong>です。
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface DateSlotSummaryBarProps {
  date: string;
  onDateChange: (date: string) => void;
  bookings: Booking[];
  onSelectSlotForManualAdd?: (date: string, time: string) => void;
}

export const DateSlotSummaryBar: React.FC<DateSlotSummaryBarProps> = ({
  date,
  onDateChange,
  bookings,
  onSelectSlotForManualAdd
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [maxCapacity, setMaxCapacity] = useState<number>(8);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const effectiveDate = date || getJstTodayString();

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/settings`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.max_groups_per_slot) {
            setMaxCapacity(parseInt(data.max_groups_per_slot, 10) || 8);
          }
        }
      } catch (_) {}
    };
    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!effectiveDate) return;
    let isMounted = true;
    const fetchDateEvents = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/events?date=${effectiveDate}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch (_) {
        if (isMounted) setEvents([]);
      }
    };
    fetchDateEvents();
    return () => {
      isMounted = false;
    };
  }, [effectiveDate]);

  // Automatically expand when user filters by a specific date in BookingsList
  useEffect(() => {
    if (date) {
      setIsOpen(true);
    }
  }, [date]);

  const slotStatuses = computeSlotStatusesForDate(effectiveDate, bookings, events, maxCapacity, 'individual', []);
  const regularSlots = slotStatuses.filter(s => REGULAR_STAFF_TIME_SLOTS.includes(s.time) || s.count > 0);
  const { rokuyo, isInu } = getRokuyoAndInu(effectiveDate);

  return (
    <div className="card" style={{ padding: '0.85rem 1.15rem', marginBottom: '1.25rem', backgroundColor: '#faf7f0', border: '1px solid var(--color-gold)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.88rem', color: 'var(--color-urushi)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-serif)' }}>
            <Calendar size={16} style={{ color: 'var(--color-gold)' }} />
            指定日の時間別 空き枠状況・手動登録
          </span>
          <input
            type="date"
            className="form-control"
            value={effectiveDate}
            onChange={(e) => {
              onDateChange(e.target.value);
              setIsOpen(true);
            }}
            style={{ width: '150px', padding: '0.2rem 0.45rem', fontSize: '0.82rem', height: 'auto', border: '1px solid var(--color-gold)', backgroundColor: '#ffffff', fontWeight: 600 }}
          />
          {rokuyo && (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 'bold',
              backgroundColor: rokuyo === '大安' ? 'rgba(62, 122, 92, 0.12)' : 'rgba(125, 122, 116, 0.12)',
              color: rokuyo === '大安' ? 'var(--color-accent-green)' : 'var(--color-accent-gray)',
              border: `1px solid ${rokuyo === '大安' ? 'var(--color-accent-green)' : 'var(--color-border)'}`,
              padding: '0.1rem 0.45rem',
              borderRadius: '3px'
            }}>
              {rokuyo}
            </span>
          )}
          {isInu && (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 'bold',
              backgroundColor: 'rgba(200, 122, 45, 0.12)',
              color: 'var(--color-accent-orange)',
              border: '1px solid var(--color-accent-orange)',
              padding: '0.1rem 0.45rem',
              borderRadius: '3px'
            }}>
              🐕 戌の日
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onSelectSlotForManualAdd && (
            <button
              type="button"
              onClick={() => onSelectSlotForManualAdd(effectiveDate, '09:30')}
              className="btn btn-primary"
              style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
            >
              <Plus size={14} />
              この日で手動登録
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            className="btn btn-outline-gold"
            style={{ padding: '0.28rem 0.65rem', fontSize: '0.76rem', backgroundColor: '#ffffff', cursor: 'pointer' }}
          >
            {isOpen ? '空き枠一覧を閉じる ▲' : '時間別の空き枠を表示 ▼'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px dashed rgba(197, 160, 89, 0.4)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-accent-gray)', marginBottom: '0.45rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem' }}>
            <span>※時間枠をクリックすると、その日付・時間がセットされた状態で「電話受付（手動登録）」が開きます。</span>
            <span>（1枠上限: 最大{maxCapacity}組）</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(122px, 1fr))',
            gap: '0.35rem'
          }}>
            {regularSlots.map(s => {
              let bg = '#ffffff';
              let border = '1px solid #b7eb8f';
              let badgeColor = '#137333';

              if (s.statusCode === 'FEW') {
                bg = '#fffdf5';
                border = '1px solid #ffe58f';
                badgeColor = '#d46b08';
              } else if (s.statusCode === 'LOCK') {
                bg = '#f0f5ff';
                border = '1px solid #adc6ff';
                badgeColor = '#1d39c4';
              } else if (s.isFull) {
                bg = '#fff1f0';
                border = '1px solid #ffa39e';
                badgeColor = '#cf1322';
              }

              return (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => onSelectSlotForManualAdd && onSelectSlotForManualAdd(effectiveDate, s.time)}
                  title={`${effectiveDate} ${s.time}：${s.detailText}（クリックで手動登録）`}
                  style={{
                    backgroundColor: bg,
                    border,
                    borderRadius: '4px',
                    padding: '0.3rem 0.45rem',
                    cursor: onSelectSlotForManualAdd ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.1rem',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.78rem', color: 'var(--color-urushi)', fontFamily: 'var(--font-serif)' }}>
                      {s.time}
                    </span>
                    <span style={{ fontSize: '0.66rem', fontWeight: 'bold', color: badgeColor }}>
                      {s.statusCode === 'LOCK'
                        ? '🔒停止'
                        : s.statusCode === 'ORG_FULL'
                          ? '×団体貸切'
                          : s.statusCode === 'FULL'
                            ? '×空き0枠'
                            : s.statusCode === 'FEW'
                              ? `▲残${s.remaining}枠`
                              : `〇空き${s.remaining}枠`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#666', textAlign: 'right' }}>
                    {s.statusCode === 'ORG_FULL' ? '団体貸切' : `予約 ${s.count}/${s.maxCapacity}組`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSlotPicker;
