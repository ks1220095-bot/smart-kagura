import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

let pool: Pool;

export async function initDb() {
  const connectionString = process.env.DATABASE_URL;
  
  // Connect using DATABASE_URL (Standard Render Postgres config)
  pool = new Pool({
    connectionString,
    ssl: connectionString ? { rejectUnauthorized: false } : undefined
  });

  const client = await pool.connect();
  try {
    // Create settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Insert default config
    await client.query(`
      INSERT INTO settings (key, value)
      VALUES ('max_groups_per_slot', '8')
      ON CONFLICT (key) DO NOTHING
    `);

    // Create bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        receipt_number VARCHAR(255) UNIQUE NOT NULL,
        booking_type VARCHAR(50) NOT NULL,
        booking_date VARCHAR(50) NOT NULL,
        booking_time VARCHAR(50) NOT NULL,
        prayer1 VARCHAR(100) NOT NULL,
        prayer2 VARCHAR(100),
        hatsuhoryo INTEGER NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        attending_count INTEGER DEFAULT 1,
        
        -- Individual Fields
        name VARCHAR(255),
        kana VARCHAR(255),
        address TEXT,
        address_kana TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        
        -- Organization Fields
        company_name VARCHAR(255),
        company_kana VARCHAR(255),
        company_address TEXT,
        company_address_kana TEXT,
        representative_title_name VARCHAR(255),
        staff_dept_title_name VARCHAR(255),
        staff_phone VARCHAR(50),
        staff_email VARCHAR(255),
        
        -- Organization Talismans
        talisman_name VARCHAR(255),
        additional_talismans TEXT,
        
        -- Organization Receipt
        wants_receipt INTEGER DEFAULT 0,
        receipt_name VARCHAR(255),
        receipt_amount INTEGER,
        
        -- Individual Wardings
        yakudoshi_type VARCHAR(50),
        
        -- Individual Birth / Children
        father_name VARCHAR(255),
        father_kana VARCHAR(255),
        mother_name VARCHAR(255),
        mother_kana VARCHAR(255),
        child_name VARCHAR(255),
        child_kana VARCHAR(255),
        child_birthday VARCHAR(50),
        
        -- Individual Longevity
        kotobuki_type VARCHAR(100),
        kotobuki_other_text VARCHAR(255),
        
        -- Organization Victory
        tournament_name VARCHAR(255),
        tournament_schedule VARCHAR(255),
        
        -- Organization Construction
        construction_name VARCHAR(255),
        construction_designer VARCHAR(255),
        construction_builder VARCHAR(255),
        construction_period VARCHAR(255),
        
        reminder_sent INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Alter bookings table to add notes column if it doesn't exist (For dynamic migration)
    await client.query(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT
    `);

    // Create events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        event_date VARCHAR(50) NOT NULL,
        start_time VARCHAR(50) NOT NULL,
        end_time VARCHAR(50) NOT NULL,
        description TEXT,
        is_closed_slot INTEGER DEFAULT 0
      )
    `);

    console.log('[Database Service] PostgreSQL schema verified successfully.');
  } finally {
    client.release();
  }
}

export function getDb() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDb() first.');
  }
  return pool;
}
