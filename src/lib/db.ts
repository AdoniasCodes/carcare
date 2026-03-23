import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "carcare.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    // Create tables if they don't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        car_make TEXT NOT NULL,
        car_model TEXT NOT NULL,
        car_year TEXT NOT NULL,
        service_type TEXT NOT NULL,
        description TEXT,
        location TEXT NOT NULL,
        preferred_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        revenue REAL,
        cost REAL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);
      CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(preferred_date);
    `);
  }
  return db;
}

export default getDb;

// Helper to generate IDs
export function generateId(): string {
  return "BK-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}
