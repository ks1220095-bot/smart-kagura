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
        padding: '8mm 8mm',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundColor: '#ffffff',
        fontFamily: 'var(--font-serif)',
        display: 'inline-flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
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
          pointerEvents: 'none',
          zIndex: 1
        }}>
          清瀧神社
        </div>

        {/* Inner Content Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', height: '100%', zIndex: 2 }}>
          
          {/* Header Title Bar */}
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            color: '#d80100', 
            letterSpacing: '0.1em', 
            borderBottom: '2px solid #d80100', 
            paddingBottom: '0.25rem',
            textAlign: 'center'
          }}>
            ご祈祷読み札　【 {title} 】
          </div>
          
          {/* Metadata Block (Horizontal Grid) */}
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#333', 
            backgroundColor: '#f9f9f9', 
            padding: '0.4rem 0.5rem', 
            borderRadius: '2px', 
            border: '1px solid #eee',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '0.2rem'
          }}>
            <div><strong>受付番号:</strong> {booking.receipt_number}</div>
            <div><strong>初穂料:</strong> 金 {booking.hatsuhoryo?.toLocaleString()} 円 ({booking.payment_status === 'paid' ? '納済' : '当日'})</div>
            <div style={{ gridColumn: 'span 2' }}><strong>祈祷日時:</strong> {formatImperialDate(booking.booking_date)} {booking.booking_time}の回</div>
          </div>

          {/* Willing Section */}
          <div style={{ borderBottom: '1px dashed #d80100', paddingBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#777', display: 'block' }}>■ 御願意</span>
            <strong style={{ fontSize: '1.4rem', color: '#d80100', display: 'block', marginTop: '0.1rem', lineHeight: '1.2' }}>
              {isIndiv && booking.prayer1 === '寿祝い' ? getLongevityTitle(booking) : booking.prayer1}
              {booking.prayer2 && `　並びに ${booking.prayer2}`}
            </strong>
            {isIndiv && booking.prayer1 === '厄年のお祓い' && booking.yakudoshi_type && (
              <span style={{ 
                fontSize: '0.75rem', 
                color: '#d80100', 
                border: '1px solid #d80100', 
                padding: '0.05rem 0.25rem', 
                borderRadius: '2px', 
                display: 'inline-block', 
                marginTop: '0.15rem' 
              }}>
                {booking.yakudoshi_type === 'maeyaku' ? '前厄' : booking.yakudoshi_type === 'honyaku' ? '本厄' : '後厄'}
              </span>
            )}
          </div>

          {/* Address Section */}
          <div style={{ borderBottom: '1px dashed #eee', paddingBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#777', display: 'block' }}>■ 郵便番号・住所</span>
            <span style={{ fontSize: '0.65rem', color: '#888', display: 'block' }}>フリガナ: {displayAddressKana}</span>
            <span style={{ fontSize: '0.85rem', display: 'block', marginTop: '0.1rem', lineHeight: '1.3' }}>
              {displayAddress}
            </span>
          </div>

          {/* Names Section (Main highlighted for Priest chanting) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#777' }}>■ お札墨書・お名前</span>
            <span style={{ fontSize: '0.65rem', color: '#888' }}>フリガナ: {displayKana}</span>
            <strong style={{ fontSize: '1.5rem', color: '#111', display: 'block', margin: '0.15rem 0', lineHeight: '1.2' }}>
              {displayName}
            </strong>

            {/* Individual child metadata */}
            {isIndiv && booking.child_name && (
              <div style={{ 
                marginTop: '0.25rem', 
                padding: '0.3rem', 
                backgroundColor: 'rgba(216, 1, 0, 0.02)', 
                border: '1px dashed rgba(216, 1, 0, 0.2)', 
                borderRadius: '2px',
                fontSize: '0.75rem', 
                lineHeight: '1.3' 
              }}>
                <span style={{ fontSize: '0.65rem', color: '#d80100', fontWeight: 'bold' }}>お子様情報:</span>{' '}
                <strong>{booking.child_name}</strong> ({booking.child_kana}) | 生年月日: {booking.child_birthday}
                {(booking.father_name || booking.mother_name) && (
                  <div style={{ marginTop: '0.15rem', color: '#555' }}>
                    {booking.father_name && <span>父親: {booking.father_name}　</span>}
                    {booking.mother_name && <span>母親: {booking.mother_name}</span>}
                  </div>
                )}
              </div>
            )}

            {/* Representative Details */}
            {!isIndiv && booking.representative_title_name && (
              <div style={{ fontSize: '0.75rem', color: '#333' }}>
                <strong>代表者名:</strong> {booking.representative_title_name}
              </div>
            )}
            {!isIndiv && booking.talisman_name && (
              <div style={{ fontSize: '0.75rem', color: '#d80100' }}>
                <strong>墨書名:</strong> {booking.talisman_name}
              </div>
            )}

            {/* Contacts & Notes */}
            <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#555' }}>
              <div><strong>連絡先:</strong> {booking.phone || booking.staff_phone}</div>
              <div><strong>人数:</strong> {booking.attending_count}名</div>
            </div>
            {booking.notes && (
              <div style={{ color: '#666', fontSize: '0.7rem', backgroundColor: '#fdfdfd', border: '1px solid #f0f0f0', padding: '0.2rem', marginTop: '0.1rem', borderRadius: '2px' }}>
                <strong>備考:</strong> {booking.notes}
              </div>
            )}

            {/* Dynamic special metadata (Tournaments / Constructions) */}
            {(booking.tournament_name || booking.construction_name) && (
              <div style={{ 
                marginTop: '0.25rem', 
                padding: '0.25rem', 
                backgroundColor: '#fffbe6', 
                border: '1px solid #ffe58f', 
                borderRadius: '2px', 
                fontSize: '0.7rem', 
                color: '#613feb' 
              }}>
                {booking.tournament_name && (
                  <div><strong>大会名:</strong> {booking.tournament_name}　<strong>日程:</strong> {booking.tournament_schedule}</div>
                )}
                {booking.construction_name && (
                  <div style={{ lineHeight: '1.25' }}>
                    <strong>工事名:</strong> {booking.construction_name}<br/>
                    <strong>施工:</strong> {booking.construction_builder} | <strong>工期:</strong> {booking.construction_period}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Area */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end', 
            marginTop: '0.4rem', 
            borderTop: '1.5px solid #d80100', 
            paddingTop: '0.3rem' 
          }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '0.05em', color: '#333' }}>清瀧神社社務所</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.6rem', color: '#666' }}>受付者印</span>
              <div style={{ width: '8mm', height: '8mm', border: '1px solid #999', borderRadius: '50%' }} />
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
