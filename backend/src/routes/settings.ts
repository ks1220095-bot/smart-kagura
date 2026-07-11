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
    res.json(settingsMap);
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

// Test email settings
router.post('/test-email', async (req, res) => {
  const { to } = req.body;
  if (!to) {
    return res.status(400).json({ error: '送信先メールアドレスを入力してください。' });
  }

  try {
    const { sendMail } = require('../services/email');
    const subject = '【清瀧神社】メールサーバー接続テスト';
    const text = `これは清瀧神社オンライン祈祷予約システムからのメールサーバー（SMTP）接続テストメールです。
このメールが届いている場合、メールサーバーの設定および認証は正常に完了しています。

環境変数設定状況:
・SMTP_HOST: ${process.env.SMTP_HOST || '未設定'}
・SMTP_PORT: ${process.env.SMTP_PORT || '未設定'}
・SMTP_USER: ${process.env.SMTP_USER || '未設定'}
・SMTP_FROM: ${process.env.SMTP_FROM || '未設定'}
・NOTIFICATION_EMAIL: ${process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '未設定'}
・RESEND_API_KEY Configured: ${!!process.env.RESEND_API_KEY}`;

    const success = await sendMail(to, subject, text, undefined, undefined, true);
    if (success) {
      res.json({ success: true, message: 'テストメールを送信しました。受信トレイをご確認ください。' });
    } else {
      res.status(500).json({ 
        error: 'メールの送信に失敗しました。SMTPサーバーの設定値（ホスト、ポート、認証情報）または送信元制限を確認してください。' 
      });
    }
  } catch (error: any) {
    console.error('Test email failed:', error);
    res.status(500).json({ error: `テストメール送信中に例外エラーが発生しました: ${error.message || error}` });
  }
});

export default router;
