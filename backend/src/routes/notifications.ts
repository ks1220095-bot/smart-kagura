import { Router } from 'express';
import { getDb } from '../db';
import { getVapidPublicKey } from '../services/webpush';

const router = Router();

// 1. Get VAPID Public Key
router.get('/vapid-key', (req, res) => {
  try {
    const key = getVapidPublicKey();
    res.json({ publicKey: key });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Subscribe to Web Push Notifications
router.post('/subscribe', async (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    return res.status(400).json({ error: '有効なサブスクリプション情報がありません。' });
  }

  try {
    const db = getDb();
    
    // SQLite/PostgreSQL UPSERT using ON CONFLICT OR IGNORE
    // Check if subscription already exists first to be highly compatible with both SQLite and Postgres
    const exists = await db.query(`SELECT id FROM push_subscriptions WHERE endpoint = $1`, [subscription.endpoint]);
    
    if (exists.rows.length > 0) {
      await db.query(`
        UPDATE push_subscriptions 
        SET p256dh = $1, auth = $2 
        WHERE endpoint = $3
      `, [
        subscription.keys.p256dh,
        subscription.keys.auth,
        subscription.endpoint
      ]);
    } else {
      await db.query(`
        INSERT INTO push_subscriptions (endpoint, p256dh, auth)
        VALUES ($1, $2, $3)
      `, [
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth
      ]);
    }

    console.log('[Notification Router] New push subscription registered successfully:', subscription.endpoint.slice(0, 45) + '...');
    res.status(201).json({ success: true });
  } catch (err: any) {
    console.error('[Notification Router] Failed to subscribe:', err);
    res.status(500).json({ error: 'サブスクリプションの登録に失敗しました。' });
  }
});

export default router;
