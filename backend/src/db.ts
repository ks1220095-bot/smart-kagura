import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';

dotenv.config();

let pool: Pool;

// SQLite Pool Emulator mimicking pg Pool interface
class SQLitePoolMock {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  private translateQuery(sql: string): string {
    let sqliteSql = sql;
    
    // Convert $1, $2 ... to ? for SQLite query bindings
    sqliteSql = sqliteSql.replace(/\$(\d+)/g, '?');
    
    // Map PostgreSQL types to SQLite equivalents
    sqliteSql = sqliteSql.replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
    sqliteSql = sqliteSql.replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    
    // ON CONFLICT DO NOTHING handles duplicate key conflict migrations
    sqliteSql = sqliteSql.replace(/ON CONFLICT\s*\(key\)\s*DO\s*NOTHING/gi, 'ON CONFLICT(key) DO NOTHING');

    return sqliteSql;
  }

  async query(sql: string, params: any[] = []) {
    const translatedSql = this.translateQuery(sql);
    const upper = translatedSql.trim().toUpperCase();

    try {
      if (upper.startsWith('SELECT')) {
        const rows = await this.db.all(translatedSql, params);
        return { rows };
      } else {
        const result = await this.db.run(translatedSql, params);
        
        let rows: any[] = [];
        // Emulate RETURNING * insert return logic for sqlite
        if (upper.includes('RETURNING')) {
          if (result.lastID !== undefined) {
            const match = upper.match(/INSERT\s+INTO\s+(\w+)/i);
            if (match) {
              const tableName = match[1];
              rows = await this.db.all(`SELECT * FROM ${tableName} WHERE id = ?`, [result.lastID]);
            }
          }
        }
        return { rows, lastID: result.lastID, changes: result.changes };
      }
    } catch (err: any) {
      // Gracefully swallow duplicate column schema migrations in local SQLite database
      if (err.message && (err.message.includes('duplicate column') || err.message.includes('already exists'))) {
        return { rows: [] };
      }
      throw err;
    }
  }

  async connect() {
    return {
      query: (sql: string, params?: any[]) => this.query(sql, params),
      release: () => {}
    };
  }
}

export async function initDb() {
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    try {
      console.log('[Database Service] DATABASE_URL provided. Attempting to connect to PostgreSQL...');
      const testPool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
      });
      // Quick connection verification test
      const client = await testPool.connect();
      client.release();
      
      pool = testPool;
      console.log('[Database Service] PostgreSQL connected successfully.');
      
      // Verify PostgreSQL schema
      await verifyPostgresSchema();
    } catch (err) {
      console.error('[Database Service] PostgreSQL connection failed. Falling back to local SQLite database...', err);
      await initSqlite();
    }
  } else {
    console.log('[Database Service] DATABASE_URL not set. Initializing local SQLite database...');
    await initSqlite();
  }
}

