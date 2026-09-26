import React, { useState, useEffect, useRef } from 'react';
import { Calendar, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { SlotAvailability } from '../../types';
import { getApiUrl } from '../../config/api';

/**
 * Calculates the exact epoch ms for the New Year booking open timestamp (in JST).
 * Dec 1 at 09:00:00 JST, or if Dec 1 is Sunday -> Dec 2 (Mon), if Saturday -> Dec 3 (Mon).
 * 09:00:00 JST is 00:00:00 UTC.
 */
export function getNewYearOpenTimestamp(currentYear: number): number {
  const dec1 = new Date(Date.UTC(currentYear, 11, 1));
  const dayOfWeek = dec1.getUTCDay(); // 0 is Sunday, 6 is Saturday
  let openDay = 1;
  if (dayOfWeek === 0) {
    openDay = 2; // Sunday -> Monday Dec 2
  } else if (dayOfWeek === 6) {
    openDay = 3; // Saturday -> Monday Dec 3
  }
  // 09:00:00 JST is 00:00:00 UTC
  return Date.UTC(currentYear, 11, openDay, 0, 0, 0);
}

export function getNewYearOpenDateLabel(currentYear: number): string {
  const dec1 = new Date(Date.UTC(currentYear, 11, 1));
  const dayOfWeek = dec1.getUTCDay();
  let dayText = '12月1日';
  if (dayOfWeek === 0) {
    dayText = '12月2日（月）';
  } else if (dayOfWeek === 6) {
    dayText = '12月3日（月）';
  }
  return `${dayText} 09:00`;
}

export function getNewYearCountdown(openTimestamp: number, nowMs: number): string {
  const diffMs = openTimestamp - nowMs;
  if (diffMs <= 0) return '受付中';
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (days > 0) {
    return `開始まであと ${days}日 ${hours}時間`;
  }
  if (hours > 0) {
    return `開始まであと ${hours}時間 ${minutes}分 ${seconds}秒`;
  }
  return `開始まであと ${minutes}分 ${seconds}秒`;
}

// 2025-2027 Exact National Astronomical Observatory of Japan New Moon (lunar month start) dates
const NEW_MOONS = [
  { date: '2025-11-20', lunarMonth: 10, lunarYear: 2025 },
  { date: '2025-12-20', lunarMonth: 11, lunarYear: 2025 },
  { date: '2026-01-19', lunarMonth: 12, lunarYear: 2025 },
  { date: '2026-02-17', lunarMonth: 1, lunarYear: 2026 },
  { date: '2026-03-19', lunarMonth: 2, lunarYear: 2026 },
  { date: '2026-04-17', lunarMonth: 3, lunarYear: 2026 },
  { date: '2026-05-17', lunarMonth: 4, lunarYear: 2026 },
  { date: '2026-06-15', lunarMonth: 5, lunarYear: 2026 },
  { date: '2026-07-14', lunarMonth: 6, lunarYear: 2026 },
  { date: '2026-08-13', lunarMonth: 7, lunarYear: 2026 },
  { date: '2026-09-11', lunarMonth: 8, lunarYear: 2026 },
  { date: '2026-10-11', lunarMonth: 9, lunarYear: 2026 },
  { date: '2026-11-09', lunarMonth: 10, lunarYear: 2026 },
  { date: '2026-12-09', lunarMonth: 11, lunarYear: 2026 },
  { date: '2027-01-08', lunarMonth: 12, lunarYear: 2026 },
  { date: '2027-02-07', lunarMonth: 1, lunarYear: 2027 },
  { date: '2027-03-08', lunarMonth: 2, lunarYear: 2027 },
  { date: '2027-04-07', lunarMonth: 3, lunarYear: 2027 },
  { date: '2027-05-06', lunarMonth: 4, lunarYear: 2027 },
  { date: '2027-06-05', lunarMonth: 5, lunarYear: 2027 },
  { date: '2027-07-04', lunarMonth: 6, lunarYear: 2027 },
  { date: '2027-08-02', lunarMonth: 7, lunarYear: 2027 },
  { date: '2027-09-01', lunarMonth: 8, lunarYear: 2027 },
  { date: '2027-09-30', lunarMonth: 9, lunarYear: 2027 },
  { date: '2027-10-29', lunarMonth: 10, lunarYear: 2027 },
  { date: '2027-11-28', lunarMonth: 11, lunarYear: 2027 },
  { date: '2027-12-28', lunarMonth: 12, lunarYear: 2027 },
];

export function getRokuyoAndInu(dateString: string): { rokuyo: string; isInu: boolean } {
  if (!dateString) return { rokuyo: '', isInu: false };
  
  // Set date to midday to avoid timezone boundary issues
  const parts = dateString.split('-');
  const target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
  
  // 1. Calculate Inu no Hi (戌の日)
  // Base date: 2026-01-01 is '亥' (Index 11 in zodiac list: 子:0, 丑:1, 寅:2, 卯:3, 辰:4, 巳:5, 午:6, 未:7, 申:8, 酉:9, 戌:10, 亥:11)
  const baseDate = new Date(2026, 0, 1, 12, 0, 0);
  const diffTime = target.getTime() - baseDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  const zodiacIdx = (((11 + (diffDays % 12)) % 12) + 12) % 12;
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
  const [limitNewYear, setLimitNewYear] = useState<boolean>(true);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState<number>(0);
  const [nowTimeMs, setNowTimeMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const fetchPeriod = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.booking_period_months) {
            setPeriodMonths(parseInt(data.booking_period_months) || 2);
          }
          setLimitNewYear(data.limit_new_year_booking !== 'false');
          if (data.server_time) {
            const serverMs = new Date(data.server_time).getTime();
            setServerTimeOffsetMs(serverMs - Date.now());
            setNowTimeMs(serverMs);
          }
        }
      } catch (err) {
        console.error('Failed to fetch booking period:', err);
      }
    };
    fetchPeriod();
  }, []);

  // Update clock every second synced to JST server time
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimeMs(Date.now() + serverTimeOffsetMs);
    }, 1000);
    return () => clearInterval(timer);
  }, [serverTimeOffsetMs]);

  // JST time calculation: epoch ms + 9 hours
  const currentJstDate = new Date(nowTimeMs + 9 * 3600 * 1000);
  const currentJstYear = currentJstDate.getUTCFullYear();
  const openTimestamp = getNewYearOpenTimestamp(currentJstYear);
  const isNewYearOpen = !limitNewYear || nowTimeMs >= openTimestamp;

  const getMaxDateString = () => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear(), today.getMonth() + periodMonths, today.getDate());
    const local = new Date(maxDate.getTime() - (maxDate.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
  };

  const fetchAvailability = async () => {
    if (!selectedDate) return;
    setLoading(true);
    setError('');
    try {
      const apiUrl = getApiUrl();
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

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate]);

  // Auto-refresh when the exact opening millisecond is reached
  const prevOpenRef = useRef(isNewYearOpen);
  useEffect(() => {
    if (!prevOpenRef.current && isNewYearOpen) {
      prevOpenRef.current = true;
      if (selectedDate) {
        const parts = selectedDate.split('-');
        if (parseInt(parts[0]) > currentJstYear) {
          fetchAvailability();
        }
      }
    }
  }, [isNewYearOpen, selectedDate, currentJstYear]);

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
            const val = e.target.value;
            if (val && limitNewYear) {
              const parts = val.split('-');
              const targetYear = parseInt(parts[0]);
              const targetMonth = parseInt(parts[1]);
              const targetDay = parseInt(parts[2]);

              if (targetYear > currentJstYear) {
                if (nowTimeMs < openTimestamp) {
                  alert('新年のご祈祷の受付は12月1日（休日の場合は、平日の始め）09:00~より開始いたしますのでご了承願います。');
                  onDateChange('');
                  onTimeChange('');
                  return;
                } else if (targetMonth === 1 && targetDay <= 2) {
                  alert('お正月の三が日（1月1日・2日）は社務の都合により、Web予約は1月3日以降の回より承っております。');
                  onDateChange('');
                  onTimeChange('');
                  return;
                }
              }
            }
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

        {/* New Year Guidance and Real-time Countdown Banner */}
        {limitNewYear && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.65rem 0.85rem',
            backgroundColor: '#fffdf5',
            border: '1px solid #e2d7ba',
            borderRadius: '4px',
            fontSize: '0.83rem',
            lineHeight: '1.5',
            color: '#554228',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#854d0e' }}>
                🎍 新年のご祈祷予約について
              </span>
              {nowTimeMs < openTimestamp ? (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '12px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fcd34d'
                }}>
                  {getNewYearCountdown(openTimestamp, nowTimeMs)}
                </span>
              ) : (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '12px',
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  border: '1px solid #a7f3d0'
                }}>
                  受付中（{getNewYearOpenDateLabel(currentJstYear)}より開始済）
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#665c49' }}>
              新年のご祈祷の受付は<strong>12月1日（休日の場合は、平日の始め）09:00~</strong>より開始いたしますのでご了承願います。
              {nowTimeMs < openTimestamp && (
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#8c7757', marginTop: '0.2rem' }}>
                  ※本年は <strong>{getNewYearOpenDateLabel(currentJstYear)}</strong> に自動で受付が開始されます（画面の再読み込みは不要です）。
                </span>
              )}
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#8c7757', marginTop: '0.2rem' }}>
                ※お正月の三が日（1月1日・2日）は社務の都合により事前予約枠はございません（1月3日以降のご祈祷をお選びいただけます）。
              </span>
            </div>
          </div>
        )}
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
                      fontSize: '0.65rem', 
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
                      {displayStatus === 'O' && <CheckCircle2 size={10} />}
                      {displayStatus === '▲' && <AlertTriangle size={10} />}
                      {(displayStatus === 'X' || displayStatus === 'X_ORG') && <XCircle size={10} />}
                      {displayStatus === 'O' 
                        ? `空き (現在${slot.count}組)` 
                        : displayStatus === '▲' 
                          ? `残り僅か (${slot.count}組)` 
                          : displayStatus === 'X_ORG' 
                            ? '選択不可' 
                            : `満席 (現在${slot.count}組)`}
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
