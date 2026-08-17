import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, DollarSign, Users, Award, Printer, ArrowLeft, ArrowUpDown, ChevronUp, ChevronDown, RotateCcw, Edit3, Trash2, Check, X, AlertCircle } from 'lucide-react';
import type { Booking } from '../../types';
import { printElement } from '../../utils/printUtils';

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

export type ScheduleSortMode = 'created_asc' | 'created_desc' | 'name_asc' | 'receipt_asc' | 'custom';

export const sortScheduleBookings = (list: Booking[], mode: ScheduleSortMode = 'created_asc'): Booking[] => {
  return [...list].sort((a, b) => {
    // 1. まず参拝予定時間 (booking_time) で比較
    const timeComp = (a.booking_time || '').localeCompare(b.booking_time || '');
    if (timeComp !== 0) return timeComp;

    // 2. 同一時間枠内での並び順
    if (mode === 'created_asc') {
      // 実際に受け付けた順番（受付日時昇順 / 早い順）
      const aCreated = a.created_at || '';
      const bCreated = b.created_at || '';
      if (aCreated && bCreated) {
        const c = aCreated.localeCompare(bCreated);
        if (c !== 0) return c;
      }
      return (a.id || 0) - (b.id || 0);
    }
    if (mode === 'created_desc') {
      // 受付日時降順（遅い順 / 新着順）
      const aCreated = a.created_at || '';
      const bCreated = b.created_at || '';
      if (aCreated && bCreated) {
        const c = bCreated.localeCompare(aCreated);
        if (c !== 0) return c;
      }
      return (b.id || 0) - (a.id || 0);
    }
    if (mode === 'name_asc') {
      // 五十音・名前順
      const aName = (a.booking_type === 'individual' ? (a.kana || a.name) : (a.company_kana || a.company_name)) || '';
      const bName = (b.booking_type === 'individual' ? (b.kana || b.name) : (b.company_kana || b.company_name)) || '';
      return aName.localeCompare(bName, 'ja');
    }
    if (mode === 'receipt_asc') {
      // 受付番号順
      const aNum = a.receipt_number || '';
      const bNum = b.receipt_number || '';
      return aNum.localeCompare(bNum);
    }
    return 0;
  });
};

