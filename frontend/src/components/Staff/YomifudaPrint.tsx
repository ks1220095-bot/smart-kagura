import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { Booking } from '../../types';

interface YomifudaPrintProps {
  booking: Booking;
  onClose: () => void;
}

export const YomifudaPrint: React.FC<YomifudaPrintProps> = ({ booking, onClose }) => {
  const isIndiv = booking.booking_type === 'individual';

  const formatImperialDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const reiwaYear = year - 2018;
    const reiwaStr = reiwaYear === 1 ? '元' : String(reiwaYear);
    return `令和${reiwaStr}年 ${date.getMonth() + 1}月 ${date.getDate()}日`;
  };

  const getLongevityTitle = (b: Booking) => {
    if (b.kotobuki_type === 'その他') return b.kotobuki_other_text || '長寿御祝';
    return `${b.kotobuki_type}御祝`;
  };

  const renderHalfSheet = (title: '神社控' | '祈祷控') => {
    const displayName = isIndiv ? booking.name : booking.company_name;
    const displayKana = isIndiv ? booking.kana : booking.company_kana;
    const displayAddress = isIndiv ? booking.address : booking.company_address;
    const displayAddressKana = isIndiv ? booking.address_kana : booking.company_address_kana;
    
    return (
      <div style={{
        width: '133mm',
        height: '188mm',
        border: '3px double #d80100',
        padding: '8mm 6mm',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundColor: '#ffffff',
        fontFamily: 'var(--font-serif)',
        writingMode: 'vertical-rl',
        textCombineUpright: 'all',
        display: 'inline-block',
        verticalAlign: 'top',
        overflow: 'hidden'
      }}>
        {/* Watermark Logo Label */}
        <div style={{
          position: 'absolute',
          bottom: '10mm',
          left: '10mm',
          fontSize: '3.2rem',
          fontWeight: 'bold',
          color: 'rgba(216, 1, 0, 0.04)',
          writingMode: 'horizontal-tb',
          pointerEvents: 'none',
          fontFamily: 'var(--font-serif)',
          zIndex: 1
        }}>
          清瀧神社
        </div>

        {/* Outer column container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
          
          {/* Title Row */}
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#d80100', letterSpacing: '0.15em', borderBottom: '1px solid #d80100', paddingBottom: '0.2rem', marginBottom: '0.4rem', writingMode: 'vertical-rl' }}>
            祈願受付票　【 {title} 】
          </div>
          
          {/* Metadata Block */}
          <div style={{ fontSize: '0.85rem', color: '#000', display: 'flex', gap: '0.4rem', borderRight: '1px dashed #d80100', paddingRight: '0.4rem' }}>
            <div>【受付番号】 {booking.receipt_number}</div>
            <div>【祈願日時】 {formatImperialDate(booking.booking_date)}　{booking.booking_time}の回</div>
            <div>【初穂料】 金 {booking.hatsuhoryo?.toLocaleString()} 円（{booking.payment_status === 'paid' ? '納済' : '当日納'}）</div>
          </div>

          {/* Main Form Fields */}
          <div style={{ flex: 1, marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            
            {/* Willing Column */}
            <div style={{ borderRight: '1px solid #ccc', paddingRight: '0.4rem', minHeight: '30mm' }}>
              <span style={{ fontSize: '0.7rem', color: '#777', display: 'block' }}>願意</span>
              <strong style={{ fontSize: '1.6rem', color: '#d80100', display: 'block', marginTop: '0.2rem' }}>
                {isIndiv && booking.prayer1 === '寿祝い' ? getLongevityTitle(booking) : booking.prayer1}
              </strong>
              {booking.prayer2 && (
                <strong style={{ fontSize: '1.2rem', display: 'block', marginTop: '0.2rem' }}>
                  並びに {booking.prayer2}
                </strong>
              )}
              {isIndiv && booking.prayer1 === '厄年のお祓い' && booking.yakudoshi_type && (
                <span style={{ fontSize: '0.9rem', color: '#d80100', border: '1px solid #d80100', padding: '0.1rem 0.3rem', display: 'inline-block', marginTop: '0.2rem' }}>
                  {booking.yakudoshi_type === 'maeyaku' ? '前厄' : booking.yakudoshi_type === 'honyaku' ? '本厄' : '後厄'}
                </span>
              )}
            </div>

            {/* Address Column */}
            <div style={{ borderRight: '1px solid #ccc', paddingRight: '0.4rem', minHeight: '30mm' }}>
              <span style={{ fontSize: '0.7rem', color: '#777', display: 'block' }}>郵便番号・住所</span>
              <span style={{ fontSize: '0.7rem', color: '#666', display: 'block' }}>({displayAddressKana})</span>
              <span style={{ fontSize: '1rem', display: 'block', marginTop: '0.2rem', lineHeight: '1.3' }}>
                {displayAddress}
              </span>
            </div>

            {/* Names Column */}
            <div style={{ borderRight: '1px solid #ccc', paddingRight: '0.4rem', flex: 1 }}>
              <span style={{ fontSize: '0.7rem', color: '#777', display: 'block' }}>氏名 / 会社名</span>
              <span style={{ fontSize: '0.7rem', color: '#666', display: 'block' }}>({displayKana})</span>
              <strong style={{ fontSize: '1.5rem', display: 'block', marginTop: '0.2rem' }}>
                {displayName}
              </strong>

              {/* Individual child meta */}
              {isIndiv && booking.child_name && (
                <div style={{ marginTop: '0.4rem', borderRight: '1px dashed #d80100', paddingRight: '0.3rem', fontSize: '0.85rem', lineHeight: '1.3' }}>
                  <span style={{ fontSize: '0.7rem', color: '#777' }}>お子様情報:</span><br/>
                  <strong>{booking.child_name}</strong> ({booking.child_kana})<br/>
                  生年月日: {booking.child_birthday}<br/>
                  {booking.father_name && <span>父: {booking.father_name}<br/></span>}
                  {booking.mother_name && <span>母: {booking.mother_name}</span>}
                </div>
              )}

              {!isIndiv && booking.representative_title_name && (
                <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>代表者氏名: {booking.representative_title_name}</div>
              )}
              {!isIndiv && booking.talisman_name && (
                <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: '#555' }}>墨書染筆名: {booking.talisman_name}</div>
              )}
            </div>

            {/* Contacts & Metadata */}
            <div style={{ display: 'flex', gap: '0.4rem', borderRight: '1px solid #ccc', paddingRight: '0.4rem', fontSize: '0.8rem' }}>
              <div>【電話番号】 {booking.phone || booking.staff_phone}</div>
              <div>【参列人数】 {booking.attending_count}名</div>
              {booking.notes && (
                <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  【備考】 {booking.notes}
                </div>
              )}
            </div>

            {/* Tournaments and constructions dynamic display */}
            {(booking.tournament_name || booking.construction_name) && (
              <div style={{ borderRight: '1px solid #ccc', paddingRight: '0.4rem', fontSize: '0.75rem', color: '#888' }}>
                {booking.tournament_name && (
                  <div>大会名: {booking.tournament_name}　日程: {booking.tournament_schedule}</div>
                )}
                {booking.construction_name && (
                  <div>工事名: {booking.construction_name}　設計: {booking.construction_designer}　施工: {booking.construction_builder}　工期: {booking.construction_period}</div>
                )}
              </div>
            )}
          </div>

          {/* Footer Area */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', borderTop: '1px dashed #d80100', paddingTop: '0.3rem' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}>清瀧神社社務所</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.6rem', color: '#777' }}>受付者印</span>
              <div style={{ width: '10mm', height: '10mm', border: '1px solid #ccc', borderRadius: '50%', marginTop: '0.1rem' }} />
            </div>
          </div>
          
        </div>
      </div>
    );
  };

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
      {/* Control bar */}
      <div className="no-print" style={{
        backgroundColor: 'var(--color-urushi)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        borderBottom: '2px solid var(--color-gold)'
      }}>
        <h4 style={{ margin: 0, color: 'white', fontFamily: 'var(--font-serif)' }}>
          ご祈祷受付票・読み札 印刷プレビュー（A4横置き・左右二分割）
        </h4>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => window.print()} 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Printer size={14} />
            印刷する (A4横)
          </button>
          <button 
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: 'white', borderColor: 'var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <ArrowLeft size={14} />
            元の管理画面に戻る
          </button>
        </div>
      </div>

      {/* Yomifuda Body (Horizontal A4 page with 2 half-sheets) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div 
          className="yomifuda-sheet print-yomifuda-page" 
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            position: 'relative',
            width: '297mm',   // A4 Width
            height: '210mm',  // A4 Height
            padding: '10mm 10mm',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '5mm',
            color: '#000000',
            overflow: 'hidden'
          }}
        >
          {/* Right half: 神社控 */}
          {renderHalfSheet('神社控')}

          {/* Center cutting dashed divider */}
          <div style={{
            height: '100%',
            borderLeft: '2px dashed #999',
            width: '1px',
            position: 'relative',
            zIndex: 10
          }} className="no-print" />

          {/* Left half: 祈祷控 */}
          {renderHalfSheet('祈祷控')}
        </div>
      </div>
    </div>
  );
};
export default YomifudaPrint;
