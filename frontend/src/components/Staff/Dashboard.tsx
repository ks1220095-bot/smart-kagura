import React, { useState } from 'react';
import { Calendar, DollarSign, Users, Award, Printer, ArrowLeft } from 'lucide-react';
import type { Booking } from '../../types';

interface DashboardProps {
  bookings: Booking[];
}

export const Dashboard: React.FC<DashboardProps> = ({ bookings }) => {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showReportPrintPreview, setShowReportPrintPreview] = useState(false);

  const getTodayString = () => {
    const today = new Date();
    const local = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
  };

  const today = getTodayString();
  const [reportDate, setReportDate] = useState(today);
  
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

  // Handle printing trigger
  const handlePrintSchedule = () => {
    window.print();
  };

  // Target date bookings for report
  const reportBookings = bookings.filter(b => b.booking_date === reportDate);
  const reportTotalPrayers = reportBookings.length;
  const reportIndividualPrayers = reportBookings.filter(b => b.booking_type === 'individual').length;
  const reportOrganizationPrayers = reportBookings.filter(b => b.booking_type === 'organization').length;
  const reportTotalRevenue = reportBookings.reduce((sum, b) => sum + (b.hatsuhoryo || 0), 0);

  // Prayer breakdown
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

  if (showPrintPreview) {
    return (
      <div style={{
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
        {/* Print controls bar */}
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
            本日分ご祈祷日程表 印刷プレビュー (横向き印刷推奨)
          </h4>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={handlePrintSchedule} 
              className="btn btn-primary" 
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
            >
              印刷する (A4横)
            </button>
            <button 
              onClick={() => setShowPrintPreview(false)} 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: 'white', borderColor: 'var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <ArrowLeft size={14} />
              元の画面に戻る
            </button>
          </div>
        </div>

        {/* Print layout sheet */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <div 
            className="schedule-print-sheet print-landscape-page"
            style={{
              backgroundColor: 'white',
              width: '297mm', // A4 Landscape width
              minHeight: '210mm',
              padding: '20mm',
              color: 'black',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              fontFamily: 'var(--font-serif)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>清瀧神社 ご祈祷日程内訳表</h2>
              <span style={{ fontSize: '1.1rem' }}>対象日： {today} (本日)</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000', backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left', width: '8%' }}>時間</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', width: '10%' }}>受付番号</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', width: '8%' }}>区分</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', width: '22%' }}>氏名 / 会社・団体名</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', width: '22%' }}>願意</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right', width: '7%' }}>人数</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right', width: '13%' }}>初穂料</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', width: '10%' }}>支払状況</th>
                </tr>
              </thead>
              <tbody>
                {todayBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                      本日予定されているご祈祷はありません。
                    </td>
                  </tr>
                ) : (
                  todayBookings.map((b) => {
                    const isIndiv = b.booking_type === 'individual';
                    const name = isIndiv ? b.name : b.company_name;
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{b.booking_time}</td>
                        <td style={{ padding: '0.6rem 0.5rem' }}>{b.receipt_number}</td>
                        <td style={{ padding: '0.6rem 0.5rem' }}>{isIndiv ? '個人' : '団体'}</td>
                        <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{name}</td>
                        <td style={{ padding: '0.6rem 0.5rem' }}>
                          {b.prayer1}
                          {b.prayer2 ? ` / ${b.prayer2}` : ''}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>{b.attending_count} 名</td>
                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>{b.hatsuhoryo.toLocaleString()} 円</td>
                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                          {b.payment_status === 'paid' ? '支払済' : '未納'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Print statistics footer */}
            <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '2px dashed #ccc', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <div>
                <span>本日予定数： {todayBookings.length} 件</span>
                <span style={{ marginLeft: '1.5rem' }}>（個人：{todayBookings.filter(b => b.booking_type === 'individual').length}件 / 団体：{todayBookings.filter(b => b.booking_type === 'organization').length}件）</span>
              </div>
              <div>
                <span>初穂料合計 (本日済)： <strong>￥{todayRevenue.toLocaleString()}</strong></span>
                <span style={{ marginLeft: '1.5rem', color: '#d3381c' }}>未収： ￥{todayUnpaidRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // B5 Portrait Report Print Preview Modal
  if (showReportPrintPreview) {
    return (
      <div style={{
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
        {/* Controls bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', margin: 0 }}>対象日の選択:</label>
              <input 
                type="date" 
                value={reportDate} 
                onChange={(e) => setReportDate(e.target.value)}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', borderRadius: '2px', border: '1px solid #ccc' }}
              />
            </div>
            <button 
              onClick={handlePrintSchedule} 
              className="btn btn-primary" 
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', backgroundColor: '#d4af37', borderColor: '#d4af37', color: '#800000' }}
            >
              印刷する
            </button>
            <button 
              onClick={() => setShowReportPrintPreview(false)} 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: 'white', borderColor: '#ccc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <ArrowLeft size={14} />
              閉じる
            </button>
          </div>
        </div>

        {/* B5 Sheet layout */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <div 
            className="report-print-sheet print-portrait-page"
            style={{
              backgroundColor: 'white',
              width: '182mm', // B5 portrait width
              minHeight: '257mm', // B5 portrait height
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
                清瀧神社  日次ご祈祷料集計報告書
              </h1>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#555', marginTop: '5px', marginBottom: '25px' }}>
              集計日: {getWarekiDateString(reportDate)}
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
                  <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>{reportTotalPrayers} 件</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>{reportIndividualPrayers} 件</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>{reportOrganizationPrayers} 件</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center' }}>{reportTotalRevenue.toLocaleString()} 円</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px 10px' }}></td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#555', marginTop: '15px', marginBottom: '8px' }}>
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
      </div>
    );
  }

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
              本日のご祈祷日程表 (本日: {today})
            </h4>
            
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                onClick={() => setShowReportPrintPreview(true)}
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.60rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--color-border)' }}
              >
                <Printer size={12} />
                日次報告書
              </button>
              {todayBookings.length > 0 && (
                <button 
                  onClick={() => setShowPrintPreview(true)}
                  className="btn btn-primary"
                  style={{ padding: '0.3rem 0.60rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Printer size={12} />
                  内訳印刷
                </button>
              )}
            </div>
          </div>

          {todayBookings.length === 0 ? (
            <p style={{ color: 'var(--color-accent-gray)', fontSize: '0.85rem', textAlign: 'center', margin: '2rem 0' }}>
              本日予定されているご祈祷はございません。
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
              {todayBookings.map(b => (
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
    </div>
  );
};

export default Dashboard;
