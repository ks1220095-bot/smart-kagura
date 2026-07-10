import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { SlotAvailability } from '../../types';

interface SlotSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
}

export const SlotSelector: React.FC<SlotSelectorProps> = ({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange
}) => {
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchAvailability = async () => {
      setLoading(true);
      setError('');
      try {
        // Backend URL fallback for local development
        const res = await fetch(`http://localhost:5000/api/bookings/slots-availability?date=${selectedDate}`);
        if (!res.ok) throw new Error('空き状況の取得に失敗しました。');
        const data = await res.json();
        setSlots(data);
      } catch (err: any) {
        setError(err.message || '接続エラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDate]);

  const getTomorrowString = () => {
    const today = new Date();
    // Get tomorrow
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    // JST offset adjust
    const local = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div className="form-group">
        <label style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-serif)' }}>
          ご希望の参拝日 <span className="required">*</span>
        </label>
        <input
          type="date"
          className="form-control"
          value={selectedDate}
          min={getTomorrowString()}
          onChange={(e) => {
            onDateChange(e.target.value);
            onTimeChange(''); // Reset time on date change
          }}
          style={{ maxWidth: '280px', border: '1px solid var(--color-gold)' }}
        />
      </div>

      {selectedDate && (
        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ 
            fontSize: '0.95rem', 
            marginBottom: '0.75rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: 'var(--color-urushi-light)'
          }}>
            <Calendar size={16} style={{ color: 'var(--color-gold)' }} />
            ご希望の時間枠を選択してください （午前9:30〜午後15:30、30分ごと）
          </h4>

          {loading && <p style={{ color: 'var(--color-accent-gray)', fontSize: '0.9rem' }}>空き状況を読み込み中...</p>}
          {error && <p style={{ color: 'var(--color-shu)', fontSize: '0.9rem' }}>{error}</p>}

          {!loading && !error && slots.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', 
              gap: '0.75rem', 
              marginTop: '0.5rem' 
            }}>
              {slots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                const isFull = slot.status === 'X';

                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={isFull}
                    onClick={() => onTimeChange(slot.time)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.65rem 0.5rem',
                      borderRadius: '2px',
                      cursor: isFull ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'var(--font-serif)',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      border: isSelected 
                        ? '2px solid var(--color-shu)' 
                        : '1px solid var(--color-border)',
                      backgroundColor: isSelected 
                        ? 'rgba(211, 56, 28, 0.04)' 
                        : isFull 
                          ? 'var(--color-washi-dark)' 
                          : '#ffffff',
                      color: isFull ? 'var(--color-accent-gray)' : 'var(--color-urushi)',
                      opacity: isFull ? 0.6 : 1,
                      transform: isSelected ? 'scale(1.02)' : 'none',
                      boxShadow: isSelected ? '0 2px 6px rgba(211, 56, 28, 0.1)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>{slot.time}</span>
                    
                    <span style={{ 
                      fontSize: '0.7rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.2rem',
                      fontWeight: 'normal',
                      color: slot.status === 'O' 
                        ? 'var(--color-accent-green)' 
                        : slot.status === '▲' 
                          ? 'var(--color-accent-orange)' 
                          : 'var(--color-accent-gray)'
                    }}>
                      {slot.status === 'O' && <CheckCircle2 size={11} />}
                      {slot.status === '▲' && <AlertTriangle size={11} />}
                      {slot.status === 'X' && <XCircle size={11} />}
                      {slot.status === 'O' ? '空きあり' : slot.status === '▲' ? '残りわずか' : '満席'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default SlotSelector;
