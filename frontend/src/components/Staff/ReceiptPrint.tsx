import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Printer, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { printElement } from '../../utils/printUtils';
import type { Booking } from '../../types';

interface ReceiptPrintProps {
  booking?: Booking;
  bookings?: Booking[];
  onClose: () => void;
}

export const ReceiptPrint: React.FC<ReceiptPrintProps> = ({ booking, bookings, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const targetBookings = bookings || (booking ? [booking] : []);

  const getReceiptDateString = (b: Booking) => {
    if (b.booking_date) {
      const parts = b.booking_date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return `${year}年${month}月${day}日`;
        }
      }
    }
    const today = new Date();
    return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  };

  interface ReceiptItem {
    id: string | number;
    receiptDate: string;
    address: string;
    amount: number;
    booking: Booking;
    splitIndex?: number;
  }

  const receiptItems: ReceiptItem[] = [];
  targetBookings.forEach((b, bIdx) => {
    const dateStr = getReceiptDateString(b);
    if (b.receipt_split_count === 2 && b.receipt_name2 && b.receipt_amount2) {
      receiptItems.push({
        id: `${b.id || bIdx}-1`,
        receiptDate: dateStr,
        address: b.receipt_name || b.company_name || b.name || '',
        amount: b.receipt_amount || b.hatsuhoryo || 0,
        booking: b,
        splitIndex: 1
      });
      receiptItems.push({
        id: `${b.id || bIdx}-2`,
        receiptDate: dateStr,
        address: b.receipt_name2,
        amount: b.receipt_amount2,
        booking: b,
        splitIndex: 2
      });
    } else {
      receiptItems.push({
        id: b.id || bIdx,
        receiptDate: dateStr,
        address: b.receipt_name || b.company_name || b.name || '',
        amount: b.receipt_amount || b.hatsuhoryo || 0,
        booking: b
      });
    }
  });

  const handlePrint = () => {
    const title = receiptItems.length === 1
      ? `清瀧神社_領収証_${receiptItems[0].address || 'ご祈祷'}`
      : `清瀧神社_領収証_${receiptItems.length}枚`;

    printElement(printRef.current, {
      title,
      orientation: 'landscape',
      size: 'A5'
    });
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const sheets = printRef.current.querySelectorAll<HTMLElement>('.receipt-sheet');
      if (sheets.length === 0) return;

      // A5 landscape: width 210mm, height 148mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [210, 148]
      });

      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        if (i > 0) {
          pdf.addPage([210, 148], 'landscape');
        }

        const prevShadow = sheet.style.boxShadow;
        sheet.style.boxShadow = 'none';

        const canvas = await html2canvas(sheet, {
          scale: 3, // High resolution
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });

        sheet.style.boxShadow = prevShadow;

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 148);
      }

      const fileName = receiptItems.length === 1 
        ? `清瀧神社_領収証_${receiptItems[0].address || 'ご祈祷'}.pdf`
        : `清瀧神社_領収証_${receiptItems.length}枚.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDFの生成中にエラーが発生しました。');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return createPortal(
    <div className="print-modal-overlay">
      {/* Control bar */}
      <div className="no-print" style={{
        backgroundColor: 'var(--color-urushi)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        borderBottom: '2px solid var(--color-gold)',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <h4 style={{ margin: 0, color: 'white', fontFamily: 'var(--font-serif)' }}>
          {receiptItems.length > 1
            ? `領収証 印刷プレビュー（全 ${receiptItems.length} 枚）`
            : '領収証 印刷プレビュー（A5横サイズ）'}
        </h4>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handlePrint} 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Printer size={14} />
            {receiptItems.length > 1 ? `印刷する (${receiptItems.length}枚 / A5横)` : '印刷する (A5横)'}
          </button>
          <button 
            onClick={handleDownloadPdf} 
            disabled={isGeneratingPdf}
            className="btn" 
            style={{ 
              padding: '0.4rem 0.9rem', 
              fontSize: '0.85rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              backgroundColor: '#1890ff',
              color: '#ffffff',
              border: '1px solid #1890ff',
              cursor: isGeneratingPdf ? 'wait' : 'pointer'
            }}
          >
            {isGeneratingPdf ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
            {isGeneratingPdf ? 'PDF生成中...' : (receiptItems.length > 1 ? `A5 PDF保存 (${receiptItems.length}枚)` : 'A5 PDF保存')}
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

      {/* Receipt Sheets Container */}
      <div 
        ref={printRef}
        className="receipt-print-wrapper" 
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '2rem', 
          padding: '2rem 0' 
        }}
      >
        {receiptItems.map((item) => {
          const amount = item.amount;
          const address = item.address;

          return (
            <div 
              key={item.id}
              className="receipt-sheet print-receipt-page" 
              style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                width: '210mm',
                height: '148mm',
                maxWidth: '210mm',
                maxHeight: '148mm',
                boxSizing: 'border-box',
                fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
                color: '#1a1a1a',
                margin: '0 auto',
                padding: '8mm'
              }}
            >
              {/* Outer Border (子持二重枠 - 外枠) */}
              <div style={{
                width: '100%',
                height: '100%',
                border: '1px solid #222222',
                padding: '2mm',
                boxSizing: 'border-box'
              }}>
                {/* Inner Border & Content Container (子持二重枠 - 内枠) */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  border: '2px solid #222222',
                  padding: '5mm 8mm',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {/* Header Title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.82rem', letterSpacing: '0.05em', color: '#333' }}>
                      No. ＿＿＿＿＿＿
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '-0.15rem' }}>
                      <h2 style={{ 
                        fontSize: '1.9rem', 
                        margin: 0, 
                        letterSpacing: '0.7em', 
                        fontWeight: 'bold',
                        fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
                        color: '#111'
                      }}>
                        領　収　証
                      </h2>
                      <div style={{ 
                        width: '150px', 
                        height: '3px', 
                        borderBottom: '3px double #222', 
                        margin: '0.25rem auto 0' 
                      }} />
                    </div>
                    <div style={{ fontSize: '0.85rem', letterSpacing: '0.05em', color: '#333' }}>
                      日付： {item.receiptDate}
                    </div>
                  </div>

                  {/* Address Line */}
                  <div style={{ marginTop: '0.35rem', width: '65%', borderBottom: '1px solid #222', paddingBottom: '0.25rem' }}>
                    <h3 style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 'bold', 
                      margin: 0,
                      letterSpacing: '0.05em',
                      fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif'
                    }}>
                      {address}　御中
                    </h3>
                  </div>

                  {/* Grand Amount Board (洗練された飾り二重線枠) */}
                  <div style={{ 
                    margin: '0.45rem auto',
                    textAlign: 'center',
                    border: '3px double #222222',
                    padding: '0.4rem 1.5rem',
                    backgroundColor: '#ffffff',
                    fontSize: '1.85rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.08em',
                    fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
                    width: '80%'
                  }}>
                    金　￥ {amount.toLocaleString()} ─
                  </div>

                  {/* Description / Particulars */}
                  <div style={{ 
                    fontSize: '0.95rem', 
                    letterSpacing: '0.04em',
                    fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
                    alignSelf: 'flex-start',
                    paddingLeft: '0.5rem'
                  }}>
                    但　<strong>ご祈祷料</strong>として、上記正に領収いたしました。
                  </div>

                  {/* Footer details & Hanko Seal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                    {/* 内訳表 */}
                    <div style={{ 
                      border: '1px solid #444', 
                      fontSize: '0.75rem', 
                      width: '36%', 
                      backgroundColor: '#ffffff' 
                    }}>
                      <div style={{ display: 'flex', borderBottom: '1px solid #444' }}>
                        <div style={{ width: '45%', padding: '0.25rem 0.4rem', borderRight: '1px solid #444', backgroundColor: '#fcfbf7', fontWeight: 'bold' }}>
                          内　訳
                        </div>
                        <div style={{ width: '55%', padding: '0.25rem 0.4rem', textAlign: 'right', fontWeight: 'bold' }}>
                          ￥{amount.toLocaleString()}
                        </div>
                      </div>
                      <div style={{ padding: '0.2rem 0.4rem', fontSize: '0.68rem', color: '#555' }}>
                        ※消費税法非課税扱い
                      </div>
                    </div>

                    {/* Shrine issuing details & Seal square */}
                    <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'right', fontSize: '0.78rem', lineHeight: '1.45', color: '#222' }}>
                        <h4 style={{ 
                          fontSize: '1.15rem', 
                          fontWeight: 'bold', 
                          margin: '0 0 0.2rem 0',
                          letterSpacing: '0.08em',
                          fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif'
                        }}>
                          清瀧神社 社務所
                        </h4>
                        〒279-0041 千葉県浦安市堀江4-1-5<br />
                        TEL： 047-351-5417<br />
                        FAX： 047-351-3110
                      </div>

                      {/* 本朱肉色 二重角印 */}
                      <div style={{ 
                        width: '24mm', 
                        height: '24mm', 
                        border: '3px double #b32418', 
                        color: '#b32418',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        lineHeight: '1.25',
                        padding: '0.15rem',
                        writingMode: 'vertical-rl',
                        letterSpacing: '0.08em',
                        borderRadius: '2px',
                        boxSizing: 'border-box'
                      }}>
                        清瀧神社<br />社務所印
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
};
export default ReceiptPrint;