interface DashboardProps {
  bookings: Booking[];
  onSelectSchedulePrint?: (date: string) => void;
  onSelectDailyReportPrint?: (date: string) => void;
  onSelectMonthlyReportPrint?: (month: string) => void;
  onRefreshBookings?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  bookings,
  onSelectSchedulePrint,
  onSelectDailyReportPrint,
  onSelectMonthlyReportPrint,
  onRefreshBookings
}) => {

  const getTodayString = () => {
    const today = new Date();
    const local = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
  };

  const today = getTodayString();
  const [reportDate, setReportDate] = useState(today);

  const getCurrentMonthString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };
  const [reportMonth, setReportMonth] = useState(getCurrentMonthString());

  // Find related bookings (same applicant / same email / same phone / same name)
  const findRelatedBookings = (target: Booking | null): Booking[] => {
    if (!target || !target.id) return [];
    const targetEmail = (target.booking_type === 'individual' ? target.email : target.staff_email)?.trim().toLowerCase();
    const targetPhone = (target.booking_type === 'individual' ? target.phone : target.staff_phone)?.trim();
    const targetName = (target.booking_type === 'individual' ? target.name : target.company_name)?.trim();

    return bookings.filter(b => {
      if (b.id === target.id) return false;
      if (Number(b.is_cancelled) === 1) return false;
      
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

  // Edit / Cancel state from Dashboard
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [batchRescheduleRelated, setBatchRescheduleRelated] = useState(true);
  const [batchCancelRelated, setBatchCancelRelated] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Related bookings for current modal targets
  const editRelatedBookings = editingBooking ? findRelatedBookings(editingBooking) : [];
  const cancelRelatedBookings = cancellingBooking ? findRelatedBookings(cancellingBooking) : [];

  // Filter out cancelled bookings for active schedule calculation
  const activeBookings = bookings.filter(b => Number(b.is_cancelled) !== 1);

  const todayBookings = activeBookings.filter(b => b.booking_date === today);
  
  const todayRevenue = todayBookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + b.hatsuhoryo, 0);

  const todayUnpaidRevenue = todayBookings
    .filter(b => b.payment_status === 'unpaid')
    .reduce((sum, b) => sum + b.hatsuhoryo, 0);

  const totalCount = activeBookings.length;
  const indivCount = activeBookings.filter(b => b.booking_type === 'individual').length;
  const orgCount = activeBookings.filter(b => b.booking_type === 'organization').length;

  const [dashboardSortMode, setDashboardSortMode] = useState<ScheduleSortMode>('created_asc');
  const [dashboardList, setDashboardList] = useState<Booking[]>([]);

  useEffect(() => {
    if (dashboardSortMode !== 'custom') {
      setDashboardList(sortScheduleBookings(activeBookings.filter(b => b.booking_date === reportDate), dashboardSortMode));
    }
  }, [bookings, reportDate, dashboardSortMode]);

  const moveDashboardRow = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dashboardList.length) return;
    const nextList = [...dashboardList];
    const item = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = item;
    setDashboardSortMode('custom');
    setDashboardList(nextList);
  };

  // Reschedule / Edit booking handler
  const handleSaveEdit = async (e: React.FormEvent) => {
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
        if (onRefreshBookings) onRefreshBookings();
      }, 1200);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '通信エラーが発生しました。' });
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel booking handler
  const handleConfirmCancel = async () => {
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
        if (onRefreshBookings) onRefreshBookings();
      }, 1200);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '通信エラーが発生しました。' });
    } finally {
      setActionLoading(false);
    }
  };

  // Target month bookings for report
  const monthlyBookings = bookings.filter(b => b.booking_date.startsWith(reportMonth));
  const monthlyTotalPrayers = monthlyBookings.length;
  const monthlyIndividualPrayers = monthlyBookings.filter(b => b.booking_type === 'individual').length;
  const monthlyOrganizationPrayers = monthlyBookings.filter(b => b.booking_type === 'organization').length;
  const monthlyTotalRevenue = monthlyBookings.reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0);

  // Monthly Prayer breakdown
  const monthlyPrayerDetails: { [key: string]: { count: number; fee: number } } = {};
  monthlyBookings.forEach(b => {
    const prayer = b.prayer1 ? b.prayer1.trim() : 'その他';
    const fee = b.hatsuhoryo || 0;
    if (!monthlyPrayerDetails[prayer]) {
      monthlyPrayerDetails[prayer] = { count: 0, fee: 0 };
    }
    monthlyPrayerDetails[prayer].count++;
    monthlyPrayerDetails[prayer].fee += fee;
  });

  const getWarekiMonthString = (monthStr: string) => {
    if (!monthStr) return '';
    const parts = monthStr.split('-');
    if (parts.length < 2) return monthStr;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    
    const reiwaYear = year - 2018;
    const eraStr = reiwaYear === 1 ? '元' : reiwaYear;
    return `令和${eraStr}年${month}月度`;
  };



  return (
    <div>
      {/* Stat Panels */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.25rem', 
        marginBottom: '1.5rem' 
      }}>
        <div className="card" style={{ padding: '1.25rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              padding: '0.6rem', 
              backgroundColor: 'var(--color-mizuiro-light)', 
              color: 'var(--color-mizuiro)', 
              borderRadius: '2px',
              border: '1px solid rgba(50, 136, 163, 0.15)'
            }}>
              <Calendar size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', display: 'block' }}>本日の予約件数</span>
              <h3 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
                {todayBookings.length} <span style={{ fontSize: '0.85rem', fontWeight: 'normal', fontFamily: 'var(--font-sans)' }}>組</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              padding: '0.6rem', 
              backgroundColor: 'rgba(62, 122, 92, 0.05)', 
              color: 'var(--color-accent-green)', 
              borderRadius: '2px',
              border: '1px solid rgba(62, 122, 92, 0.15)'
            }}>
              <DollarSign size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', display: 'block' }}>本日の初穂料 (支払済)</span>
              <h3 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
                {todayRevenue.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 'normal', fontFamily: 'var(--font-sans)' }}>円</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              padding: '0.6rem', 
              backgroundColor: 'var(--color-mizuiro-light)', 
              color: 'var(--color-mizuiro)', 
              borderRadius: '2px',
              border: '1px solid rgba(50, 136, 163, 0.15)'
            }}>
              <Users size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', display: 'block' }}>本日の未収初穂料</span>
              <h3 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
                {todayUnpaidRevenue.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 'normal', fontFamily: 'var(--font-sans)' }}>円</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              padding: '0.6rem', 
              backgroundColor: 'rgba(28, 28, 28, 0.05)', 
              color: 'var(--color-urushi)', 
              borderRadius: '2px',
              border: '1px solid rgba(28, 28, 28, 0.1)'
            }}>
              <Award size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', display: 'block' }}>累計登録件数</span>
              <h3 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
                {totalCount} <span style={{ fontSize: '0.85rem', fontWeight: 'normal', fontFamily: 'var(--font-sans)' }}>件</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Details breakdown */}
      <div className="grid-2">
        {/* Ratio Card */}
        <div className="card">
          <h4 style={{ 
            fontSize: '0.95rem', 
            marginBottom: '1rem', 
            fontFamily: 'var(--font-serif)', 
            borderBottom: '1px solid var(--color-border)', 
            paddingBottom: '0.3rem' 
          }}>
            予約比率の内訳 (累計)
          </h4>
          <div style={{ display: 'flex', height: '24px', borderRadius: '2px', overflow: 'hidden', margin: '2rem 0' }}>
            <div style={{ 
              width: `${totalCount ? (indivCount / totalCount) * 100 : 50}%`, 
              backgroundColor: 'var(--color-mizuiro)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              fontSize: '0.75rem', 
              fontWeight: 'bold' 
            }}>
              {indivCount > 0 && `個人 (${Math.round((indivCount / totalCount) * 100)}%)`}
            </div>
            <div style={{ 
              width: `${totalCount ? (orgCount / totalCount) * 100 : 50}%`, 
              backgroundColor: 'var(--color-gold)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              fontSize: '0.75rem', 
              fontWeight: 'bold' 
            }}>
              {orgCount > 0 && `団体 (${Math.round((orgCount / totalCount) * 100)}%)`}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.85rem', color: 'var(--color-urushi-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--color-mizuiro)' }}></div>
              個人祈祷: {indivCount} 件
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--color-gold)' }}></div>
              団体祈祷: {orgCount} 件
            </div>
          </div>
        </div>

        {/* Today's timeline */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ 
              fontSize: '0.95rem', 
              margin: 0,
              fontFamily: 'var(--font-serif)'
            }}>
              ご祈祷日程表
            </h4>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>対象日:</span>
                <input 
                  type="date" 
                  value={reportDate} 
                  onChange={(e) => setReportDate(e.target.value)} 
                  style={{
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.75rem',
                    borderRadius: '3px',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer'
                  }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button 
                  onClick={() => onSelectDailyReportPrint && onSelectDailyReportPrint(reportDate)}
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--color-border)' }}
                >
                  <Printer size={12} />
                  日次報告書
                </button>
                {dashboardList.length > 0 && (
                  <button 
                    onClick={() => onSelectSchedulePrint && onSelectSchedulePrint(reportDate)}
                    className="btn btn-primary"
                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Printer size={12} />
                    内訳印刷
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sorting bar on dashboard card */}
          {dashboardList.length > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              backgroundColor: 'var(--color-washi-dark)', 
              padding: '0.35rem 0.6rem', 
              borderRadius: '2px', 
              marginBottom: '0.5rem',
              border: '1px solid var(--color-border)',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ArrowUpDown size={13} style={{ color: 'var(--color-gold)' }} />
                <span style={{ fontWeight: 600, color: 'var(--color-urushi)' }}>並び順:</span>
                <select
                  value={dashboardSortMode}
                  onChange={(e) => setDashboardSortMode(e.target.value as ScheduleSortMode)}
                  style={{
                    padding: '0.15rem 0.35rem',
                    fontSize: '0.75rem',
                    border: '1px solid var(--color-gold)',
                    borderRadius: '2px',
                    backgroundColor: '#fff',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="created_asc">📅 実際の受付順（早い順）</option>
                  <option value="created_desc">📅 実際の受付順（遅い順）</option>
                  <option value="name_asc">🔤 お名前順（五十音）</option>
                  <option value="receipt_asc">🔢 受付番号順</option>
                  {dashboardSortMode === 'custom' && <option value="custom">✋ 手動並び替え中</option>}
                </select>
              </div>

              {dashboardSortMode === 'custom' && (
                <button
                  type="button"
                  onClick={() => setDashboardSortMode('created_asc')}
                  style={{
                    padding: '0.1rem 0.4rem',
                    fontSize: '0.7rem',
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <RotateCcw size={10} />
                  受付順に戻す
                </button>
              )}
            </div>
          )}

          {dashboardList.length === 0 ? (
            <p style={{ color: 'var(--color-accent-gray)', fontSize: '0.85rem', textAlign: 'center', margin: '2rem 0' }}>
              選択された日に予定されているご祈祷はございません。
            </p>
          ) : (
            <div style={{ 
              maxHeight: '220px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.4rem', 
              fontSize: '0.8rem' 
            }}>
              {dashboardList.map((b, idx) => (
                <div key={b.id || idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.4rem 0.5rem', 
                  backgroundColor: 'var(--color-washi)', 
                  border: '1px solid var(--color-border)',
                  borderRadius: '2px',
                  gap: '0.5rem'
                }}>
                  {/* Left reorder buttons */}
                  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => moveDashboardRow(idx, 'up')}
                      disabled={idx === 0}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #ddd',
                        borderRadius: '2px',
                        padding: '1px 3px',
                        cursor: idx === 0 ? 'default' : 'pointer',
                        opacity: idx === 0 ? 0.2 : 0.8,
                        lineHeight: 1
                      }}
                      title="1つ上へ移動"
                    >
                      <ChevronUp size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDashboardRow(idx, 'down')}
                      disabled={idx === dashboardList.length - 1}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #ddd',
                        borderRadius: '2px',
                        padding: '1px 3px',
                        cursor: idx === dashboardList.length - 1 ? 'default' : 'pointer',
                        opacity: idx === dashboardList.length - 1 ? 0.2 : 0.8,
                        lineHeight: 1
                      }}
                      title="1つ下へ移動"
                    >
                      <ChevronDown size={11} />
                    </button>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ wordBreak: 'break-all' }}>
                      <strong style={{ fontFamily: 'var(--font-serif)', marginRight: '0.35rem' }}>{b.booking_time}</strong>
                      {b.booking_type === 'individual' ? `${b.name} 様` : `${b.company_name}`}{' '}
                      <span style={{ color: 'var(--color-accent-gray)', fontSize: '0.75rem' }}>({b.prayer1})</span>
                      {b.created_at && (
                        <span style={{ marginLeft: '0.35rem', fontSize: '0.7rem', color: '#888' }}>
                          [{b.created_at.split(' ')[0].replace(/^\d{4}-/, '').replace('-', '/')}受付]
                        </span>
                      )}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: '0.72rem',
                      color: b.payment_status === 'paid' ? 'var(--color-accent-green)' : 'var(--color-mizuiro)' 
                    }}>
                      {b.payment_status === 'paid' ? '支払済' : '未払い'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingBooking({ ...b })}
                      style={{
                        padding: '0.2rem 0.45rem',
                        fontSize: '0.7rem',
                        backgroundColor: '#fff',
                        border: '1px solid var(--color-gold)',
                        color: 'var(--color-urushi)',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                      title="日時・内容を変更"
                    >
                      <Edit3 size={11} />
                      変更
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancellingBooking(b)}
                      style={{
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.7rem',
                        backgroundColor: '#fff',
                        border: '1px solid #e0b4b4',
                        color: '#c93a3a',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.15rem'
                      }}
                      title="予約をキャンセル"
                    >
                      <Trash2 size={11} />
                      取消
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Aggregation Section */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h4 style={{ fontSize: '0.95rem', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 月次ご祈祷料集計報告 ({getWarekiMonthString(reportMonth)})
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)' }}>集計月:</span>
              <input 
                type="month" 
                value={reportMonth} 
                onChange={(e) => setReportMonth(e.target.value)} 
                style={{
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.75rem',
                  borderRadius: '3px',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer'
                }} 
              />
            </div>
            <button 
              onClick={() => onSelectMonthlyReportPrint && onSelectMonthlyReportPrint(reportMonth)}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--color-border)' }}
            >
              <Printer size={12} />
              月次報告書 印刷
            </button>
          </div>
        </div>

        {monthlyTotalPrayers === 0 ? (
          <p style={{ color: 'var(--color-accent-gray)', fontSize: '0.85rem', textAlign: 'center', margin: '2rem 0' }}>
            選択された月にご祈祷実績はございません。
          </p>
        ) : (
          <div>
            {/* KPI Cards for Selected Month */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
              gap: '0.5rem', 
              marginBottom: '1.25rem',
              backgroundColor: 'var(--color-washi)',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)', display: 'block' }}>ご祈祷総数</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-urushi)' }}>{monthlyTotalPrayers} 件</span>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)', display: 'block' }}>個人祈祷数</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-urushi)' }}>{monthlyIndividualPrayers} 件</span>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)', display: 'block' }}>団体祈祷数</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-urushi)' }}>{monthlyOrganizationPrayers} 件</span>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-gray)', display: 'block' }}>初穂料総額</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-mizuiro)' }}>{monthlyTotalRevenue.toLocaleString()} 円</span>
              </div>
            </div>

            {/* Breakdown Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-washi-dark)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.5rem 0.75rem', fontWeight: 'bold', color: 'var(--color-urushi)' }}>願意名</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontWeight: 'bold', color: 'var(--color-urushi)', textAlign: 'center', width: '25%' }}>祈祷件数</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontWeight: 'bold', color: 'var(--color-urushi)', textAlign: 'right', width: '30%' }}>初穂料小計</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(monthlyPrayerDetails).map(pName => (
                    <tr key={pName} style={{ borderBottom: '1px dashed var(--color-border)' }}>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{pName}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{monthlyPrayerDetails[pName].count} 件</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 'bold' }}>{monthlyPrayerDetails[pName].fee.toLocaleString()} 円</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

{/* EDIT / RESCHEDULE MODAL */}
{editingBooking && createPortal(
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
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '0.2rem',
            display: 'flex'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Body Form */}
      <form onSubmit={handleSaveEdit} style={{ padding: '1.25rem' }}>
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
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem',
                fontSize: '0.85rem',
                border: '1px solid var(--color-gold)',
                borderRadius: '3px',
                outline: 'none',
                backgroundColor: '#fcfaf5'
              }}
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
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem',
                fontSize: '0.85rem',
                border: '1px solid var(--color-gold)',
                borderRadius: '3px',
                outline: 'none',
                backgroundColor: '#fcfaf5'
              }}
            >
              {TIME_SLOTS.map(t => (
                <option key={t} value={t}>{t}の回</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem', color: '#333' }}>
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
            style={{
              width: '100%',
              padding: '0.45rem 0.6rem',
              fontSize: '0.85rem',
              border: '1px solid #ccc',
              borderRadius: '3px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem', color: '#333' }}>
              主願意
            </label>
            <input
              type="text"
              value={editingBooking.prayer1}
              onChange={(e) => setEditingBooking({ ...editingBooking, prayer1: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem',
                fontSize: '0.85rem',
                border: '1px solid #ccc',
                borderRadius: '3px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem', color: '#333' }}>
              初穂料（円）
            </label>
            <input
              type="number"
              value={editingBooking.hatsuhoryo}
              onChange={(e) => setEditingBooking({ ...editingBooking, hatsuhoryo: Number(e.target.value) })}
              min={0}
              step={1000}
              required
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem',
                fontSize: '0.85rem',
                border: '1px solid #ccc',
                borderRadius: '3px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem', color: '#333' }}>
              参列人数
            </label>
            <input
              type="number"
              value={editingBooking.attending_count}
              onChange={(e) => setEditingBooking({ ...editingBooking, attending_count: Number(e.target.value) })}
              min={1}
              required
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem',
                fontSize: '0.85rem',
                border: '1px solid #ccc',
                borderRadius: '3px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem', color: '#333' }}>
              支払状況
            </label>
            <select
              value={editingBooking.payment_status}
              onChange={(e) => setEditingBooking({ ...editingBooking, payment_status: e.target.value as 'paid' | 'unpaid' })}
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem',
                fontSize: '0.85rem',
                border: '1px solid #ccc',
                borderRadius: '3px'
              }}
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

        {/* Action Buttons */}
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

