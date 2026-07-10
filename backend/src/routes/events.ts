import { Router } from 'express';
import { getDb } from '../db';
import { CalendarEvent } from '../types';

const router = Router();

// 1. Get calendar events
router.get('/', async (req, res) => {
  const { month, date } = req.query;

  try {
    const db = getDb();
    let query = `SELECT * FROM events WHERE 1=1`;
    const params: any[] = [];
    let pIdx = 1;

    if (month && typeof month === 'string') {
      // YYYY-MM format
      query += ` AND event_date LIKE $${pIdx++}`;
      params.push(`${month}%`);
    } else if (date && typeof date === 'string') {
      // YYYY-MM-DD format
      query += ` AND event_date = $${pIdx++}`;
      params.push(date);
    }

    query += ` ORDER BY event_date ASC, start_time ASC`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ error: '行事情報の取得に失敗しました。' });
  }
});

// 2. Create a new event (Festival / Close slot)
router.post('/', async (req, res) => {
  const event: CalendarEvent = req.body;
  if (!event.title || !event.event_date || !event.start_time || !event.end_time) {
    return res.status(400).json({ error: '必須項目が不足しています。' });
  }

  try {
    const db = getDb();
    const result = await db.query(
      `INSERT INTO events (title, event_date, start_time, end_time, description, is_closed_slot) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        event.title,
        event.event_date,
        event.start_time,
        event.end_time,
        event.description || null,
        event.is_closed_slot || 0
      ]
    );

    const createdEvent = { ...event, id: result.rows[0].id };
    res.status(201).json(createdEvent);
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ error: '行事情報の登録に失敗しました。' });
  }
});

// 3. Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const checkResult = await db.query(`SELECT * FROM events WHERE id = $1`, [req.params.id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '指定された行事が見つかりません。' });
    }

    await db.query(`DELETE FROM events WHERE id = $1`, [req.params.id]);
    res.json({ message: '行事が削除されました。', deletedId: req.params.id });
  } catch (error) {
    console.error('Event deletion error:', error);
    res.status(500).json({ error: '行事情報の削除に失敗しました。' });
  }
});

export default router;
