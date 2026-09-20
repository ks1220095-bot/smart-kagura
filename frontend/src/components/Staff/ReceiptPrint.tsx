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

        const canvas = await html2canvas(sheet, {
          scale: 3, // High resolution
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });

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
                width: '200mm',
                height: '138mm',
                maxWidth: '200mm',
                maxHeight: '138mm',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-serif)',
                color: '#000000',
                margin: '0 auto',
                padding: '0'
              }}
            >
              {/* Outer Border */}
              <div style={{
                width: '100%',
                height: '100%',
                border: '1px solid #111111',
                padding: '2.5mm',
                boxSizing: 'border-box'
              }}>
                {/* Inner Border & Content Container */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  border: '2px solid #111111',
                  padding: '5mm 8mm',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {/* Header Title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>No. ＿＿＿＿＿＿</span>
                    <h2 style={{ 
                      fontSize: '1.9rem', 
                      textAlign: 'center', 
                      margin: '0 auto', 
                      letterSpacing: '0.5em', 
                      fontWeight: 'bold',
                      borderBottom: '2px solid #000000',
                      paddingBottom: '0.15rem',
                      width: '45%'
                    }}>
                      領収証
                    </h2>
                    <span style={{ fontSize: '0.85rem' }}>日付： {item.receiptDate}</span>
                  </div>

                  {/* Address Line */}
                  <div style={{ marginTop: '0.4rem', borderBottom: '1px solid #000000', width: '70%', paddingBottom: '0.2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>
                      {address}　御中
                    </h3>
                  </div>

                  {/* Grand Amount Board */}
                  <div style={{ 
                    margin: '0.5rem 0',
                    textAlign: 'center',
                    border: '2px solid #000000',
                    padding: '0.35rem',
                    backgroundColor: '#fafafa',
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.05em',
                    fontFamily: 'var(--font-sans)',
                    width: '80%',
                    alignSelf: 'center'
                  }}>
                    金　￥ {amount.toLocaleString()} ─
                  </div>

                  {/* Description / Particulars */}
                  <div style={{ fontSize: '0.95rem', marginBottom: '0.5rem', borderBottom: '1px dashed #000000', width: '80%', paddingBottom: '0.25rem', alignSelf: 'flex-start' }}>
                    但　<strong>ご祈祷料</strong>として、上記正に領収いたしました。
                  </div>

                  {/* Footer details & Hanko Seal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                    <div style={{ fontSize: '0.72rem', color: '#444', border: '1px solid #aaa', padding: '0.5rem', width: '35%' }}>
                      【内訳】<br />
                      ・ご祈祷料： ￥{amount.toLocaleString()}<br />
                      ・消費税法非課税扱い
                    </div>

                    {/* Shrine issuing details & Seal square */}
                    <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-end', width: '55%', justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'right', fontSize: '0.78rem', lineHeight: '1.35' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '0 0 0.15rem 0' }}>清瀧神社 社務所</h4>
                        〒279-0041 千葉県浦安市堀江4-1-5<br />
                        TEL： 047-351-5417<br />
                        FAX： 047-351-3110
                      </div>

                      {/* Red Square Seal (Simulation) */}
                      <div style={{ 
                        width: '24mm', 
                        height: '24mm', 
                        border: '2px solid #ff4d4f', 
                        color: '#ff4d4f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        lineHeight: '1.2',
                        padding: '0.15rem',
                        writingMode: 'vertical-rl',
                        letterSpacing: '0.08em',
                        borderRadius: '3px'
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
