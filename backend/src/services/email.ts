import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const smtpFrom = process.env.SMTP_FROM || 'no-reply@example.com';
const adminEmail = process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '';

// Check if SMTP environment variables are properly configured
const isSmtpConfigured = () => {
  return (
    smtpHost &&
    smtpHost !== 'smtp.example.com' &&
    smtpUser &&
    smtpUser !== 'your-email@example.com' &&
    smtpPass &&
    smtpPass !== 'your-email-password'
  );
};

/**
 * Sends an email. If SMTP credentials are not configured,
 * it will fallback to printing the email contents to the console log.
 */
export async function sendMail(to: string, subject: string, text: string, html?: string, attachments?: { filename: string; content: string }[]) {
  const resendApiKey = process.env.RESEND_API_KEY;

  // 1. Primary: SMTP (Shrine mail server) if configured
  if (isSmtpConfigured()) {
    try {
      console.log(`[Email Service] Attempting to send mail via SMTP (Shrine mail server) to ${to}...`);
      let activePort = smtpPort;
      let isSecure = smtpPort === 465;
      
      // Auto-fallback: Gmail on 465 is often blocked. Force 587 with STARTTLS.
      if (smtpHost.includes('smtp.gmail.com') && smtpPort === 465) {
        console.log('[Email Service] Auto-redirecting Gmail connection from 465 to 587.');
        activePort = 587;
        isSecure = false;
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: activePort,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        family: 4, // Force IPv4 to bypass Render container IPv6 network unreachable error
        connectionTimeout: 10000,
        greetingTimeout: 10000
      } as any);

      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        text,
        html,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64') // Nodemailer requires Buffer or string
        }))
      });

      console.log(`[Email Sent via SMTP] Message ID: ${info.messageId} to ${to}`);
      return true;
    } catch (error) {
      console.error('[Email Error] Failed to send email via SMTP, will fallback if Resend configured:', error);
    }
  }

  // 2. Secondary/Fallback: Resend API if API key is provided
  if (resendApiKey) {
    try {
      console.log(`[Email Service] Attempting to send mail via Resend API fallback to ${to}...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: (smtpFrom && !smtpFrom.includes('example.com')) 
            ? smtpFrom 
            : '清瀧神社ご祈祷予約 <onboarding@resend.dev>',
          to,
          subject,
          text,
          html,
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
      } else {
        const errText = await response.text();
        console.error('[Email Error] Resend API fallback responded with error:', errText);
      }
    } catch (err) {
      console.error('[Email Error] Failed to send email via Resend API fallback:', err);
    }
  }

  // 3. Last Fallback: Mock Outbox in developer environment
  console.log('\n=================== [MOCK EMAIL OUTBOX] ===================');
  console.log(`To:      ${to}`);
  console.log(`From:    ${smtpFrom}`);
  console.log(`Subject: ${subject}`);
  console.log('-----------------------------------------------------------');
  console.log(text);
  if (attachments && attachments.length > 0) {
    console.log(`Attachments: ${attachments.map(a => a.filename).join(', ')}`);
  }
  console.log('===========================================================\n');
  return true;
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
    if (booking.child_name) {
      text += `・お祝いのお子様: ${booking.child_name} 様 (${booking.child_kana})
・お子様生年月日: ${booking.child_birthday}
・ご両親氏名: ${[
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
・領収証の発行希望: ${booking.wants_receipt ? `希望する (宛名: ${booking.receipt_name} / 金額: ${booking.receipt_amount?.toLocaleString()}円)` : '希望しない'}
`;
    // Detailed options for organization
    if (booking.tournament_name) {
      text += `・大会名称: ${booking.tournament_name}\n・大会日程: ${booking.tournament_schedule}\n`;
    }
    if (booking.construction_name) {
      text += `・工事名称: ${booking.construction_name}
・設計監理者名: ${booking.construction_designer}
・施工者名: ${booking.construction_builder}
・工期: ${booking.construction_period}
`;
    }
  }

  text += `\n神社管理画面より詳細の確認、および読み札の印刷準備をお願いいたします。`;

  const to = adminEmail || smtpUser || (smtpFrom && !smtpFrom.includes('example.com') ? smtpFrom : '') || 'seiryuujinja@gmail.com';
  if (to) {
    await sendMail(to, subject, text);
  }
}
