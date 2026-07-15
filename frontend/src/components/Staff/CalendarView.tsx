import React, { useState, useEffect } from 'react';
import { Plus, Lock, Unlock, CalendarDays } from 'lucide-react';
import { getRokuyoAndInu } from '../Visitor/SlotSelector';
import type { CalendarEvent, Booking } from '../../types';

interface CalendarViewProps {
  bookings: Booking[];
  onRefreshBookings: () => void;
}

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

export const CalendarView: React.FC<CalendarViewProps> = ({ bookings, onRefreshBookings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Date configuration state (For quick slot lock toggle)
  const [focusedDate, setFocusedDate] = useState<string>('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // New event form state
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('16:00');
  const [description, setDescription] = useState('');
  const [isClosedSlot, setIsClosedSlot] = useState(false);

  const fetchEvents = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/events?month=${year}-${month}`);
      if (!res.ok) throw new Error('行事情報の取得に失敗しました。');
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  // Set today as initial focused date
  useEffect(() => {
    const today = new Date();
    const local = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    setFocusedDate(local.toISOString().split('T')[0]);
  }, []);

  const getMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // start weekday
    const totalDays = new Date(year, month + 1, 0).getDate(); // days count
    return { firstDay, totalDays, year, month };
  };

  const { firstDay, totalDays, year, month } = getMonthData();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate || !startTime || !endTime) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          event_date: eventDate,
          start_time: startTime,
          end_time: endTime,
          description,
          is_closed_slot: isClosedSlot ? 1 : 0
        })
      });

      if (!res.ok) throw new Error('イベントの登録に失敗しました。');
      
      setTitle('');
      setEventDate('');
      setStartTime('09:30');
      setEndTime('16:00');
      setDescription('');
      setIsClosedSlot(false);
      setShowAddForm(false);
      
      fetchEvents();
      onRefreshBookings();
    } catch (error) {
      alert(error);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('削除に失敗しました。');
      fetchEvents();
      onRefreshBookings();
    } catch (error) {
      alert(error);
    }
  };

  // Toggle single time slot lock status (Staff utility)
  const handleToggleSlotLock = async (slotTime: string, currentlyLocked: boolean, eventId?: number) => {
    if (currentlyLocked && eventId) {
      // Unlock (Delete event)
      await handleDeleteEvent(eventId);
    } else {
      // Lock (Create closed slot event)
      try {
        // We set end time to slotTime + 30 mins
        const [h, m] = slotTime.split(':').map(Number);
        const endMin = m + 30;
        const endHour = h + (endMin >= 60 ? 1 : 0);
        const endMinStr = String(endMin % 60).padStart(2, '0');
        const endHourStr = String(endHour).padStart(2, '0');
        const nextTime = `${endHourStr}:${endMinStr}`;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '臨時受付停止',
            event_date: focusedDate,
            start_time: slotTime,
            end_time: nextTime,
            description: '管理画面からの個別クローズ',
            is_closed_slot: 1
          })
        });

        if (!res.ok) throw new Error('スロットのロックに失敗しました。');
        fetchEvents();
        onRefreshBookings();
      } catch (error) {
        alert(error);
      }
    }
  };

  const renderCells = () => {
    const cells = [];
    
    // Blank offsets for first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div key={`empty-${i}`} style={{ 
          border: '1px solid var(--color-border)', 
          backgroundColor: 'var(--color-washi-dark)', 
          minHeight: '100px' 
        }} />
      );
    }

    // Days slots
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayBookings = bookings.filter(b => b.booking_date === dateStr && b.is_cancelled !== 1);
      const dayEvents = events.filter(e => e.event_date === dateStr);
      const isFocused = focusedDate === dateStr;

      cells.push(
        <div 
          key={day} 
          onClick={() => setFocusedDate(dateStr)}
          style={{ 
            border: isFocused ? '2px solid var(--color-mizuiro)' : '1px solid var(--color-border)', 
            minHeight: '105px', 
            padding: '0.4rem', 
            backgroundColor: isFocused ? 'var(--color-mizuiro-light)' : '#ffffff', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <span style={{ 
                fontWeight: 700, 
                fontSize: '0.9rem',
                color: isFocused ? 'var(--color-mizuiro-hover)' : 'var(--color-urushi)'
              }}>{day}</span>
              {(() => {
                const { rokuyo, isInu } = getRokuyoAndInu(dateStr);
                return (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-accent-gray)', display: 'inline-flex', alignItems: 'center', gap: '0.1rem' }}>
                    {rokuyo} {isInu && '🐕'}
                  </span>
                );
              })()}
            </div>
            
            {/* Display shrine events inside cells */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.25rem' }} className="no-print">
              {dayEvents.map(e => (
                <div key={e.id} style={{ 
                  backgroundColor: e.is_closed_slot ? 'rgba(50, 136, 163, 0.08)' : 'rgba(197, 160, 89, 0.08)', 
                  color: e.is_closed_slot ? 'var(--color-mizuiro)' : 'var(--color-gold)',
                  border: e.is_closed_slot ? '1px solid rgba(50, 136, 163, 0.2)' : '1px solid rgba(197, 160, 89, 0.2)',
                  fontSize: '0.6rem', 
                  padding: '0.1rem 0.2rem', 
                  borderRadius: '2px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span title={`${e.title} (${e.start_time}-${e.end_time})`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                    {e.is_closed_slot ? '🔒' : '📢'} {e.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Aggregate booking counts */}
          {dayBookings.length > 0 && (
            <div style={{
              backgroundColor: 'rgba(50, 136, 163, 0.05)',
              border: '1px solid rgba(50, 136, 163, 0.15)',
              borderRadius: '2px',
              padding: '0.15rem 0.25rem',
              fontSize: '0.7rem',
              color: 'var(--color-mizuiro)',
              fontWeight: 'bold',
              textAlign: 'center',
              fontFamily: 'var(--font-serif)'
            }}>
              予約: {dayBookings.length} 組
            </div>
          )}
        </div>
      );
    }

    return cells;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Calendar container card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={handlePrevMonth} className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>先月</button>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', margin: 0 }}>
              {year}年 {month + 1}月
            </h3>
            <button onClick={handleNextMonth} className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>翌月</button>
          </div>

          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
          >
            <Plus size={14} />
            神社行事の登録
          </button>
        </div>

        {/* Add Shrine event form */}
        {showAddForm && (
          <form onSubmit={handleAddEvent} className="alert-warning" style={{ marginBottom: '1.25rem', border: '1px solid var(--color-gold)', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', fontFamily: 'var(--font-serif)', color: 'var(--color-mizuiro-hover)' }}>神社行事の設定</h4>
            
            <div className="grid-2">
              <div className="form-group">
                <label>行事・祭典名 <span className="required">*</span></label>
                <input type="text" className="form-control" placeholder="例：大祓式、例大祭など" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>該当日の選択 <span className="required">*</span></label>
                <input type="date" className="form-control" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>開始時刻 <span className="required">*</span></label>
                <input type="time" className="form-control" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>終了時刻 <span className="required">*</span></label>
                <input type="time" className="form-control" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>説明（備考）</label>
              <input type="text" className="form-control" placeholder="例：例大祭準備のため受付制限" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="form-group" style={{ margin: '0.75rem 0' }}>
              <label className="checkbox-label" style={{ color: 'var(--color-mizuiro-hover)', fontWeight: 'bold' }}>
                <input type="checkbox" checked={isClosedSlot} onChange={(e) => setIsClosedSlot(e.target.checked)} />
                この時間帯の一般予約枠をロック（自動クローズ）する
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>登録する</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>キャンセル</button>
            </div>
          </form>
        )}

        {/* スマホ用の横スクロール案内 */}
        {isMobile && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--color-accent-gray)', 
            marginBottom: '0.5rem', 
            textAlign: 'right'
          }}>
            ← 左右スクロールでカレンダー全体を見られます →
          </div>
        )}

        {/* Calendar Grid */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '2px', overflowX: 'auto' }}>
          <div style={{ minWidth: isMobile ? '700px' : '100%' }}>
            {/* Days of week */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              backgroundColor: 'var(--color-urushi)', 
              color: '#ffffff', 
              textAlign: 'center', 
              fontWeight: 'bold', 
              fontSize: '0.8rem', 
              padding: '0.4rem 0' 
            }}>
              <div style={{ color: '#ff4d4f' }}>日</div>
              <div>月</div>
              <div>火</div>
              <div>水</div>
              <div>木</div>
              <div>金</div>
              <div style={{ color: '#40a9ff' }}>土</div>
            </div>

            {/* Days cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {renderCells()}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK SLOT CONTROL PANEL (TRIGGERS PER FOCUSED DATE) */}
      {focusedDate && (
        <div className="card kamidana-border" style={{ padding: '1.5rem' }}>
          <h4 style={{ 
            fontSize: '1rem', 
            fontFamily: 'var(--font-serif)', 
            borderBottom: '1px solid var(--color-border)', 
            paddingBottom: '0.5rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-mizuiro-hover)'
          }}>
            <CalendarDays size={18} />
            時間枠ごとの受付可否（ロック）設定　【 対象日: {focusedDate} 】
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginBottom: '1.25rem' }}>
            ※各時間枠をクリックすることで、該当する時間の予約受付を「可」と「不可」で個別にトグルでロック/解除できます。
          </p>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
            gap: '0.75rem' 
          }}>
            {TIME_SLOTS.map((slot) => {
              // Check if there is an event locking this specific slot
              // A slot is locked if an is_closed_slot event covers this hour (start_time <= slot && end_time > slot)
              const matchedLockEvent = events.find(e => 
                e.event_date === focusedDate && 
                e.is_closed_slot === 1 && 
                slot >= e.start_time && 
                slot < e.end_time
              );
              const isLocked = !!matchedLockEvent;

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleToggleSlotLock(slot, isLocked, matchedLockEvent?.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.75rem 0.5rem',
                    borderRadius: '2px',
                    border: isLocked ? '1px solid var(--color-mizuiro)' : '1px solid var(--color-border)',
                    backgroundColor: isLocked ? 'var(--color-mizuiro-light)' : '#ffffff',
                    color: isLocked ? 'var(--color-mizuiro)' : 'var(--color-urushi)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >
                  <span style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{slot}</span>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.2rem',
                    color: isLocked ? 'var(--color-mizuiro)' : 'var(--color-accent-green)'
                  }}>
                    {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                    {isLocked ? '受付不可' : '受付可能'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Timeline Panel */}
          <div style={{ marginTop: '2rem', borderTop: '2px solid var(--color-gold)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h5 style={{ fontSize: '1.05rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', margin: 0, color: 'var(--color-urushi)' }}>
                ⛩️ 日次詳細タイムライン 【 {focusedDate} 】
              </h5>
              
              {/* Daily Summary statistics */}
              <div style={{ display: 'flex', gap: '0.5rem 1rem', fontSize: '0.8rem', backgroundColor: 'var(--color-washi-dark)', padding: '0.4rem 0.8rem', border: '1px solid var(--color-border)', borderRadius: '2px', flexWrap: 'wrap' }}>
                <div>総予約: <strong style={{ color: 'var(--color-urushi)' }}>{bookings.filter(b => b.booking_date === focusedDate && b.is_cancelled !== 1).length} 件</strong></div>
                <div>総初穂料: <strong style={{ color: 'var(--color-accent-green)' }}>{bookings.filter(b => b.booking_date === focusedDate && b.is_cancelled !== 1).reduce((s, i) => s + i.hatsuhoryo, 0).toLocaleString()}円</strong></div>
                <div>総参列者数: <strong style={{ color: 'var(--color-gold)' }}>{bookings.filter(b => b.booking_date === focusedDate && b.is_cancelled !== 1).reduce((s, i) => s + (typeof i.attending_count === 'number' ? i.attending_count : 1), 0)} 名</strong></div>
              </div>
            </div>

            {(() => {
              const todayBookings = bookings.filter(b => b.booking_date === focusedDate && b.is_cancelled !== 1);
              
              // Group bookings by time slot
              const grouped: { [key: string]: Booking[] } = {};
              TIME_SLOTS.forEach(slot => {
                const match = todayBookings.filter(b => b.booking_time === slot);
                if (match.length > 0) grouped[slot] = match;
              });

              const activeSlots = Object.keys(grouped).sort();

              if (activeSlots.length === 0) {
                return (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-accent-gray)', textAlign: 'center', padding: '2rem 0', backgroundColor: '#fcfcfc', border: '1px dashed var(--color-border)' }}>
                    この日のご祈祷予約はありません。
                  </p>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeSlots.map(slot => (
                    <div key={slot} style={{ display: 'flex', gap: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                      {/* Time Indicator */}
                      <div style={{ width: '70px', fontSize: '1.15rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: 'var(--color-mizuiro)', paddingTop: '0.2rem' }}>
                        {slot}
                      </div>
                      
                      {/* Bookings under this time slot */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {grouped[slot].map(b => {
                          const isIndiv = b.booking_type === 'individual';
                          const nameLabel = isIndiv ? '個人' : '団体';
                          const displayName = isIndiv ? b.name : b.company_name;
                          const displayKana = isIndiv ? b.kana : b.company_kana;
                          
                          return (
                            <div key={b.id} style={{ 
                              backgroundColor: '#ffffff', 
                              border: `1px solid ${isIndiv ? 'var(--color-border)' : 'var(--color-gold)'}`,
                              borderLeft: `4px solid ${isIndiv ? 'var(--color-accent-green)' : 'var(--color-gold)'}`,
                              borderRadius: '2px',
                              padding: '1rem',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.01)'
                            }}>
                              {/* Header info */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid #f7f7f7', paddingBottom: '0.4rem' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)', fontFamily: 'monospace' }}>
                                  受付番号: {b.receipt_number}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <span className={`badge ${isIndiv ? 'badge-paid' : 'badge-unpaid'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderColor: isIndiv ? 'var(--color-accent-green)' : 'var(--color-gold)', color: isIndiv ? 'var(--color-accent-green)' : 'var(--color-gold)', backgroundColor: 'transparent' }}>
                                    {nameLabel}
                                  </span>
                                  <span style={{ 
                                    fontSize: '0.7rem', 
                                    fontWeight: 'bold', 
                                    backgroundColor: b.payment_status === 'paid' ? 'rgba(62, 122, 92, 0.08)' : 'rgba(211, 56, 28, 0.08)',
                                    color: b.payment_status === 'paid' ? 'var(--color-accent-green)' : 'var(--color-shu)',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '2px'
                                  }}>
                                    {b.payment_status === 'paid' ? '初穂料納め済' : '初穂料未払い'}
                                  </span>
                                </div>
                              </div>

                              {/* Body details */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                                <div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)' }}>ご祈祷対象者・企業名</div>
                                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--color-urushi)' }}>
                                    {displayName} 様 <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--color-accent-gray)' }}>({displayKana})</span>
                                  </div>
                                  {isIndiv && b.notes && b.notes.includes('申込代表者:') && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.2rem' }}>
                                      {b.notes}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)' }}>願意（お願い事）</div>
                                  <div style={{ fontWeight: 'bold' }}>
                                    {b.prayer1} {b.prayer2 ? ` / ${b.prayer2}` : ''}
                                  </div>
                                  {/* Dynamic metadata attributes inside list cards */}
                                  {b.yakudoshi_type && (
                                    <span style={{ fontSize: '0.75rem', backgroundColor: '#fff9e6', color: 'var(--color-gold)', padding: '0.05rem 0.25rem', borderRadius: '2px', marginTop: '0.2rem', display: 'inline-block' }}>
                                      厄年区分: {b.yakudoshi_type === 'maeyaku' ? '前厄' : b.yakudoshi_type === 'honyaku' ? '本厄' : '後厄'}
                                    </span>
                                  )}
                                  {b.child_name && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.2rem', lineHeight: '1.4' }}>
                                      祝子: {b.child_name} ({b.child_kana})　生年月日: {b.child_birthday}
                                    </div>
                                  )}
                                  {b.kotobuki_type && (
                                    <span style={{ fontSize: '0.75rem', backgroundColor: '#fff9e6', color: 'var(--color-gold)', padding: '0.05rem 0.25rem', borderRadius: '2px', marginTop: '0.2rem', display: 'inline-block' }}>
                                      祝区分: {b.kotobuki_type === 'その他' ? b.kotobuki_other_text : b.kotobuki_type}
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span>参列予定人数:</span> 
                                    <strong>{b.attending_count} 名</strong>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                    <span>お初穂料金額:</span>
                                    <strong style={{ color: 'var(--color-mizuiro)' }}>{b.hatsuhoryo.toLocaleString()} 円</strong>
                                  </div>
                                  {(b.phone || b.staff_phone) && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', marginTop: '0.2rem' }}>
                                      連絡先: {isIndiv ? b.phone : `${b.staff_dept_title_name} / ${b.staff_phone}`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
export default CalendarView;
