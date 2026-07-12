import webpush from 'web-push';
import { getDb } from '../db';

let keysInitialized = false;

export function getVapidPublicKey(): string {
  initWebPush();
  return process.env.VAPID_PUBLIC_KEY || '';
}

function initWebPush() {
  if (keysInitialized) return;

  let publicKey = process.env.VAPID_PUBLIC_KEY;
  let privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:info@seiryuujinja.com';

  if (!publicKey || !privateKey) {
    console.warn('[Web Push Warning] VAPID keys are not configured. Generating temporary keys for fallback...');
    const tempKeys = webpush.generateVAPIDKeys();
    publicKey = tempKeys.publicKey;
    privateKey = tempKeys.privateKey;
    
    // Cache the temporary keys in environment variables for consecutive calls within the process lifetime
    process.env.VAPID_PUBLIC_KEY = publicKey;
    process.env.VAPID_PRIVATE_KEY = privateKey;
    
    console.log('==================================================================');
    console.log('[Web Push Setup] Temporary VAPID Keys Generated:');
    console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
    console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
    console.log(`VAPID_SUBJECT=${subject}`);
    console.log('Please register these variables to your Render Environment Settings.');
    console.log('==================================================================');
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  keysInitialized = true;
}

export async function sendWebPushNotification(title: string, body: string) {
  initWebPush();

  try {
    const db = getDb();
    const result = await db.query(`SELECT * FROM push_subscriptions`);
    const subs = result.rows;

    if (subs.length === 0) {
      console.log('[Web Push Service] No active subscriptions registered. Skipping push.');
      return;
    }

    console.log(`[Web Push Service] Sending push notification to ${subs.length} subscriber(s)...`);

    const payload = JSON.stringify({ title, body });

    const promises = subs.map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        console.error('[Web Push Error] Failed to send push to endpoint:', sub.endpoint, 'Status:', err.statusCode);
        // If subscription is expired/invalid (404 or 410 Gone), delete it from database
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log('[Web Push Service] Deleting expired push subscription:', sub.endpoint);
          await db.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [sub.endpoint]).catch(() => {});
        }
      }
    });

    await Promise.all(promises);
  } catch (err) {
    console.error('[Web Push Service Error] Failed to execute push dispatch loop:', err);
  }
}
