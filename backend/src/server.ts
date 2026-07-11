import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db';
import bookingsRouter from './routes/bookings';
import eventsRouter from './routes/events';
import settingsRouter from './routes/settings';

import { startReminderScheduler } from './services/reminder';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/settings', settingsRouter);

// Database initialization and server boot
async function startServer() {
  try {
    await initDb();
    // Start automated day-before reminder task
    startReminderScheduler();
    app.listen(Number(port), '0.0.0.0', () => {
      console.log(`[Smart-Kagura Backend] Running on http://0.0.0.0:${port}`);
      console.log(`=== SERVER STARTING (Version 1.1.3 - IPv4 / Bind 0.0.0.0) ===`);
      console.log(`SMTP_HOST Configured:`, !!process.env.SMTP_HOST);
      console.log(`SMTP_PORT Value:`, process.env.SMTP_PORT);
      console.log(`RESEND_API_KEY Configured:`, !!process.env.RESEND_API_KEY);
    });
  } catch (error) {
    console.error('Fatal: Failed to initialize server:', error);
    process.exit(1);
  }
}

startServer();