async function initSqlite() {
  try {
    const dbPath = path.resolve(__dirname, '../../database.sqlite');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const sqlitePool = new SQLitePoolMock(db);
    pool = sqlitePool as any;

    const client = await pool.connect();
    try {
      // 1. Settings Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);

      // Seed settings
      await client.query(`
        INSERT OR IGNORE INTO settings (key, value)
        VALUES 
          ('max_groups_per_slot', '8'),
          ('is_booking_active', 'true'),
          ('maintenance_message', '現在、オンラインでのご祈祷予約の受付を一時的に停止しております。お急ぎの場合は、神社社務所まで直接お電話（047-351-5417）にてお問い合わせください。'),
          ('booking_period_months', '2')
      `);

      // 2. Bookings Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          receipt_number TEXT UNIQUE NOT NULL,
          booking_type TEXT NOT NULL,
          booking_date TEXT NOT NULL,
          booking_time TEXT NOT NULL,
          prayer1 TEXT NOT NULL,
          prayer2 TEXT,
          hatsuhoryo INTEGER NOT NULL,
          payment_status TEXT DEFAULT 'unpaid',
          attending_count INTEGER DEFAULT 1,
          name TEXT,
          kana TEXT,
          address TEXT,
          address_kana TEXT,
          phone TEXT,
          email TEXT,
          company_name TEXT,
          company_kana TEXT,
          company_address TEXT,
          company_address_kana TEXT,
          representative_title_name TEXT,
          staff_dept_title_name TEXT,
          staff_phone TEXT,
          staff_email TEXT,
          talisman_name TEXT,
          additional_talismans TEXT,
          wants_receipt INTEGER DEFAULT 0,
          receipt_name TEXT,
          receipt_amount INTEGER,
          yakudoshi_type TEXT,
          father_name TEXT,
          father_kana TEXT,
          mother_name TEXT,
          mother_kana TEXT,
          child_name TEXT,
          child_kana TEXT,
          child_birthday TEXT,
          kotobuki_type TEXT,
          kotobuki_other_text TEXT,
          tournament_name TEXT,
          tournament_schedule TEXT,
          construction_name TEXT,
          construction_designer TEXT,
          construction_builder TEXT,
          construction_period TEXT,
          reminder_sent INTEGER DEFAULT 0,
          is_accepted INTEGER DEFAULT 0,
          is_receipt_issued INTEGER DEFAULT 0,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Safe check migrations
      try { await db.run(`ALTER TABLE bookings ADD COLUMN notes TEXT`); } catch(e) {}
      try { await db.run(`ALTER TABLE bookings ADD COLUMN reminder_sent INTEGER DEFAULT 0`); } catch(e) {}
      try { await db.run(`ALTER TABLE bookings ADD COLUMN is_accepted INTEGER DEFAULT 0`); } catch(e) {}
      try { await db.run(`ALTER TABLE bookings ADD COLUMN is_receipt_issued INTEGER DEFAULT 0`); } catch(e) {}

      // 3. Events Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          event_date TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          description TEXT,
          is_closed_slot INTEGER DEFAULT 0
        )
      `);

      console.log('[Database Service] Local SQLite initialized and schema verified.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[Database Service] SQLite initialization error:', err);
    throw err;
  }
}

async function verifyPostgresSchema() {
  const client = await pool.connect();
  try {
    // Verify Postgres tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    await client.query(`
      INSERT INTO settings (key, value)
      VALUES 
        ('max_groups_per_slot', '8'),
        ('is_booking_active', 'true'),
        ('maintenance_message', '現在、オンラインでのご祈祷予約の受付を一時的に停止しております。お急ぎの場合は、神社社務所まで直接お電話（047-351-5417）にてお問い合わせください。'),
        ('booking_period_months', '2')
      ON CONFLICT (key) DO NOTHING
    `);

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
        name VARCHAR(255),
        kana VARCHAR(255),
        address TEXT,
        address_kana TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        company_name VARCHAR(255),
        company_kana VARCHAR(255),
        company_address TEXT,
        company_address_kana TEXT,
        representative_title_name VARCHAR(255),
        staff_dept_title_name VARCHAR(255),
        staff_phone VARCHAR(50),
        staff_email VARCHAR(255),
        talisman_name VARCHAR(255),
        additional_talismans TEXT,
        wants_receipt INTEGER DEFAULT 0,
        receipt_name VARCHAR(255),
        receipt_amount INTEGER,
        yakudoshi_type VARCHAR(50),
        father_name VARCHAR(255),
        father_kana VARCHAR(255),
        mother_name VARCHAR(255),
        mother_kana VARCHAR(255),
        child_name VARCHAR(255),
        child_kana VARCHAR(255),
        child_birthday VARCHAR(50),
        kotobuki_type VARCHAR(100),
        kotobuki_other_text VARCHAR(255),
        tournament_name VARCHAR(255),
        tournament_schedule VARCHAR(255),
        construction_name VARCHAR(255),
        construction_designer VARCHAR(255),
        construction_builder VARCHAR(255),
        construction_period VARCHAR(255),
        reminder_sent INTEGER DEFAULT 0,
        is_accepted INTEGER DEFAULT 0,
        is_receipt_issued INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT
    `);
    await client.query(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent INTEGER DEFAULT 0
    `);
    await client.query(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_accepted INTEGER DEFAULT 0
    `);
    await client.query(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_receipt_issued INTEGER DEFAULT 0
    `);

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
