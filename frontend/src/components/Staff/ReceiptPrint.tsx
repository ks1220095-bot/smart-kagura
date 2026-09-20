import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Printer, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { printElement } from '../../utils/printUtils';
import type { Booking } from '../../types';

interface ReceiptPrintProps {
  booking: Booking;
  onClose: () => void;
}

export const ReceiptPrint: React.FC<ReceiptPrintProps> = ({ booking, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  };

  const amount = booking.receipt_amount || booking.hatsuhoryo || 0;
  const address = booking.receipt_name || booking.company_name || '';

  const handlePrint = () => {
    const recipientName = booking.receipt_name || booking.name || booking.company_name || 'ご祈祷';
    printElement(printRef.current, {
      title: `清瀧神社_領収証_${recipientName}`,
      orientation: 'landscape',
      size: 'A5'
    });
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);

    try {
      // A5 landscape: width 210mm, height 148mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [210, 148]
      });

      const canvas = await html2canvas(printRef.current, {
        scale: 3, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 148);

      const recipientName = booking.receipt_name || booking.name || booking.company_name || 'ご祈祷';
      const fileName = `清瀧神社_領収証_${recipientName}.pdf`;
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
          領収証 印刷プレビュー（A5横サイズ）
        </h4>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handlePrint} 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Printer size={14} />
            印刷する (A5横)
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
            {isGeneratingPdf ? 'PDF生成中...' : 'A5 PDF保存'}
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
      <div className="receipt-print-wrapper" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 0' }}>
        <div 
          ref={printRef}
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
                <span style={{ fontSize: '0.85rem' }}>日付： {getTodayString()}</span>
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
      </div>
    </div>,
    document.body
  );
};
export default ReceiptPrint;
