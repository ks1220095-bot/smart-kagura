import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Printer, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { printElement } from '../../utils/printUtils';
import { getBookingReceipts, type Booking } from '../../types';

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
    honorific: '御中' | '様' | '';
    amount: number;
    booking: Booking;
    splitIndex?: number;
  }

  const buildInitialReceiptItems = (): ReceiptItem[] => {
    const items: ReceiptItem[] = [];
    targetBookings.forEach((b, bIdx) => {
      const dateStr = getReceiptDateString(b);
      const defaultHonorific: '御中' | '様' = b.booking_type === 'individual' ? '様' : '御中';
      const bReceipts = getBookingReceipts(b);
      if (bReceipts.length > 0) {
        bReceipts.forEach((r, rIdx) => {
          items.push({
            id: `${b.id || bIdx}-${rIdx + 1}`,
            receiptDate: dateStr,
            address: r.name || b.company_name || b.name || '',
            honorific: defaultHonorific,
            amount: Number(r.amount) || 0,
            booking: b,
            splitIndex: bReceipts.length > 1 ? rIdx + 1 : undefined
          });
        });
      } else {
        items.push({
          id: `${b.id || bIdx}-1`,
          receiptDate: dateStr,
          address: b.receipt_name || b.company_name || b.name || '',
          honorific: defaultHonorific,
          amount: b.receipt_amount || b.hatsuhoryo || 0,
          booking: b
        });
      }
    });
    return items;
  };

  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>(buildInitialReceiptItems);

  const handleUpdateItem = (index: number, field: keyof ReceiptItem, value: any) => {
    setReceiptItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddSplitSheet = () => {
    const base = receiptItems[0];
    if (!base) return;
    setReceiptItems(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}-${prev.length + 1}`,
        receiptDate: base.receiptDate,
        address: base.address,
        honorific: base.honorific,
        amount: 0,
        booking: base.booking,
        splitIndex: prev.length + 1
      }
    ]);
  };

  const handleRemoveSplitSheet = (index: number) => {
    setReceiptItems(prev => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

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
        flexDirection: 'column',
        gap: '0.6rem',
        color: 'white',
        borderBottom: '2px solid var(--color-gold)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, color: 'white', fontFamily: 'var(--font-serif)' }}>
              {receiptItems.length > 1
                ? `領収証 印刷プレビュー（全 ${receiptItems.length} 枚・中央揃え）`
                : '領収証 印刷プレビュー（A5横・中央揃え）'}
            </h4>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#fffae6' }}>
              ※ 印刷時は詳細設定で 用紙サイズ:「A5」、両面印刷:「オフ（片面）」をご指定ください
            </span>
          </div>
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

        {/* 宛名・敬称・金額 クイック調整バー（プレビュー上での即時編集・分割対応） */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(197, 160, 89, 0.4)',
          borderRadius: '6px',
          padding: '0.5rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#fffae6', fontWeight: 'bold' }}>
              ✏️ 印字内容の微調整（宛名・敬称「様／御中」・金額をこの場で直接変更できます）
            </span>
            <button
              type="button"
              onClick={handleAddSplitSheet}
              style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                border: '1px solid var(--color-gold)',
                backgroundColor: 'rgba(197, 160, 89, 0.2)',
                color: '#fffae6',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ＋ 領収証をもう1枚追加（分割）
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '140px', overflowY: 'auto' }}>
            {receiptItems.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '4px'
                }}
              >
                <span style={{ fontSize: '0.72rem', color: '#fffae6', minWidth: '48px', fontWeight: 'bold' }}>
                  {receiptItems.length > 1 ? `${idx + 1}枚目:` : '印字:'}
                </span>
                <label style={{ fontSize: '0.72rem', color: '#ddd', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0, flex: '2 1 200px' }}>
                  <span>宛名:</span>
                  <input
                    type="text"
                    value={item.address}
                    onChange={(e) => handleUpdateItem(idx, 'address', e.target.value)}
                    placeholder="宛名を入力"
                    style={{
                      flex: 1,
                      padding: '0.2rem 0.45rem',
                      fontSize: '0.8rem',
                      borderRadius: '3px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: '#fff',
                      color: '#111'
                    }}
                  />
                </label>
                <label style={{ fontSize: '0.72rem', color: '#ddd', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}>
                  <span>敬称:</span>
                  <select
                    value={item.honorific}
                    onChange={(e) => handleUpdateItem(idx, 'honorific', e.target.value as '御中' | '様' | '')}
                    style={{
                      padding: '0.2rem 0.4rem',
                      fontSize: '0.8rem',
                      borderRadius: '3px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: '#fff',
                      color: '#111',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="様">様（個人・氏名）</option>
                    <option value="御中">御中（団体・企業）</option>
                    <option value="">なし（宛名に含める）</option>
                  </select>
                </label>
                <label style={{ fontSize: '0.72rem', color: '#ddd', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}>
                  <span>金額(円):</span>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleUpdateItem(idx, 'amount', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    style={{
                      width: '105px',
                      padding: '0.2rem 0.45rem',
                      fontSize: '0.8rem',
                      borderRadius: '3px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: '#fff',
                      color: '#111',
                      textAlign: 'right',
                      fontWeight: 'bold'
                    }}
                  />
                </label>
                {receiptItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSplitSheet(idx)}
                    style={{
                      background: 'none',
                      border: '1px solid #ff7875',
                      color: '#ffccc7',
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media screen {
          .receipt-sheet {
            box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          }
        }
      `}</style>

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
          const address = item.address.trim();
          const alreadyHasHonorific = address.endsWith('様') || address.endsWith('御中');
          const displayHonorific = !alreadyHasHonorific && item.honorific ? `　${item.honorific}` : '';

          return (
            <div 
              key={item.id}
              className="receipt-sheet print-receipt-page" 
              style={{
                backgroundColor: '#ffffff',
                width: '210mm',
                height: '147mm',
                maxWidth: '210mm',
                maxHeight: '147mm',
                boxSizing: 'border-box',
                fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
                color: '#1a1a1a',
                margin: '0 auto',
                padding: '8mm 9mm'
              }}
            >
              {/* Outer Border (子持二重枠 - 外枠) */}
              <div style={{
                width: '100%',
                height: '100%',
                border: '1px solid #222222',
                padding: '2.5mm',
                boxSizing: 'border-box'
              }}>
                {/* Inner Border & Content Container (子持二重枠 - 内枠) */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  border: '1.5px solid #222222',
                  padding: '5mm 8mm',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  {/* Header Title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div style={{ fontSize: '0.82rem', letterSpacing: '0.05em', color: '#333' }}>
                      No. ＿＿＿＿＿＿
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '-0.15rem' }}>
                      <h2 style={{ 
                        fontSize: '1.95rem', 
                        margin: 0, 
                        letterSpacing: '0.7em', 
                        fontWeight: 'bold',
                        fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
                        color: '#111'
                      }}>
                        領　収　証
                      </h2>
                      {/* 潰れない二重下線 (上線1px + 隙間3px + 下線1px) */}
                      <div style={{ 
                        width: '140px', 
                        margin: '0.2rem auto 0', 
                        borderTop: '1px solid #333', 
                        borderBottom: '1px solid #333', 
                        height: '3px',
                        boxSizing: 'border-box'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.85rem', letterSpacing: '0.05em', color: '#333' }}>
                      日付： {item.receiptDate}
                    </div>
                  </div>

                  {/* Middle Main Block (Centered Vertically & Horizontally) */}
                  <div style={{
                    margin: 'auto 0',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}>
                    {/* Address Line (Centered) */}
                    <div style={{ 
                      width: '75%', 
                      borderBottom: '1px solid #333', 
                      paddingBottom: '0.25rem',
                      textAlign: 'center',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <h3 style={{ 
                        fontSize: '1.35rem', 
                        fontWeight: 'bold', 
                        margin: 0,
                        letterSpacing: '0.08em',
                        fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
                        textAlign: 'center'
                      }}>
                        {address}{displayHonorific}
                      </h3>
                    </div>

                    {/* Grand Amount Board (洗練された飾り二重線枠) */}
                    <div style={{ 
                      textAlign: 'center',
                      border: '3px double #333333',
                      padding: '0.35rem 1.5rem',
                      backgroundColor: '#ffffff',
                      fontSize: '1.85rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.08em',
                      fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
                      width: '78%'
                    }}>
                      金　￥ {amount.toLocaleString()} ─
                    </div>

                    {/* Description / Particulars (Centered) */}
                    <div style={{ 
                      fontSize: '0.95rem', 
                      letterSpacing: '0.06em',
                      fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif',
                      textAlign: 'center',
                      width: '100%'
                    }}>
                      但　<strong>ご祈祷料</strong>として、上記正に領収いたしました。
                    </div>
                  </div>

                  {/* Footer details & Hanko Seal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
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
