import { Router } from 'express';
import { getDb } from '../db';
import { Booking } from '../types';
import { sendMail, sendAdminNotification } from '../services/email';

const router = Router();

// Generate unique receipt numbers
function generateReceiptNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `SRY-${dateStr}-${rand}`;
}

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

// Helper: Generate CSV backup and mail to admin
async function triggerCSVBackup(db: any) {
  try {
    if (process.env.SPREADSHEET_API_URL) {
      console.log('[Backup Service] Spreadsheet integration active. Skipping CSV backup email transmission.');
      return;
    }
    const result = await db.query(`SELECT * FROM bookings ORDER BY created_at DESC`);
    if (result.rows.length === 0) return;

    // Build CSV Content
    const cols = Object.keys(result.rows[0]);
    const headerRow = cols.join(',');
    const dataRows = result.rows.map((row: any) => {
      return cols.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        // Escape quotes
        const clean = String(val).replace(/"/g, '""');
        return `"${clean}"`;
      }).join(',');
    });
    
    const csvString = '\uFEFF' + [headerRow, ...dataRows].join('\n'); // Add UTF-8 BOM for Excel compatibility
    const base64Content = Buffer.from(csvString).toString('base64');
    
    const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }).replace(/[\/\s:]/g, '-');
    const filename = `bookings_ledger_backup_${timestamp}.csv`;
    
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'seiryuujinja@gmail.com';
    
    console.log(`[Backup Service] Sending transaction CSV backup to ${adminEmail}...`);
    await sendMail(
      adminEmail,
      `【自動バックアップ】清瀧神社ご祈祷予約台帳 (${timestamp})`,
      `清瀧神社 御中\n\nオンライン予約受付の更新がありましたので、最新の台帳データ（CSVファイル）を送信します。このメールはデータベースの自動バックアップです。`,
      undefined,
      [{ filename, content: base64Content }]
    );
  } catch (err) {
    console.error('[Backup Error] Failed to generate or send ledger backup:', err);
  }
}

