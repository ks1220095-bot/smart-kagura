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

export default router;
