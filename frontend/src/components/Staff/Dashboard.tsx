import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, DollarSign, Users, Award, Printer, ArrowLeft } from 'lucide-react';
import type { Booking } from '../../types';

interface DashboardProps {
  bookings: Booking[];
  onSelectSchedulePrint?: (date: string) => void;
  onSelectDailyReportPrint?: (date: string) => void;
  onSelectMonthlyReportPrint?: (month: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  bookings,
  onSelectSchedulePrint,
  onSelectDailyReportPrint,
  onSelectMonthlyReportPrint
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
  
  // Sort bookings for today by time ascending
  const todayBookings = bookings
    .filter(b => b.booking_date === today)
    .sort((a, b) => a.booking_time.localeCompare(b.booking_time));
  
  // Calculate total hatsuhoryo revenues
  const todayRevenue = todayBookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + b.hatsuhoryo, 0);

  const todayUnpaidRevenue = todayBookings
    .filter(b => b.payment_status === 'unpaid')
    .reduce((sum, b) => sum + b.hatsuhoryo, 0);

  const totalCount = bookings.length;
  const indivCount = bookings.filter(b => b.booking_type === 'individual').length;
  const orgCount = bookings.filter(b => b.booking_type === 'organization').length;

  // Target date bookings for report
  const reportBookings = bookings.filter(b => b.booking_date === reportDate);

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.3rem', marginBottom: '1rem' }}>
            <h4 style={{ 
              fontSize: '0.95rem', 
              margin: 0,
              fontFamily: 'var(--font-serif)'
            }}>
              ご祈祷日程表
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
            
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                onClick={() => onSelectDailyReportPrint && onSelectDailyReportPrint(reportDate)}
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.60rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--color-border)' }}
              >
                <Printer size={12} />
                日次報告書
              </button>
              {reportBookings.length > 0 && (
                <button 
                  onClick={() => onSelectSchedulePrint && onSelectSchedulePrint(reportDate)}
                  className="btn btn-primary"
                  style={{ padding: '0.3rem 0.60rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Printer size={12} />
                  内訳印刷
                </button>
              )}
            </div>
          </div>

          {reportBookings.length === 0 ? (
            <p style={{ color: 'var(--color-accent-gray)', fontSize: '0.85rem', textAlign: 'center', margin: '2rem 0' }}>
              選択された日に予定されているご祈祷はございません。
            </p>
          ) : (
            <div style={{ 
              maxHeight: '180px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.4rem', 
              fontSize: '0.8rem' 
            }}>
              {reportBookings.map(b => (
                <div key={b.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.45rem', 
                  backgroundColor: 'var(--color-washi)', 
                  border: '1px solid var(--color-border)',
                  borderRadius: '2px'
                }}>
                  <span>
                    <strong style={{ fontFamily: 'var(--font-serif)' }}>{b.booking_time}</strong> —{' '}
                    {b.booking_type === 'individual' ? `${b.name} 様` : `${b.company_name}`}{' '}
                    <span style={{ color: 'var(--color-accent-gray)' }}>({b.prayer1})</span>
                  </span>
                  <span style={{ 
                    fontWeight: 600, 
                    color: b.payment_status === 'paid' ? 'var(--color-accent-green)' : 'var(--color-mizuiro)' 
                  }}>
                    {b.payment_status === 'paid' ? '支払済' : '未払い'}
                  </span>
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
            <label style={{ fontSize: '0.8rem', color: 'var(--color-accent-gray)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              集計月:
              <input 
                type="month" 
                value={reportMonth} 
                onChange={(e) => setReportMonth(e.target.value)}
                className="form-control"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: '140px', display: 'inline-block' }}
              />
            </label>
            <button 
              onClick={() => onSelectMonthlyReportPrint && onSelectMonthlyReportPrint(reportMonth)}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--color-border)' }}
            >
              <Printer size={12} />
              月次報告書 印刷
            </button>
          </div>
        </div>

        {monthlyBookings.length === 0 ? (
          <p style={{ color: 'var(--color-accent-gray)', fontSize: '0.85rem', textAlign: 'center', margin: '2rem 0' }}>
            選択された月のご祈祷データはありません。
          </p>
        ) : (
          <div>
            {/* Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem', backgroundColor: 'var(--color-washi)', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '2px' }}>
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
    </div>
  );
};

export default Dashboard;

// --- PRINT COMPONENT: SCHEDULE INNER PRINT ---
export const ScheduleInnerPrint: React.FC<{ bookings: Booking[]; date: string; onClose: () => void }> = ({ bookings, date, onClose }) => {
  const handlePrint = () => {
    window.print();
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

  const reportBookings = bookings
    .filter(b => b.booking_date === date)
    .sort((a, b) => a.booking_time.localeCompare(b.booking_time));
  
  const count = reportBookings.length;
  // 自動スケーリング設定
  const printPadding = count > 24 ? '4mm 6mm' : count > 20 ? '6mm 8mm' : count > 15 ? '8mm 10mm' : count > 8 ? '12mm 15mm' : '20mm';
  const printFontSize = count > 24 ? '0.62rem' : count > 20 ? '0.68rem' : count > 15 ? '0.74rem' : count > 8 ? '0.8rem' : '0.9rem';
  const printTitleSize = count > 24 ? '1.15rem' : count > 15 ? '1.3rem' : '1.75rem';
  const printHeaderMargin = count > 24 ? '0.2rem' : count > 15 ? '0.4rem' : '1.5rem';
  const printRowPadding = count > 24 ? '0.2rem 0.35rem' : count > 20 ? '0.28rem 0.4rem' : count > 15 ? '0.4rem 0.5rem' : '0.6rem 0.5rem';
  
  const totalPaid = reportBookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0);
  const totalUnpaid = reportBookings.filter(b => b.payment_status === 'unpaid').reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0);

  return createPortal(
    <div className="schedule-print-modal-parent" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 2000,
      overflowY: 'auto'
    }}>
      <div className="no-print" style={{
        backgroundColor: 'var(--color-urushi)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        borderBottom: '2px solid var(--color-gold)'
      }}>
        <h4 style={{ margin: 0, color: 'white', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={18} />
          ご祈祷日程内訳表 印刷プレビュー (横向き印刷推奨)
        </h4>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            印刷する (A4横)
          </button>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: 'white', borderColor: 'var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={14} />
            元の画面に戻る
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div 
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
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '8%' }}>時間</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '15%' }}>受付番号</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '8%' }}>区分</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '28%' }}>氏名 / 会社・団体名</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '20%' }}>願意</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '7%', textAlign: 'right' }}>人数</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '10%', textAlign: 'right' }}>初穂料</th>
                <th style={{ padding: printRowPadding, fontWeight: 'bold', width: '7%', textAlign: 'center' }}>支払状況</th>
              </tr>
            </thead>
            <tbody>
              {reportBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    ご祈祷の予約はありません。
                  </td>
                </tr>
              ) : (
                reportBookings.map((b) => {
                  const isIndiv = b.booking_type === 'individual';
                  const name = isIndiv ? b.name : b.company_name;
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #ccc' }}>
                      <td style={{ padding: printRowPadding, fontWeight: 'bold' }}>{b.booking_time}</td>
                      <td style={{ padding: printRowPadding }}>{b.receipt_number}</td>
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
              <span style={{ marginLeft: '1.5rem' }}>（個人：{reportBookings.filter(b => b.booking_type === 'individual').length}件 / 団体：{reportBookings.filter(b => b.booking_type === 'organization').length}件）</span>
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
    <div className="daily-print-modal-parent" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 2000,
      overflowY: 'auto'
    }}>
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
          <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', backgroundColor: '#d4af37', borderColor: '#d4af37', color: '#800000' }}>
            印刷する
          </button>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: 'white', borderColor: '#ccc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={14} />
            閉じる
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div 
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
    <div className="monthly-print-modal-parent" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 2000,
      overflowY: 'auto'
    }}>
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
          <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', backgroundColor: '#d4af37', borderColor: '#d4af37', color: '#800000' }}>
            印刷する
          </button>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: 'white', borderColor: '#ccc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={14} />
            閉じる
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div 
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
