import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { SlotAvailability } from '../../types';

// 2026 & 2027 New moon (lunar month start) dates for Rokuyo calculation
const NEW_MOONS = [
  { date: '2025-12-20', lunarMonth: 11, lunarYear: 2025 },
  { date: '2026-01-19', lunarMonth: 12, lunarYear: 2025 },
  { date: '2026-02-17', lunarMonth: 1, lunarYear: 2026 },
  { date: '2026-03-19', lunarMonth: 2, lunarYear: 2026 },
  { date: '2026-04-17', lunarMonth: 3, lunarYear: 2026 },
  { date: '2026-05-16', lunarMonth: 4, lunarYear: 2026 },
  { date: '2026-06-15', lunarMonth: 5, lunarYear: 2026 },
  { date: '2026-07-14', lunarMonth: 6, lunarYear: 2026 },
  { date: '2026-08-12', lunarMonth: 7, lunarYear: 2026 },
  { date: '2026-09-11', lunarMonth: 8, lunarYear: 2026 },
  { date: '2026-10-11', lunarMonth: 9, lunarYear: 2026 },
  { date: '2026-11-09', lunarMonth: 10, lunarYear: 2026 },
  { date: '2026-12-09', lunarMonth: 11, lunarYear: 2026 },
  { date: '2027-01-08', lunarMonth: 12, lunarYear: 2026 },
  { date: '2027-02-07', lunarMonth: 1, lunarYear: 2027 },
  { date: '2027-03-08', lunarMonth: 2, lunarYear: 2027 },
  { date: '2027-04-07', lunarMonth: 3, lunarYear: 2027 },
  { date: '2027-05-06', lunarMonth: 4, lunarYear: 2027 },
  { date: '2027-06-04', lunarMonth: 5, lunarYear: 2027 },
  { date: '2027-07-04', lunarMonth: 6, lunarYear: 2027 },
  { date: '2027-08-02', lunarMonth: 7, lunarYear: 2027 },
  { date: '2027-09-01', lunarMonth: 7, lunarYear: 2027, isLeap: true }, // Leap month
  { date: '2027-10-01', lunarMonth: 8, lunarYear: 2027 },
  { date: '2027-10-30', lunarMonth: 9, lunarYear: 2027 },
  { date: '2027-11-29', lunarMonth: 10, lunarYear: 2027 },
  { date: '2027-12-28', lunarMonth: 11, lunarYear: 2027 },
];

export function getRokuyoAndInu(dateString: string): { rokuyo: string; isInu: boolean } {
  if (!dateString) return { rokuyo: '', isInu: false };
  
  // Set date to midday to avoid timezone boundary issues
  const parts = dateString.split('-');
  const target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
  
  // 1. Calculate Inu no Hi (戌の日)
  // Base date: 2026-01-01 is '申' (Index 8 in zodiac list)
  const baseDate = new Date(2026, 0, 1, 12, 0, 0);
  const diffTime = target.getTime() - baseDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  const zodiacIdx = (8 + (diffDays % 12) + 12) % 12;
  const isInu = zodiacIdx === 10; // 10 is '戌'

  // 2. Calculate Rokuyo (六曜)
  let activeNewMoon = NEW_MOONS[0];
  for (const nm of NEW_MOONS) {
    const nmParts = nm.date.split('-');
    const nmDate = new Date(parseInt(nmParts[0]), parseInt(nmParts[1]) - 1, parseInt(nmParts[2]), 12, 0, 0);
    if (nmDate <= target) {
      activeNewMoon = nm;
    } else {
      break;
    }
  }

  const nmParts = activeNewMoon.date.split('-');
  const nmDate = new Date(parseInt(nmParts[0]), parseInt(nmParts[1]) - 1, parseInt(nmParts[2]), 12, 0, 0);
  const dayOffset = Math.round((target.getTime() - nmDate.getTime()) / (1000 * 60 * 60 * 24));
  const lunarDay = dayOffset + 1;
  const lunarMonth = activeNewMoon.lunarMonth;

  // Rokuyo formula: (lunarMonth + lunarDay) % 6
  const rokuyoIdx = (lunarMonth + lunarDay) % 6;
  const ROKUYO_LABELS = ['大安', '赤口', '先勝', '友引', '先負', '仏滅'];
  const rokuyo = ROKUYO_LABELS[rokuyoIdx];

  return { rokuyo, isInu };
}

interface SlotSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
  bookingType?: 'individual' | 'organization';
}

export const SlotSelector: React.FC<SlotSelectorProps> = ({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  bookingType = 'individual'
}) => {
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [periodMonths, setPeriodMonths] = useState<number>(2);

  useEffect(() => {
    const fetchPeriod = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.booking_period_months) {
            setPeriodMonths(parseInt(data.booking_period_months) || 2);
          }
        }
      } catch (err) {
        console.error('Failed to fetch booking period:', err);
      }
    };
    fetchPeriod();
  }, []);

  const getMaxDateString = () => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear(), today.getMonth() + periodMonths, today.getDate());
    const local = new Date(maxDate.getTime() - (maxDate.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchAvailability = async () => {
      setLoading(true);
      setError('');
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/bookings/slots-availability?date=${selectedDate}`);
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

  const visitorSlots = slots.filter(slot => slot.time >= '09:30' && slot.time <= '15:30');

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
          max={getMaxDateString()}
          onChange={(e) => {
            onDateChange(e.target.value);
            onTimeChange(''); // Reset time on date change
          }}
          style={{ maxWidth: '280px', border: '1px solid var(--color-gold)' }}
        />
        {selectedDate && (() => {
          const { rokuyo, isInu } = getRokuyoAndInu(selectedDate);
          return (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
              <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: 'bold', 
                backgroundColor: rokuyo === '大安' ? 'rgba(62, 122, 92, 0.1)' : 'rgba(125, 122, 116, 0.1)', 
                color: rokuyo === '大安' ? 'var(--color-accent-green)' : 'var(--color-accent-gray)', 
                border: `1px solid ${rokuyo === '大安' ? 'var(--color-accent-green)' : 'var(--color-border)'}`,
                padding: '0.2rem 0.5rem',
                borderRadius: '2px'
              }}>
                {rokuyo}
              </span>
              {isInu && (
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 'bold', 
                  backgroundColor: 'rgba(200, 122, 45, 0.1)', 
                  color: 'var(--color-accent-orange)', 
                  border: '1px solid var(--color-accent-orange)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  🐕 戌の日
                </span>
              )}
            </div>
          );
        })()}
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

          {!loading && !error && visitorSlots.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', 
              gap: '0.75rem', 
              marginTop: '0.5rem' 
            }}>
              {visitorSlots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                const isFull = slot.status === 'X' || (bookingType === 'organization' && Number(slot.count) > 0);
                const displayStatus = (bookingType === 'organization' && Number(slot.count) > 0) ? 'X_ORG' : slot.status;

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
                      color: displayStatus === 'O' 
                        ? 'var(--color-accent-green)' 
                        : displayStatus === '▲' 
                          ? 'var(--color-accent-orange)' 
                          : 'var(--color-accent-gray)'
                    }}>
                      {displayStatus === 'O' && <CheckCircle2 size={11} />}
                      {displayStatus === '▲' && <AlertTriangle size={11} />}
                      {(displayStatus === 'X' || displayStatus === 'X_ORG') && <XCircle size={11} />}
                      {displayStatus === 'O' ? '空きあり' : displayStatus === '▲' ? '残りわずか' : displayStatus === 'X_ORG' ? '選択不可' : '満席'}
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