// 1. Get slot availability for a specific date
router.get('/slots-availability', async (req, res) => {
  const { date } = req.query;
  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: '日付パラメータが必要です。' });
  }

  try {
    const db = getDb();
    
    // Get max group capacity setting
    const limitSetting = await db.query(`SELECT value FROM settings WHERE key = $1`, ['max_groups_per_slot']);
    const maxCapacity = parseInt(limitSetting.rows[0]?.value || '8');

    // Get current booking counts and type details per slot (to handle organization cap limits)
    const bookedCounts = await db.query(
      `SELECT booking_time, COUNT(*) as count, 
              SUM(CASE WHEN booking_type = 'organization' THEN 1 ELSE 0 END) as org_count 
       FROM bookings 
       WHERE booking_date = $1 
       GROUP BY booking_time`,
      [date]
    );

    // Get closed slots by shrine events
    const closedEvents = await db.query(
      `SELECT start_time, end_time FROM events WHERE event_date = $1 AND is_closed_slot = 1`,
      [date]
    );

    const bookingMap = new Map<string, { count: number; orgCount: number }>();
    bookedCounts.rows.forEach((b: any) => {
      bookingMap.set(b.booking_time, { 
        count: parseInt(b.count), 
        orgCount: parseInt(b.org_count || '0') 
      });
    });

    const result = TIME_SLOTS.map(slot => {
      // Check if slot falls inside any closed event period
      const isClosed = closedEvents.rows.some((event: any) => {
        return slot >= event.start_time && slot < event.end_time;
      });

      if (isClosed) {
        return { 
          time: slot, 
          count: maxCapacity, 
          capacity: maxCapacity, 
          status: 'X', 
          label: '満席（受付終了）',
          has_organization: false,
          total_bookings: maxCapacity
        };
      }

      const slotData = bookingMap.get(slot) || { count: 0, orgCount: 0 };
      const count = slotData.count;
      const hasOrg = slotData.orgCount > 0;

      // Rule: If organization booking exists, the slot is instantly closed (remaining = 0)
      const remaining = hasOrg ? 0 : Math.max(0, maxCapacity - count);
      let status = 'O';
      let label = `空きあり（残り ${remaining}組）`;

      if (remaining === 0) {
        status = 'X';
        label = '満席（受付終了）';
      } else if (remaining <= 3) {
        status = '▲';
        label = `残りわずか（残り ${remaining}組）`;
      }

      return {
        time: slot,
        count,
        capacity: maxCapacity,
        status,
        label,
        has_organization: hasOrg,
        total_bookings: count
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Availability fetch error:', error);
    res.status(500).json({ error: '空き状況の取得に失敗しました。' });
  }
});

// 2. Create a new booking (Supports single object or Array for multiple prayers cart)
router.post('/', async (req, res) => {
  const payload = req.body;
  const bookings: Booking[] = Array.isArray(payload) ? payload : [payload];
  
  if (bookings.length === 0) {
    return res.status(400).json({ error: '予約データが空です。' });
  }

  const first = bookings[0];
  if (!first.booking_date || !first.booking_time || !first.booking_type) {
    return res.status(400).json({ error: '必須項目（日付、時間、祈祷区分）が不足しています。' });
  }

  try {
    const db = getDb();

    // Check dynamic booking period range limits
    const periodSetting = await db.query(`SELECT value FROM settings WHERE key = $1`, ['booking_period_months']);
    const periodMonths = parseInt(periodSetting.rows[0]?.value || '2');
    
    const today = new Date();
    // Maximum allowed booking date (today + months limit + 1 day buffer)
    const maxDate = new Date(today.getFullYear(), today.getMonth() + periodMonths, today.getDate() + 1);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    if (first.booking_date > maxDateStr) {
      return res.status(400).json({ 
        error: `ご指定の日付（${first.booking_date}）は、オンライン予約の受付期間外です（本日より ${periodMonths}ヶ月先まで受付しております）。` 
      });
    }
    
    // 1. Check max slot capacity
    const limitSetting = await db.query(`SELECT value FROM settings WHERE key = $1`, ['max_groups_per_slot']);
    const maxCapacity = parseInt(limitSetting.rows[0]?.value || '8');

    // 2. Query existing bookings for this time slot
    const bookedCounts = await db.query(
      `SELECT id, booking_type FROM bookings WHERE booking_date = $1 AND booking_time = $2`,
      [first.booking_date, first.booking_time]
    );

    const totalBooked = bookedCounts.rows.length;
    const hasOrg = bookedCounts.rows.some((r: any) => r.booking_type === 'organization');

    // Rule A: If slot already contains an organization booking, it is completely locked.
    if (hasOrg) {
      return res.status(400).json({ error: 'ご指定の時間帯は団体参拝の貸切枠のため、個人・団体問わずこれ以上の予約はできません。' });
    }

    const includesOrg = bookings.some(b => b.booking_type === 'organization');

    if (includesOrg) {
      // Rule B: If trying to book an organization slot:
      // - The slot must be completely empty (totalBooked must be 0)
      if (totalBooked > 0) {
        return res.status(400).json({ error: 'ご指定の時間帯にはすでに他の方のご予約が入っているため、団体参拝の予約はできません。' });
      }
      // - The request must only contain 1 booking (cannot mix organization and individual)
      if (bookings.length > 1) {
        return res.status(400).json({ error: '団体参拝の予約は、他のお願い事と同時に申し込むことはできません（貸切のため1件のみ）。' });
      }
    } else {
      // Rule C: If booking individual slots:
      // Check if total new slots exceed capacity
      if (totalBooked + bookings.length > maxCapacity) {
        const remaining = Math.max(0, maxCapacity - totalBooked);
        return res.status(400).json({ 
          error: `ご指定の時間帯は残り枠数（残り ${remaining}組）を超えているため、${bookings.length}件の同時予約はできません。` 
        });
      }
    }

    // 3. Check if slot is closed by shrine events
    const isClosedEvent = await db.query(
      `SELECT COUNT(*) as count FROM events WHERE event_date = $1 AND is_closed_slot = 1 AND $2 >= start_time AND $3 < end_time`,
      [first.booking_date, first.booking_time, first.booking_time]
    );
    if (isClosedEvent.rows.length > 0 && parseInt(isClosedEvent.rows[0].count || '0') > 0) {
      return res.status(400).json({ error: 'ご指定の時間帯は祭典・行事等により受付停止中です。' });
    }

    // 4. Insert all items inside a transaction
    await db.query('BEGIN');
    const createdBookings: Booking[] = [];
    const baseReceiptNum = generateReceiptNumber();

    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      b.receipt_number = bookings.length > 1 ? `${baseReceiptNum}-${i + 1}` : baseReceiptNum;
      b.payment_status = 'unpaid';

      const result = await db.query(`
        INSERT INTO bookings (
          receipt_number, booking_type, booking_date, booking_time, prayer1, prayer2, hatsuhoryo, payment_status, attending_count,
          name, kana, address, address_kana, phone, email,
          company_name, company_kana, company_address, company_address_kana, representative_title_name,
          staff_dept_title_name, staff_phone, staff_email, talisman_name, additional_talismans,
          wants_receipt, receipt_name, receipt_amount,
          yakudoshi_type, father_name, father_kana, mother_name, mother_kana, child_name, child_kana, child_birthday,
          kotobuki_type, kotobuki_other_text, tournament_name, tournament_schedule,
          construction_name, construction_designer, construction_builder, construction_period, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45)
        RETURNING id
      `, [
        b.receipt_number, b.booking_type, b.booking_date, b.booking_time, b.prayer1, b.prayer2 || null, b.hatsuhoryo, b.payment_status, b.attending_count,
        b.name || null, b.kana || null, b.address || null, b.address_kana || null, b.phone || null, b.email || null,
        b.company_name || null, b.company_kana || null, b.company_address || null, b.company_address_kana || null, b.representative_title_name || null,
        b.staff_dept_title_name || null, b.staff_phone || null, b.staff_email || null, b.talisman_name || null, b.additional_talismans || null,
        b.wants_receipt || 0, b.receipt_name || null, b.receipt_amount || null,
        b.yakudoshi_type || null, b.father_name || null, b.father_kana || null, b.mother_name || null, b.mother_kana || null, b.child_name || null, b.child_kana || null, b.child_birthday || null,
        b.kotobuki_type || null, b.kotobuki_other_text || null, b.tournament_name || null, b.tournament_schedule || null,
        b.construction_name || null, b.construction_designer || null, b.construction_builder || null, b.construction_period || null,
        b.notes || null
      ]);
      b.id = result.rows[0].id;
      createdBookings.push(b);
    }
    await db.query('COMMIT');

    // 5. Build Unified Confirmation Email to Visitor
    const isIndiv = first.booking_type === 'individual';
    const visitorEmail = isIndiv ? first.email : first.staff_email;

    let subject = '';
    let text = '';

    if (visitorEmail) {
      subject = `【清瀧神社】ご祈祷予約完了のお知らせ`;
      text = `${isIndiv ? `${first.name} 様` : `${first.company_name}\n担当 ${first.staff_dept_title_name} 様`}

この度は、清瀧神社オンライン祈祷予約システムをご利用いただき、誠にありがとうございます。
ご祈祷のご予約が完了いたしましたので、詳細をお知らせいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ご予約内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
· 予約日時　: ${first.booking_date} ${first.booking_time}の回
・ご祈祷種類: ${isIndiv ? '個人のご祈祷' : '団体（企業）のご祈祷'}
・お申込件数: ${createdBookings.length}件
`;

      const totalHatsuhoryo = createdBookings.reduce((sum, b) => sum + b.hatsuhoryo, 0);

      createdBookings.forEach((b, idx) => {
        text += `\n[ご祈祷 ${idx + 1}件目]\n`;
        text += `・願意（お願い事）: ${b.prayer1}\n`;
        if (b.prayer2) text += `・副願意　　　　　: ${b.prayer2}\n`;
        
        if (isIndiv) {
          text += `・受ける方のお名前: ${b.name} 様 (${b.kana})\n`;
          if (b.prayer1 === '厄年のお祓い' && b.yakudoshi_type) {
            const yakuLabel = b.yakudoshi_type === 'maeyaku' ? '前厄' : b.yakudoshi_type === 'honyaku' ? '本厄' : '後厄';
            text += `・厄年区分　　　　: ${yakuLabel}\n`;
          }
          if (b.child_name) {
            text += `・お子様のお名前　: ${b.child_name} (${b.child_kana})\n`;
            text += `・お子様の生年月日: ${b.child_birthday}\n`;
            if (b.father_name) text += `・父親の氏名: ${b.father_name} (${b.father_kana})\n`;
            if (b.mother_name) text += `・母親の氏名: ${b.mother_name} (${b.mother_kana})\n`;
          }
          if (b.prayer1 === '寿祝い' && b.kotobuki_type) {
            const kLabel = b.kotobuki_type === 'その他' ? b.kotobuki_other_text : b.kotobuki_type;
            text += `・長寿祝区分　　　: ${kLabel}\n`;
          }
        } else {
          // Org details
          text += `・代表者役職氏名: ${b.representative_title_name}\n`;
          text += `・お札染筆名　　: ${b.talisman_name || b.company_name}\n`;
          if (b.additional_talismans) text += `・追加希望守札: ${b.additional_talismans}\n`;
          if (b.wants_receipt) text += `・領収証希望　: 希望する (宛名: ${b.receipt_name} / 金額: ￥${b.receipt_amount?.toLocaleString()})\n`;
          
          if (b.prayer1 === '必勝祈願' || b.prayer2 === '必勝祈願') {
            text += `・必勝祈願詳細: 大会【${b.tournament_name}】日程【${b.tournament_schedule}】\n`;
          }
          if (b.prayer1 === '工事安全' || b.prayer2 === '工事安全') {
            text += `・工事安全詳細: 工事【${b.construction_name}】設計【${b.construction_designer}】施工【${b.construction_builder}】工期【${b.construction_period}】\n`;
          }
        }
      });

      text += `\n・お初穂料合計: ${totalHatsuhoryo.toLocaleString()}円以上（当日現金納め、お気持ち）
・総参列予定者: ${first.attending_count}名
`;

      if (isIndiv) {
        text += `・ご住所　　　: ${first.address} (${first.address_kana || ''})\n`;
        text += `・電話番号　　: ${first.phone}\n`;
      } else {
        text += `・所在地　　　: ${first.company_address} (${first.company_address_kana || ''})\n`;
        text += `・担当者電話　: ${first.staff_phone}\n`;
      }

      text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 参拝時の注意事項（必ずお読みください）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ご来社時刻と遅刻について
   ご祈祷の準備の関係上、開始時刻の15分前にはご来社いただきますようお願いいたします。
   ※ご祈祷の開始時刻5分前を過ぎるとその時間のご祈祷は受け付けない場合がございます、ご了承願います。
   到着されましたら、社務所受付にてご予約された方のお名前をお伝えください。

2. カメラマン同行について
   プロ・アマチュア問わず、外部のカメラマンの方の神社社殿（拝殿）内へのお立ち入り・同伴撮影はご遠慮いただきます。

3. 所要時間について
   ご祈祷の時間は、おおむね20分ほどかかります。

4. 初穂料について
   お初穂料はご神前にお供えいたしますので、のし袋か封筒などに入れ、当日受付にて現金でお納めください。
`;

      if (bookings.some(b => b.prayer1 === '車祓（お車のお祓い）' || b.prayer2 === '交通安全')) {
        text += `
[車祓を受けられる方へ]
お車のお祓いをお申し込みの方は、お車を一般駐車場に停めず、神社正面の鳥居をくぐり、参道に直接停車していただきますようお願いいたします。
`;
      }
      if (bookings.some(b => b.prayer1 === '安産祈願')) {
        text += `
[安産祈願を受けられる方へ]
すでにお持ちの腹帯（妊婦帯）をご持参いただけますと、ご神前にて一緒にお祓いいたします。当日受付の際、職員にお声がけの上お渡しください。
`;
      }

      if (!isIndiv) {
        text += `
[団体・企業ご参拝の方へ]
ご予約が完了いたしました。お申込内容を確認の上、近日中に準備のご案内や調整のため、担当より改めてお電話またはメールにてご連絡をさせていただきます。
`;
      }

      text += `
ご不明な点などがございましたら、以下までお気軽にご連絡くださいませ。

清瀧神社
住所: 〒279-0041 千葉県浦安市堀江4-1-5
TEL: 047-351-5417 (受付時間: 9:30〜15:30)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ご予約の日程変更・キャンセルについて
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ご都合が悪くなった場合の日程変更やキャンセルは、以下のURLからオンラインで行うことができます。
`;

      createdBookings.forEach((b, idx) => {
        text += `[ご祈祷 ${idx + 1}件目 (${b.prayer1})] 変更・キャンセルリンク:\n`;
        text += `https://seiryu-gokitou.vercel.app/?changeId=${b.id}\n\n`;
      });
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    }

    // 5. Send confirmation and backup emails asynchronously but sequentially with delays
    (async () => {
      try {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        
        // 5-1. Send visitor confirmation
        if (visitorEmail) {
          await sendMail(visitorEmail, subject, text).catch(err => console.error('Error sending visitor mail:', err));
          await sleep(1000); // 1 second delay to respect Resend Rate Limits (2 req/sec)
        }
        
        // 5-2. Send admin notifications sequentially
        for (const b of createdBookings) {
          await sendAdminNotification(b).catch(err => console.error('Error sending admin mail:', err));
          await sleep(1000); // 1 second delay
        }
        
        // 5-3. Save to Google Sheets if SPREADSHEET_API_URL is configured
        const sheetUrl = process.env.SPREADSHEET_API_URL;
        if (sheetUrl) {
          console.log(`[Spreadsheet Service] Uploading ${createdBookings.length} booking(s) to Google Sheets...`);
          try {
            const sheetRes = await fetch(sheetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'addBookings',
                bookings: createdBookings
              })
            });
            if (sheetRes.ok) {
              console.log('[Spreadsheet Service] Google Sheets sync completed successfully.');
            } else {
              const errText = await sheetRes.text();
              console.error('[Spreadsheet Error] Google Sheets API responded with error:', errText);
            }
          } catch (sheetErr) {
            console.error('[Spreadsheet Error] Failed to sync with Google Sheets:', sheetErr);
          }
          await sleep(1000); // 1 second delay buffer
        }

        // 5-4. Trigger CSV backup (automatically skips email transmission if spreadsheet integration is active)
        await triggerCSVBackup(db).catch(err => console.error('Failed to trigger database backup:', err));
      } catch (emailFlowErr) {
        console.error('Error in sequential email delivery flow:', emailFlowErr);
      }
    })();

    res.status(201).json(Array.isArray(payload) ? createdBookings : createdBookings[0]);
  } catch (error: any) {
    const db = getDb();
    await db.query('ROLLBACK').catch(() => {});
    
    console.error('Booking creation error:', error);
    res.status(500).json({ error: '予約の登録に失敗しました。詳細な原因はログを参照してください。' });
  }
});

