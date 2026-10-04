import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

// Get settings map
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query(`SELECT * FROM settings`);
    const settingsMap: Record<string, string> = {};
    result.rows.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json({
      ...settingsMap,
      server_time: new Date().toISOString()
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ error: '設定情報の取得に失敗しました。' });
  }
});

// Update a setting
router.post('/', async (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: 'KeyとValueが必要です。' });
  }

  try {
    const db = getDb();
    await db.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2) 
       ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value`,
      [key, String(value)]
    );
    res.json({ success: true, key, value });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: '設定情報の更新に失敗しました。' });
  }
});

// Test email settings (Resend API)
router.post('/test-email', async (req, res) => {
  const { to } = req.body;
  if (!to) {
    return res.status(400).json({ error: '送信先メールアドレスを入力してください。' });
  }

  try {
    const { sendMail } = require('../services/email');
    const subject = '【清瀧神社】Resendメール送信テスト';
    const text = `これは清瀧神社オンライン祈祷予約システムからのResendメール配信テストです。
このメールが届いている場合、ResendのAPIキーおよびドメイン設定は正常に作動しています。

環境変数設定状況:
・RESEND_API_KEY Configured: ${!!process.env.RESEND_API_KEY}
・RESEND_FROM: ${process.env.RESEND_FROM || process.env.SMTP_FROM || '清瀧神社ご祈祷予約 <onboarding@resend.dev>'}
・NOTIFICATION_EMAIL: ${process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '未設定'}`;

    const success = await sendMail(to, subject, text, undefined, undefined, true);
    if (success) {
      res.json({ success: true, message: 'Resend経由のテストメールを送信しました。受信トレイをご確認ください。' });
    } else {
      res.status(500).json({ 
        error: 'メールの送信に失敗しました。Resend APIキーが正しいか、またはドメイン設定が完了しているかご確認ください。' 
      });
    }
  } catch (error: any) {
    console.error('Test email failed:', error);
    res.status(500).json({ error: `テストメール送信中に例外エラーが発生しました: ${error.message || error}` });
  }
});


// SSE Client tracking for real-time schedule order updates across staff devices
interface SseClient {
  id: number;
  res: any;
}
let sseClients: SseClient[] = [];
let nextClientId = 1;

export function broadcastScheduleOrderUpdate(payload: {
  date: string;
  mode: string;
  orderedIds?: number[];
  updatedAt: number;
}) {
  const data = JSON.stringify(payload);
  sseClients.forEach(client => {
    try {
      client.res.write(`event: schedule_order_updated\ndata: ${data}\n\n`);
    } catch (e) {
      // client disconnected
    }
  });
}

// 1. SSE Stream for Schedule Order Real-time Updates
router.get('/schedule-order-events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.write(': connected\n\n');

  const clientId = nextClientId++;
  const client: SseClient = { id: clientId, res };
  sseClients.push(client);

  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (e) {
      clearInterval(keepAliveInterval);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// 2. Get schedule order for a specific date
router.get('/schedule-order/:date', async (req, res) => {
  const { date } = req.params;
  if (!date) {
    return res.status(400).json({ error: '日付が必要です。' });
  }

  try {
    const db = getDb();
    const key = `schedule_order_${date}`;
    const result = await db.query(`SELECT value FROM settings WHERE key = $1`, [key]);
    if (result.rows.length > 0 && result.rows[0].value) {
      const parsed = JSON.parse(result.rows[0].value);
      return res.json({
        date,
        mode: parsed.mode || 'created_asc',
        orderedIds: parsed.orderedIds || null,
        updatedAt: parsed.updatedAt || 0
      });
    }
    res.json({
      date,
      mode: 'created_asc',
      orderedIds: null,
      updatedAt: 0
    });
  } catch (error) {
    console.error('Fetch schedule order error:', error);
    res.status(500).json({ error: '日程表の並び順取得に失敗しました。' });
  }
});

// 3. Save schedule order for a specific date and broadcast to all connected devices
router.post('/schedule-order/:date', async (req, res) => {
  const { date } = req.params;
  const { mode, orderedIds } = req.body;
  if (!date || !mode) {
    return res.status(400).json({ error: '日付と並び順モードが必要です。' });
  }

  try {
    const db = getDb();
    const key = `schedule_order_${date}`;
    const updatedAt = Date.now();
    const value = JSON.stringify({
      mode,
      orderedIds: mode === 'custom' ? (orderedIds || []) : undefined,
      updatedAt
    });

    await db.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2) 
       ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value`,
      [key, value]
    );

    const payload = {
      date,
      mode,
      orderedIds: mode === 'custom' ? (orderedIds || []) : undefined,
      updatedAt
    };

    // Broadcast to all active clients via SSE
    broadcastScheduleOrderUpdate(payload);

    res.json({ success: true, ...payload });
  } catch (error) {
    console.error('Save schedule order error:', error);
    res.status(500).json({ error: '日程表の並び順保存に失敗しました。' });
  }
});

export default router;
