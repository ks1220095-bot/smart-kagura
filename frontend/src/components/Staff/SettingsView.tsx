import React, { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [maxCapacity, setMaxCapacity] = useState<number>(8);
  const [isBookingActive, setIsBookingActive] = useState<boolean>(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/settings`);
      if (!res.ok) throw new Error('設定の取得に失敗しました。');
      const data = await res.json();
      if (data.max_groups_per_slot) {
        setMaxCapacity(parseInt(data.max_groups_per_slot));
      }
      setIsBookingActive(data.is_booking_active !== 'false');
      setMaintenanceMessage(data.maintenance_message || '現在、オンラインでのご祈祷予約の受付を一時的に停止しております。お急ぎの場合は、神社社務所まで直接お電話（047-351-5417）にてお問い合わせください。');
    } catch (err: any) {
      console.error('Settings fetch error:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // 1. Save max capacity
      const res1 = await fetch(`${apiUrl}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'max_groups_per_slot', value: String(maxCapacity) })
      });
      if (!res1.ok) throw new Error('最大組数の保存に失敗しました。');

      // 2. Save booking active status
      const res2 = await fetch(`${apiUrl}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'is_booking_active', value: String(isBookingActive) })
      });
      if (!res2.ok) throw new Error('予約受付状況の保存に失敗しました。');

      // 3. Save maintenance message
      const res3 = await fetch(`${apiUrl}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'maintenance_message', value: maintenanceMessage })
      });
      if (!res3.ok) throw new Error('案内メッセージの保存に失敗しました。');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="card kamidana-border">
        <h3 style={{ 
          fontSize: '1.15rem', 
          fontFamily: 'var(--font-serif)', 
          borderBottom: '1px solid var(--color-border)', 
          paddingBottom: '0.4rem', 
          marginBottom: '1.5rem' 
        }}>
          システム管理設定
        </h3>

        <form onSubmit={handleSave}>
          {/* Booking activation status switcher */}
          <div className="form-group" style={{ marginBottom: '1.5rem', borderBottom: '1px dashed var(--color-border)', paddingBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
              一般向けオンライン予約受付状況
            </label>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: isBookingActive ? 'bold' : 'normal' }}>
                <input 
                  type="radio" 
                  checked={isBookingActive === true} 
                  onChange={() => setIsBookingActive(true)}
                  style={{ accentColor: 'var(--color-accent-green)' }} 
                />
                <span style={{ color: 'var(--color-accent-green)' }}>🟢 受付中（一般公開）</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: !isBookingActive ? 'bold' : 'normal' }}>
                <input 
                  type="radio" 
                  checked={isBookingActive === false} 
                  onChange={() => setIsBookingActive(false)}
                  style={{ accentColor: 'var(--color-shu)' }} 
                />
                <span style={{ color: 'var(--color-shu)' }}>🔴 受付停止（非公開・案内メッセージ表示）</span>
              </label>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', display: 'block', marginTop: '0.5rem', lineHeight: '1.5' }}>
              ※「受付停止」にすると、一般公開されている予約フォーム画面が自動的にお知らせメッセージに切り替わり、新規のWeb予約をブロックします。（すでに予約が完了している方の変更・キャンセルは引き続き可能です）
            </span>
          </div>

          {/* Maintenance custom message editor */}
          {!isBookingActive && (
            <div className="form-group" style={{ marginBottom: '1.5rem', borderBottom: '1px dashed var(--color-border)', paddingBottom: '1.5rem', backgroundColor: 'rgba(211, 56, 28, 0.03)', padding: '1rem', border: '1px solid #ffa39e', borderRadius: '4px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem', color: 'var(--color-urushi)' }}>
                受付停止時に表示する案内メッセージ
              </label>
              <textarea
                className="form-control"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                rows={4}
                placeholder="現在、予約受付を停止している理由や案内文を入力してください。"
                style={{ 
                  width: '100%', 
                  border: '1px solid var(--color-border)', 
                  resize: 'vertical',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  marginTop: '0.25rem',
                  backgroundColor: '#ffffff'
                }}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', display: 'block', marginTop: '0.4rem', lineHeight: '1.5' }}>
                ※画面の「オンライン予約受付 停止中のお知らせ」の下に、上記に入力した文章がそのまま表示されます。
              </span>
            </div>
          )}

          {/* Slot Max Capacity settings */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              1枠（30分）あたりの最大ご祈祷予約上限組数 <span className="required">*</span>
            </label>
            <input
              type="number"
              className="form-control"
              min="1"
              max="50"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ 
                maxWidth: '120px', 
                border: '1px solid var(--color-gold)', 
                fontWeight: 'bold', 
                fontSize: '1.1rem', 
                marginTop: '0.4rem' 
              }}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', display: 'block', marginTop: '0.4rem', lineHeight: '1.5' }}>
              ※清瀧神社の30分間枠ごとの最大予約可能組数です。この上限に達した時間枠は、参拝者の日時選択画面で自動的に「満席（受付終了）」表示に切り替わります。（デフォルト値: 8）
            </span>
          </div>

          {error && <p style={{ color: 'var(--color-shu)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
          {saved && (
            <p style={{ 
              color: 'var(--color-accent-green)', 
              fontSize: '0.85rem', 
              marginBottom: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.2rem' 
            }}>
              <Check size={14} />
              設定を正常に保存しました。
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Save size={14} />
            {loading ? '保存中...' : '設定を保存する'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default SettingsView;
