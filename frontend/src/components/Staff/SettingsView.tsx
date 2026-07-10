import React, { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [maxCapacity, setMaxCapacity] = useState<number>(8);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/settings');
      if (!res.ok) throw new Error('設定の取得に失敗しました。');
      const data = await res.json();
      if (data.max_groups_per_slot) {
        setMaxCapacity(parseInt(data.max_groups_per_slot));
      }
    } catch (err: any) {
      console.error(err);
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
      const res = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'max_groups_per_slot', value: String(maxCapacity) })
      });

      if (!res.ok) throw new Error('設定の保存に失敗しました。');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '560px' }}>
      <div className="card kamidana-border">
        <h3 style={{ 
          fontSize: '1.15rem', 
          fontFamily: 'var(--font-serif)', 
          borderBottom: '1px solid var(--color-border)', 
          paddingBottom: '0.4rem', 
          marginBottom: '1.25rem' 
        }}>
          システム管理設定
        </h3>

        <form onSubmit={handleSave}>
          <div className="form-group">
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
