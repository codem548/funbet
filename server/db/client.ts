/**
 * FunBet Casino — Drizzle ORM Database Client
 *
 * Dual-engine: SQLite for development, PostgreSQL for production.
 * The DATABASE_URL environment variable determines which is used.
 *
 * - postgres://user:pass@host:port/db → PostgreSQL
 * - file:./dev.db or sqlite:... → SQLite
 */
import { drizzle, PgQueryResult } from 'drizzle-orm/pg';
import { createClient } from 'pg';
import Database from 'better-sqlite3';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzleSQLite> | null = null;

/**
 * Determine if the DATABASE_URL points to PostgreSQL.
 */
function isPostgres(): boolean {
  return env.DATABASE_URL.startsWith('postgres://') || env.DATABASE_URL.startsWith('postgresql://');
}

/**
 * Initialize the database connection (singleton).
 */
export function initializeDb() {
  if (db) return db;

  if (isPostgres()) {
    const client = createClient({
      connectionString: env.DATABASE_URL,
    });
    db = drizzle(client, { schema }) as ReturnType<typeof drizzle>;
    logger.info('🗄️  Database: PostgreSQL');
  } else {
    // Extract file path from "file:./dev.db" or default to ./dev.db
    let dbPath = './dev.db';
    if (env.DATABASE_URL.startsWith('file:')) {
      dbPath = env.DATABASE_URL.slice(5);
    }
    const sqlite = new Database(dbPath);
    db = drizzleSQLite(sqlite, { schema }) as ReturnType<typeof drizzleSQLite>;
    logger.info('🗄️  Database: SQLite (dev)');
  }

  return db;
}

/**
 * Get the initialized database instance.
 * Throws if not initialized — requires bootstrap to call initializeDb() first.
 */
export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDb() first.');
  }
  return db;
}

/**
 * Get typed schema exports for raw queries or external use.
 */
export type Database = ReturnType<typeof getDb>;
export { schema };
