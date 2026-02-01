import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Support DATABASE_PATH env for production deployment
const dbPathFromEnv = process.env.DATABASE_PATH;
const dataDir = dbPathFromEnv 
  ? dirname(dbPathFromEnv)
  : join(__dirname, '../../data');
const dbPath = dbPathFromEnv || join(dataDir, 'economy.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    // Initialize schema
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      moltbook_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      bio TEXT,
      balance INTEGER DEFAULT 0,
      reputation_score REAL DEFAULT 0,
      jobs_completed INTEGER DEFAULT 0,
      jobs_requested INTEGER DEFAULT 0,
      verified_at TEXT,
      created_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      base_price INTEGER NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      service_id TEXT REFERENCES services(id),
      requester_id TEXT NOT NULL REFERENCES agents(id),
      provider_id TEXT NOT NULL REFERENCES agents(id),
      title TEXT NOT NULL,
      description TEXT,
      agreed_price INTEGER NOT NULL,
      status TEXT DEFAULT 'requested',
      escrow_tx_id TEXT,
      created_at TEXT NOT NULL,
      accepted_at TEXT,
      delivered_at TEXT,
      completed_at TEXT
    );
    
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      from_agent_id TEXT REFERENCES agents(id),
      to_agent_id TEXT REFERENCES agents(id),
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      job_id TEXT REFERENCES jobs(id),
      created_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      reviewer_id TEXT NOT NULL REFERENCES agents(id),
      reviewee_id TEXT NOT NULL REFERENCES agents(id),
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_services_agent ON services(agent_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_requester ON jobs(requester_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_provider ON jobs(provider_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_agent_id);
  `);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
