import React, { useState } from 'react';
import { Search, Download, Trash2, Printer, Edit3 } from 'lucide-react';
import type { Booking } from '../../types';

interface BookingsListProps {
  bookings: Booking[];
  onRefresh: () => void;
  onSelectYomifuda: (booking: Booking) => void;
  onSelectReceipt: (booking: Booking) => void;
}

export const BookingsList: React.FC<BookingsListProps> = ({
  bookings,
  onRefresh,
  onSelectYomifuda,
  onSelectReceipt
}) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'booking_datetime' | 'kana' | 'prayer'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Payment update modal states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [customHatsuhoryo, setCustomHatsuhoryo] = useState<number>(0);
  const [customReceiptAmount, setCustomReceiptAmount] = useState<number>(0);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Filter logic
  const filteredBookings = bookings.filter(b => {
    if (filterDate && b.booking_date !== filterDate) return false;
    if (filterType && b.booking_type !== filterType) return false;
    if (filterStatus && b.payment_status !== filterStatus) return false;
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchName = b.booking_type === 'individual' 
        ? b.name?.toLowerCase().includes(searchLower) || b.kana?.toLowerCase().includes(searchLower)
        : b.company_name?.toLowerCase().includes(searchLower) || b.company_kana?.toLowerCase().includes(searchLower);
      const matchNum = b.receipt_number?.toLowerCase().includes(searchLower);
      const matchPhone = b.phone?.includes(searchText) || b.staff_phone?.includes(searchText);
      return matchName || matchNum || matchPhone;
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
    setCustomHatsuhoryo(booking.hatsuhoryo);
    setCustomReceiptAmount(booking.receipt_amount || booking.hatsuhoryo);
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

  // Delete booking
  const handleDeleteBooking = async (id: number) => {
    if (!confirm('この予約をキャンセル（削除）しますか？この操作は取り消せません。')) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('予約のキャンセルに失敗しました。');
      onRefresh();
    } catch (error) {
      alert(error);
    }
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

      {/* Bookings table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-urushi)', color: '#ffffff', borderBottom: '2px solid var(--color-gold)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>参拝日時</th>
              <th style={{ padding: '0.75rem 1rem' }}>区分</th>
              <th style={{ padding: '0.75rem 1rem' }}>氏名 / 会社名</th>
              <th style={{ padding: '0.75rem 1rem' }}>願意</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>初穂料</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>社務状態</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>備考</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>書面</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedBookings.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-accent-gray)' }}>
                  該当する予約情報が見つかりません。
                </td>
              </tr>
            ) : (
              sortedBookings.map((b) => {
                const isIndiv = b.booking_type === 'individual';
                const nameDisplay = isIndiv ? b.name : b.company_name;
                const statusColor = b.payment_status === 'paid' ? 'var(--color-accent-green)' : 'var(--color-shu)';

                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s' }} className="hover-row">

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{b.booking_date} {b.booking_time}</div>
                      {b.created_at && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)', marginTop: '0.2rem' }} title="予約受付日時">
                          受付: {new Date(b.created_at).toLocaleString('ja-JP', { hour12: false }).slice(0, 16)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${isIndiv ? 'badge-paid' : 'badge-unpaid'}`} style={{ borderColor: isIndiv ? 'var(--color-accent-green)' : 'var(--color-gold)', color: isIndiv ? 'var(--color-accent-green)' : 'var(--color-gold)', backgroundColor: 'transparent' }}>
                        {isIndiv ? '個人' : '団体'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{nameDisplay}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)' }}>
                        {isIndiv ? b.phone : `${b.staff_dept_title_name} (${b.staff_phone})`}
                      </div>
                      {b.notes && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          backgroundColor: '#f5f5f5', 
                          padding: '0.2rem 0.4rem', 
                          borderRadius: '2px', 
                          marginTop: '0.25rem', 
                          color: '#555',
                          borderLeft: '2px solid var(--color-gold)',
                          display: 'inline-block',
                          maxWidth: '220px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={b.notes}>
                          📝 {b.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div>{b.prayer1}</div>
                      {b.prayer2 && <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)' }}>{b.prayer2}</div>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                      {b.hatsuhoryo.toLocaleString()} 円
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem', cursor: 'pointer', margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={Number(b.is_accepted) === 1} 
                            onChange={() => handleToggleCheckbox(b, 'is_accepted')} 
                            style={{ width: '15px', height: '15px', cursor: 'pointer', margin: '0 0 0.15rem 0' }}
                          />
                          <span>受付</span>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem', cursor: 'pointer', margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={b.payment_status === 'paid'} 
                            onChange={() => handleToggleCheckbox(b, 'payment_status')} 
                            style={{ width: '15px', height: '15px', cursor: 'pointer', margin: '0 0 0.15rem 0' }}
                          />
                          <span style={{ color: b.payment_status === 'paid' ? 'var(--color-accent-green)' : 'var(--color-shu)' }}>初穂</span>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem', cursor: 'pointer', margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={Number(b.is_receipt_issued) === 1} 
                            onChange={() => handleToggleCheckbox(b, 'is_receipt_issued')} 
                            style={{ width: '15px', height: '15px', cursor: 'pointer', margin: '0 0 0.15rem 0' }}
                          />
                          <span>領収</span>
                        </label>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenPaymentModal(b)}
                        style={{
                          backgroundColor: b.payment_status === 'paid' ? 'rgba(62, 122, 92, 0.1)' : 'rgba(211, 56, 28, 0.1)',
                          border: `1px solid ${statusColor}`,
                          color: statusColor,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Edit3 size={12} />
                        備考
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => onSelectYomifuda(b)}
                          title="読み札を印刷"
                          style={{
                            border: '1px solid var(--color-border)',
                            backgroundColor: '#ffffff',
                            padding: '0.2rem',
                            cursor: 'pointer',
                            color: 'var(--color-urushi-light)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Printer size={14} />
                          <span style={{ fontSize: '0.7rem', marginLeft: '0.15rem' }}>お札</span>
                        </button>
                        {!isIndiv && b.wants_receipt === 1 && (
                          <button
                            onClick={() => onSelectReceipt(b)}
                            title="領収証を印刷"
                            style={{
                              border: '1px solid var(--color-gold)',
                              backgroundColor: 'rgba(197, 160, 89, 0.05)',
                              padding: '0.2rem',
                              cursor: 'pointer',
                              color: 'var(--color-gold)',
                              display: 'flex',
                              alignItems: 'center'
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
                        onClick={() => b.id && handleDeleteBooking(b.id)}
                        title="キャンセル"
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--color-shu)',
                          cursor: 'pointer',
                          padding: '0.2rem'
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

            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label>管理者用備考（メモ・コメント）</label>
              <textarea
                className="form-control"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={3}
                placeholder="祈祷に関する特記事項やメモ"
                style={{ border: '1px solid var(--color-border)', resize: 'vertical', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => setSelectedBooking(null)}
                disabled={savingPayment}
              >
                キャンセル
              </button>
              
              {selectedBooking.payment_status === 'paid' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--color-shu)', color: 'var(--color-shu)' }}
                  onClick={() => handleUpdatePayment('unpaid')}
                  disabled={savingPayment}
                >
                  未払いに戻す
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => handleUpdatePayment('paid')}
                disabled={savingPayment}
              >
                {savingPayment ? '保存中...' : '支払済にする'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingsList;