// 3. Get bookings list (Admin with filters)
router.get('/', async (req, res) => {
  const { date, type, search, status } = req.query;

  try {
    const db = getDb();
    let query = `SELECT * FROM bookings WHERE 1=1`;
    const params: any[] = [];
    let pIdx = 1;

    if (date && typeof date === 'string') {
      query += ` AND booking_date = $${pIdx++}`;
      params.push(date);
    }
    if (type && typeof type === 'string') {
      query += ` AND booking_type = $${pIdx++}`;
      params.push(type);
    }
    if (status && typeof status === 'string') {
      query += ` AND payment_status = $${pIdx++}`;
      params.push(status);
    }
    if (search && typeof search === 'string') {
      query += ` AND (name LIKE $${pIdx} OR company_name LIKE $${pIdx} OR receipt_number LIKE $${pIdx} OR phone LIKE $${pIdx} OR staff_phone LIKE $${pIdx})`;
      pIdx++;
      const searchWild = `%${search}%`;
      params.push(searchWild);
    }

    query += ` ORDER BY booking_date DESC, booking_time ASC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Bookings fetch error:', error);
    res.status(500).json({ error: '予約情報の取得に失敗しました。' });
  }
});

// 4. Export CSV (Admin)
router.get('/export-csv', async (req, res) => {
  const { date, type, search, status } = req.query;

  try {
    const db = getDb();
    let query = `SELECT * FROM bookings WHERE 1=1`;
    const params: any[] = [];
    let pIdx = 1;

    if (date && typeof date === 'string') {
      query += ` AND booking_date = $${pIdx++}`;
      params.push(date);
    }
    if (type && typeof type === 'string') {
      query += ` AND booking_type = $${pIdx++}`;
      params.push(type);
    }
    if (status && typeof status === 'string') {
      query += ` AND payment_status = $${pIdx++}`;
      params.push(status);
    }
    if (search && typeof search === 'string') {
      query += ` AND (name LIKE $${pIdx} OR company_name LIKE $${pIdx} OR receipt_number LIKE $${pIdx})`;
      pIdx++;
      const searchWild = `%${search}%`;
      params.push(searchWild);
    }

    query += ` ORDER BY booking_date DESC, booking_time ASC`;

    const result = await db.query(query, params);
    const bookings = result.rows;

    let csv = '\ufeff受付番号,予約日,予約時間,区分,氏名/企業名,フリガナ,願意1,願意2,初穂料,支払状況,参列人数,電話番号,メール,代表者名,担当者名,領収書希望,領収書宛名,領収書金額,追加守札,備考\n';
    
    bookings.forEach((b: Booking) => {
      const typeStr = b.booking_type === 'individual' ? '個人' : '団体';
      const nameStr = b.booking_type === 'individual' ? b.name : b.company_name;
      const kanaStr = b.booking_type === 'individual' ? b.kana : b.company_kana;
      const phoneStr = b.booking_type === 'individual' ? b.phone : b.staff_phone;
      const emailStr = b.booking_type === 'individual' ? b.email : b.staff_email;
      const statusStr = b.payment_status === 'paid' ? '支払済' : '未払い';
      
      const row = [
        b.receipt_number,
        b.booking_date,
        b.booking_time,
        typeStr,
        `"${(nameStr || '').replace(/"/g, '""')}"`,
        `"${(kanaStr || '').replace(/"/g, '""')}"`,
        b.prayer1,
        b.prayer2 || '',
        b.hatsuhoryo,
        statusStr,
        b.attending_count,
        phoneStr || '',
        emailStr || '',
        `"${(b.representative_title_name || '').replace(/"/g, '""')}"`,
        `"${(b.staff_dept_title_name || '').replace(/"/g, '""')}"`,
        b.wants_receipt ? '要' : '不要',
        `"${(b.receipt_name || '').replace(/"/g, '""')}"`,
        b.receipt_amount || '',
        `"${(b.additional_talismans || '').replace(/"/g, '""')}"`,
        `"${(b.notes || '').replace(/"/g, '""')}"`
      ].join(',');
      csv += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings.csv');
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'CSVエクスポートに失敗しました。' });
  }
});

