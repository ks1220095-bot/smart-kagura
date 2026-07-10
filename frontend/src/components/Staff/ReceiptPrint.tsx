import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { Booking } from '../../types';

interface ReceiptPrintProps {
  booking: Booking;
  onClose: () => void;
}

export const ReceiptPrint: React.FC<ReceiptPrintProps> = ({ booking, onClose }) => {
  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  };

  const amount = booking.receipt_amount || booking.hatsuhoryo;
  const address = booking.receipt_name || booking.company_name || '';

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
          領収証 印刷プレビュー（A5横サイズ）
        </h4>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => window.print()} 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Printer size={14} />
            印刷する (A5横)
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

      {/* Receipt Sheet */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 0' }}>
        <div 
          className="receipt-sheet" 
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #111111',
            borderRadius: '2px',
            position: 'relative',
            width: '210mm',
            height: '148mm', // A5 landscape dimensions
            padding: '12mm 15mm',
            fontFamily: 'var(--font-serif)',
            color: '#000000',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Receipt Border line */}
          <div style={{ position: 'absolute', top: '4mm', bottom: '4mm', left: '4mm', right: '4mm', border: '1px solid #111111', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '5mm', bottom: '5mm', left: '5mm', right: '5mm', border: '2px solid #111111', pointerEvents: 'none' }} />

          {/* Header Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>No. ＿＿＿＿＿＿</span>
            <h2 style={{ 
              fontSize: '2.2rem', 
              textAlign: 'center', 
              margin: '0 auto', 
              letterSpacing: '0.5em', 
              fontWeight: 'bold',
              borderBottom: '2px solid #000000',
              paddingBottom: '0.2rem',
              width: '50%'
            }}>
              領収証
            </h2>
            <span style={{ fontSize: '0.9rem' }}>日付： {getTodayString()}</span>
          </div>

          {/* Address Line */}
          <div style={{ marginTop: '1.5rem', borderBottom: '1px solid #000000', width: '75%', paddingBottom: '0.3rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>
              {address}　御中
            </h3>
          </div>

          {/* Grand Amount Board */}
          <div style={{ 
            margin: '1.5rem 0',
            textAlign: 'center',
            border: '2px solid #000000',
            padding: '0.75rem',
            backgroundColor: '#fafafa',
            fontSize: '2rem',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            fontFamily: 'var(--font-sans)',
            width: '80%',
            alignSelf: 'center'
          }}>
            金額　￥ {amount.toLocaleString()} ─
          </div>

          {/* Description / Particulars */}
          <div style={{ fontSize: '1rem', marginBottom: '1.5rem', borderBottom: '1px dashed #000000', width: '80%', paddingBottom: '0.4rem', alignSelf: 'flex-start' }}>
            Butsu　<strong>御初穂料（ご祈祷：{booking.prayer1}）</strong>として上記の通り正に受領いたしました。
          </div>

          {/* Footer details & Hanko Seal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
            <div style={{ fontSize: '0.75rem', color: '#666', border: '1px solid #ccc', padding: '0.75rem', width: '35%' }}>
              【内訳】<br />
              ・御初穂料： ￥{amount.toLocaleString()}<br />
              ・消費税法非課税扱い
            </div>

            {/* Shrine issuing details & Seal square */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', width: '55%', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'right', fontSize: '0.85rem', lineHeight: '1.5' }}>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>清瀧神社 社務所</h4>
                〒279-0041 千葉県浦安市堀江4-1-5<br />
                TEL： 047-351-5417<br />
                FAX： 047-351-3110
              </div>

              {/* Red Square Seal (Simulation) */}
              <div style={{ 
                width: '30mm', 
                height: '30mm', 
                border: '2px solid #ff4d4f', 
                color: '#ff4d4f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                lineHeight: '1.2',
                padding: '0.2rem',
                writingMode: 'vertical-rl',
                letterSpacing: '0.1em',
                borderRadius: '4px'
              }}>
                清瀧神社<br />社務所印
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default ReceiptPrint;
