import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { Booking } from '../../types';

interface BookingSuccessProps {
  bookings: Booking[];
  onReset: () => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({ bookings, onReset }) => {
  const [copied, setCopied] = useState(false);

  if (!bookings || bookings.length === 0) return null;
  const firstBooking = bookings[0];
  const isIndiv = firstBooking.booking_type === 'individual';

  const handleCopyReceipt = () => {
    if (!firstBooking.receipt_number) return;
    navigator.clipboard.writeText(firstBooking.receipt_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      {/* Receipt Number Badge */}
      {firstBooking.receipt_number && (
        <div style={{
          backgroundColor: '#fffdf7',
          border: '2px solid var(--color-gold)',
          borderRadius: '4px',
          padding: '1.1rem 1.25rem',
          maxWidth: '520px',
          margin: '0 auto 1.5rem auto',
          textAlign: 'center',
          boxShadow: '0 3px 8px rgba(197, 160, 89, 0.15)'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-urushi)', fontWeight: 600, marginBottom: '0.4rem' }}>
            ご予約受付番号（お控え）
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '1.45rem',
              fontWeight: 'bold',
              letterSpacing: '0.08em',
              color: 'var(--color-urushi)',
              backgroundColor: '#ffffff',
              padding: '0.2rem 0.75rem',
              borderRadius: '3px',
              border: '1px dashed var(--color-gold)'
            }}>
              {firstBooking.receipt_number}
            </span>
            <button
              type="button"
              onClick={handleCopyReceipt}
              className="btn btn-secondary"
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: copied ? '#f6ffed' : '#ffffff',
                borderColor: copied ? '#52c41a' : 'var(--color-gold)',
                color: copied ? '#52c41a' : 'var(--color-urushi)'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'コピーしました' : '番号をコピー'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-gray)', margin: '0.5rem 0 0 0' }}>
            ※当日の社務所受付や、オンラインでのご予約照会・変更・キャンセルの際に必要となります。
          </p>
        </div>
      )}

      {/* Confirmation Card UI */}
      <div style={{
        backgroundColor: 'var(--color-washi-dark)',
        border: '2px solid var(--color-gold)',
        borderRadius: '2px',
        padding: '1.5rem',
        maxWidth: '520px',
        margin: '0 auto 1.5rem auto',
        textAlign: 'left',
        boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
        position: 'relative'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <th style={{ padding: '0.5rem 0', textAlign: 'left', color: 'var(--color-accent-gray)', fontWeight: 500, width: '35%' }}>受付番号</th>
              <td style={{ padding: '0.5rem 0', fontWeight: 'bold', fontFamily: 'monospace' }}>{firstBooking.receipt_number || '発番中'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <th style={{ padding: '0.5rem 0', textAlign: 'left', color: 'var(--color-accent-gray)', fontWeight: 500 }}>予約日時</th>
              <td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>{firstBooking.booking_date}　{firstBooking.booking_time}の回</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <th style={{ padding: '0.5rem 0', textAlign: 'left', color: 'var(--color-accent-gray)', fontWeight: 500 }}>ご祈祷の種類</th>
              <td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>{isIndiv ? '個人のご祈祷' : '団体（企業）のご祈祷'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <th style={{ padding: '0.5rem 0', textAlign: 'left', color: 'var(--color-accent-gray)', fontWeight: 500, verticalAlign: 'top' }}>申し込まれた願意</th>
              <td style={{ padding: '0.5rem 0', fontWeight: 'bold', lineHeight: '1.4' }}>
                {bookings.map((b, idx) => (
                  <div key={b.id || idx} style={{ marginBottom: idx < bookings.length - 1 ? '0.35rem' : '0' }}>
                    <strong>{idx + 1}. {b.prayer1}</strong> 
                    {b.name ? `（氏名: ${b.name} 様）` : ''}
                    {b.prayer2 ? ` / ${b.prayer2}` : ''}
                  </div>
                ))}
              </td>
            </tr>
            <tr>
              <th style={{ padding: '0.5rem 0', textAlign: 'left', color: 'var(--color-accent-gray)', fontWeight: 500 }}>お初穂料合計</th>
              <td style={{ padding: '0.5rem 0', fontWeight: 'bold', color: 'var(--color-mizuiro)' }}>
                {bookings.reduce((sum, b) => sum + b.hatsuhoryo, 0).toLocaleString()}円より お気持ち（当日現金納め）
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dedicated Change / Cancellation Guidance Card */}
      <div style={{
        backgroundColor: '#f6ffed',
        border: '1.5px solid #b7eb8f',
        borderRadius: '4px',
        padding: '1.25rem 1.5rem',
        maxWidth: '520px',
        margin: '0 auto 2rem auto',
        textAlign: 'left',
        boxShadow: '0 2px 8px rgba(82, 196, 26, 0.08)'
      }}>
        <h4 style={{
          fontSize: '1rem',
          fontWeight: 'bold',
          color: '#274916',
          marginBottom: '0.6rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <span>📅</span> ご予約の確認・日程変更・キャンセルについて
        </h4>
        <ul style={{
          fontSize: '0.85rem',
          lineHeight: '1.6',
          color: '#274916',
          paddingLeft: '1.2rem',
          margin: '0 0 1rem 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          <li>万一ご都合が悪くなった場合、<strong>ご祈祷開始日時の24時間前（前日同時刻）まで</strong>でしたら、オンラインでいつでも日程変更・キャンセルが可能です。</li>
          <li style={{ color: '#389e0d', fontWeight: 'bold' }}>
            ・キャンセル料等は一切発生いたしませんのでご安心ください。
          </li>
          <li>開始24時間以内の直前の変更・キャンセルにつきましては、清瀧神社社務所（<a href="tel:0473515417" style={{ color: '#274916', fontWeight: 'bold', textDecoration: 'underline' }}>047-351-5417</a>）までお電話にて直接ご連絡をお願いいたします。</li>
        </ul>

        {firstBooking.id && (
          <div style={{ textAlign: 'center' }}>
            <a
              href={`/?changeId=${firstBooking.id}`}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.5rem',
                fontSize: '0.9rem',
                textDecoration: 'none',
                borderRadius: '4px'
              }}
            >
              <span>✏️</span> この予約の変更・キャンセル画面を開く
            </a>
          </div>
        )}
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
            <li>・**境内での記念撮影・カメラマン撮影について**: 撮影でカメラマンの方をお願いされるご家族様には撮影許可証などは設けておりません。他のご参拝の方のご迷惑にならないよう、どうぞお撮り下さいませ。（※なお、神事の厳修のため、社殿・拝殿内へのカメラマンのお立ち入り・ご祈祷中の撮影はご遠慮いただきます）</li>
            <li>・お初穂料はご神前にお供えいたしますので、のし袋か封筒などに入れ、当日受付にて現金でお納めください。</li>
            <li>・ご祈祷の所要時間は、約20〜30分ほどかかります。</li>
            <li>・ご一緒に参拝（昇殿）いただくご家族等の**人数制限は設けておりません**。</li>
            <li style={{ color: '#d3381c', fontWeight: 'bold' }}>
              ・オンラインでの日程変更・キャンセル手続きは【ご祈祷開始時間の24時間前まで】となっております（キャンセル料は一切かかりません）。それ以降の直前の変更・キャンセルにつきましては、恐れ入りますが清瀧神社社務所（<a href="tel:0473515417" style={{ color: '#d3381c', textDecoration: 'underline' }}>047-351-5417</a>）までお電話にて直接ご連絡をお願いいたします。ご理解・ご協力のほどお願い申し上げます。
            </li>
            
            {/* Dynamic context warnings */}
            {bookings.some(b => b.prayer1 === '車祓（お車のお祓い）' || b.prayer2 === '交通安全') && (
              <li style={{ color: 'var(--color-mizuiro-hover)', fontWeight: 600 }}>
                ・【車祓の方】お車は駐車場に停めず、神社正面の鳥居をくぐり、参道に停車していただきますようお願いいたします。
              </li>
            )}
            {bookings.some(b => b.prayer1 === '安産祈願') && (
              <li style={{ color: 'var(--color-accent-green)', fontWeight: 600 }}>
                ・【安産祈願の方】ご祈祷の授与品として腹帯をお渡しする予定でございます。
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
          ご不明な点などがございましたら、清瀧神社TEL <a href="tel:0473515417" style={{ color: 'inherit', fontWeight: 'bold', textDecoration: 'underline' }}>047-351-5417</a> まで気兼ねなくご連絡くださいませ。
        </p>
      </div>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'center' }}>
        <button onClick={onReset} className="btn btn-primary">
          新しい予約を行う
        </button>
      </div>
    </div>
  );
};
export default BookingSuccess;