// 5. Get single booking
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '予約情報が見つかりません。' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Booking detail error:', error);
    res.status(500).json({ error: '予約情報の取得に失敗しました。' });
  }
});

// 6. Update payment status, other status flags and custom hatsuhoryo (Admin)
router.patch('/:id/payment', async (req, res) => {
  const { payment_status, hatsuhoryo, receipt_amount, notes, is_accepted, is_receipt_issued } = req.body;

  try {
    const db = getDb();
    
    // Check if booking exists
    const checkResult = await db.query(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '予約情報が見つかりません。' });
    }

    let query = `UPDATE bookings SET id = id`;
    const params: any[] = [];
    let pIdx = 1;

    if (payment_status !== undefined) {
      if (payment_status !== 'paid' && payment_status !== 'unpaid') {
        return res.status(400).json({ error: '有効な支払状況を指定してください。' });
      }
      query += `, payment_status = $${pIdx++}`;
      params.push(payment_status);
    }
    if (hatsuhoryo !== undefined && typeof hatsuhoryo === 'number') {
      query += `, hatsuhoryo = $${pIdx++}`;
      params.push(hatsuhoryo);
    }
    if (receipt_amount !== undefined && typeof receipt_amount === 'number') {
      query += `, receipt_amount = $${pIdx++}`;
      params.push(receipt_amount);
    }
    if (notes !== undefined && (typeof notes === 'string' || notes === null)) {
      query += `, notes = $${pIdx++}`;
      params.push(notes);
    }
    if (is_accepted !== undefined && is_accepted !== null) {
      query += `, is_accepted = $${pIdx++}`;
      params.push(Number(is_accepted));
    }
    if (is_receipt_issued !== undefined && is_receipt_issued !== null) {
      query += `, is_receipt_issued = $${pIdx++}`;
      params.push(Number(is_receipt_issued));
    }

    query += ` WHERE id = $${pIdx}`;
    params.push(req.params.id);

    await db.query(query, params);
    
    const result = await db.query(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: '情報の更新に失敗しました。' });
  }
});

