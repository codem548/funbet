/**
 * FunBet Casino — Database Migration & Data Migration
 *
 * Handles schema creation (SQLite / PostgreSQL) and legacy JSON data migration.
 */
import { getDb } from './client';
import { logger } from '../utils/logger';

/**
 * Run schema migrations.
 * SQLite: creates tables via raw SQL if they don't exist.
 * PostgreSQL: requires `npx drizzle-kit migrate` (documented in runMigrations).
 */
export async function runMigrations() {
  const db = getDb();

  try {
    // Detect PostgreSQL
    const isPg = db?._connector?.data?.connection?.options?.connection?.database
      || process.env.DATABASE_URL?.startsWith('postgres');

    if (isPg) {
      // PostgreSQL — migrations managed by drizzle-kit
      logger.info('✅ PostgreSQL schema migrations managed by drizzle-kit');
      return;
    }

    // SQLite — create all tables
    await db.run(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        salt TEXT,
        token_version INTEGER NOT NULL DEFAULT 1,
        token_hash TEXT,
        solde INTEGER NOT NULL DEFAULT 0,
        credits INTEGER NOT NULL DEFAULT 10000,
        credits_fictifs INTEGER NOT NULL DEFAULT 0,
        revenu INTEGER NOT NULL DEFAULT 0,
        total_bet INTEGER NOT NULL DEFAULT 0,
        total_win INTEGER NOT NULL DEFAULT 0,
        total_deposit INTEGER NOT NULL DEFAULT 0,
        total_withdrawal INTEGER NOT NULL DEFAULT 0,
        payment_method TEXT,
        payment_number TEXT,
        payment_name TEXT,
        pays TEXT,
        telephone TEXT,
        is_admin INTEGER NOT NULL DEFAULT 0,
        is_frozen INTEGER NOT NULL DEFAULT 0,
        is_online INTEGER NOT NULL DEFAULT 0,
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        last_login_at TEXT,
        last_logout_at TEXT,
        last_activity_at TEXT,
        server_seed TEXT,
        client_seed TEXT,
        nonce INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    await db.run(`CREATE INDEX IF NOT EXISTS players_solde_idx ON players(solde);`);
    await db.run(`CREATE INDEX IF NOT EXISTS players_username_idx ON players(username);`);
    await db.run(`CREATE INDEX IF NOT EXISTS players_is_frozen_idx ON players(is_frozen);`);

    // Sessions
    await db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        refresh_token_hash TEXT NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS sessions_is_active_idx ON sessions(is_active);
    `);

    // Games
    await db.run(`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        min_bet INTEGER NOT NULL,
        max_bet INTEGER NOT NULL,
        house_edge INTEGER NOT NULL DEFAULT 4,
        config TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    logger.info('✅ SQLite tables created/verified');
  } catch (err) {
    logger.error({ err }, '❌ Migration failed');
    throw err;
  }
}
