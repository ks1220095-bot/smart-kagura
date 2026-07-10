import React from 'react';
import { Check, Printer } from 'lucide-react';
import type { Booking } from '../../types';

interface BookingSuccessProps {
  booking: Booking;
  onReset: () => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({ booking, onReset }) => {
  const isIndiv = booking.booking_type === 'individual';
  const receiptNum = booking.receipt_number || '';

  return (
    <div className="card kamidana-border" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
      <div style={{
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-accent-green)',
        color: 'white',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        boxShadow: '0 2px 8px rgba(62, 122, 92, 0.2)'
      }}>
        <Check size={32} />
      </div>

      <h2 style={{ fontSize: '1.6rem', color: 'var(--color-accent-green)', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
        ご予約が完了いたしました
      </h2>
      <p style={{ color: 'var(--color-accent-gray)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        ご入力いただいたメールアドレス宛に、予約完了メールを自動送信いたしました。
      </p>

      {/* Screen Save Guideline Warning Banner */}
      <div style={{
        color: '#d3381c',
        backgroundColor: '#fff1f0',
        border: '1px solid #ffa39e',
        borderRadius: '4px',
        padding: '0.75rem 1rem',
        maxWidth: '520px',
        margin: '0 auto 1.5rem auto',
        fontWeight: 'bold',
        fontSize: '0.95rem',
        textAlign: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
      }}>
        ⚠️ この画面をスクリーンショット等で保存していただきますようお願いします。
      </div>

      {/* Confirmation Card UI */}
      <div style={{
        backgroundColor: 'var(--color-washi-dark)',
        border: '2px solid var(--color-gold)',
        borderRadius: '2px',
        padding: '1.5rem',
        maxWidth: '520px',
        margin: '0 auto 2rem auto',
        textAlign: 'left',
        boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
        position: 'relative'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px dashed var(--color-gold)', 
          paddingBottom: '0.75rem', 
          marginBottom: '1.25rem' 
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)' }}>ご予約受付番号</span>
            <h3 style={{ fontSize: '1.4rem', letterSpacing: '0.05em', color: 'var(--color-mizuiro)', margin: 0 }}>{receiptNum}</h3>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <th style={{ padding: '0.5rem 0', textAlign: 'left', color: 'var(--color-accent-gray)', fontWeight: 500, width: '35%' }}>予約日時</th>
              <td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>{booking.booking_date}　{booking.booking_time}の回</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <th style={{ padding: '0.5rem 0', textAlign: 'left', color: 'var(--color-accent-gray)', fontWeight: 500 }}>ご祈祷の種類</th>
              <td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>{isIndiv ? '個人のご祈祷' : '団体（企業）のご祈祷'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <th style={{ padding: '0.5rem 0', textAlign: 'left', color: 'var(--color-accent-gray)', fontWeight: 500 }}>願意</th>
              <td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>
                {booking.prayer1}
                {booking.prayer2 ? ` / ${booking.prayer2}` : ''}
              </td>
            </tr>
            <tr>
              <th style={{ padding: '0.5rem 0', textAlign: 'left', color: 'var(--color-accent-gray)', fontWeight: 500 }}>お初穂料</th>
              <td style={{ padding: '0.5rem 0', fontWeight: 'bold', color: 'var(--color-mizuiro)' }}>
                {booking.hatsuhoryo.toLocaleString()}円以上（当日お気持ち、現金納め）
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Warnings Board */}
      <div style={{ maxWidth: '680px', margin: '0 auto 2rem auto', textAlign: 'left' }}>
        <div className="alert-warning">
          <h5 style={{ fontSize: '0.95rem', fontWeight: 'bold', borderBottom: '1px solid rgba(50, 136, 163, 0.3)', paddingBottom: '0.25rem', marginBottom: '0.5rem', color: 'var(--color-mizuiro-hover)' }}>
            参拝当日のご案内とお願い
          </h5>
          <ul style={{ listStyleType: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li>・ご祈祷の準備の関係上、**開始時刻の15分前**にはご来社いただきますようお願いいたします。到着されましたら社務所窓口にて受付番号をお知らせください。</li>
            <li style={{ color: '#d3381c', fontWeight: 'bold' }}>・ご祈祷の開始時刻5分前を過ぎるとその時間のご祈祷は受け付けない場合がございます、ご了承願います。</li>
            <li style={{ color: '#d3381c', fontWeight: 'bold' }}>・カメラマンの方は、神社社殿へのお立ち入りはご遠慮いただきます。</li>
            <li>・お初穂料はご神前にお供えいたしますので、のし袋か封筒などに入れ、当日受付にて現金でお納めください。</li>
            <li>・ご祈祷の所要時間は、約20〜30分ほどかかります。</li>
            <li>・ご一緒に参拝（昇殿）いただくご家族等の**人数制限は設けておりません**。</li>
            
            {/* Dynamic context warnings */}
            {(booking.prayer1 === '車祓（お車のお祓い）' || booking.prayer2 === '交通安全') && (
              <li style={{ color: 'var(--color-mizuiro-hover)', fontWeight: 600 }}>
                ・【車祓の方】お車は駐車場に停めず、神社正面の鳥居をくぐり、参道に停車していただきますようお願いいたします。
              </li>
            )}
            {booking.prayer1 === '安産祈願' && (
              <li style={{ color: 'var(--color-accent-green)', fontWeight: 600 }}>
                ・【安産祈願の方】すでにお持ちの腹帯（妊婦帯）をご持参いただけますと、ご神前にてお祓いいたします。当日受付時にお渡しください。
              </li>
            )}
            {!isIndiv && (
              <li style={{ color: 'var(--color-accent-orange)', fontWeight: 600 }}>
                ・【団体参拝の方】予約完了後、お申込内容を確認の上、担当より折り返しのご確認（お電話またはメール）をさせていただきます。
              </li>
            )}
          </ul>
        </div>
        
        <p style={{ fontSize: '0.8rem', color: 'var(--color-accent-gray)', textAlign: 'center', marginTop: '1rem' }}>
          ご不明な点などがございましたら、清瀧神社TEL 047-351-5417 まで気兼ねなくご連絡くださいませ。
        </p>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button onClick={() => window.print()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={16} />
          予約票を印刷する
        </button>
        <button onClick={onReset} className="btn btn-primary">
          新しい予約を行う
        </button>
      </div>
    </div>
  );
};
export default BookingSuccess;
