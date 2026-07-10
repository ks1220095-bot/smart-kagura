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
          ご祈祷読み札・お札 印刷プレビュー（B5縦サイズ）
        </h4>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => window.print()} 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Printer size={14} />
            印刷する (B5縦)
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

      {/* Yomifuda Body (Vertical text B5 page) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 0' }}>
        <div 
          className="yomifuda-sheet print-yomifuda-page" 
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '2px double var(--color-gold)',
            borderRadius: '2px',
            position: 'relative',
            width: '182mm',   // B5 Width
            height: '257mm',  // B5 Height
            padding: '18mm 12mm',
            fontFamily: 'var(--font-serif)',
            color: '#000000',
            writingMode: 'vertical-rl',
            textCombineUpright: 'all'
          }}
        >
          {/* Shinto watermark-like frame */}
          <div style={{ position: 'absolute', top: '10mm', bottom: '10mm', left: '10mm', right: '10mm', border: '1px solid rgba(50,136,163,0.12)', pointerEvents: 'none' }} />

          {/* 1. Date Column */}
          <div style={{ fontSize: '0.95rem', display: 'inline-block', verticalAlign: 'top', marginLeft: '0.75rem', letterSpacing: '0.1em' }}>
            奉修祈願日： {formatImperialDate(booking.booking_date)}
          </div>

          {/* 2. Address / Meta Column */}
          <div style={{ fontSize: '1rem', display: 'inline-block', verticalAlign: 'top', marginLeft: '1.5rem', letterSpacing: '0.1em', width: '12mm' }}>
            {isIndiv ? (
              <>住所： {booking.address}</>
            ) : (
              <>所在地： {booking.company_address}</>
            )}
          </div>

          {/* 3. Main Names Section */}
          <div style={{ 
            display: 'inline-block', 
            verticalAlign: 'top',
            marginLeft: '3rem',
            height: '100%',
            width: '24mm'
          }}>
            {isIndiv ? (
              <div style={{ display: 'inline-flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-start' }}>
                <span style={{ fontSize: '1.1rem', color: '#555' }}>({booking.kana})</span>
                <span style={{ fontSize: '2.1rem', fontWeight: 'bold', marginTop: '0.4rem', letterSpacing: '0.1em' }}>
                  {booking.name} 殿
                </span>
                
                {booking.child_name && (
                  <div style={{ display: 'inline-flex', flexDirection: 'column', marginTop: '1.5rem', borderRight: '1px dashed #bbb', paddingRight: '0.5rem', fontSize: '1.1rem' }}>
                    <span>お祝子：</span>
                    <span style={{ fontSize: '0.8rem', color: '#555' }}>({booking.child_kana})</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{booking.child_name}</span>
                    <span style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>生年月日：{booking.child_birthday}</span>
                    
                    <span style={{ marginTop: '1rem' }}>両親：</span>
                    {booking.father_name && <span>父： {booking.father_name}</span>}
                    {booking.mother_name && <span>母： {booking.mother_name}</span>}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'inline-flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-start' }}>
                <span style={{ fontSize: '1rem', color: '#555' }}>({booking.company_kana})</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '0.4rem' }}>
                  {booking.company_name}
                </span>
                <span style={{ fontSize: '1.1rem', marginTop: '0.4rem' }}>
                  代表： {booking.representative_title_name}
                </span>

                <div style={{ 
                  marginTop: '1.5rem', 
                  borderRight: '2px solid var(--color-gold)', 
                  paddingRight: '0.5rem', 
                  display: 'inline-flex', 
                  flexDirection: 'column' 
                }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-gold)' }}>神札染筆名：</span>
                  <span style={{ fontSize: '1.9rem', fontWeight: 'bold', marginTop: '0.25rem', letterSpacing: '0.05em' }}>
                    {booking.talisman_name || booking.company_name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Willing / Prayers (Center position) */}
          <div style={{ 
            display: 'inline-block', 
            verticalAlign: 'top',
            marginLeft: '3rem',
            width: '32mm',
            borderRight: '1px double #000',
            borderLeft: '1px double #000',
            padding: '0 0.5rem',
            height: '100%',
            textAlign: 'center'
          }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 'bold', letterSpacing: '0.15em', textDecoration: 'underline', textDecorationColor: 'var(--color-gold)' }}>
                {isIndiv && booking.prayer1 === '寿祝い' ? getLongevityTitle(booking) : booking.prayer1}
              </span>
              
              {booking.prayer2 && (
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '1.5rem', letterSpacing: '0.1em' }}>
                  並びに {booking.prayer2}
                </span>
              )}

              {isIndiv && booking.prayer1 === '厄年のお祓い' && booking.yakudoshi_type && (
                <span style={{ fontSize: '1.4rem', marginTop: '1rem', border: '1px solid #000', padding: '0.4rem 0.2rem', borderRadius: '2px' }}>
                  {booking.yakudoshi_type === 'maeyaku' ? '前厄祈願' : booking.yakudoshi_type === 'honyaku' ? '本厄祈願' : '後厄祈願'}
                </span>
              )}
            </div>
          </div>

          {/* 5. Special contexts */}
          <div style={{ fontSize: '0.95rem', display: 'inline-block', verticalAlign: 'top', marginLeft: '2rem', width: '22mm', letterSpacing: '0.05em' }}>
            {booking.tournament_name && (
              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '1px dashed #ccc', paddingLeft: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--color-mizuiro)' }}>【大会必勝】</span>
                <span>大会名：{booking.tournament_name}</span>
                <span>日程：{booking.tournament_schedule}</span>
              </div>
            )}

            {booking.construction_name && (
              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '1px dashed #ccc', paddingLeft: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--color-mizuiro)' }}>【工事安全】</span>
                <span>工事名：{booking.construction_name}</span>
                <span>設計：{booking.construction_designer}</span>
                <span>施工：{booking.construction_builder}</span>
                <span>工期：{booking.construction_period}</span>
              </div>
            )}

            {!isIndiv && booking.additional_talismans && (
              <div style={{ display: 'inline-flex', flexDirection: 'column', marginTop: '1.5rem', color: '#444' }}>
                <span>【追加守札】</span>
                <span>{booking.additional_talismans}</span>
              </div>
            )}
          </div>

          {/* 6. Issuing Office */}
          <div style={{ 
            display: 'inline-block', 
            verticalAlign: 'bottom',
            fontSize: '1.15rem', 
            letterSpacing: '0.15em',
            marginLeft: '1.5rem',
            height: '100%',
            color: '#333'
          }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', paddingBottom: '20mm' }}>
              <span>清瀧神社社務所奉仕</span>
            </div>
          </div>

          {/* 7. STAFF POST-PRINT HANDWRITE CHECK BOXES (Far Left) */}
          <div style={{ 
            display: 'inline-block',
            verticalAlign: 'top',
            borderLeft: '1px dashed #999',
            paddingLeft: '0.75rem',
            height: '100%',
            fontSize: '0.85rem',
            color: '#444',
            width: '25mm',
            float: 'left' // Push to the far left
          }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--color-mizuiro)', borderBottom: '1px solid #ccc', paddingBottom: '0.2rem', marginBottom: '0.75rem' }}>
                  社務処理欄
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  No. ＿＿＿＿＿＿
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span>初穂料：</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ［　］済（領収証）
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ［　］済（現金受）
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ［　］未納
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '1.5rem' }}>
                <span>備考：</span>
                <div style={{ borderRight: '1px solid #ccc', height: '60mm', marginRight: '0.5rem' }} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default YomifudaPrint;
