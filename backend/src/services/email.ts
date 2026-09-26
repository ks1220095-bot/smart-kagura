import dotenv from 'dotenv';
import { getBookingReceipts, getBookingChildren, getBookingWoodTalismans } from '../types';

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY || '';
const resendFromRaw = process.env.RESEND_FROM || process.env.SMTP_FROM || '';
// Intelligent fallback: if sender address domain is not verified, use onboarding domain
const resendFrom = resendFromRaw.includes('seiryuujinja.com')
  ? resendFromRaw
  : '清瀧神社ご祈祷予約 <onboarding@resend.dev>';
const adminEmail = process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '';

/**
 * Sends an email via Resend API.
 * If Resend API Key is not configured, it will fallback to Mock Outbox (console output).
 */
export async function sendMail(
  to: string, 
  subject: string, 
  text: string, 
  html?: string, 
  attachments?: { filename: string; content: string }[],
  throwOnError: boolean = false
) {
  if (resendApiKey) {
    try {
      let attempts = 0;
      const maxAttempts = 3;
      let response: any = null;

      while (attempts < maxAttempts) {
        attempts++;
        console.log(`[Email Service] Sending mail via Resend API to ${to} (Attempt ${attempts}/${maxAttempts})...`);
        
        response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: resendFrom,
            to,
            subject,
            text,
            html,
            reply_to: resendFrom.includes('onboarding@resend.dev') ? undefined : resendFrom,
            attachments: attachments?.map(att => ({
              filename: att.filename,
              content: att.content // Base64 content
            }))
          })
        });

        if (response.ok) {
          const data: any = await response.json();
          console.log(`[Email Sent via Resend] ID: ${data.id} to ${to}`);
          return true;
        }

        const isRateLimit = response.status === 429;
        const errText = await response.text();
        console.warn(`[Email Warning] Resend attempt ${attempts} failed with status ${response.status}:`, errText);

        if (isRateLimit && attempts < maxAttempts) {
          console.log(`[Email Service] Rate limit hit. Waiting 1.5 seconds before retrying (Attempt ${attempts + 1}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
          console.error('[Email Error] Resend API responded with error:', errText);
          if (throwOnError) {
            throw new Error(`Resend APIエラー: ${errText}`);
          }
          break; // Stop attempting for non-429 or final attempt
        }
      }
    } catch (err: any) {
      console.error('[Email Error] Failed to send email via Resend API:', err);
      if (throwOnError) {
        throw new Error(`Resend送信失敗: ${err.message || err}`);
      }
    }
  }

  // Last Fallback: Mock Outbox in developer environment
  console.log('\n=================== [MOCK EMAIL OUTBOX] ===================');
  console.log(`To:      ${to}`);
  console.log(`From:    ${resendFrom}`);
  console.log(`Subject: ${subject}`);
  console.log('-----------------------------------------------------------');
  console.log(text);
  if (attachments && attachments.length > 0) {
    console.log(`Attachments: ${attachments.map(a => a.filename).join(', ')}`);
  }
  console.log('===========================================================\n');
  return false;
}

/**
 * Sends a notification email to the shrine administrator.
 */
export async function sendAdminNotification(booking: any) {
  const isIndiv = booking.booking_type === 'individual';
  const subject = `【清瀧神社】新規ご祈祷予約通知 (${isIndiv ? '個人' : '団体'}) - ${booking.booking_date}`;
  
  let text = `清瀧神社 御中

オンライン祈祷予約システムより、以下の通り新規の予約を受け付けました。

■ 予約内容
・予約日時: ${booking.booking_date} ${booking.booking_time}の回
・ご祈祷種類: ${isIndiv ? '個人のご祈祷' : '団体（企業）のご祈祷'}
・主願意: ${booking.prayer1}
${booking.prayer2 ? `・副願意: ${booking.prayer2}\n` : ''}・初穂料（基準値）: ${booking.hatsuhoryo.toLocaleString()}円 (当日現金納め)
・参列予定人数: ${booking.attending_count}名

■ 申込者情報
`;

  if (isIndiv) {
    text += `・お名前: ${booking.name} 様 (${booking.kana})
・ご住所: ${booking.address} (${booking.address_kana})
・電話番号: ${booking.phone}
・メールアドレス: ${booking.email}
`;
    // Detailed options for individual
    if (booking.yakudoshi_type) {
      const yakudoshiMap: any = { maeyaku: '前厄', honyaku: '本厄', atoyaku: '後厄' };
      text += `・厄年区分: ${yakudoshiMap[booking.yakudoshi_type] || booking.yakudoshi_type}\n`;
    }
    const bChildren = getBookingChildren(booking);
    if (bChildren.length > 0) {
      if (bChildren.length === 1) {
        text += `・お祝いのお子様: ${bChildren[0].name} 様 (${bChildren[0].kana})${bChildren[0].gender ? ` [${bChildren[0].gender}]` : ''}\n`;
        text += `・お子様生年月日: ${bChildren[0].birthday}${bChildren[0].age_text ? ` (${bChildren[0].age_text})` : ''}\n`;
      } else {
        text += `・お祝いのお子様（全${bChildren.length}名）:\n`;
        bChildren.forEach((child, cIdx) => {
          text += `　- ${cIdx + 1}人目: ${child.name} 様 (${child.kana})${child.gender ? ` [${child.gender}]` : ''} 生年月日: ${child.birthday}${child.age_text ? ` (${child.age_text})` : ''}\n`;
        });
      }
      text += `・ご両親氏名: ${[
        booking.father_name ? `父: ${booking.father_name}(${booking.father_kana})` : '',
        booking.mother_name ? `母: ${booking.mother_name}(${booking.mother_kana})` : ''
      ].filter(Boolean).join('、')}
`;
    }
    if (booking.kotobuki_type) {
      text += `・寿祝い区分: ${booking.kotobuki_type === 'other' ? `その他 (${booking.kotobuki_other_text})` : booking.kotobuki_type}\n`;
    }
  } else {
    text += `・団体（企業）名: ${booking.company_name} (${booking.company_kana})
・所在地: ${booking.company_address} (${booking.company_address_kana})
・代表者役職氏名: ${booking.representative_title_name}
・申込担当者部署役職氏名: ${booking.staff_dept_title_name}
・担当者電話番号: ${booking.staff_phone}
・担当者メールアドレス: ${booking.staff_email}
・お札に書かれるお名前: ${booking.talisman_name || '（未入力）'}
・追加希望の守札: ${booking.additional_talismans || '（なし）'}
${(booking.wood_talisman_count || booking.wood_talisman_large_count) ? (() => {
  let text = `・追加の木の御札: ${[
    booking.wood_talisman_count ? `祈願符(約36cm) ${booking.wood_talisman_count}体` : '',
    booking.wood_talisman_large_count ? `祈願符・大(約45cm) ${booking.wood_talisman_large_count}体` : ''
  ].filter(Boolean).join('、')}\n`;
  const woodTalismans = getBookingWoodTalismans(booking);
  if (woodTalismans.standard.length > 0) {
    text += `　- 祈願符（約36cm）:\n` + woodTalismans.standard.map((item, i) => {
      const p1 = item.prayer1 === 'その他（自由入力）' ? (item.custom_prayer1 || 'その他') : (item.prayer1 || '社運隆昌');
      const p2 = item.prayer2 === 'その他（自由入力）' ? (item.custom_prayer2 || 'その他') : (item.prayer2 || '');
      const prayerText = p2 ? ` [主願意: ${p1} / 副願意: ${p2}]` : ` [主願意: ${p1}]`;
      return `　  ${i + 1}体目: ${item.name || '（未入力・会社名代表者名適用）'}${prayerText}`;
    }).join('\n') + '\n';
  }
  if (woodTalismans.large.length > 0) {
    text += `　- 祈願符・大（約45cm）:\n` + woodTalismans.large.map((item, i) => {
      const p1 = item.prayer1 === 'その他（自由入力）' ? (item.custom_prayer1 || 'その他') : (item.prayer1 || '社運隆昌');
      const p2 = item.prayer2 === 'その他（自由入力）' ? (item.custom_prayer2 || 'その他') : (item.prayer2 || '');
      const prayerText = p2 ? ` [主願意: ${p1} / 副願意: ${p2}]` : ` [主願意: ${p1}]`;
      return `　  ${i + 1}体目: ${item.name || '（未入力・会社名代表者名適用）'}${prayerText}`;
    }).join('\n') + '\n';
  }
  return text;
})() : ''}・領収証の発行希望: ${(() => {
  if (!booking.wants_receipt) return '希望しない';
  const receipts = getBookingReceipts(booking);
  if (receipts.length > 1) {
    return `${receipts.length}社名義で希望 (全${receipts.length}枚)\n` +
      receipts.map((r, idx) => `　- ${idx + 1}社目: ${r.name} ￥${Number(r.amount).toLocaleString()}円`).join('\n') +
      `\n　(領収証合計: ￥${receipts.reduce((acc, r) => acc + Number(r.amount), 0).toLocaleString()}円)`;
  } else if (receipts.length === 1) {
    return `希望する (宛名: ${receipts[0].name} / 金額: ${Number(receipts[0].amount).toLocaleString()}円)`;
  }
  return '希望する';
})()}
`;
    // Detailed options for organization
    if (booking.tournament_name) {
      text += `・大会名称: ${booking.tournament_name}\n・大会日程: ${booking.tournament_schedule}\n`;
    }
    if (booking.construction_name) {
      text += `· 工事名称: ${booking.construction_name}
・設計監理者名: ${booking.construction_designer}
・施工者名: ${booking.construction_builder}
・工期: ${booking.construction_period}
`;
    }
  }

  text += `\n神社管理画面より詳細の確認、および読み札の印刷準備をお願いいたします。`;

  const to = adminEmail || 'seiryuujinja@gmail.com';
  if (to) {
    await sendMail(to, subject, text);
  }
}
