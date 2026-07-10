import { getDb } from '../db';
import { sendMail } from './email';
import { Booking } from '../types';

// Process automated day-before reminder email notifications
export async function sendDayBeforeReminders() {
  console.log('[Reminder Service] Scanning database for tomorrow\'s bookings...');
  
  try {
    const db = getDb();
    
    // Calculate tomorrow's JST date string (YYYY-MM-DD)
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    // JST offset adjust
    const local = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60000));
    const tomorrowStr = local.toISOString().split('T')[0];

    // Find all bookings tomorrow that haven't sent reminder yet
    const result = await db.query(
      `SELECT * FROM bookings WHERE booking_date = $1 AND reminder_sent = 0`,
      [tomorrowStr]
    );
    const pendingBookings: Booking[] = result.rows;

    if (pendingBookings.length === 0) {
      console.log(`[Reminder Service] No pending reminders to send for tomorrow (${tomorrowStr}).`);
      return;
    }

    console.log(`[Reminder Service] Found ${pendingBookings.length} pending bookings. Starting mailing...`);

    for (const booking of pendingBookings) {
      const isIndiv = booking.booking_type === 'individual';
      const email = isIndiv ? booking.email : booking.staff_email;

      if (!email) {
        // Skip if no email is registered (e.g. manual telephone booking without email)
        // Mark as sent anyway so we don't scan it forever
        await db.query(`UPDATE bookings SET reminder_sent = 1 WHERE id = $1`, [booking.id]);
        continue;
      }

      const receiptNum = booking.receipt_number;
      const name = isIndiv ? booking.name : booking.company_name;
      const time = booking.booking_time;
      const prayer = booking.prayer1 + (booking.prayer2 ? ` / ${booking.prayer2}` : '');

      const subject = `【清瀧神社】明日ご祈祷予約の事前確認`;
      const text = `${isIndiv ? `${name} 様` : `${name}\n担当 ${booking.staff_dept_title_name} 様`}

清瀧神社でございます。
明日のご祈祷のご予約につきまして、事前に確認のご案内を申し上げます。

道中お気をつけてご来社くださいませ。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ご予約内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
·予約日時　: ${tomorrowStr} ${time}の回
·ご祈祷種類: ${isIndiv ? '個人のご祈祷' : '団体（企業）のご祈祷'}
·願意　　　: ${prayer}
·お初穂料　: ${booking.hatsuhoryo.toLocaleString()}円以上（お気持ち、当日現金納め）
·参列予定者: ${booking.attending_count}名

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 参拝時の注意事項（必ず事前にお読みください）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ご来社時刻と遅刻について
   ご祈祷の準備の関係上、開始時刻の15分前にはご来社いただきますようお願いいたします。
   ※ご祈祷の開始時刻5分前を過ぎると、当日の神事スケジュールの都合上、その時間のご祈祷は受け付けない場合がございます。あらかじめご了承願います。
   到着されましたら、社務所受付にてご予約された方のお名前をお伝えください。

2. カメラマン同行について
   プロ・アマチュア問わず、外部の専属カメラマンの方の神社社殿（拝殿）内へのお立ち入り・同伴撮影はご遠慮いただきます。

3. 初穂料について
   お初穂料はご神前にお供えいたしますので、のし袋か封筒などに入れ、当日受付にて現金でお納めください。

※本メールは、ご予約日の前日にシステムより自動配信されております。
すでに変更・キャンセル等のご連絡をいただいている場合は、何卒ご容赦ください。

清瀧神社
住所: 〒279-0041 千葉県浦安市堀江4-1-5
TEL: 047-351-5417 (受付時間: 9:30〜15:30)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      
      console.log(`[Reminder Service] Sending reminder mail to ${email} (Receipt: ${receiptNum})...`);
      
      try {
        await sendMail(email, subject, text);
        // Mark as sent in DB
        await db.query(`UPDATE bookings SET reminder_sent = 1 WHERE id = $1`, [booking.id]);
        console.log(`[Reminder Service] Successfully sent reminder to ${receiptNum}.`);
      } catch (mailErr) {
        console.error(`[Reminder Service] Failed to send email to ${email} for booking ${receiptNum}:`, mailErr);
      }
    }

  } catch (error: any) {
    console.error('[Reminder Service] Error occurred during reminder check:', error);
    if (error && error.stack) {
      console.error(error.stack);
    }
  }
}

// Start interval checks for reminders
export function startReminderScheduler() {
  // Check immediately upon boot
  sendDayBeforeReminders();

  // Run database checks hourly (3600000 ms)
  setInterval(() => {
    sendDayBeforeReminders();
  }, 3600000);
}
