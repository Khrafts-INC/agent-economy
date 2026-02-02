// Database initialization and access
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SCHEMA } from './schema.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Database path (in project root data directory)
const DB_PATH = join(__dirname, '../../data/agent-economy.db');
let db = null;
export function getDb() {
    if (!db) {
        // Ensure data directory exists
        try {
            mkdirSync(dirname(DB_PATH), { recursive: true });
        }
        catch (e) {
            // ignore if exists
        }
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL'); // Better concurrency
        db.pragma('foreign_keys = ON'); // Enforce relationships
    }
    return db;
}
export function initDb() {
    const database = getDb();
    database.exec(SCHEMA);
    console.log('✅ Database initialized at', DB_PATH);
}
export function closeDb() {
    if (db) {
        db.close();
        db = null;
    }
}