// 6.5. Update a booking completely (Visitor self-service change)
router.put('/:id', async (req, res) => {
  const booking: Booking = req.body;
  if (!booking.booking_date || !booking.booking_time || !booking.prayer1) {
    return res.status(400).json({ error: '必須項目が不足しています。' });
  }

  try {
    const db = getDb();
    
    // Check if booking exists
    const checkResult = await db.query(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '予約情報が見つかりません。' });
    }

    // Capacity checks (only check if date/time changed)
    const existing = checkResult.rows[0];
    if (existing.booking_date !== booking.booking_date || existing.booking_time !== booking.booking_time) {
      const limitSetting = await db.query(`SELECT value FROM settings WHERE key = $1`, ['max_groups_per_slot']);
      const maxCapacity = parseInt(limitSetting.rows[0]?.value || '8');

      const bookedCount = await db.query(
        `SELECT COUNT(*) as count FROM bookings WHERE booking_date = $1 AND booking_time = $2 AND id <> $3`,
        [booking.booking_date, booking.booking_time, req.params.id]
      );

      if (parseInt(bookedCount.rows[0]?.count || '0') >= maxCapacity) {
        return res.status(400).json({ error: '申し訳ございません。変更先の日時は満席となっております。' });
      }

      // Check Closed event
      const isClosedEvent = await db.query(
        `SELECT COUNT(*) as count FROM events WHERE event_date = $1 AND is_closed_slot = 1 AND $2 >= start_time AND $3 < end_time`,
        [booking.booking_date, booking.booking_time, booking.booking_time]
      );
      if (isClosedEvent.rows.length > 0 && parseInt(isClosedEvent.rows[0].count || '0') > 0) {
        return res.status(400).json({ error: '変更先の日時は祭典・行事等により受付停止中です。' });
      }
    }

    // Update Query
    await db.query(`
      UPDATE bookings SET
        booking_type = $1, booking_date = $2, booking_time = $3, prayer1 = $4, prayer2 = $5, hatsuhoryo = $6, attending_count = $7,
        name = $8, kana = $9, address = $10, address_kana = $11, phone = $12, email = $13,
        company_name = $14, company_kana = $15, company_address = $16, company_address_kana = $17, representative_title_name = $18,
        staff_dept_title_name = $19, staff_phone = $20, staff_email = $21, talisman_name = $22, additional_talismans = $23,
        wants_receipt = $24, receipt_name = $25, receipt_amount = $26,
        yakudoshi_type = $27, father_name = $28, father_kana = $29, mother_name = $30, mother_kana = $31, child_name = $32, child_kana = $33, child_birthday = $34,
        kotobuki_type = $35, kotobuki_other_text = $36, tournament_name = $37, tournament_schedule = $38,
        construction_name = $39, construction_designer = $40, construction_builder = $41, construction_period = $42, notes = $43
      WHERE id = $44
    `, [
      booking.booking_type, booking.booking_date, booking.booking_time, booking.prayer1, booking.prayer2 || null, booking.hatsuhoryo, booking.attending_count,
      booking.name || null, booking.kana || null, booking.address || null, booking.address_kana || null, booking.phone || null, booking.email || null,
      booking.company_name || null, booking.company_kana || null, booking.company_address || null, booking.company_address_kana || null, booking.representative_title_name || null,
      booking.staff_dept_title_name || null, booking.staff_phone || null, booking.staff_email || null, booking.talisman_name || null, booking.additional_talismans || null,
      booking.wants_receipt || 0, booking.receipt_name || null, booking.receipt_amount || null,
      booking.yakudoshi_type || null, booking.father_name || null, booking.father_kana || null, booking.mother_name || null, booking.mother_kana || null, booking.child_name || null, booking.child_kana || null, booking.child_birthday || null,
      booking.kotobuki_type || null, booking.kotobuki_other_text || null, booking.tournament_name || null, booking.tournament_schedule || null,
      booking.construction_name || null, booking.construction_designer || null, booking.construction_builder || null, booking.construction_period || null,
      booking.notes || null, req.params.id
    ]);

    const updatedBooking = { ...booking, id: parseInt(req.params.id) };

    // Send rescheduling confirmation mail
    const visitorEmail = booking.booking_type === 'individual' ? booking.email : booking.staff_email;
    if (visitorEmail) {
      const isIndiv = booking.booking_type === 'individual';
      const subject = `【清瀧神社】ご祈祷予約の「変更」完了のお知らせ`;
      let text = `${isIndiv ? `${booking.name} 様` : `${booking.company_name}\n担当 ${booking.staff_dept_title_name} 様`}

いつも清瀧神社をご拝礼いただき、誠にありがとうございます。
ご予約内容の「変更」が完了いたしましたので、最新の詳細内容をお知らせいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ご変更後の予約内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
・予約日時　: ${booking.booking_date} ${booking.booking_time}の回
・ご祈祷種類: ${isIndiv ? '個人のご祈祷' : '団体（企業）のご祈祷'}
・主願意　　: ${booking.prayer1}
`;

      if (booking.prayer2) {
        text += `・副願意　　: ${booking.prayer2}\n`;
      }

      text += `・お初穂料　: ${booking.hatsuhoryo.toLocaleString()}円以上（当日現金納め、お気持ち）
・参列予定者: ${booking.attending_count}名
`;
      
      text += `
ご不明な点などがございましたら、以下までお気軽にご連絡くださいませ。

清瀧神社
住所: 〒279-0041 千葉県浦安市堀江4-1-5
TEL: 047-351-5417 (受付時間: 9:30〜15:30)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ご予約の日程変更・キャンセルについて
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
再度変更・キャンセルされる場合は、引き続き以下のURLからオンラインで行うことができます。
https://seiryu-gokitou.vercel.app/?changeId=${req.params.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      sendMail(visitorEmail, subject, text).catch(err => console.error('Error sending change confirmation mail:', err));
    }

    res.json(updatedBooking);
  } catch (error) {
    console.error('Booking PUT update error:', error);
    res.status(500).json({ error: '予約内容の更新に失敗しました。' });
  }
});

// 7. Delete booking (Cancel)
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const checkResult = await db.query(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '予約情報が見つかりません。' });
    }

    await db.query(`DELETE FROM bookings WHERE id = $1`, [req.params.id]);
    res.json({ message: '予約が正常にキャンセルされました。', deletedId: req.params.id });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    res.status(500).json({ error: '予約のキャンセルに失敗しました。' });
  }
});

// 8. Reschedule booking (Visitor self-service)
router.patch('/:id/reschedule', async (req, res) => {
  const { booking_date, booking_time } = req.body;
  if (!booking_date || !booking_time) {
    return res.status(400).json({ error: '変更後の日付と時間が必要です。' });
  }

  try {
    const db = getDb();
    
    // Check capacity
    const limitSetting = await db.query(`SELECT value FROM settings WHERE key = $1`, ['max_groups_per_slot']);
    const maxCapacity = parseInt(limitSetting.rows[0]?.value || '8');

    const bookedCount = await db.query(
      `SELECT COUNT(*) as count FROM bookings WHERE booking_date = $1 AND booking_time = $2 AND id <> $3`,
      [booking_date, booking_time, req.params.id]
    );

    if (parseInt(bookedCount.rows[0]?.count || '0') >= maxCapacity) {
      return res.status(400).json({ error: '申し訳ございません。変更先の枠は満席となっております。' });
    }

    // Check if slot is closed by festival
    const isClosedEvent = await db.query(
      `SELECT COUNT(*) as count FROM events WHERE event_date = $1 AND is_closed_slot = 1 AND $2 >= start_time AND $3 < end_time`,
      [booking_date, booking_time, booking_time]
    );
    if (isClosedEvent.rows.length > 0 && parseInt(isClosedEvent.rows[0].count || '0') > 0) {
      return res.status(400).json({ error: '変更先の枠は祭典・行事等により受付停止中です。' });
    }

    await db.query(
      `UPDATE bookings SET booking_date = $1, booking_time = $2 WHERE id = $3`,
      [booking_date, booking_time, req.params.id]
    );

    res.json({ success: true, booking_date, booking_time });
  } catch (error) {
    console.error('Booking reschedule error:', error);
    res.status(500).json({ error: '日程の変更に失敗しました。' });
  }
});

export default router;
