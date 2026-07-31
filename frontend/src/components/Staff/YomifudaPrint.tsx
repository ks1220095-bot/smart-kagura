import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { Booking } from '../../types';

interface YomifudaPrintProps {
  booking: Booking;
  onClose: () => void;
}

export const YomifudaPrint: React.FC<YomifudaPrintProps> = ({ booking, onClose }) => {
  const isIndiv = booking.booking_type === 'individual';

  // 満年齢の計算
  const getFullAge = (birthdayStr: string, bookingDateStr: string): number => {
    if (!birthdayStr || !bookingDateStr) return 0;
    const birth = new Date(birthdayStr);
    const bookingDate = new Date(bookingDateStr);
    let age = bookingDate.getFullYear() - birth.getFullYear();
    const m = bookingDate.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && bookingDate.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // 数え年の計算
  const getKazoeAge = (birthdayStr: string, bookingDateStr: string): number => {
    if (!birthdayStr || !bookingDateStr) return 1;
    const birth = new Date(birthdayStr);
    const bookingDate = new Date(bookingDateStr);
    return bookingDate.getFullYear() - birth.getFullYear() + 1;
  };

  // 年齢表示テキストの生成
  const formatAgeSuffix = (birthdayStr: string, bookingDateStr: string): string => {
    try {
      const full = getFullAge(birthdayStr, bookingDateStr);
      const kazoe = getKazoeAge(birthdayStr, bookingDateStr);
      return `（満${full}歳 / 数え${kazoe}歳）`;
    } catch (e) {
      return '';
    }
  };

  // notes から生年月日や年齢を抽出するヘルパー
  const parseNotesPersonalInfo = (notes: string) => {
    if (!notes) return null;
    const regex = /【生年月日】([^\s(]+)(?:\s*\(([^)]+)\))?/;
    const match = notes.match(regex);
    if (match) {
      return {
        birthday: match[1],
        details: match[2]
      };
    }
    return null;
  };

  // notes からお車情報を抽出するヘルパー
  const parseNotesCarInfo = (notes: string) => {
    if (!notes) return null;
    const regex = /【お車】メーカー:\s*([^/]+?)\s*\/\s*車種:\s*([^/]+?)\s*\/\s*ナンバー:\s*(.+)$/;
    const match = notes.match(regex);
    if (match) {
      return {
        maker: match[1].trim(),
        model: match[2].trim(),
        number: match[3].trim()
      };
    }
    return null;
  };

  const formatImperialDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const ymd = y * 10000 + m * 100 + d;

    if (ymd >= 20190501) {
      const wYear = y - 2019 + 1;
      const yearStr = wYear === 1 ? '元' : String(wYear);
      return `令和${yearStr}年${m}月${d}日`;
    } else if (ymd >= 19890108) {
      const wYear = y - 1989 + 1;
      const yearStr = wYear === 1 ? '元' : String(wYear);
      return `平成${yearStr}年${m}月${d}日`;
    } else if (ymd >= 19261225) {
      const wYear = y - 1926 + 1;
      const yearStr = wYear === 1 ? '元' : String(wYear);
      return `昭和${yearStr}年${m}月${d}日`;
    } else if (ymd >= 19120730) {
      const wYear = y - 1912 + 1;
      const yearStr = wYear === 1 ? '元' : String(wYear);
      return `大正${yearStr}年${m}月${d}日`;
    } else if (ymd >= 18680125) {
      const wYear = y - 1868 + 1;
      const yearStr = wYear === 1 ? '元' : String(wYear);
      return `明治${yearStr}年${m}月${d}日`;
    }
    return `${y}年${m}月${d}日`;
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#777' }}>■ お札墨書・お申込名</span>
            <span style={{ fontSize: '0.65rem', color: '#888' }}>フリガナ: {displayKana}</span>
            <strong style={{ fontSize: '1.45rem', color: '#111', display: 'block', margin: '0.1rem 0', lineHeight: '1.2' }}>
              {displayName}
            </strong>

            {/* Individual child metadata (Highlight child & parents info with Ruby) */}
            {isIndiv && booking.child_name && (
              <div style={{ 
                marginTop: '0.3rem', 
                padding: '0.45rem 0.55rem', 
                backgroundColor: 'rgba(216, 1, 0, 0.02)', 
                border: '1.5px solid rgba(216, 1, 0, 0.12)', 
                borderRadius: '4px',
                fontSize: '0.8rem', 
                lineHeight: '1.35' 
              }}>
                <div style={{ borderBottom: booking.child_name2 ? '1px dashed rgba(216, 1, 0, 0.1)' : 'none', paddingBottom: '0.2rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.6rem', color: '#d80100', fontWeight: 'bold', display: 'block' }}>お子様情報 {booking.child_gender ? `[${booking.child_gender}]` : ''}</span>
                  <span style={{ fontSize: '0.65rem', color: '#666' }}>フリガナ: {booking.child_kana}</span>
                  <strong style={{ fontSize: '1.15rem', display: 'block' }}>{booking.child_name}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#777' }}>
                    生年月日: {booking.child_birthday ? formatImperialDate(booking.child_birthday) : ''} {booking.child_birthday && formatAgeSuffix(booking.child_birthday, booking.booking_date)}
                  </span>
                </div>

                {booking.child_name2 && (
                  <div style={{ borderBottom: 'none', paddingBottom: '0.2rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.6rem', color: '#d80100', fontWeight: 'bold', display: 'block' }}>お子様情報（ご息女・第二子） {booking.child_gender2 ? `[${booking.child_gender2}]` : ''}</span>
                    <span style={{ fontSize: '0.65rem', color: '#666' }}>フリガナ: {booking.child_kana2}</span>
                    <strong style={{ fontSize: '1.15rem', display: 'block' }}>{booking.child_name2}</strong>
                    <span style={{ fontSize: '0.7rem', color: '#777' }}>
                      生年月日: {booking.child_birthday2 ? formatImperialDate(booking.child_birthday2) : ''} {booking.child_birthday2 && formatAgeSuffix(booking.child_birthday2, booking.booking_date)}
                    </span>
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', borderTop: '1px dashed rgba(216, 1, 0, 0.1)', paddingTop: '0.3rem', marginTop: '0.2rem' }}>
                  {booking.father_name && (
                    <div>
                      <span style={{ fontSize: '0.6rem', color: '#777', display: 'block' }}>父親フリガナ</span>
                      <span style={{ fontSize: '0.65rem', color: '#444', display: 'block', fontWeight: 'bold' }}>{booking.father_kana || '（ふりがな無）'}</span>
                      <strong style={{ fontSize: '0.95rem' }}>{booking.father_name}</strong>
                    </div>
                  )}
                  {booking.mother_name && (
                    <div>
                      <span style={{ fontSize: '0.6rem', color: '#777', display: 'block' }}>母親フリガナ</span>
                      <span style={{ fontSize: '0.65rem', color: '#444', display: 'block', fontWeight: 'bold' }}>{booking.mother_kana || '（ふりがな無）'}</span>
                      <strong style={{ fontSize: '0.95rem' }}>{booking.mother_name}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 個人祈祷用（厄年、寿祝い、十三参り、成人祝等）の生年月日・年齢ハイライト表示 */}
            {isIndiv && (booking.prayer1 === '厄年のお祓い' || booking.prayer1 === '寿祝い' || booking.prayer1 === '十三参り' || booking.prayer1 === '成人祝い' || booking.prayer1 === '十三詣り') && (() => {
              const personalInfo = parseNotesPersonalInfo(booking.notes || '');
              if (!personalInfo) return null;
              
              const warekiBirthday = formatImperialDate(personalInfo.birthday);
              const fullAge = getFullAge(personalInfo.birthday, booking.booking_date);
              const kazoeAge = getKazoeAge(personalInfo.birthday, booking.booking_date);
              const ageText = `満${fullAge}歳 / 数え${kazoeAge}歳`;

              return (
                <div style={{ 
                  marginTop: '0.3rem', 
                  padding: '0.45rem 0.55rem', 
                  backgroundColor: 'rgba(216, 1, 0, 0.02)', 
                  border: '1.5px solid rgba(216, 1, 0, 0.12)', 
                  borderRadius: '4px',
                  fontSize: '0.8rem', 
                  lineHeight: '1.35' 
                }}>
                  <span style={{ fontSize: '0.6rem', color: '#d80100', fontWeight: 'bold', display: 'block' }}>御祈祷対象者 生年月日・年齢情報</span>
                  <strong style={{ fontSize: '1.05rem', display: 'block', margin: '0.1rem 0' }}>{booking.name}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#333' }}>
                    <strong>生年月日 (和暦):</strong> {warekiBirthday}<br />
                    <strong>年齢:</strong> <strong style={{ color: '#d80100' }}>{ageText}</strong>
                  </div>
                  {personalInfo.details && (
                    <div style={{ fontSize: '0.72rem', color: '#777', marginTop: '0.15rem', borderTop: '1px dashed rgba(0,0,0,0.05)', paddingTop: '0.15rem' }}>
                      ※登録区分: {personalInfo.details}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 車祓（お車のお祓い）用 metadata (ハイライト表示) */}
            {isIndiv && booking.prayer1 === '車祓（お車のお祓い）' && (() => {
              const carInfo = parseNotesCarInfo(booking.notes || '');
              const maker = booking.car_maker || carInfo?.maker || '';
              const model = booking.car_model || carInfo?.model || '';
              const number = booking.car_number || carInfo?.number || '';
              if (!maker && !model && !number) return null;
              return (
                <div style={{ 
                  marginTop: '0.3rem', 
                  padding: '0.45rem 0.55rem', 
                  backgroundColor: 'rgba(197, 160, 89, 0.03)', 
                  border: '1.5px solid rgba(197, 160, 89, 0.25)', 
                  borderRadius: '4px',
                  fontSize: '0.8rem', 
                  lineHeight: '1.35' 
                }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-gold)', fontWeight: 'bold', display: 'block' }}>お祓い車両情報</span>
                  <div style={{ marginTop: '0.2rem' }}>
                    <strong>メーカー:</strong> <strong style={{ color: '#d80100' }}>{maker}</strong><br/>
                    <strong>車種名:</strong> <strong style={{ color: '#d80100' }}>{model}</strong><br/>
                    <strong>車両ナンバー:</strong> <strong style={{ fontSize: '1.1rem', color: '#d80100' }}>{number}</strong>
                  </div>
                </div>
              );
            })()}

            {/* Representative & Talisman Name Details (Gold highlight border block) */}
            {!isIndiv && (
              <div style={{ 
                marginTop: '0.3rem', 
                padding: '0.45rem 0.55rem', 
                backgroundColor: 'rgba(197, 160, 89, 0.03)', 
                border: '1.5px solid rgba(197, 160, 89, 0.25)', 
                borderRadius: '4px',
                fontSize: '0.8rem', 
                lineHeight: '1.35' 
              }}>
                {booking.talisman_name && (
                  <div style={{ borderBottom: booking.representative_title_name ? '1px dashed rgba(197, 160, 89, 0.15)' : 'none', paddingBottom: '0.2rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--color-gold)', fontWeight: 'bold', display: 'block' }}>お札墨書名</span>
                    <strong style={{ fontSize: '1.15rem', color: '#d80100', display: 'block' }}>{booking.talisman_name}</strong>
                  </div>
                )}
                {booking.representative_title_name && (
                  <div>
                    <span style={{ fontSize: '0.6rem', color: '#777', display: 'block' }}>参拝代表者役職・氏名</span>
                    <strong style={{ fontSize: '1.0rem' }}>{booking.representative_title_name}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Contacts & Notes */}
            {(() => {
              const contactName = isIndiv 
                ? booking.name 
                : (booking.staff_dept_title_name || booking.name || booking.representative_title_name);
              return (
                <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#555' }}>
                  <div><strong>連絡先:</strong> {booking.phone || booking.staff_phone}</div>
                  {contactName && <div><strong>担当者:</strong> {contactName}</div>}
                  <div><strong>人数:</strong> {booking.attending_count}名</div>
                </div>
              );
            })()}
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
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.45rem' }}>
              <div style={{ 
                fontSize: '0.62rem', 
                color: '#444', 
                textAlign: 'right', 
                lineHeight: '1.25', 
                borderRight: '1px dashed #d80100', 
                paddingRight: '0.45rem'
              }}>
                <div><strong>願意:</strong> {booking.prayer1 === '寿祝い' ? getLongevityTitle(booking) : booking.prayer1}</div>
                <div><strong>番号:</strong> {booking.receipt_number}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.6rem', color: '#666' }}>受付印</span>
                <div style={{ width: '8mm', height: '8mm', border: '1px solid #999', borderRadius: '50%' }} />
              </div>
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
      {/* 印刷用 CSS スタイルの流し込み */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape !important;
            margin: 0 !important;
          }
          body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* コントロールバーなどを非表示 */
          .no-print {
            display: none !important;
          }
          /* 背景暗転やスクロール枠を印刷から除外・全画面化 */
          div[style*="rgba(0,0,0,0.85)"] {
            background-color: transparent !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
          }
          /* 外枠ラッパーのパディングを除去 */
          .yomifuda-print-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          /* 印刷対象の用紙をぴったり余白0でA4横配置 */
          .print-yomifuda-page {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
        }
      `}</style>
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
      <div className="yomifuda-print-wrapper" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
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
