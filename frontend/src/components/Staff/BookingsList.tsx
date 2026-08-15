import React, { useState } from 'react';
import { Search, Download, Trash2, Printer, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import type { Booking } from '../../types';

interface BookingsListProps {
  bookings: Booking[];
  onRefresh: () => void;
  onSelectYomifuda: (booking: Booking) => void;
  onSelectReceipt: (booking: Booking) => void;
  onSelectBulkYomifuda?: (bookings: Booking[]) => void;
}

// Helper: Determine visually distinct pastel colors based on prayer types
function getPrayerColor(prayer: string): { bg: string; text: string; border: string } {
  if (!prayer) return { bg: '#f5f5f5', text: '#555', border: '#ddd' };
  
  // 1. Evil warding / bad year purification (Red/Vermilion theme)
  if (prayer.includes('厄') || prayer.includes('除') || prayer.includes('方災') || prayer.includes('清祓')) {
    return { bg: '#fce8e6', text: '#c5221f', border: '#fad2cf' };
  }
  // 2. Child growth celebration / maternity (Blue/Cyan theme)
  if (prayer.includes('宮') || prayer.includes('七五三') || prayer.includes('安産') || prayer.includes('誕生') || prayer.includes('初節句') || prayer.includes('成長')) {
    return { bg: '#e8f0fe', text: '#1967d2', border: '#d2e3fc' };
  }
  // 3. Business / career success (Purple theme)
  if (prayer.includes('商売') || prayer.includes('社運') || prayer.includes('隆昌') || prayer.includes('万来') || prayer.includes('必勝') || prayer.includes('就職') || prayer.includes('学業') || prayer.includes('合格')) {
    return { bg: '#f3e8fd', text: '#8430d9', border: '#e8d0fc' };
  }
  // 4. Family health / safety (Pink theme)
  if (prayer.includes('家内') || prayer.includes('健全') || prayer.includes('成就') || prayer.includes('健康') || prayer.includes('病気') || prayer.includes('安全')) {
    return { bg: '#fde8f2', text: '#c2185b', border: '#fbc0ed' };
  }
  // 5. Default others (Green theme)
  return { bg: '#e6f4ea', text: '#137333', border: '#ceead6' };
}

export const BookingsList: React.FC<BookingsListProps> = ({
  bookings,
  onRefresh,
  onSelectYomifuda,
  onSelectReceipt,
  onSelectBulkYomifuda
}) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'booking_datetime' | 'kana' | 'prayer'>('booking_datetime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [includePast, setIncludePast] = useState(false);

  // Payment update modal states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [customHatsuhoryo, setCustomHatsuhoryo] = useState<number>(0);
  const [customReceiptAmount, setCustomReceiptAmount] = useState<number>(0);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);

  const [editTargetBooking, setEditTargetBooking] = useState<Booking | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Booking>>({});
  const [savingDetail, setSavingDetail] = useState(false);

  const handleOpenEditModal = (booking: Booking) => {
    setEditTargetBooking(booking);
    setEditFormData({ ...booking });
  };

  const handleUpdateBookingDetail = async () => {
    if (!editTargetBooking || !editTargetBooking.id) return;
    setSavingDetail(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings/${editTargetBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '予約情報の更新に失敗しました。');
      }
      onRefresh(); // Refresh bookings list
      setEditTargetBooking(null);
      alert('予約情報を正常に更新・上書き保存しました。');
    } catch (e: any) {
      alert(e.message || '接続に失敗しました。');
    } finally {
      setSavingDetail(false);
    }
  };

  // Accordion state for expanded details
  const [expandedBookingIds, setExpandedBookingIds] = useState<number[]>([]);

  const toggleAccordion = (id: number) => {
    setExpandedBookingIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Inline hatsuhoryo edit states
  const [editingHatsuhoryoId, setEditingHatsuhoryoId] = useState<number | null>(null);
  const [editingHatsuhoryoVal, setEditingHatsuhoryoVal] = useState<number>(0);
  const [editingProgressId, setEditingProgressId] = useState<number | null>(null);
  const [appendNoteText, setAppendNoteText] = useState<string>('');
  const [selectedBookingIds, setSelectedBookingIds] = useState<number[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState<boolean>(false);

  // Filter logic
  const filteredBookings = bookings.filter(b => {
    // Hide bookings before today (JST) unless includePast is checked OR search text is entered
    const jstDateStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
      .toLocaleDateString('sv-SE');
    if (!includePast && !searchText && b.booking_date < jstDateStr) return false;

    if (filterDate && b.booking_date !== filterDate) return false;
    if (filterType && b.booking_type !== filterType) return false;
    if (filterStatus && b.payment_status !== filterStatus) return false;
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchName = b.booking_type === 'individual' 
        ? (b.name || '').toLowerCase().includes(searchLower) || (b.kana || '').toLowerCase().includes(searchLower)
        : (b.company_name || '').toLowerCase().includes(searchLower) || (b.company_kana || '').toLowerCase().includes(searchLower);
      const matchNum = (b.receipt_number || '').toLowerCase().includes(searchLower);
      const matchPhone = (b.phone || '').includes(searchText) || (b.staff_phone || '').includes(searchText);
      const matchPrayer = (b.prayer1 || '').toLowerCase().includes(searchLower) || (b.prayer2 || '').toLowerCase().includes(searchLower);
      const matchDate = (b.booking_date || '').includes(searchText);
      return matchName || matchNum || matchPhone || matchPrayer || matchDate;
    }
    return true;
  });

  // Sort logic applied to filtered results
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';

    if (sortBy === 'created_at') {
      valA = a.created_at || '';
      valB = b.created_at || '';
    } else if (sortBy === 'booking_datetime') {
      valA = `${a.booking_date} ${a.booking_time}`;
      valB = `${b.booking_date} ${b.booking_time}`;
    } else if (sortBy === 'kana') {
      valA = a.booking_type === 'individual' ? (a.kana || '') : (a.company_kana || '');
      valB = b.booking_type === 'individual' ? (b.kana || '') : (b.company_kana || '');
    } else if (sortBy === 'prayer') {
      valA = a.prayer1 || '';
      valB = b.prayer1 || '';
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Trigger CSV export on backend
  const handleExportCSV = () => {
    const query = new URLSearchParams({
      date: filterDate,
      type: filterType,
      status: filterStatus,
      search: searchText
    }).toString();
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.open(`${apiUrl}/api/bookings/export-csv?${query}`, '_blank');
  };

  // Toggle paid status
  const handleOpenPaymentModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setCustomHatsuhoryo(booking.hatsuhoryo || 0);
    setCustomReceiptAmount(booking.receipt_amount || booking.hatsuhoryo || 0);
    setCustomNotes(booking.notes || '');
  };

  const handleUpdatePayment = async (status: 'paid' | 'unpaid') => {
    if (!selectedBooking) return;
    setSavingPayment(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings/${selectedBooking.id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: status,
          hatsuhoryo: status === 'paid' ? customHatsuhoryo : selectedBooking.hatsuhoryo,
          receipt_amount: status === 'paid' && selectedBooking.wants_receipt ? customReceiptAmount : undefined,
          notes: customNotes
        })
      });

      if (!res.ok) throw new Error('情報（支払・備考）の更新に失敗しました。');
      
      setSelectedBooking(null);
      onRefresh();
    } catch (error) {
      alert(error);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSaveHatsuhoryo = async (bookingId: number) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings/${bookingId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hatsuhoryo: editingHatsuhoryoVal
        })
      });

      if (!res.ok) throw new Error('初穂料の更新に失敗しました。');
      
      setEditingHatsuhoryoId(null);
      onRefresh();
    } catch (error: any) {
      alert(error.message || '更新に失敗しました。');
    }
  };

  const handleSaveProgress = async (bookingId: number, status: '新規です♪' | 'チェック済み！' | '受付済み♪' | 'ご祈祷中👏' | '返信済み！' | '遅刻中＞＜') => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings/${bookingId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress_status: status
        })
      });

      if (!res.ok) throw new Error('進捗状況の更新に失敗しました。');
      
      setEditingProgressId(null);
      onRefresh();
    } catch (error: any) {
      alert(error.message || '更新に失敗しました。');
    }
  };

  const handleAppendNote = () => {
    if (!appendNoteText.trim()) return;
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const stamp = `[${month}/${date} ${hours}:${minutes}]`;
    
    const newNotes = customNotes.trim() 
      ? `${customNotes.trim()}\n${stamp} ${appendNoteText.trim()}`
      : `${stamp} ${appendNoteText.trim()}`;
      
    setCustomNotes(newNotes);
    setAppendNoteText('');
  };

  // Toggle selection for a single booking
  const handleToggleSelectBooking = (id: number) => {
    setSelectedBookingIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle selection for all visible bookings
  const handleToggleSelectAll = (visibleBookings: Booking[]) => {
    const visibleIds = visibleBookings.map(b => b.id!).filter(id => id !== undefined);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedBookingIds.includes(id));
    
    if (allSelected) {
      // Remove all visible from selection
      setSelectedBookingIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Add all visible to selection
      setSelectedBookingIds(prev => {
        const next = [...prev];
        visibleIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  // Perform bulk update API request
  const handleBulkUpdate = async (fields: any) => {
    if (selectedBookingIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings/bulk-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedBookingIds,
          fields
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '一括更新に失敗しました。');
      }
      
      setSelectedBookingIds([]);
      onRefresh();
    } catch (error: any) {
      alert(error.message || '更新に失敗しました。');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Delete booking - open confirmation modal
  const handleDeleteBooking = (booking: Booking) => {
    setDeleteTarget(booking);
  };

  const handleToggleCheckbox = async (booking: Booking, field: 'is_accepted' | 'payment_status' | 'is_receipt_issued') => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      let payload: any = {};
      if (field === 'is_accepted') {
        payload.is_accepted = Number(booking.is_accepted) === 1 ? 0 : 1;
        payload.payment_status = booking.payment_status;
      } else if (field === 'is_receipt_issued') {
        payload.is_receipt_issued = Number(booking.is_receipt_issued) === 1 ? 0 : 1;
        payload.payment_status = booking.payment_status;
      } else if (field === 'payment_status') {
        payload.payment_status = booking.payment_status === 'paid' ? 'unpaid' : 'paid';
      }

      const res = await fetch(`${apiUrl}/api/bookings/${booking.id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('ステータスの更新に失敗しました。');
      onRefresh();
    } catch (err: any) {
      alert(err.message || '更新に失敗しました。');
    }
  };

  return (
    <div>
      {/* Search and filter toolbar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.75rem', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="text"
                placeholder="名前・会社名・受付番号・電話番号"
                className="form-control"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent-gray)' }} />
            </div>

            {/* Date filter */}
            <input
              type="date"
              className="form-control"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ width: '150px', fontSize: '0.85rem' }}
            />

            {/* Type filter */}
            <select
              className="form-control"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ width: '130px', fontSize: '0.85rem' }}
            >
              <option value="">-- 全区分 --</option>
              <option value="individual">個人祈祷</option>
              <option value="organization">団体祈祷</option>
            </select>

            {/* Payment status filter */}
            <select
              className="form-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '120px', fontSize: '0.85rem' }}
            >
              <option value="">-- 全支払 --</option>
              <option value="paid">支払済</option>
              <option value="unpaid">未払い</option>
            </select>

            {/* Sorting controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.5rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', whiteSpace: 'nowrap' }}>並べ替え:</span>
              <select
                className="form-control"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ width: '130px', fontSize: '0.8rem', padding: '0.25rem 0.5rem', height: 'auto' }}
              >
                <option value="created_at">予約受付順 (更新順)</option>
                <option value="booking_datetime">ご参拝日時順</option>
                <option value="kana">お名前順 (あいうえお)</option>
                <option value="prayer">願意順</option>
              </select>
              <button
                type="button"
                className="btn btn-outline-gold"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', height: 'auto', minWidth: '40px', cursor: 'pointer' }}
                title={sortOrder === 'asc' ? '昇順 (古い・小さい順)' : '降順 (新しい・大きい順)'}
              >
                {sortOrder === 'asc' ? '▲ 昇順' : '▼ 降順'}
              </button>
            </div>

            {/* Past bookings option */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontSize: '0.8rem', 
              color: 'var(--color-urushi)', 
              cursor: 'pointer', 
              whiteSpace: 'nowrap', 
              userSelect: 'none', 
              marginLeft: '0.5rem',
              borderLeft: '1px solid var(--color-border)',
              paddingLeft: '0.75rem',
              height: '32px'
            }}>
              <input 
                type="checkbox" 
                checked={includePast} 
                onChange={(e) => setIncludePast(e.target.checked)}
                style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: 'var(--color-urushi)' }}
              />
              <span>過去の予約を含める</span>
            </label>
          </div>

          <button 
            onClick={handleExportCSV} 
            className="btn btn-outline-gold" 
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={14} />
            CSVエクスポート
          </button>
        </div>
      </div>

      {selectedBookingIds.length > 0 && (
        <div style={{
          backgroundColor: '#faf7f0',
          border: '1px solid var(--color-gold)',
          borderRadius: '4px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              backgroundColor: 'var(--color-urushi)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              padding: '0.2rem 0.6rem',
              borderRadius: '20px'
            }}>
              選択中: {selectedBookingIds.length} 件
            </span>
            <button
              onClick={() => setSelectedBookingIds([])}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent-gray)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                textDecoration: 'underline'
              }}
            >
              選択を解除
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* 一括: 受付状況 */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                onClick={() => handleBulkUpdate({ is_accepted: 1 })}
                className="btn btn-outline-gold"
                disabled={isBulkUpdating}
                style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', backgroundColor: '#ffffff' }}
              >
                一括受付済
              </button>
              <button
                onClick={() => handleBulkUpdate({ is_accepted: 0 })}
                className="btn btn-outline-gold"
                disabled={isBulkUpdating}
                style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', backgroundColor: '#ffffff', color: 'var(--color-accent-gray)', borderColor: 'var(--color-border)' }}
              >
                一括受付解除
              </button>
            </div>

            {/* 一括: 初穂料支払状況 */}
            <div style={{ display: 'flex', gap: '0.35rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '0.75rem' }}>
              <button
                onClick={() => handleBulkUpdate({ payment_status: 'paid' })}
                className="btn btn-outline-gold"
                disabled={isBulkUpdating}
                style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', backgroundColor: '#ffffff', color: 'var(--color-accent-green)', borderColor: 'var(--color-accent-green)' }}
              >
                一括支払済
              </button>
              <button
                onClick={() => handleBulkUpdate({ payment_status: 'unpaid' })}
                className="btn btn-outline-gold"
                disabled={isBulkUpdating}
                style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', backgroundColor: '#ffffff', color: 'var(--color-shu)', borderColor: 'var(--color-shu)' }}
              >
                一括未払い
              </button>
            </div>

            {/* 一括: 進捗ステータス */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#555', fontWeight: 'bold' }}>一括進捗変更:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkUpdate({ progress_status: e.target.value });
                    e.target.value = ''; // Reset select
                  }
                }}
                disabled={isBulkUpdating}
                defaultValue=""
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: '3px',
                  border: '1px solid var(--color-gold)',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="" disabled>ステータスを選択...</option>
                <option value="新規です♪">新規です♪</option>
                <option value="チェック済み！">チェック済み！</option>
                <option value="受付済み♪">受付済み♪</option>
                <option value="ご祈祷中👏">ご祈祷中👏</option>
                <option value="返信済み！">返信済み！</option>
                <option value="遅刻中＞＜">遅刻中＞＜</option>
              </select>
            </div>
            
            {/* 一括: 取消処理 */}
            <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '0.75rem' }}>
              <button
                onClick={() => {
                  if (window.confirm(`選択された ${selectedBookingIds.length} 件の予約を一括でキャンセル（取消）しますか？`)) {
                    handleBulkUpdate({ is_cancelled: 1 });
                  }
                }}
                className="btn"
                disabled={isBulkUpdating}
                style={{
                  fontSize: '0.72rem',
                  padding: '0.3rem 0.6rem',
                  backgroundColor: 'rgba(211, 56, 28, 0.1)',
                  color: 'var(--color-shu)',
                  border: '1px solid var(--color-shu)',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  margin: 0
                }}
              >
                一括取消
              </button>
            </div>

            {/* 一括: 読み札印刷 */}
            <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '0.75rem' }}>
              <button
                onClick={() => {
                  const selectedBookings = bookings.filter(b => selectedBookingIds.includes(b.id!) && b.is_cancelled !== 1);
                  if (selectedBookings.length === 0) {
                    alert('印刷可能な予約（キャンセルされていない予約）が選択されていません。');
                    return;
                  }
                  if (onSelectBulkYomifuda) {
                    onSelectBulkYomifuda(selectedBookings);
                  }
                }}
                className="btn btn-primary"
                style={{
                  fontSize: '0.72rem',
                  padding: '0.3rem 0.6rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  backgroundColor: 'var(--color-mizuiro-hover)',
                  borderColor: 'var(--color-mizuiro-hover)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <Printer size={12} />
                一括お札印刷
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-urushi)', color: '#ffffff', borderBottom: '2px solid var(--color-gold)' }}>
              <th style={{ padding: '0.75rem 1rem', width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={sortedBookings.length > 0 && sortedBookings.every(b => selectedBookingIds.includes(b.id!))} 
                  onChange={() => handleToggleSelectAll(sortedBookings)}
                  style={{ cursor: 'pointer', width: '15px', height: '15px' }} 
                />
              </th>
              <th style={{ padding: '0.75rem 1rem' }}>参拝日時</th>
              <th style={{ padding: '0.75rem 1rem' }}>区分</th>
              <th style={{ padding: '0.75rem 1rem' }}>氏名 / 会社名</th>
              <th style={{ padding: '0.75rem 1rem' }}>願意</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>初穂料</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>進捗</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>社務状態</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>備考</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>書面</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedBookings.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-accent-gray)' }}>
                  該当する予約情報が見つかりません。
                </td>
              </tr>
            ) : (
              sortedBookings.map((b) => {
                const isIndiv = b.booking_type === 'individual';
                const nameDisplay = isIndiv ? b.name : b.company_name;
                const statusColor = b.payment_status === 'paid' ? 'var(--color-accent-green)' : 'var(--color-shu)';

                const isCancelled = b.is_cancelled === 1;
                const isChanged = b.is_changed === 1;
                
                let rowStyle: React.CSSProperties = { 
                  borderBottom: '1px solid var(--color-border)', 
                  transition: 'background-color 0.15s' 
                };
                if (isCancelled) {
                  rowStyle = {
                    ...rowStyle,
                    backgroundColor: '#fff5f5',
                    color: 'var(--color-accent-gray)',
                    textDecoration: 'line-through'
                  };
                } else if (!isIndiv) {
                  rowStyle = {
                    ...rowStyle,
                    backgroundColor: '#faf7f0'
                  };
                }

                return (
                  <tr key={b.id} style={rowStyle} className={isCancelled ? "" : "hover-row"}>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedBookingIds.includes(b.id!)} 
                        onChange={() => handleToggleSelectBooking(b.id!)} 
                        style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{b.booking_date} {b.booking_time}</div>
                      {b.created_at && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-accent-gray)', marginTop: '0.15rem' }} title="予約受付日時">
                          受付: {new Date(b.created_at).toLocaleString('ja-JP', { hour12: false }).slice(0, 16)}
                        </div>
                      )}
                      
                      {isCancelled && b.cancelled_at && (
                        <div style={{
                          fontSize: '0.68rem',
                          color: 'var(--color-shu)',
                          fontWeight: 'bold',
                          marginTop: '0.2rem',
                          backgroundColor: '#ffebee',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '2px',
                          display: 'inline-block'
                        }}>
                          ❌ 取消: {b.cancelled_at}
                        </div>
                      )}

                      {!isCancelled && b.is_changed === 1 && b.changed_at && (
                        <div style={{ marginTop: '0.2rem' }}>
                          <div style={{
                            fontSize: '0.68rem',
                            color: 'var(--color-mizuiro-hover)',
                            fontWeight: 'bold',
                            backgroundColor: '#e0f7fa',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '2px',
                            display: 'inline-block'
                          }}>
                            ✏️ 変更: {b.changed_at}
                          </div>
                          {b.changed_history && (
                            <div style={{
                              fontSize: '0.62rem',
                              color: '#666',
                              marginTop: '0.1rem',
                              fontStyle: 'italic',
                              lineHeight: '1.2'
                            }}>
                              ({b.changed_history})
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                        <span style={{ 
                          borderColor: isIndiv ? 'var(--color-accent-green)' : 'var(--color-gold)', 
                          color: isIndiv ? 'var(--color-accent-green)' : 'var(--color-urushi)', 
                          backgroundColor: isIndiv ? '#e6f4ea' : '#fef7e0', 
                          border: `1px solid ${isIndiv ? 'var(--color-accent-green)' : 'var(--color-gold)'}`,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap'
                        }}>
                          {isIndiv ? '個人' : '団体'}
                        </span>
                        {isCancelled && (
                          <span className="badge badge-unpaid" style={{ borderColor: 'var(--color-shu)', color: 'var(--color-shu)', backgroundColor: 'rgba(211, 56, 28, 0.05)', textDecoration: 'none', fontSize: '0.65rem', padding: '0.1rem 0.25rem', fontWeight: 'bold' }}>
                            取消
                          </span>
                        )}
                        {isChanged && !isCancelled && (
                          <span className="badge badge-paid" style={{ borderColor: 'var(--color-mizuiro)', color: 'var(--color-mizuiro-hover)', backgroundColor: 'rgba(50, 136, 163, 0.05)', textDecoration: 'none', fontSize: '0.65rem', padding: '0.1rem 0.25rem', fontWeight: 'bold' }}>
                            変更有
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>{nameDisplay}</span>
                        {b.has_past_prayer === 1 && (
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            color: '#7e22ce',
                            backgroundColor: '#f3e8ff',
                            border: '1px solid #d8b4fe',
                            padding: '0.15rem 0.35rem',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap'
                          }}>
                            祈祷歴あり
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)' }}>
                        {isIndiv ? b.phone : `${b.staff_dept_title_name} (${b.staff_phone})`}
                      </div>

                       {/* Display child details and notes inside an accordion */}
                      {(() => {
                        const hasChild = isIndiv && !!b.child_name;
                        const hasParents = isIndiv && (!!b.father_name || !!b.mother_name);
                        const hasYakudoshi = isIndiv && !!b.yakudoshi_type;
                        const hasKotobuki = isIndiv && !!b.kotobuki_type;
                        
                        const hasTournament = !isIndiv && !!b.tournament_name;
                        const hasConstruction = !isIndiv && !!b.construction_name;
                        
                        const hasDetails = hasChild || hasParents || hasYakudoshi || hasKotobuki || hasTournament || hasConstruction || !!b.notes;
                        const isExpanded = expandedBookingIds.includes(b.id!);

                        if (!hasDetails) return null;

                        return (
                          <>
                            <div style={{ marginTop: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() => toggleAccordion(b.id!)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  border: 'none',
                                  background: 'none',
                                  color: 'var(--color-mizuiro-hover)',
                                  cursor: 'pointer',
                                  fontSize: '0.72rem',
                                  fontWeight: 'bold',
                                  padding: 0,
                                  outline: 'none'
                                }}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp size={11} />
                                    詳細を閉じる
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown size={11} />
                                    詳細を表示 (
                                    {(() => {
                                      const parts = [];
                                      if (hasChild) parts.push('子息情報');
                                      if (hasParents) parts.push('家族情報');
                                      if (hasYakudoshi || hasKotobuki) parts.push('祈祷情報');
                                      if (hasTournament || hasConstruction) parts.push('行事・工事情報');
                                      if (b.notes) parts.push('備考');
                                      return parts.join('・');
                                    })()}
                                    )
                                  </>
                                )}
                              </button>
                            </div>

                            {isExpanded && (
                              <div style={{
                                marginTop: '0.4rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                                padding: '0.4rem',
                                backgroundColor: '#fafafa',
                                border: '1px solid #e5e5e5',
                                borderRadius: '4px',
                                maxWidth: '280px'
                              }}>
                                {/* A. お子様情報 */}
                                {hasChild && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    backgroundColor: '#faf7f0',
                                    border: '1px solid rgba(197, 160, 89, 0.3)',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '3px'
                                  }}>
                                    <div style={{ color: 'var(--color-urushi)', fontWeight: 'bold' }}>
                                      👶 {b.is_twin === 1 ? '第1子: ' : ''}{b.child_name} ({b.child_kana}){b.child_gender ? ` [${b.child_gender}]` : ''}
                                    </div>
                                    {b.child_birthday && (
                                      <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)' }}>
                                        生年月日: {b.child_birthday}
                                      </div>
                                    )}
                                    
                                    {/* 双子（第二子） */}
                                    {b.is_twin === 1 && b.child_name2 && (
                                      <div style={{ borderTop: '1px dashed rgba(197,160,89,0.2)', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                                        <div style={{ color: 'var(--color-urushi)', fontWeight: 'bold' }}>
                                          👶 第2子: {b.child_name2} ({b.child_kana2}){b.child_gender2 ? ` [${b.child_gender2}]` : ''}
                                        </div>
                                        {b.child_birthday2 && (
                                          <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)' }}>
                                            生年月日: {b.child_birthday2}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* B. 家族情報（父母の名前） */}
                                {hasParents && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    backgroundColor: '#f5f7fa',
                                    border: '1px solid #dcdfe6',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '3px',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.3rem'
                                  }}>
                                    {b.father_name && (
                                      <div>
                                        <div style={{ fontSize: '0.62rem', color: '#777' }}>父親 (フリガナ)</div>
                                        <strong style={{ fontSize: '0.82rem' }}>{b.father_name}</strong>
                                        <div style={{ fontSize: '0.65rem', color: '#666' }}>({b.father_kana || '不明'})</div>
                                      </div>
                                    )}
                                    {b.mother_name && (
                                      <div>
                                        <div style={{ fontSize: '0.62rem', color: '#777' }}>母親 (フリガナ)</div>
                                        <strong style={{ fontSize: '0.82rem' }}>{b.mother_name}</strong>
                                        <div style={{ fontSize: '0.65rem', color: '#666' }}>({b.mother_kana || '不明'})</div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* C. 厄年情報 */}
                                {hasYakudoshi && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    backgroundColor: '#faf1f1',
                                    border: '1px solid #f5c2c2',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '3px'
                                  }}>
                                    <div style={{ color: '#d3381c', fontWeight: 'bold' }}>
                                      👹 厄年区分: {b.yakudoshi_type === 'maeyaku' ? '前厄' : b.yakudoshi_type === 'honyaku' ? '本厄' : '後厄'}
                                    </div>
                                  </div>
                                )}

                                {/* D. 寿祝い情報 */}
                                {hasKotobuki && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    backgroundColor: '#faf5f0',
                                    border: '1px solid #f5dab1',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '3px'
                                  }}>
                                    <div style={{ color: '#e6a23c', fontWeight: 'bold' }}>
                                      🎉 寿祝い: {b.kotobuki_type === 'その他' ? b.kotobuki_other_text : b.kotobuki_type}
                                    </div>
                                  </div>
                                )}

                                {/* E. 団体大会情報 */}
                                {hasTournament && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    backgroundColor: '#fdf6ec',
                                    border: '1px solid #f5dab1',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '3px'
                                  }}>
                                    <div style={{ fontWeight: 'bold', color: '#e6a23c' }}>🏆 必勝祈願 大会情報</div>
                                    <div><strong>大会名:</strong> {b.tournament_name}</div>
                                    {b.tournament_schedule && <div><strong>日程:</strong> {b.tournament_schedule}</div>}
                                  </div>
                                )}

                                {/* F. 団体工事安全情報 */}
                                {hasConstruction && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    backgroundColor: '#f0f9eb',
                                    border: '1px solid #c2e7b0',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '3px',
                                    lineHeight: '1.3'
                                  }}>
                                    <div style={{ fontWeight: 'bold', color: '#67c23a' }}>🚧 工事安全祈願 情報</div>
                                    <div><strong>工事名:</strong> {b.construction_name}</div>
                                    {b.construction_builder && <div><strong>施工:</strong> {b.construction_builder}</div>}
                                    {b.construction_designer && <div><strong>設計:</strong> {b.construction_designer}</div>}
                                    {b.construction_period && <div><strong>工期:</strong> {b.construction_period}</div>}
                                  </div>
                                )}

                                {/* G. 備考（メモ） */}
                                {b.notes && (
                                  <div style={{ 
                                    fontSize: '0.73rem', 
                                    backgroundColor: '#ffffff', 
                                    padding: '0.3rem 0.45rem', 
                                    borderRadius: '2px', 
                                    color: '#555',
                                    borderLeft: '3px solid var(--color-gold)',
                                    borderTop: '1px solid #f0f0f0',
                                    borderRight: '1px solid #f0f0f0',
                                    borderBottom: '1px solid #f0f0f0',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all'
                                  }} title={b.notes}>
                                    📝 {b.notes}
                                  </div>
                                )}

                                {/* 予約情報編集ボタン */}
                                <div style={{ marginTop: '0.45rem', display: 'flex', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => handleOpenEditModal(b)}
                                    className="btn btn-outline-gold"
                                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', backgroundColor: '#ffffff', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    ✏️ 予約情報を編集・書き換える
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {(() => {
                        const pStyle = getPrayerColor(b.prayer1);
                        return (
                          <div style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            backgroundColor: pStyle.bg,
                            color: pStyle.text,
                            border: `1px solid ${pStyle.border}`
                          }}>
                            {b.prayer1}
                          </div>
                        );
                      })()}
                      {b.prayer2 && <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)', marginTop: '0.2rem', paddingLeft: '0.25rem' }}>+{b.prayer2}</div>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                      {editingHatsuhoryoId === b.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                          <input
                            type="number"
                            className="form-control"
                            value={editingHatsuhoryoVal}
                            onChange={(e) => setEditingHatsuhoryoVal(Number(e.target.value))}
                            style={{ width: '80px', padding: '0.2rem 0.4rem', fontSize: '0.85rem', textAlign: 'right', margin: 0, border: '1px solid var(--color-gold)' }}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveHatsuhoryo(b.id!)}
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', backgroundColor: 'var(--color-accent-green)', color: '#ffffff', border: 'none', borderRadius: '2px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingHatsuhoryoId(null)}
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', backgroundColor: 'var(--color-accent-gray)', color: '#ffffff', border: 'none', borderRadius: '2px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end', cursor: isCancelled ? 'not-allowed' : 'pointer' }}
                          onClick={() => {
                            if (!isCancelled) {
                              setEditingHatsuhoryoId(b.id!);
                              setEditingHatsuhoryoVal(b.hatsuhoryo);
                            }
                          }}
                          title="クリックして初穂料を編集"
                        >
                          <span>{b.hatsuhoryo.toLocaleString()} 円</span>
                          {!isCancelled && <Edit3 size={11} style={{ color: 'var(--color-accent-gray)', opacity: 0.6 }} />}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {editingProgressId === b.id ? (
                        <select
                          value={b.progress_status || '新規です♪'}
                          onChange={(e) => handleSaveProgress(b.id!, e.target.value as any)}
                          onBlur={() => setEditingProgressId(null)}
                          autoFocus
                          style={{
                            padding: '0.15rem 0.3rem',
                            fontSize: '0.75rem',
                            borderRadius: '3px',
                            border: '1px solid var(--color-gold)',
                            backgroundColor: '#ffffff',
                            color: '#333',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="新規です♪">新規です♪</option>
                          <option value="チェック済み！">チェック済み！</option>
                          <option value="受付済み♪">受付済み♪</option>
                          <option value="ご祈祷中👏">ご祈祷中👏</option>
                          <option value="返信済み！">返信済み！</option>
                          <option value="遅刻中＞＜">遅刻中＞＜</option>
                        </select>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                          <div
                            onClick={() => {
                              if (!isCancelled) {
                                setEditingProgressId(b.id!);
                              }
                            }}
                            style={(() => {
                              const status = b.progress_status || '新規です♪';
                              let bg = '#e0f7fa';
                              let text = '#006064';
                              let border = '#b2ebf2';
                              
                              if (status === 'チェック済み！') {
                                bg = '#e8f5e9';
                                text = '#1b5e20';
                                border = '#c8e6c9';
                              } else if (status === '受付済み♪') {
                                bg = '#fff3e0';
                                text = '#e65100';
                                border = '#ffe0b2';
                              } else if (status === 'ご祈祷中👏') {
                                bg = '#e8eaf6';
                                text = '#1a237e';
                                border = '#c5cae9';
                              } else if (status === '返信済み！') {
                                bg = '#f3e5f5';
                                text = '#4a148c';
                                border = '#e1bee7';
                              } else if (status === '遅刻中＞＜') {
                                bg = '#ffebee';
                                text = '#b71c1c';
                                border = '#ffcdd2';
                              }
                              
                              return {
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '20px',
                                fontSize: '0.72rem',
                                fontWeight: 'bold',
                                backgroundColor: bg,
                                color: text,
                                border: `1px solid ${border}`,
                                cursor: isCancelled ? 'not-allowed' : 'pointer',
                                userSelect: 'none'
                              };
                            })()}
                            title="クリックして進捗ステータスを変更"
                          >
                            <span>{b.progress_status || '新規です♪'}</span>
                            {!isCancelled && <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>▼</span>}
                          </div>
                          {b.progress_status_updated_at && (
                            <div style={{ fontSize: '0.62rem', color: '#888', whiteSpace: 'nowrap' }} title="進捗ステータスの最終更新日時">
                              更新: {b.progress_status_updated_at}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem', cursor: isCancelled ? 'not-allowed' : 'pointer', margin: 0, opacity: isCancelled ? 0.5 : 1 }}>
                          <input 
                            type="checkbox" 
                            checked={Number(b.is_accepted) === 1} 
                            onChange={() => !isCancelled && handleToggleCheckbox(b, 'is_accepted')} 
                            disabled={isCancelled}
                            style={{ width: '15px', height: '15px', cursor: isCancelled ? 'not-allowed' : 'pointer', margin: '0 0 0.15rem 0' }}
                          />
                          <span>受付</span>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem', cursor: isCancelled ? 'not-allowed' : 'pointer', margin: 0, opacity: isCancelled ? 0.5 : 1 }}>
                          <input 
                            type="checkbox" 
                            checked={b.payment_status === 'paid'} 
                            onChange={() => !isCancelled && handleToggleCheckbox(b, 'payment_status')} 
                            disabled={isCancelled}
                            style={{ width: '15px', height: '15px', cursor: isCancelled ? 'not-allowed' : 'pointer', margin: '0 0 0.15rem 0' }}
                          />
                          <span style={{ color: b.payment_status === 'paid' ? 'var(--color-accent-green)' : 'var(--color-shu)' }}>初穂</span>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem', cursor: isCancelled ? 'not-allowed' : 'pointer', margin: 0, opacity: isCancelled ? 0.5 : 1 }}>
                          <input 
                            type="checkbox" 
                            checked={Number(b.is_receipt_issued) === 1} 
                            onChange={() => !isCancelled && handleToggleCheckbox(b, 'is_receipt_issued')} 
                            disabled={isCancelled}
                            style={{ width: '15px', height: '15px', cursor: isCancelled ? 'not-allowed' : 'pointer', margin: '0 0 0.15rem 0' }}
                          />
                          <span>領収</span>
                        </label>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => !isCancelled && handleOpenPaymentModal(b)}
                        disabled={isCancelled}
                        style={{
                          backgroundColor: b.payment_status === 'paid' ? 'rgba(62, 122, 92, 0.1)' : 'rgba(211, 56, 28, 0.1)',
                          border: `1px solid ${statusColor}`,
                          color: statusColor,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '2px',
                          cursor: isCancelled ? 'not-allowed' : 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          opacity: isCancelled ? 0.5 : 1
                        }}
                      >
                        <Edit3 size={12} />
                        備考
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => !isCancelled && onSelectYomifuda(b)}
                          disabled={isCancelled}
                          title="読み札を印刷"
                          style={{
                            border: '1px solid var(--color-border)',
                            backgroundColor: '#ffffff',
                            padding: '0.2rem',
                            cursor: isCancelled ? 'not-allowed' : 'pointer',
                            color: 'var(--color-urushi-light)',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: isCancelled ? 0.4 : 1
                          }}
                        >
                          <Printer size={14} />
                          <span style={{ fontSize: '0.7rem', marginLeft: '0.15rem' }}>お札</span>
                        </button>
                        {!isIndiv && b.wants_receipt === 1 && (
                          <button
                            onClick={() => !isCancelled && onSelectReceipt(b)}
                            disabled={isCancelled}
                            title="領収証を印刷"
                            style={{
                              border: '1px solid var(--color-gold)',
                              backgroundColor: 'rgba(197, 160, 89, 0.05)',
                              padding: '0.2rem',
                              cursor: isCancelled ? 'not-allowed' : 'pointer',
                              color: 'var(--color-gold)',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: isCancelled ? 0.4 : 1
                            }}
                          >
                            <Printer size={14} />
                            <span style={{ fontSize: '0.7rem', marginLeft: '0.15rem' }}>領収</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => b.id && handleDeleteBooking(b)}
                        title={isCancelled ? "データベースから完全に消去" : "予約を消去（キャンセル・完全削除）"}
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--color-shu)',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          opacity: isCancelled ? 0.6 : 1
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modifying Modal */}
      {selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card washi-bg" style={{ 
            maxWidth: '450px', 
            width: '100%', 
            margin: 0, 
            padding: '1.5rem', 
            border: '2px solid var(--color-gold)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
          }}>
            <h4 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              備考・支払情報の更新
            </h4>
            
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--color-urushi-light)' }}>
              <strong>参拝者:</strong> {selectedBooking.booking_type === 'individual' ? selectedBooking.name : selectedBooking.company_name} 様<br />
              <strong>願意:</strong> {selectedBooking.prayer1}<br />
              <strong>基準初穂料:</strong> {selectedBooking.hatsuhoryo.toLocaleString()} 円
            </p>

            <div className="form-group">
              <label>実際に納められたお初穂料 (お気持ち額を含む) <span className="required">*</span></label>
              <input
                type="number"
                className="form-control"
                value={customHatsuhoryo}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setCustomHatsuhoryo(val);
                  setCustomReceiptAmount(val); // Sync default receipt amount
                }}
                style={{ border: '1px solid var(--color-gold)', fontWeight: 'bold', fontSize: '1.1rem' }}
              />
            </div>

            {selectedBooking.wants_receipt === 1 && (
              <div className="form-group alert-warning" style={{ padding: '0.75rem', marginTop: '0.5rem' }}>
                <label>領収証記載金額</label>
                <input
                  type="number"
                  className="form-control"
                  value={customReceiptAmount}
                  onChange={(e) => setCustomReceiptAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ border: '1px solid var(--color-border)' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)', marginTop: '0.2rem', display: 'block' }}>
                  ※宛名: {selectedBooking.receipt_name}
                </span>
              </div>
            )}

            <div className="form-group" style={{ marginTop: '0.75rem', padding: '0.6rem', backgroundColor: '#fafafa', border: '1px solid #e5e5e5', borderRadius: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-urushi)', fontWeight: 'bold', display: 'block', marginBottom: '0.2rem' }}>✍️ 既存の備考・情報に新しいメモを追記する</label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="追記したいメモを入力..."
                  value={appendNoteText}
                  onChange={(e) => setAppendNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAppendNote();
                    }
                  }}
                  style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem', border: '1px solid var(--color-gold)', margin: 0 }}
                />
                <button
                  type="button"
                  onClick={handleAppendNote}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.75rem',
                    backgroundColor: 'var(--color-gold)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  末尾に追記
                </button>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#888', marginTop: '0.2rem', display: 'block', lineHeight: '1.25' }}>
                ※「末尾に追記」を押すと、現在の日時スタンプ `[月/日 時:分]` 付きで、自動的に改行して備考欄の末尾に安全に追記されます。既存の情報（生年月日や車種など）は上部に保持されます。
              </span>
            </div>

            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label>管理者用備考（メモ・コメント全体）</label>
              <textarea
                className="form-control"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={3}
                placeholder="祈祷に関する特記事項やメモ"
                style={{ border: '1px solid var(--color-border)', resize: 'vertical', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => setSelectedBooking(null)}
                disabled={savingPayment}
              >
                キャンセル
              </button>

              {/* 備考・支払情報のみを現在の支払ステータス維持で保存するボタン */}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}
                onClick={() => handleUpdatePayment(selectedBooking.payment_status)}
                disabled={savingPayment}
              >
                {savingPayment ? '保存中...' : `備考・初穂料のみ保存 (${selectedBooking.payment_status === 'paid' ? '支払済のまま' : '未払いのまま'})`}
              </button>
              
              {selectedBooking.payment_status === 'paid' ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--color-shu)', color: 'var(--color-shu)' }}
                  onClick={() => handleUpdatePayment('unpaid')}
                  disabled={savingPayment}
                >
                  未払いに戻して保存
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => handleUpdatePayment('paid')}
                  disabled={savingPayment}
                >
                  支払済にして保存
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card kamidana-border" style={{ maxWidth: '460px', width: '100%', padding: '1.5rem', backgroundColor: '#ffffff', color: '#333333' }}>
            <h4 style={{ fontSize: '1.05rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-urushi)', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⚠️ 予約の消去方法を選択してください
            </h4>
            
            <div style={{ fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '1.25rem', backgroundColor: 'var(--color-washi-dark)', padding: '0.75rem', border: '1px solid var(--color-border)' }}>
              <div>受付番号: <strong>{deleteTarget.receipt_number}</strong></div>
              <div>氏名/企業: <strong>{deleteTarget.booking_type === 'individual' ? deleteTarget.name : deleteTarget.company_name} 様</strong></div>
              <div>願意内容: <strong>{deleteTarget.prayer1}</strong></div>
              <div>参拝日時: <strong>{deleteTarget.booking_date} {deleteTarget.booking_time}</strong></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {deleteTarget.is_cancelled !== 1 && (
                <button
                   type="button"
                   className="btn btn-outline-gold"
                   onClick={async () => {
                     try {
                       const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                       const res = await fetch(`${apiUrl}/api/bookings/${deleteTarget.id}`, { method: 'DELETE' });
                       if (!res.ok) throw new Error('予約のキャンセルに失敗しました。');
                       setDeleteTarget(null);
                       onRefresh();
                     } catch (error) {
                       alert(error);
                     }
                   }}
                   style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', padding: '0.75rem', gap: '0.15rem', cursor: 'pointer', width: '100%' }}
                >
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-gold)' }}>❌ 予約のキャンセル (取消扱いとして残す)</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)' }}>
                    台帳の一覧に「取消（斜線）」の状態で残します。過去の予約の履歴として後から確認できます。
                  </span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-outline-gold"
                onClick={async () => {
                  if (!confirm('この予約データをデータベースから完全に消去します。この操作は絶対に取り消せません。本当によろしいですか？')) return;
                  try {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const res = await fetch(`${apiUrl}/api/bookings/${deleteTarget.id}?hard=true`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('予約の完全削除に失敗しました。');
                    setDeleteTarget(null);
                    onRefresh();
                  } catch (error) {
                    alert(error);
                  }
                }}
                style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', padding: '0.75rem', gap: '0.15rem', cursor: 'pointer', borderColor: 'var(--color-shu)', width: '100%' }}
              >
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-shu)' }}>🗑️ 完全削除 (データベースから物理消去)</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)' }}>
                  予約の記録自体をシステムおよび台帳から完全に消去し、画面から綺麗に消し去ります。
                </span>
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 予約情報編集モーダル */}
      {editTargetBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card washi-bg" style={{ 
            maxWidth: '650px', 
            width: '100%', 
            maxHeight: '85vh',
            overflowY: 'auto',
            margin: 0, 
            padding: '1.5rem', 
            border: '2px solid var(--color-gold)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
          }}>
            <h4 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-urushi)' }}>
              ✏️ 予約詳細情報の編集・書き換え
            </h4>

            {/* 1. 基本情報セクション */}
            <div style={{ marginBottom: '1rem', borderBottom: '1px dashed #ccc', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-gold)', display: 'block', marginBottom: '0.5rem' }}>■ 予約基本設定</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem' }}>参拝日 (YYYY-MM-DD) <span className="required">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={editFormData.booking_date || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, booking_date: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem' }}>参拝時間 (HH:MM) <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="例: 09:30"
                    value={editFormData.booking_time || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, booking_time: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem' }}>初穂料 (円) <span className="required">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    value={editFormData.hatsuhoryo || 0}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, hatsuhoryo: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem' }}>参列人数 <span className="required">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    value={editFormData.attending_count || 1}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, attending_count: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem' }}>主願意 <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.prayer1 || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, prayer1: e.target.value }))}
                  />
                </div>
                {editFormData.booking_type === 'organization' && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>副願意</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.prayer2 || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, prayer2: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 2. 個人祈祷用の申込者情報 */}
            {editFormData.booking_type === 'individual' ? (
              <div style={{ marginBottom: '1rem', borderBottom: '1px dashed #ccc', paddingBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-gold)', display: 'block', marginBottom: '0.5rem' }}>■ 参拝代表者（ご予約者様情報）</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>お名前 <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>フリガナ <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.kana || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, kana: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem' }}>ご住所 <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.address || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem' }}>住所フリガナ <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.address_kana || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, address_kana: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>電話番号 <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>メールアドレス <span className="required">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                {/* 2-a. お子様情報セクション（七五三・初宮等） */}
                <div style={{ marginTop: '1rem', padding: '0.75rem', border: '1px solid rgba(197, 160, 89, 0.25)', borderRadius: '4px', backgroundColor: '#faf8f5' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-urushi)', display: 'block', marginBottom: '0.5rem' }}>👶 お子様・ご両親情報 (七五三・初宮など用)</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>第一子 氏名</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.child_name || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, child_name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>第一子 フリガナ</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.child_kana || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, child_kana: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>第一子 生年月日 (YYYY-MM-DD)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例: 2018-05-05"
                        value={editFormData.child_birthday || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, child_birthday: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>第一子 性別</label>
                      <select
                        className="form-control"
                        value={editFormData.child_gender || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, child_gender: (e.target.value || undefined) as any }))}
                      >
                        <option value="">-- 未選択 --</option>
                        <option value="男">男の子</option>
                        <option value="女">女の子</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: '0.5rem 0 0 0', gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editFormData.is_twin === 1}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, is_twin: e.target.checked ? 1 : 0 }))}
                        />
                        <span>双子（二人目のお子様）の情報を登録する</span>
                      </label>
                    </div>

                    {editFormData.is_twin === 1 && (
                      <>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>第二子 氏名</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editFormData.child_name2 || ''}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, child_name2: e.target.value }))}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>第二子 フリガナ</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editFormData.child_kana2 || ''}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, child_kana2: e.target.value }))}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>第二子 生年月日 (YYYY-MM-DD)</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="例: 2018-05-05"
                            value={editFormData.child_birthday2 || ''}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, child_birthday2: e.target.value }))}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>第二子 性別</label>
                          <select
                            className="form-control"
                            value={editFormData.child_gender2 || ''}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, child_gender2: (e.target.value || undefined) as any }))}
                          >
                            <option value="">-- 未選択 --</option>
                            <option value="男">男の子</option>
                            <option value="女">女の子</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>父親 氏名</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.father_name || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, father_name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>父親 フリガナ</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.father_kana || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, father_kana: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>母親 氏名</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.mother_name || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, mother_name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>母親 フリガナ</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.mother_kana || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, mother_kana: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* 2-b. お車情報セクション */}
                <div style={{ marginTop: '1rem', padding: '0.75rem', border: '1px solid rgba(197, 160, 89, 0.25)', borderRadius: '4px', backgroundColor: '#faf8f5' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-urushi)', display: 'block', marginBottom: '0.5rem' }}>🚗 車祓用車両情報</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>メーカー名</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.car_maker || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, car_maker: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>車種名</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.car_model || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, car_model: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.75rem' }}>車両ナンバー</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.car_number || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, car_number: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* 2-c. 厄年・寿祝区分 */}
                <div style={{ marginTop: '1rem', padding: '0.75rem', border: '1px solid rgba(197, 160, 89, 0.25)', borderRadius: '4px', backgroundColor: '#faf8f5' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-urushi)', display: 'block', marginBottom: '0.5rem' }}>✨ 厄年・長寿祝設定</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>厄年区分</label>
                      <select
                        className="form-control"
                        value={editFormData.yakudoshi_type || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, yakudoshi_type: e.target.value as any }))}
                      >
                        <option value="">-- 無 --</option>
                        <option value="maeyaku">前厄</option>
                        <option value="honyaku">本厄</option>
                        <option value="atoyaku">後厄</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>寿祝区分</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="例: 還暦、古希など"
                        value={editFormData.kotobuki_type || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, kotobuki_type: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // 3. 団体祈祷用情報
              <div style={{ marginBottom: '1rem', borderBottom: '1px dashed #ccc', paddingBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-gold)', display: 'block', marginBottom: '0.5rem' }}>■ 企業・団体情報</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>会社・団体名 <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.company_name || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>フリガナ <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.company_kana || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, company_kana: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem' }}>所在地 <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.company_address || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, company_address: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem' }}>所在地フリガナ <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.company_address_kana || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, company_address_kana: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>代表者役職・氏名 <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.representative_title_name || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, representative_title_name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>代表者役職・氏名（フリガナ） <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.representative_kana || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, representative_kana: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>お札墨書名 <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.talisman_name || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, talisman_name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>申込担当者名 <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.staff_dept_title_name || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, staff_dept_title_name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>担当者電話番号 <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.staff_phone || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, staff_phone: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem' }}>担当者メールアドレス <span className="required">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      value={editFormData.staff_email || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, staff_email: e.target.value }))}
                    />
                  </div>
                </div>

                {/* 3-a. 必勝祈願・工事安全 */}
                <div style={{ marginTop: '1rem', padding: '0.75rem', border: '1px solid rgba(197, 160, 89, 0.25)', borderRadius: '4px', backgroundColor: '#faf8f5' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-urushi)', display: 'block', marginBottom: '0.5rem' }}>🏆 必勝祈願・工事安全詳細</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>大会名 (必勝祈願用)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.tournament_name || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, tournament_name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>大会日程</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.tournament_schedule || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, tournament_schedule: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>工事名 (工事安全祈願用)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.construction_name || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, construction_name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>工期</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.construction_period || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, construction_period: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. 備考欄セクション */}
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-gold)' }}>■ 備考（お車のメーカーや生年月日テキスト等のシステムデータも含まれます）</label>
              <textarea
                className="form-control"
                value={editFormData.notes || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            {/* 5. フッターアクションボタン */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditTargetBooking(null)}
                disabled={savingDetail}
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdateBookingDetail}
                disabled={savingDetail}
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                {savingDetail ? '保存中...' : '💾 変更を上書き保存する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingsList;
