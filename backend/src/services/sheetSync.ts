import cron from 'node-cron';
import { getDb } from '../db';

export async function syncAllBookingsToSpreadsheet() {
  const sheetUrl = process.env.SPREADSHEET_API_URL;
  if (!sheetUrl) {
    console.warn('[SheetSync Service] SPREADSHEET_API_URL is not set. Skipping scheduled backup sync.');
    return;
  }

  console.log('[SheetSync Service] Starting scheduled 8-hour database sync to Google Sheets...');
  try {
    const db = getDb();
    // Fetch all records sorted by date and time
    const result = await db.query(`
      SELECT * FROM bookings 
      ORDER BY booking_date ASC, booking_time ASC
    `);

    const bookings = result.rows;
    console.log(`[SheetSync Service] Found ${bookings.length} total booking(s) to synchronize.`);

    // Perform bulk synchronize POST request to GAS
    const res = await fetch(sheetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncAllBookings',
        bookings: bookings
      })
    });

    if (res.ok) {
      console.log('[SheetSync Service] Google Sheets 8-hour full synchronization completed successfully.');
    } else {
      const errText = await res.text();
      console.error('[SheetSync Service] Google Sheets synchronization returned error status:', res.status, errText);
    }
  } catch (error) {
    console.error('[SheetSync Service] Scheduled synchronization failed:', error);
  }
}

export function startSheetSyncScheduler() {
  console.log('[SheetSync Service] Initializing 8-hour cron scheduler...');
  // Cron running every 8 hours at minute 0: "0 */8 * * *"
  cron.schedule('0 */8 * * *', async () => {
    await syncAllBookingsToSpreadsheet();
  });
}