{/* CANCEL CONFIRMATION MODAL */}
{cancellingBooking && createPortal(
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
      {/* Header */}
      <div style={{
        backgroundColor: '#c93a3a',
        color: '#ffffff',
        padding: '0.9rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          予約のキャンセル（取消）確認
        </h3>
        <button
          type="button"
          onClick={() => setCancellingBooking(null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '0.2rem',
            display: 'flex'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
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

        <p style={{ fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 1rem 0', color: '#333' }}>
          以下のご祈祷予約を<strong>キャンセル（取消）</strong>しますか？
        </p>

        <div style={{
          backgroundColor: '#fbf7ee',
          padding: '0.75rem 1rem',
          borderRadius: '4px',
          border: '1px solid #e8dbbe',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
          lineHeight: '1.7'
        }}>
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
            onClick={handleConfirmCancel}
            disabled={actionLoading}
            style={{
              backgroundColor: '#c93a3a',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 1.25rem',
              borderRadius: '3px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 'bold'
            }}
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

export default Dashboard;

// --- PRINT COMPONENT: SCHEDULE INNER PRINT ---
// Time slot color palette (Traditional Japanese soft tints for elegant grouping)
const getTimeSlotTheme = (timeStr: string) => {
  const t = timeStr || '09:00';
  if (t.startsWith('09:00')) return { bg: '#edf4f9', border: '#7daec9', badgeBg: '#34617d', badgeText: '#ffffff', tag: '09:00枠' };
  if (t.startsWith('09:30')) return { bg: '#fbf7ee', border: '#d6be89', badgeBg: '#7d6124', badgeText: '#ffffff', tag: '09:30枠' };
  if (t.startsWith('10:00')) return { bg: '#edf7f0', border: '#8ac497', badgeBg: '#2c6b3b', badgeText: '#ffffff', tag: '10:00枠' };
  if (t.startsWith('10:30')) return { bg: '#f5f0f9', border: '#bfa0d8', badgeBg: '#643c85', badgeText: '#ffffff', tag: '10:30枠' };
  if (t.startsWith('11:00')) return { bg: '#fdf1f3', border: '#df94a0', badgeBg: '#8e2f41', badgeText: '#ffffff', tag: '11:00枠' };
  if (t.startsWith('11:30')) return { bg: '#fdf5ec', border: '#deb186', badgeBg: '#865123', badgeText: '#ffffff', tag: '11:30枠' };
  if (t.startsWith('13:00')) return { bg: '#edf4f9', border: '#7daec9', badgeBg: '#34617d', badgeText: '#ffffff', tag: '13:00枠' };
  if (t.startsWith('13:30')) return { bg: '#fbf7ee', border: '#d6be89', badgeBg: '#7d6124', badgeText: '#ffffff', tag: '13:30枠' };
  if (t.startsWith('14:00')) return { bg: '#edf7f0', border: '#8ac497', badgeBg: '#2c6b3b', badgeText: '#ffffff', tag: '14:00枠' };
  if (t.startsWith('14:30')) return { bg: '#f5f0f9', border: '#bfa0d8', badgeBg: '#643c85', badgeText: '#ffffff', tag: '14:30枠' };
  if (t.startsWith('15:00')) return { bg: '#fdf1f3', border: '#df94a0', badgeBg: '#8e2f41', badgeText: '#ffffff', tag: '15:00枠' };
  if (t.startsWith('15:30')) return { bg: '#fdf5ec', border: '#deb186', badgeBg: '#865123', badgeText: '#ffffff', tag: '15:30枠' };
  if (t.startsWith('16:00')) return { bg: '#edf6f5', border: '#83bfba', badgeBg: '#26645e', badgeText: '#ffffff', tag: '16:00枠' };
  return { bg: '#f8f9fa', border: '#adb5bd', badgeBg: '#495057', badgeText: '#ffffff', tag: `${t}枠` };
};

export const ScheduleInnerPrint: React.FC<{ bookings: Booking[]; date: string; onClose: () => void }> = ({ bookings, date, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [sortMode, setSortMode] = useState<ScheduleSortMode>('created_asc');
  const [orderedBookings, setOrderedBookings] = useState<Booking[]>(() => {
    return sortScheduleBookings(bookings.filter(b => b.booking_date === date), 'created_asc');
  });

  useEffect(() => {
    if (sortMode !== 'custom') {
      setOrderedBookings(sortScheduleBookings(bookings.filter(b => b.booking_date === date), sortMode));
    }
  }, [bookings, date, sortMode]);

  const handleSortChange = (mode: ScheduleSortMode) => {
    setSortMode(mode);
    if (mode !== 'custom') {
      setOrderedBookings(sortScheduleBookings(bookings.filter(b => b.booking_date === date), mode));
    }
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedBookings.length) return;
    const nextList = [...orderedBookings];
    const item = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = item;
    setSortMode('custom');
    setOrderedBookings(nextList);
  };

  const handlePrint = () => {
    printElement(printRef.current, {
      title: '清瀧神社 ご祈祷日程内訳表',
      orientation: 'landscape',
      size: 'A4'
    });
  };

  const getWarekiDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    
    const reiwaYear = year - 2018;
    const eraStr = reiwaYear === 1 ? '元' : reiwaYear;
    return `令和${eraStr}年${month}月${day}日（${dayOfWeek}）`;
  };

  const count = orderedBookings.length;
  // 自動スケーリング設定
  const printPadding = count > 24 ? '4mm 6mm' : count > 20 ? '6mm 8mm' : count > 15 ? '8mm 10mm' : count > 8 ? '12mm 15mm' : '20mm';
  const printFontSize = count > 24 ? '0.62rem' : count > 20 ? '0.68rem' : count > 15 ? '0.74rem' : count > 8 ? '0.8rem' : '0.9rem';
  const printTitleSize = count > 24 ? '1.15rem' : count > 15 ? '1.3rem' : '1.75rem';
  const printHeaderMargin = count > 24 ? '0.2rem' : count > 15 ? '0.4rem' : '1.5rem';
  const printRowPadding = count > 24 ? '0.2rem 0.35rem' : count > 20 ? '0.28rem 0.4rem' : count > 15 ? '0.4rem 0.5rem' : '0.6rem 0.5rem';
  
  const totalPaid = orderedBookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0);
  const totalUnpaid = orderedBookings.filter(b => b.payment_status === 'unpaid').reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0);

  return createPortal(
    <div className="print-modal-overlay">
      <div className="no-print" style={{
        backgroundColor: 'var(--color-urushi)',
        padding: '0.6rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        borderBottom: '2px solid var(--color-gold)',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <h4 style={{ margin: 0, color: 'white', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
          <Printer size={18} />
          ご祈祷日程内訳表 印刷プレビュー (横向き印刷推奨)
        </h4>

        {/* Sorting controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            backgroundColor: '#2c2523', 
            padding: '0.35rem 0.75rem', 
            borderRadius: '4px',
            border: '1.5px solid var(--color-gold)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}>
            <ArrowUpDown size={15} style={{ color: 'var(--color-gold)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-gold)' }}>並び順切替:</span>
            <select
              value={sortMode}
              onChange={(e) => handleSortChange(e.target.value as ScheduleSortMode)}
              style={{
                backgroundColor: '#ffffff',
                color: '#111111',
                border: '1px solid var(--color-gold)',
                borderRadius: '3px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="created_asc">📅 実際の受付順（早い順 / 先着順）</option>
              <option value="created_desc">📅 実際の受付順（遅い順 / 新着順）</option>
              <option value="name_asc">🔤 お名前順（五十音順）</option>
              <option value="receipt_asc">🔢 受付番号順</option>
              {sortMode === 'custom' && <option value="custom">✋ 手動並び替え中</option>}
            </select>
          </div>

          {sortMode === 'custom' && (
            <button
              type="button"
              onClick={() => handleSortChange('created_asc')}
              className="btn"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                backgroundColor: '#ffffff',
                color: 'var(--color-urushi)',
                border: '1px solid var(--color-gold)',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
              受付順にリセット
            </button>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
              印刷する (A4横)
            </button>
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: 'white', borderColor: 'var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowLeft size={14} />
              元の画面に戻る
            </button>
          </div>
        </div>
      </div>

      <div className="schedule-print-wrapper" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div 
          ref={printRef}
          className="schedule-print-sheet print-landscape-page"
          style={{
            backgroundColor: 'white',
            width: '297mm',
            height: '210mm',
            padding: printPadding,
            boxSizing: 'border-box',
            fontFamily: 'var(--font-serif)',
            display: 'flex',
            flexDirection: 'column',
            color: 'black',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid black', paddingBottom: '0.4rem', marginBottom: printHeaderMargin }}>
            <h2 style={{ fontSize: printTitleSize, margin: 0, fontWeight: 'bold', letterSpacing: '0.1em' }}>
              清瀧神社 ご祈祷日程内訳表
            </h2>
            <span style={{ fontSize: count > 15 ? '0.75rem' : '0.9rem', fontWeight: 600 }}>
              対象日： {getWarekiDateString(date)}
            </span>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: printFontSize }}>
            <thead>
              <tr style={{ borderBottom: '2px solid black', textAlign: 'left' }}>
                <th className="no-print" style={{ padding: printRowPadding, fontWeight: 'bold', width: '5%', textAlign: 'center', color: '#c5a059', backgroundColor: '#fcfaf5' }}>移動</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '10%' }}>時間</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '9%' }}>区分</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '36%' }}>氏名 / 会社・団体名</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '23%' }}>願意</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '7%', textAlign: 'right' }}>人数</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '10%', textAlign: 'right' }}>初穂料</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '7%', textAlign: 'center' }}>支払状況</th>
              </tr>
            </thead>
            <tbody>
              {orderedBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    ご祈祷の予約はありません。
                  </td>
                </tr>
              ) : (
                orderedBookings.map((b, idx) => {
                  const isIndiv = b.booking_type === 'individual';
                  const name = isIndiv ? b.name : b.company_name;
                  const theme = getTimeSlotTheme(b.booking_time);
                  const isFirstOfSlot = idx === 0 || orderedBookings[idx - 1].booking_time !== b.booking_time;

                  return (
                    <tr 
                      key={b.id || idx} 
                      style={{ 
                        backgroundColor: theme.bg,
                        borderBottom: '1px solid #d0d7de',
                        borderTop: isFirstOfSlot && idx > 0 ? `2px solid ${theme.border}` : 'none'
                      }}
                    >
                      <td className="no-print" style={{ padding: '0.2rem', textAlign: 'center', verticalAlign: 'middle', backgroundColor: '#fdfbf7', borderRight: '1px solid #eee' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <button
                            type="button"
                            onClick={() => moveRow(idx, 'up')}
                            disabled={idx === 0}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #c5a059',
                              borderRadius: '2px',
                              padding: '2px 4px',
                              cursor: idx === 0 ? 'default' : 'pointer',
                              opacity: idx === 0 ? 0.2 : 0.9,
                              lineHeight: 1,
                              color: 'var(--color-urushi)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            title="1つ上へ移動"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRow(idx, 'down')}
                            disabled={idx === orderedBookings.length - 1}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #c5a059',
                              borderRadius: '2px',
                              padding: '2px 4px',
                              cursor: idx === orderedBookings.length - 1 ? 'default' : 'pointer',
                              opacity: idx === orderedBookings.length - 1 ? 0.2 : 0.9,
                              lineHeight: 1,
                              color: 'var(--color-urushi)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            title="1つ下へ移動"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                      </td>
                      <td style={{ 
                        padding: printRowPadding, 
                        fontWeight: 'bold',
                        borderLeft: `4px solid ${theme.badgeBg}`
                      }}>
                        <span style={{
                          backgroundColor: theme.badgeBg,
                          color: theme.badgeText,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          display: 'inline-block',
                          fontSize: count > 24 ? '0.65rem' : count > 15 ? '0.72rem' : '0.8rem',
                          fontWeight: 'bold',
                          letterSpacing: '0.05em'
                        }}>
                          {b.booking_time}
                        </span>
                      </td>
                      <td style={{ padding: printRowPadding }}>{isIndiv ? '個人' : '団体'}</td>
                      <td style={{ padding: printRowPadding, fontWeight: 600 }}>{name}</td>
                      <td style={{ padding: printRowPadding }}>
                        {b.prayer1}
                        {b.prayer2 ? ` / ${b.prayer2}` : ''}
                      </td>
                      <td style={{ padding: printRowPadding, textAlign: 'right' }}>{b.attending_count} 名</td>
                      <td style={{ padding: printRowPadding, textAlign: 'right', fontWeight: 600 }}>{b.hatsuhoryo.toLocaleString()} 円</td>
                      <td style={{ padding: printRowPadding, textAlign: 'center' }}>
                        {b.payment_status === 'paid' ? '支払済' : '未納'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div style={{ 
            marginTop: 'auto', 
            paddingTop: '0.5rem', 
            borderTop: '2px dashed #ccc', 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: count > 24 ? '0.7rem' : count > 15 ? '0.75rem' : '0.85rem' 
          }}>
            <div>
              <span>予定件数： {count} 件</span>
              <span style={{ marginLeft: '1.5rem' }}>（個人：{orderedBookings.filter(b => b.booking_type === 'individual').length}件 / 団体：{orderedBookings.filter(b => b.booking_type === 'organization').length}件）</span>
            </div>
            <div>
              <span>初穂料合計 (受取済)： <strong>￥{totalPaid.toLocaleString()}</strong></span>
              <span style={{ marginLeft: '1.5rem', color: '#d3381c' }}>未収： ￥{totalUnpaid.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- PRINT COMPONENT: DAILY REPORT PRINT ---
export const DailyReportPrint: React.FC<{ bookings: Booking[]; date: string; onClose: () => void }> = ({ bookings, date, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const getWarekiDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    
    const reiwaYear = year - 2018;
    const eraStr = reiwaYear === 1 ? '元' : reiwaYear;
    return `令和${eraStr}年${month}月${day}日（${dayOfWeek}）`;
  };
  const reportBookings = bookings.filter(b => b.booking_date === date);
  const reportTotalPrayers = reportBookings.length;
  const reportIndividualPrayers = reportBookings.filter(b => b.booking_type === 'individual').length;
  const reportOrganizationPrayers = reportBookings.filter(b => b.booking_type === 'organization').length;
  const reportTotalRevenue = reportBookings.reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0);

  const prayerDetails: { [key: string]: { count: number; fee: number } } = {};
  reportBookings.forEach(b => {
    const prayer = b.prayer1 ? b.prayer1.trim() : 'その他';
    const fee = b.hatsuhoryo || 0;
    if (!prayerDetails[prayer]) {
      prayerDetails[prayer] = { count: 0, fee: 0 };
    }
    prayerDetails[prayer].count++;
    prayerDetails[prayer].fee += fee;
  });

  return createPortal(
    <div className="print-modal-overlay">
      <div className="no-print" style={{
        backgroundColor: '#800000',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        borderBottom: '2px solid #d4af37'
      }}>
        <h4 style={{ margin: 0, color: 'white', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={18} />
          日次ご祈祷料集計報告書 印刷プレビュー (B5縦サイズ推奨)
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => printElement(printRef.current, { title: '清瀧神社 日次ご祈祷料集計報告書', orientation: 'portrait', size: 'B5' })} 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', backgroundColor: '#d4af37', borderColor: '#d4af37', color: '#800000' }}
          >
            印刷する
          </button>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: 'white', borderColor: '#ccc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={14} />
            閉じる
          </button>
        </div>
      </div>

      <div className="daily-print-wrapper" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div 
          ref={printRef}
          className="report-print-sheet print-portrait-page"
          style={{
            backgroundColor: 'white',
            width: '182mm',
            minHeight: '257mm',
            padding: '15mm',
            color: 'black',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontFamily: '"Noto Serif JP", serif',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}
        >
          {/* Header */}
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            textAlign: 'center',
            letterSpacing: '5px',
            textDecoration: 'underline',
            marginBottom: '35px',
            color: '#000'
          }}>
            ご 祈 祷 日 報
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '25px',
            fontSize: '13px'
          }}>
            <div>日付： {getWarekiDateString(date)}</div>
            <div>清瀧神社 社務所</div>
          </div>

          {/* Core summary statistics */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '35px', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000', backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ccc', padding: '8px 10px', fontWeight: 'bold', textAlign: 'center', width: '25%' }}>区分</th>
                <th style={{ border: '1px solid #ccc', padding: '8px 10px', fontWeight: 'bold', textAlign: 'center', width: '25%' }}>予定件数</th>
                <th style={{ border: '1px solid #ccc', padding: '8px 10px', fontWeight: 'bold', textAlign: 'center', width: '25%' }}>受取済初穂料</th>
                <th style={{ border: '1px solid #ccc', padding: '8px 10px', fontWeight: 'bold', textAlign: 'center', width: '25%' }}>未収初穂料</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', fontWeight: 'bold', textAlign: 'center' }}>個人ご祈祷</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>{reportIndividualPrayers} 件</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'right' }}>
                  {reportBookings.filter(b => b.booking_type === 'individual' && b.payment_status === 'paid').reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0).toLocaleString()} 円
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'right', color: '#d3381c' }}>
                  {reportBookings.filter(b => b.booking_type === 'individual' && b.payment_status === 'unpaid').reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0).toLocaleString()} 円
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', fontWeight: 'bold', textAlign: 'center' }}>団体ご祈祷</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>{reportOrganizationPrayers} 件</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'right' }}>
                  {reportBookings.filter(b => b.booking_type === 'organization' && b.payment_status === 'paid').reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0).toLocaleString()} 円
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'right', color: '#d3381c' }}>
                  {reportBookings.filter(b => b.booking_type === 'organization' && b.payment_status === 'unpaid').reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0).toLocaleString()} 円
                </td>
              </tr>
              <tr style={{ backgroundColor: '#f9f9f9', fontWeight: 'bold' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>合計</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>{reportTotalPrayers} 件</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'right' }}>
                  {reportBookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0).toLocaleString()} 円
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'right', color: '#d3381c' }}>
                  {reportBookings.filter(b => b.payment_status === 'unpaid').reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0).toLocaleString()} 円
                </td>
              </tr>
            </tbody>
          </table>

          {/* Breakdown by prayer type */}
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            marginBottom: '12px',
            borderLeft: '4px solid #800000',
            paddingLeft: '8px'
          }}>
            ＜願意別の内訳＞
          </div>

          <table style={{ width: '70%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: '8px 10px', backgroundColor: '#f9f9f9', fontWeight: 'bold', textAlign: 'center', width: '50%' }}>願意名</th>
                <th style={{ border: '1px solid #ccc', padding: '8px 10px', backgroundColor: '#f9f9f9', fontWeight: 'bold', textAlign: 'center', width: '25%' }}>祈祷件数</th>
                <th style={{ border: '1px solid #ccc', padding: '8px 10px', backgroundColor: '#f9f9f9', fontWeight: 'bold', textAlign: 'center', width: '25%' }}>初穂料小計</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(prayerDetails).length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center', color: '#777' }}>
                    （該当日のご祈祷はありません）
                  </td>
                </tr>
              ) : (
                Object.keys(prayerDetails).map(pName => (
                  <tr key={pName}>
                    <td style={{ border: '1px solid #ccc', padding: '8px 10px' }}>{pName}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>{prayerDetails[pName].count} 件</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'right' }}>{prayerDetails[pName].fee.toLocaleString()} 円</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{
            backgroundColor: '#faf7f0',
            border: '3px double #800000',
            padding: '15px',
            textAlign: 'center',
            marginTop: '40px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#800000', marginBottom: '8px' }}>【 本日の社入金 】</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#800000', marginBottom: '6px' }}>金  {reportTotalRevenue.toLocaleString()}  円 整</div>
            <div style={{ fontSize: '11px', color: '#555' }}>（内訳  ご祈祷: {reportTotalRevenue.toLocaleString()} 円）</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const MonthlyReportPrint: React.FC<{ bookings: Booking[]; month: string; onClose: () => void }> = ({ bookings, month, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const getWarekiMonthString = (monthStr: string) => {
    if (!monthStr) return '';
    const parts = monthStr.split('-');
    if (parts.length < 2) return monthStr;
    const year = Number(parts[0]);
    const monthVal = Number(parts[1]);
    
    const reiwaYear = year - 2018;
    const eraStr = reiwaYear === 1 ? '元' : reiwaYear;
    return `令和${eraStr}年${monthVal}月度`;
  };

  const monthlyBookings = bookings.filter(b => b.booking_date.startsWith(month));
  const monthlyTotalPrayers = monthlyBookings.length;
  const monthlyIndividualPrayers = monthlyBookings.filter(b => b.booking_type === 'individual').length;
  const monthlyOrganizationPrayers = monthlyBookings.filter(b => b.booking_type === 'organization').length;
  const monthlyTotalRevenue = monthlyBookings.reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0);

  const monthlyPrayerDetails: { [key: string]: { count: number; fee: number } } = {};
  monthlyBookings.forEach(b => {
    const prayer = b.prayer1 ? b.prayer1.trim() : 'その他';
    const fee = b.hatsuhoryo || 0;
    if (!monthlyPrayerDetails[prayer]) {
      monthlyPrayerDetails[prayer] = { count: 0, fee: 0 };
    }
    monthlyPrayerDetails[prayer].count++;
    monthlyPrayerDetails[prayer].fee += fee;
  });

  return createPortal(
    <div className="print-modal-overlay">
      <div className="no-print" style={{
        backgroundColor: '#800000',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        borderBottom: '2px solid #d4af37'
      }}>
        <h4 style={{ margin: 0, color: 'white', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={18} />
          月次ご祈祷料集計報告書 印刷プレビュー (B5縦サイズ推奨)
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => printElement(printRef.current, { title: '清瀧神社 月次ご祈祷料集計報告書', orientation: 'portrait', size: 'B5' })} 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', backgroundColor: '#d4af37', borderColor: '#d4af37', color: '#800000' }}
          >
            印刷する
          </button>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: 'white', borderColor: '#ccc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={14} />
            閉じる
          </button>
        </div>
      </div>

      <div className="monthly-print-wrapper" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div 
          ref={printRef}
          className="report-print-sheet print-portrait-page"
          style={{
            backgroundColor: 'white',
            width: '182mm',
            minHeight: '257mm',
            padding: '15mm',
            color: 'black',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontFamily: '"Noto Serif JP", serif',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '5px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#800000', margin: 0, padding: '10px 0', letterSpacing: '2px', borderBottom: '1px solid #800000' }}>
              清瀧神社  月次ご祈祷料集計報告書
            </h1>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#555', marginTop: '5px', marginBottom: '25px' }}>
            集計月: {getWarekiMonthString(month)}
          </div>

          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#800000', backgroundColor: '#faf7f0', padding: '8px 12px', borderLeft: '5px solid #800000', marginBottom: '12px' }}>
            【 ご祈祷（初穂料）の部 】
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: '8px 10px', backgroundColor: '#f2ede4', fontWeight: 'bold', textAlign: 'center' }}>ご祈祷総数</th>
                <th style={{ border: '1px solid #ccc', padding: '8px 10px', backgroundColor: '#f2ede4', fontWeight: 'bold', textAlign: 'center' }}>個人祈祷数</th>
                <th style={{ border: '1px solid #ccc', padding: '8px 10px', backgroundColor: '#f2ede4', fontWeight: 'bold', textAlign: 'center' }}>団体祈祷数</th>
                <th style={{ border: '1px solid #ccc', padding: '8px 10px', backgroundColor: '#f2ede4', fontWeight: 'bold', textAlign: 'center' }}>初穂料総額</th>
                <th style={{ border: '1px solid #ccc', padding: '8px 10px', backgroundColor: '#f2ede4', fontWeight: 'bold', textAlign: 'center' }}>内訳備考</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>{monthlyTotalPrayers} 件</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>{monthlyIndividualPrayers} 件</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>{monthlyOrganizationPrayers} 件</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>{monthlyTotalRevenue.toLocaleString()} 円</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px' }}></td>
              </tr>
            </tbody>
          </table>

          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#555', marginTop: '15px', marginBottom: '8px' }}>
            ＜願意別の内訳＞
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-washi-dark)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 'bold', color: 'var(--color-urushi)' }}>願意名</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 'bold', color: 'var(--color-urushi)', textAlign: 'center', width: '25%' }}>祈祷件数</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 'bold', color: 'var(--color-urushi)', textAlign: 'right', width: '30%' }}>初穂料小計</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(monthlyPrayerDetails).map(pName => (
                  <tr key={pName} style={{ borderBottom: '1px dashed var(--color-border)' }}>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{pName}</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{monthlyPrayerDetails[pName].count} 件</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 'bold' }}>{monthlyPrayerDetails[pName].fee.toLocaleString()} 円</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            backgroundColor: '#faf7f0',
            border: '3px double #800000',
            padding: '15px',
            textAlign: 'center',
            marginTop: '40px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#800000', marginBottom: '8px' }}>【 当月の総社入金 】</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#800000', marginBottom: '6px' }}>金  {monthlyTotalRevenue.toLocaleString()}  円 整</div>
            <div style={{ fontSize: '11px', color: '#555' }}>（内訳  ご祈祷: {monthlyTotalRevenue.toLocaleString()} 円）</div>
          </div>
        </div>
      </div>
    </div>, document.body
  );
};
