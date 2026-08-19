import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Lock, Unlock, CalendarDays, Calendar, Check, X, Edit3, Trash2, Printer, AlertCircle } from 'lucide-react';
import { getRokuyoAndInu } from '../Visitor/SlotSelector';
import type { CalendarEvent, Booking } from '../../types';

interface CalendarViewProps {
  bookings: Booking[];
  onRefreshBookings: () => void;
  onSelectSchedulePrint?: (date: string) => void;
  onSelectDailyReportPrint?: (date: string) => void;
}

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

export const getWarekiDateString = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00+09:00');
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const dayOfWeek = days[date.getDay()];

  let era = '';
  let eraYear = year;
  if (year >= 2019) {
    era = '令和';
    eraYear = year - 2018;
  } else if (year >= 1989) {
    era = '平成';
    eraYear = year - 1988;
  }
  const eraStr = eraYear === 1 ? '元年' : `${eraYear}年`;
  return `${era}${eraStr}${month}月${day}日（${dayOfWeek}）`;
};

export function getUniqueGroupStats(dayBookings: any[]) {
  if (dayBookings.length === 0) {
    return { groupsCount: 0, totalAttending: 0 };
  }

  const groupsMap = new Map<string, any[]>();

  dayBookings.forEach(b => {
    const identifier = b.booking_time + "_" + (b.phone || b.email || b.name || b.company_name || Math.random().toString());
    if (!groupsMap.has(identifier)) {
      groupsMap.set(identifier, []);
    }
    groupsMap.get(identifier)!.push(b);
  });

  const groupsCount = groupsMap.size;

  let totalAttending = 0;
  groupsMap.forEach(groupItems => {
    const maxAttending = groupItems.reduce((max, item) => {
      const count = typeof item.attending_count === 'number' ? item.attending_count : 1;
      return count > max ? count : max;
    }, 0);
    totalAttending += maxAttending;
  });

  return { groupsCount, totalAttending };
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  bookings, 
  onRefreshBookings,
  onSelectSchedulePrint,
  onSelectDailyReportPrint
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Date configuration state (For quick slot lock toggle)
  const [focusedDate, setFocusedDate] = useState<string>('');

  // Detailed Day Popup Modal state
  const [selectedDayModalDate, setSelectedDayModalDate] = useState<string | null>(null);

  // Find related bookings (same applicant / same email / same phone / same name in the same time slot)
  const findRelatedBookings = (target: Booking | null): Booking[] => {
    if (!target || !target.id) return [];
    const targetEmail = (target.booking_type === 'individual' ? target.email : target.staff_email)?.trim().toLowerCase();
    const targetPhone = (target.booking_type === 'individual' ? target.phone : target.staff_phone)?.trim();
    const targetName = (target.booking_type === 'individual' ? target.name : target.company_name)?.trim();

    return bookings.filter(b => {
      if (b.id === target.id) return false;
      if (Number(b.is_cancelled) === 1) return false;
      
      // Must be the same date and same time slot
      if (b.booking_date !== target.booking_date || b.booking_time !== target.booking_time) return false;

      // 1. Same email (primary)
      const bEmail = (b.booking_type === 'individual' ? b.email : b.staff_email)?.trim().toLowerCase();
      if (targetEmail && bEmail && targetEmail === bEmail) return true;

      // 2. Same phone number
      const bPhone = (b.booking_type === 'individual' ? b.phone : b.staff_phone)?.trim();
      if (targetPhone && bPhone && targetPhone === bPhone) return true;

      // 3. Same name
      const bName = (b.booking_type === 'individual' ? b.name : b.company_name)?.trim();
      if (targetName && bName && targetName === bName) return true;

      return false;
    });
  };

  // Edit/Reschedule & Cancel states for modal
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [batchRescheduleRelated, setBatchRescheduleRelated] = useState(true);
  const [batchCancelRelated, setBatchCancelRelated] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const editRelatedBookings = editingBooking ? findRelatedBookings(editingBooking) : [];
  const cancelRelatedBookings = cancellingBooking ? findRelatedBookings(cancellingBooking) : [];

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

  // Edit event form state
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('09:30');
  const [editEndTime, setEditEndTime] = useState('16:00');
  const [editDescription, setEditDescription] = useState('');
  const [editIsClosedSlot, setEditIsClosedSlot] = useState(false);

  // Batch slots selection states
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [loadingBatch, setLoadingBatch] = useState(false);

  // Clear selection on date change
  useEffect(() => {
    setSelectedSlots([]);
  }, [focusedDate]);

  const handleSlotClick = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleSelectAllSlots = () => {
    setSelectedSlots([...TIME_SLOTS]);
  };

  const handleClearSlotSelection = () => {
    setSelectedSlots([]);
  };

  const handleBatchLock = async () => {
    if (selectedSlots.length === 0) return;
    
    const slotsToLock = selectedSlots.filter(slot => {
      const isAlreadyLocked = events.some(e => 
        e.event_date === focusedDate && 
        e.is_closed_slot === 1 && 
        slot >= e.start_time && 
        slot < e.end_time
      );
      return !isAlreadyLocked;
    });

    if (slotsToLock.length === 0) {
      alert('選択された時間枠はすでにすべて受付不可（ロック）になっています。');
      return;
    }

    setLoadingBatch(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const promises = slotsToLock.map(slotTime => {
        const [h, m] = slotTime.split(':').map(Number);
        const endMin = m + 30;
        const endHour = h + (endMin >= 60 ? 1 : 0);
        const endMinStr = String(endMin % 60).padStart(2, '0');
        const endHourStr = String(endHour).padStart(2, '0');
        const nextTime = `${endHourStr}:${endMinStr}`;

        return fetch(`${apiUrl}/api/events`, {
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
      });

      await Promise.all(promises);
      setSelectedSlots([]);
      fetchEvents();
      onRefreshBookings();
    } catch (error) {
      alert('一括ロック処理中にエラーが発生しました。');
      console.error(error);
    } finally {
      setLoadingBatch(false);
    }
  };

  const handleBatchUnlock = async () => {
    if (selectedSlots.length === 0) return;

    const eventsToDelete: number[] = [];
    selectedSlots.forEach(slot => {
      const matchedLockEvent = events.find(e => 
        e.event_date === focusedDate && 
        e.is_closed_slot === 1 && 
        slot >= e.start_time && 
        slot < e.end_time
      );
      if (matchedLockEvent && matchedLockEvent.id && !eventsToDelete.includes(matchedLockEvent.id)) {
        eventsToDelete.push(matchedLockEvent.id);
      }
    });

    if (eventsToDelete.length === 0) {
      alert('選択された時間枠には解除できるロック情報がありません。');
      return;
    }

    setLoadingBatch(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const promises = eventsToDelete.map(id => 
        fetch(`${apiUrl}/api/events/${id}`, { method: 'DELETE' })
      );

      await Promise.all(promises);
      setSelectedSlots([]);
      fetchEvents();
      onRefreshBookings();
    } catch (error) {
      alert('一括解除処理中にエラーが発生しました。');
      console.error(error);
    } finally {
      setLoadingBatch(false);
    }
  };

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

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editingEvent.id || !editTitle || !editEventDate || !editStartTime || !editEndTime) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          event_date: editEventDate,
          start_time: editStartTime,
          end_time: editEndTime,
          description: editDescription,
          is_closed_slot: editIsClosedSlot ? 1 : 0
        })
      });

      if (!res.ok) throw new Error('行事情報の更新に失敗しました。');
      
      setEditingEvent(null);
      fetchEvents();
      onRefreshBookings();
    } catch (error) {
      alert(error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent || !editingEvent.id) return;
    if (!window.confirm(`「${editingEvent.title}」を削除してもよろしいですか？`)) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/events/${editingEvent.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('行事情報の削除に失敗しました。');
      
      setEditingEvent(null);
      fetchEvents();
      onRefreshBookings();
    } catch (error) {
      alert(error);
    }
  };

  const handleDeleteEventById = async (id?: number, eventTitle?: string) => {
    if (!id) return;
    if (!window.confirm(`「${eventTitle || 'この行事'}」を削除してもよろしいですか？`)) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/events/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('行事情報の削除に失敗しました。');
      
      fetchEvents();
      onRefreshBookings();
    } catch (error) {
      alert(error);
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
          minHeight: isMobile ? '76px' : '105px' 
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
          onClick={() => {
            setFocusedDate(dateStr);
            setSelectedDayModalDate(dateStr);
          }}
          style={{ 
            border: isFocused ? '2px solid var(--color-mizuiro)' : '1px solid var(--color-border)', 
            minHeight: isMobile ? '76px' : '105px', 
            padding: isMobile ? '0.25rem 0.2rem' : '0.4rem', 
            backgroundColor: isFocused ? 'var(--color-mizuiro-light)' : '#ffffff', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="タップしてこの日の詳細（ご祈祷予約・行事）を表示"
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
              <span style={{ 
                fontWeight: 700, 
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                color: isFocused ? 'var(--color-mizuiro-hover)' : 'var(--color-urushi)'
              }}>{day}</span>
              {(() => {
                const { rokuyo, isInu } = getRokuyoAndInu(dateStr);
                return (
                  <span style={{ fontSize: isMobile ? '0.55rem' : '0.65rem', color: 'var(--color-accent-gray)', display: 'inline-flex', alignItems: 'center', gap: '0.1rem', whiteSpace: 'nowrap' }}>
                    {rokuyo} {isInu && '🐕'}
                  </span>
                );
              })()}
            </div>
            
            {/* Display shrine events inside cells (PC-matching visual style) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.15rem' }} className="no-print">
              {dayEvents.map(e => (
                <div 
                  key={e.id} 
                  onClick={(evt) => {
                    evt.stopPropagation();
                    setEditingEvent(e);
                    setEditTitle(e.title);
                    setEditEventDate(e.event_date);
                    setEditStartTime(e.start_time);
                    setEditEndTime(e.end_time);
                    setEditDescription(e.description || '');
                    setEditIsClosedSlot(e.is_closed_slot === 1);
                    setShowAddForm(false);
                  }}
                  style={{ 
                    backgroundColor: e.is_closed_slot ? 'rgba(50, 136, 163, 0.08)' : 'rgba(197, 160, 89, 0.08)', 
                    color: e.is_closed_slot ? 'var(--color-mizuiro)' : 'var(--color-gold)',
                    border: e.is_closed_slot ? '1px solid rgba(50, 136, 163, 0.25)' : '1px solid rgba(197, 160, 89, 0.25)',
                    fontSize: isMobile ? '0.55rem' : '0.62rem', 
                    padding: '0.1rem 0.2rem', 
                    borderRadius: '2px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    lineHeight: '1.2'
                  }}
                >
                  <span title={`${e.title} (${e.start_time}-${e.end_time})`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                    {e.is_closed_slot ? '🔒' : '📢'} {e.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Aggregate booking counts (PC-matching pink border & text badge) */}
          {dayBookings.length > 0 && (
            <div style={{
              backgroundColor: 'rgba(216, 1, 0, 0.06)',
              border: '1px solid rgba(216, 1, 0, 0.25)',
              borderRadius: '2px',
              padding: isMobile ? '0.1rem 0.15rem' : '0.15rem 0.25rem',
              fontSize: isMobile ? '0.6rem' : '0.7rem',
              color: 'var(--color-mizuiro)',
              fontWeight: 'bold',
              textAlign: 'center',
              fontFamily: 'var(--font-serif)',
              whiteSpace: 'nowrap',
              marginTop: '0.2rem'
            }}>
              予約: {getUniqueGroupStats(dayBookings).groupsCount} 組
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
      <div className="card" style={{ padding: isMobile ? '0.75rem 0.25rem' : '1.5rem', marginBottom: 0 }}>
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

        {/* Edit Shrine event form */}
        {editingEvent && (
          <form onSubmit={handleUpdateEvent} className="alert-warning" style={{ marginBottom: '1.25rem', border: '1px solid var(--color-mizuiro-hover)', padding: '1.25rem', backgroundColor: 'rgba(50, 136, 163, 0.05)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', fontFamily: 'var(--font-serif)', color: 'var(--color-mizuiro-hover)' }}>神社行事の変更・削除</h4>
            
            <div className="grid-2">
              <div className="form-group">
                <label>行事・祭典名 <span className="required">*</span></label>
                <input type="text" className="form-control" placeholder="例：大祓式、例大祭など" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>該当日の選択 <span className="required">*</span></label>
                <input type="date" className="form-control" value={editEventDate} onChange={(e) => setEditEventDate(e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>開始時刻 <span className="required">*</span></label>
                <input type="time" className="form-control" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>終了時刻 <span className="required">*</span></label>
                <input type="time" className="form-control" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>説明（備考）</label>
              <input type="text" className="form-control" placeholder="例：例大祭準備のため受付制限" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>

            <div className="form-group" style={{ margin: '0.75rem 0' }}>
              <label className="checkbox-label" style={{ color: 'var(--color-mizuiro-hover)', fontWeight: 'bold' }}>
                <input type="checkbox" checked={editIsClosedSlot} onChange={(e) => setEditIsClosedSlot(e.target.checked)} />
                この時間帯の一般予約枠をロック（自動クローズ）する
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>変更を保存する</button>
                <button type="button" onClick={() => setEditingEvent(null)} className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>キャンセル</button>
              </div>
              <button 
                type="button" 
                onClick={handleDeleteEvent} 
                className="btn btn-secondary" 
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', backgroundColor: '#fff1f0', borderColor: '#ffa39e', color: '#f5222d' }}
              >
                🗑️ この行事を削除する
              </button>
            </div>
          </form>
        )}

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

        {/* Calendar Grid (Full Width No Horizontal Scroll) */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '2px', width: '100%', overflow: 'hidden' }}>
          <div style={{ width: '100%' }}>
            {/* Days of week */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', 
              backgroundColor: 'var(--color-urushi)', 
              color: '#ffffff', 
              textAlign: 'center', 
              fontWeight: 'bold', 
              fontSize: isMobile ? '0.75rem' : '0.85rem', 
              padding: '0.35rem 0' 
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
              {renderCells()}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK SLOT CONTROL PANEL (TRIGGERS PER FOCUSED DATE) */}
      {focusedDate && (
        <div className="card kamidana-border" style={{ padding: isMobile ? '1rem 0.75rem' : '1.5rem' }}>
          <h4 style={{ 
            fontSize: isMobile ? '0.9rem' : '1rem', 
            fontFamily: 'var(--font-serif)', 
            borderBottom: '1px solid var(--color-border)', 
            paddingBottom: '0.4rem', 
            marginBottom: '0.75rem', 
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-mizuiro-hover)'
          }}>
            <CalendarDays size={16} />
            時間枠ごとの受付可否（ロック）設定　【 対象日: {focusedDate} 】
          </h4>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)', marginBottom: '0.85rem' }}>
            ※各時間枠をクリックして複数選択し、下の一括操作ボタンでまとめて「受付不可（ロック）」または「受付可能（解除）」に一括更新できます。
          </p>

          {/* 一括操作ツールバー */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', backgroundColor: 'var(--color-washi-dark)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={handleSelectAllSlots}
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
            >
              全て選択
            </button>
            <button
              type="button"
              onClick={handleClearSlotSelection}
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
              disabled={selectedSlots.length === 0}
            >
              選択クリア ({selectedSlots.length})
            </button>

            <div style={{ borderLeft: '1px solid var(--color-border)', height: '16px', margin: '0 0.2rem' }} />

            <button
              type="button"
              onClick={handleBatchLock}
              className="btn btn-primary"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: 'var(--color-urushi)',
                borderColor: 'var(--color-urushi)',
                color: '#ffffff'
              }}
              disabled={selectedSlots.length === 0 || loadingBatch}
            >
              🔒 選択枠をまとめて「受付不可」にする
            </button>
            <button
              type="button"
              onClick={handleBatchUnlock}
              className="btn btn-primary"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: 'var(--color-accent-green)',
                borderColor: 'var(--color-accent-green)',
                color: '#ffffff'
              }}
              disabled={selectedSlots.length === 0 || loadingBatch}
            >
              🔓 選択枠をまとめて「受付可能」にする
            </button>

            {loadingBatch && <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)' }}>一括処理中...</span>}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', 
            gap: isMobile ? '0.3rem' : '0.5rem' 
          }}>
            {TIME_SLOTS.map((slot) => {
              const matchedLockEvent = events.find(e => 
                e.event_date === focusedDate && 
                e.is_closed_slot === 1 && 
                slot >= e.start_time && 
                slot < e.end_time
              );
              const isLocked = !!matchedLockEvent;
              const isSelected = selectedSlots.includes(slot);

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleSlotClick(slot)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isMobile ? '0.35rem 0.15rem' : '0.5rem 0.35rem',
                    borderRadius: '2px',
                    border: isSelected
                      ? '2px solid var(--color-gold)'
                      : isLocked 
                        ? '1px solid var(--color-mizuiro)' 
                        : '1px solid var(--color-border)',
                    backgroundColor: isSelected
                      ? '#fff9e6'
                      : isLocked 
                        ? 'var(--color-mizuiro-light)' 
                        : '#ffffff',
                    color: isLocked ? 'var(--color-mizuiro)' : 'var(--color-urushi)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '0.7rem' : '0.85rem',
                    transform: isSelected ? 'scale(1.02)' : 'none',
                    boxShadow: isSelected ? '0 2px 6px rgba(197, 160, 89, 0.2)' : 'none'
                  }}
                >
                  <span style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', marginBottom: '0.1rem' }}>{slot}</span>
                  <span style={{ 
                    fontSize: isMobile ? '0.55rem' : '0.65rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.1rem',
                    color: isLocked ? 'var(--color-mizuiro)' : 'var(--color-accent-green)',
                    whiteSpace: 'nowrap'
                  }}>
                    {isLocked ? <Lock size={8} /> : <Unlock size={8} />}
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
              {(() => {
                const todayBookings = bookings.filter(b => b.booking_date === focusedDate && b.is_cancelled !== 1);
                const stats = getUniqueGroupStats(todayBookings);
                const totalHatsuhoryo = todayBookings.reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0);
                return (
                  <div style={{ display: 'flex', gap: '0.5rem 1rem', fontSize: '0.8rem', backgroundColor: 'var(--color-washi-dark)', padding: '0.4rem 0.8rem', border: '1px solid var(--color-border)', borderRadius: '2px', flexWrap: 'wrap' }}>
                    <div>総件数: <strong style={{ color: 'var(--color-urushi)' }}>{todayBookings.length} 件</strong></div>
                    <div>総組数: <strong style={{ color: 'var(--color-mizuiro-hover)' }}>{stats.groupsCount} 組</strong></div>
                    <div>総初穂料: <strong style={{ color: 'var(--color-accent-green)' }}>{totalHatsuhoryo.toLocaleString()}円</strong></div>
                    <div>総参列者数: <strong style={{ color: 'var(--color-gold)' }}>{stats.totalAttending} 名</strong></div>
                  </div>
                );
              })()}
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
                      <div style={{ width: '90px', display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingTop: '0.2rem', borderRight: '1px dashed rgba(197, 160, 89, 0.25)', paddingRight: '0.5rem', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: 'var(--color-mizuiro)', lineHeight: 1 }}>
                          {slot}
                        </div>
                        {(() => {
                          const slotStats = getUniqueGroupStats(grouped[slot]);
                          return (
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-accent-gray)', lineHeight: '1.3', marginTop: '0.25rem' }}>
                              <div style={{ fontWeight: 500 }}>{slotStats.groupsCount}組 ({grouped[slot].length}件)</div>
                              <div style={{ color: 'var(--color-gold)', fontWeight: 'bold', marginTop: '0.1rem', fontSize: '0.7rem' }}>👥 {slotStats.totalAttending}名</div>
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Bookings under this time slot */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {grouped[slot].map(b => {
                          const isIndiv = b.booking_type === 'individual';
                          const nameLabel = isIndiv ? '個人' : '団体';
                          const displayName = isIndiv ? (b.name || '') : (b.company_name || '');
                          const displayKana = isIndiv ? (b.kana || '') : (b.company_kana || '');
                          
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
                                    <strong>{(b.attending_count || 1)} 名</strong>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                    <span>お初穂料金額:</span>
                                    <strong style={{ color: 'var(--color-mizuiro)' }}>{(b.hatsuhoryo || 0).toLocaleString()} 円</strong>
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

      {/* DETAILED DAY POPUP MODAL */}
      {selectedDayModalDate && createPortal(
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
          zIndex: 9998,
          padding: '1rem',
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '780px',
            maxHeight: '90vh',
            boxShadow: '0 12px 35px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: 'var(--color-urushi)',
              color: '#ffffff',
              padding: '1rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '3px solid var(--color-gold)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Calendar size={22} style={{ color: 'var(--color-gold)' }} />
                  {getWarekiDateString(selectedDayModalDate)} の詳細
                </h3>
                {(() => {
                  const { rokuyo, isInu } = getRokuyoAndInu(selectedDayModalDate);
                  return (
                    <div style={{ fontSize: '0.8rem', color: '#fbf7ee', marginTop: '0.2rem', opacity: 0.9 }}>
                      六曜: <strong>{rokuyo}</strong> {isInu && <span style={{ marginLeft: '0.5rem', backgroundColor: '#e27344', color: '#fff', padding: '1px 6px', borderRadius: '3px', fontSize: '0.75rem' }}>🐕 戌の日</span>}
                    </div>
                  );
                })()}
              </div>

              <button
                type="button"
                onClick={() => setSelectedDayModalDate(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title="閉じる"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* SECTION 1: Shrine Events */}
              <div style={{ backgroundColor: 'var(--color-washi)', padding: '1rem 1.25rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-urushi)' }}>
                    📢 神社行事・予約枠制限
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setEventDate(selectedDayModalDate);
                      setShowAddForm(true);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={12} />
                    行事・制限を追加
                  </button>
                </div>

                {(() => {
                  const dayEvents = events.filter(e => e.event_date === selectedDayModalDate);
                  if (dayEvents.length === 0) {
                    return (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-accent-gray)' }}>
                        この日に登録されている神社行事・枠制限はございません。
                      </p>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {dayEvents.map(e => (
                        <div key={e.id} style={{
                          backgroundColor: e.is_closed_slot ? 'rgba(50, 136, 163, 0.06)' : 'rgba(197, 160, 89, 0.06)',
                          border: e.is_closed_slot ? '1px solid rgba(50, 136, 163, 0.25)' : '1px solid rgba(197, 160, 89, 0.25)',
                          padding: '0.6rem 0.8rem',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '1rem' }}>{e.is_closed_slot ? '🔒' : '📢'}</span>
                              <strong style={{ fontSize: '0.9rem', color: 'var(--color-urushi)' }}>{e.title}</strong>
                              <span style={{ fontSize: '0.75rem', backgroundColor: '#fff', padding: '1px 5px', borderRadius: '3px', border: '1px solid #ddd' }}>
                                {e.start_time} 〜 {e.end_time}
                              </span>
                              {e.is_closed_slot === 1 && (
                                <span style={{ fontSize: '0.7rem', backgroundColor: '#e27344', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>
                                  予約受付不可
                                </span>
                              )}
                            </div>
                            {e.description && (
                              <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.25rem', marginLeft: '1.4rem' }}>
                                {e.description}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEvent(e);
                                setEditTitle(e.title);
                                setEditEventDate(e.event_date);
                                setEditStartTime(e.start_time);
                                setEditEndTime(e.end_time);
                                setEditDescription(e.description || '');
                                setEditIsClosedSlot(e.is_closed_slot === 1);
                              }}
                              style={{
                                padding: '0.2rem 0.4rem',
                                fontSize: '0.75rem',
                                backgroundColor: '#fff',
                                border: '1px solid var(--color-gold)',
                                color: 'var(--color-urushi)',
                                borderRadius: '2px',
                                cursor: 'pointer'
                              }}
                            >
                              編集
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEventById(e.id, e.title)}
                              style={{
                                padding: '0.2rem 0.4rem',
                                fontSize: '0.75rem',
                                backgroundColor: '#fff',
                                border: '1px solid #e0b4b4',
                                color: '#c93a3a',
                                borderRadius: '2px',
                                cursor: 'pointer'
                              }}
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* SECTION 2: Bookings on Selected Date */}
              <div style={{ backgroundColor: 'var(--color-washi)', padding: '1rem 1.25rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                {(() => {
                  const dayBookings = bookings.filter(b => b.booking_date === selectedDayModalDate && Number(b.is_cancelled) !== 1);
                  const stats = getUniqueGroupStats(dayBookings);
                  const totalFee = dayBookings.reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0);

                  return (
                    <div>
                      {/* Sub-header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontFamily: 'var(--font-serif)', color: 'var(--color-urushi)' }}>
                            ⛩️ 当日のご祈祷予約一覧
                          </h4>
                          <span style={{ fontSize: '0.8rem', backgroundColor: '#fff', border: '1px solid var(--color-gold)', color: 'var(--color-urushi)', padding: '1px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                            合計 {stats.groupsCount} 組 ({dayBookings.length} 件 / 参列 {stats.totalAttending} 名 / 初穂料: ¥{totalFee.toLocaleString()})
                          </span>
                        </div>

                        {dayBookings.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectSchedulePrint) onSelectSchedulePrint(selectedDayModalDate);
                              }}
                              className="btn btn-primary"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Printer size={12} />
                              内訳印刷
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectDailyReportPrint) onSelectDailyReportPrint(selectedDayModalDate);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Printer size={12} />
                              日次報告書
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Bookings List */}
                      {dayBookings.length === 0 ? (
                        <p style={{ margin: '1rem 0', fontSize: '0.85rem', color: 'var(--color-accent-gray)', textAlign: 'center' }}>
                          この日に予定されているご祈祷予約はございません。
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          {dayBookings.map((b, idx) => {
                            const isIndiv = b.booking_type === 'individual';
                            const displayName = isIndiv ? b.name : (b.talisman_name || b.company_name);
                            return (
                              <div key={b.id || idx} style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--color-border)',
                                borderRadius: '4px',
                                padding: '0.75rem 1rem',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                      backgroundColor: 'var(--color-urushi)',
                                      color: '#ffffff',
                                      padding: '2px 8px',
                                      borderRadius: '3px',
                                      fontSize: '0.8rem',
                                      fontWeight: 'bold',
                                      fontFamily: 'var(--font-serif)'
                                    }}>
                                      {b.booking_time}
                                    </span>
                                    <strong style={{ fontSize: '0.95rem', color: 'var(--color-urushi)' }}>
                                      {displayName} 様
                                    </strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)' }}>
                                      ({isIndiv ? '個人祈祷' : '団体祈祷'})
                                    </span>
                                    <span style={{ 
                                      fontSize: '0.75rem', 
                                      fontWeight: 'bold',
                                      color: b.payment_status === 'paid' ? 'var(--color-accent-green)' : 'var(--color-mizuiro)',
                                      backgroundColor: b.payment_status === 'paid' ? 'rgba(62, 122, 92, 0.08)' : 'rgba(50, 136, 163, 0.08)',
                                      padding: '1px 6px',
                                      borderRadius: '2px'
                                    }}>
                                      {b.payment_status === 'paid' ? '支払済' : '未納'}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    <button
                                      type="button"
                                      onClick={() => setEditingBooking({ ...b })}
                                      style={{
                                        padding: '0.2rem 0.5rem',
                                        fontSize: '0.75rem',
                                        backgroundColor: '#fff',
                                        border: '1px solid var(--color-gold)',
                                        color: 'var(--color-urushi)',
                                        borderRadius: '2px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.2rem'
                                      }}
                                    >
                                      <Edit3 size={11} />
                                      日時・内容変更
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCancellingBooking(b)}
                                      style={{
                                        padding: '0.2rem 0.45rem',
                                        fontSize: '0.75rem',
                                        backgroundColor: '#fff',
                                        border: '1px solid #e0b4b4',
                                        color: '#c93a3a',
                                        borderRadius: '2px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.15rem'
                                      }}
                                    >
                                      <Trash2 size={11} />
                                      取消
                                    </button>
                                  </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.8rem', color: '#444', backgroundColor: '#fcfaf5', padding: '0.5rem 0.75rem', borderRadius: '3px' }}>
                                  <div><strong>主願意：</strong> {b.prayer1} {b.prayer2 ? ` / ${b.prayer2}` : ''}</div>
                                  <div><strong>初穂料：</strong> {b.hatsuhoryo.toLocaleString()} 円</div>
                                  <div><strong>参列人数：</strong> {b.attending_count || 1} 名</div>
                                  {(b.phone || b.staff_phone) && (
                                    <div><strong>電話番号：</strong> {isIndiv ? b.phone : `${b.staff_phone} (${b.staff_dept_title_name})`}</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #eee', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedDayModalDate(null)}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT / RESCHEDULE MODAL FROM CALENDAR */}
      {editingBooking && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1rem',
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              backgroundColor: 'var(--color-urushi)',
              color: '#ffffff',
              padding: '0.9rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid var(--color-gold)'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} style={{ color: 'var(--color-gold)' }} />
                予約日時の変更・内容編集
              </h3>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!editingBooking || !editingBooking.id) return;
              setActionLoading(true);
              setActionMessage(null);
              try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                
                // 1. Update primary target
                const res = await fetch(`${apiUrl}/api/bookings/${editingBooking.id}?is_staff=true`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editingBooking)
                });
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error || '予約日時の変更に失敗しました。');
                }

                // 2. Batch update related bookings if checkbox is checked
                if (batchRescheduleRelated && editRelatedBookings.length > 0) {
                  for (const rel of editRelatedBookings) {
                    const updatedRel = {
                      ...rel,
                      booking_date: editingBooking.booking_date,
                      booking_time: editingBooking.booking_time
                    };
                    await fetch(`${apiUrl}/api/bookings/${rel.id}?is_staff=true`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updatedRel)
                    });
                  }
                }

                const totalUpdated = 1 + (batchRescheduleRelated ? editRelatedBookings.length : 0);
                setActionMessage({ 
                  type: 'success', 
                  text: totalUpdated > 1 
                    ? `ご予約（関連予約を含む合計 ${totalUpdated} 件）の日時を正常に変更・一括更新いたしました。` 
                    : '予約日時を正常に変更・更新いたしました。' 
                });
                setTimeout(() => {
                  setEditingBooking(null);
                  setActionMessage(null);
                  onRefreshBookings();
                }, 1200);
              } catch (err: any) {
                setActionMessage({ type: 'error', text: err.message || '通信エラーが発生しました。' });
              } finally {
                setActionLoading(false);
              }
            }} style={{ padding: '1.25rem' }}>
              {actionMessage && (
                <div style={{
                  padding: '0.6rem 0.9rem',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  backgroundColor: actionMessage.type === 'success' ? '#e8f5e9' : '#ffebee',
                  color: actionMessage.type === 'success' ? '#2e7d32' : '#c62828',
                  border: `1px solid ${actionMessage.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`
                }}>
                  {actionMessage.text}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem', color: 'var(--color-urushi)' }}>
                    📅 ご祈祷予定日 <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={editingBooking.booking_date}
                    onChange={(e) => setEditingBooking({ ...editingBooking, booking_date: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.85rem', border: '1px solid var(--color-gold)', borderRadius: '3px', outline: 'none', backgroundColor: '#fcfaf5' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem', color: 'var(--color-urushi)' }}>
                    ⏰ ご祈祷時間 <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    value={editingBooking.booking_time}
                    onChange={(e) => setEditingBooking({ ...editingBooking, booking_time: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.85rem', border: '1px solid var(--color-gold)', borderRadius: '3px', outline: 'none', backgroundColor: '#fcfaf5' }}
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}の回</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                  {editingBooking.booking_type === 'individual' ? '受ける方のお名前' : '企業・団体名'}
                </label>
                <input
                  type="text"
                  value={editingBooking.booking_type === 'individual' ? (editingBooking.name || '') : (editingBooking.company_name || '')}
                  onChange={(e) => {
                    if (editingBooking.booking_type === 'individual') {
                      setEditingBooking({ ...editingBooking, name: e.target.value });
                    } else {
                      setEditingBooking({ ...editingBooking, company_name: e.target.value });
                    }
                  }}
                  required
                  style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '3px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                    主願意
                  </label>
                  <input
                    type="text"
                    value={editingBooking.prayer1}
                    onChange={(e) => setEditingBooking({ ...editingBooking, prayer1: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '3px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                    初穂料（円）
                  </label>
                  <input
                    type="number"
                    value={editingBooking.hatsuhoryo}
                    onChange={(e) => setEditingBooking({ ...editingBooking, hatsuhoryo: Number(e.target.value) })}
                    min={0}
                    step={1000}
                    required
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '3px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                    参列人数
                  </label>
                  <input
                    type="number"
                    value={editingBooking.attending_count}
                    onChange={(e) => setEditingBooking({ ...editingBooking, attending_count: Number(e.target.value) })}
                    min={1}
                    required
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '3px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                    支払状況
                  </label>
                  <select
                    value={editingBooking.payment_status}
                    onChange={(e) => setEditingBooking({ ...editingBooking, payment_status: e.target.value as 'paid' | 'unpaid' })}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '3px' }}
                  >
                    <option value="paid">支払済</option>
                    <option value="unpaid">未納（未払い）</option>
                  </select>
                </div>
              </div>

              {/* Related Bookings Batch Reschedule Box */}
              {editRelatedBookings.length > 0 && (
                <div style={{
                  backgroundColor: '#fffdf7',
                  border: '1px solid var(--color-gold)',
                  borderRadius: '4px',
                  padding: '0.75rem 0.9rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-urushi)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>💡</span> 同一申込者の関連予約が他に {editRelatedBookings.length} 件 あります：
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.6rem' }}>
                    {editRelatedBookings.map((rel, idx) => (
                      <div key={rel.id || idx} style={{ fontSize: '0.78rem', color: '#555', backgroundColor: '#ffffff', padding: '0.3rem 0.5rem', borderRadius: '3px', border: '1px solid #eee' }}>
                        ・<strong>{rel.booking_time}</strong> {rel.name || rel.company_name} 様 【{rel.prayer1}】 {rel.hatsuhoryo.toLocaleString()}円
                      </div>
                    ))}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-urushi)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={batchRescheduleRelated}
                      onChange={(e) => setBatchRescheduleRelated(e.target.checked)}
                      style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                    />
                    これらの関連予約（合計 {editRelatedBookings.length + 1} 件）も一緒に新しい日時に変更する
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                  style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Check size={16} />
                  {actionLoading ? '更新中...' : '変更を保存する'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* CANCEL CONFIRMATION MODAL FROM CALENDAR */}
      {cancellingBooking && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1rem',
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ backgroundColor: '#c93a3a', color: '#ffffff', padding: '0.9rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                予約のキャンセル（取消）確認
              </h3>
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem' }}>
              {actionMessage && (
                <div style={{
                  padding: '0.6rem 0.9rem',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  backgroundColor: actionMessage.type === 'success' ? '#e8f5e9' : '#ffebee',
                  color: actionMessage.type === 'success' ? '#2e7d32' : '#c62828',
                  border: `1px solid ${actionMessage.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`
                }}>
                  {actionMessage.text}
                </div>
              )}

              <p style={{ fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 1rem 0' }}>
                以下のご祈祷予約を<strong>キャンセル（取消）</strong>しますか？
              </p>

              <div style={{ backgroundColor: '#fbf7ee', padding: '0.75rem 1rem', borderRadius: '4px', border: '1px solid #e8dbbe', marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.7' }}>
                <div><strong>日時：</strong> {cancellingBooking.booking_date} {cancellingBooking.booking_time}の回</div>
                <div><strong>お名前：</strong> {cancellingBooking.booking_type === 'individual' ? `${cancellingBooking.name} 様` : `${cancellingBooking.company_name}`}</div>
                <div><strong>願意：</strong> {cancellingBooking.prayer1}</div>
                <div><strong>初穂料：</strong> {cancellingBooking.hatsuhoryo.toLocaleString()} 円</div>
              </div>

              {/* Related Bookings Batch Cancel Box */}
              {cancelRelatedBookings.length > 0 && (
                <div style={{
                  backgroundColor: '#fdf2f2',
                  border: '1px solid #f0b6b6',
                  borderRadius: '4px',
                  padding: '0.75rem 0.9rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#c93a3a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>💡</span> 同一申込者の関連予約が他に {cancelRelatedBookings.length} 件 あります：
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.6rem' }}>
                    {cancelRelatedBookings.map((rel, idx) => (
                      <div key={rel.id || idx} style={{ fontSize: '0.78rem', color: '#555', backgroundColor: '#ffffff', padding: '0.3rem 0.5rem', borderRadius: '3px', border: '1px solid #f5cccc' }}>
                        ・<strong>{rel.booking_time}</strong> {rel.name || rel.company_name} 様 【{rel.prayer1}】 {rel.hatsuhoryo.toLocaleString()}円
                      </div>
                    ))}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 'bold', color: '#c93a3a', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={batchCancelRelated}
                      onChange={(e) => setBatchCancelRelated(e.target.checked)}
                      style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                    />
                    同一申込者の関連予約（合計 {cancelRelatedBookings.length + 1} 件）もすべてまとめてキャンセルする
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  閉じる
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!cancellingBooking || !cancellingBooking.id) return;
                    setActionLoading(true);
                    setActionMessage(null);
                    try {
                      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                      
                      // 1. Cancel primary target
                      const res = await fetch(`${apiUrl}/api/bookings/${cancellingBooking.id}?is_staff=true`, {
                        method: 'DELETE'
                      });
                      if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || '予約のキャンセルに失敗しました。');
                      }

                      // 2. Batch cancel related bookings if checkbox is checked
                      if (batchCancelRelated && cancelRelatedBookings.length > 0) {
                        for (const rel of cancelRelatedBookings) {
                          await fetch(`${apiUrl}/api/bookings/${rel.id}?is_staff=true`, {
                            method: 'DELETE'
                          });
                        }
                      }

                      const totalCancelled = 1 + (batchCancelRelated ? cancelRelatedBookings.length : 0);
                      setActionMessage({ 
                        type: 'success', 
                        text: totalCancelled > 1 
                          ? `ご祈祷予約（同一申込者の関連予約を含む合計 ${totalCancelled} 件）をすべて一括キャンセル（取消）いたしました。` 
                          : 'ご祈祷予約を正常にキャンセル（取消）いたしました。' 
                      });
                      setTimeout(() => {
                        setCancellingBooking(null);
                        setActionMessage(null);
                        onRefreshBookings();
                      }, 1200);
                    } catch (err: any) {
                      setActionMessage({ type: 'error', text: err.message || '通信エラーが発生しました。' });
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading}
                  style={{ backgroundColor: '#c93a3a', color: '#ffffff', border: 'none', padding: '0.45rem 1.25rem', borderRadius: '3px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'bold' }}
                >
                  <Trash2 size={15} />
                  {actionLoading ? '処理中...' : 'キャンセルを実行する'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
export default CalendarView;
