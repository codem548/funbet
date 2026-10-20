/**
 * FunBet Casino — Drizzle ORM Schema (SQLite / PostgreSQL compatible)
 *
 * Utilise des types universels (text, integer, real) pour fonctionner sur
 * les deux moteurs. Les UUID sont stockés en TEXT.
 * Toutes les valeurs monétaires sont des INTEGER (FCFA entiers).
 */
import {
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';

// Re-export sqlite-compatible builders for dev engine
import { sqliteTable as table } from 'drizzle-orm/better-sqlite3';

// Use pg-core column helpers but sqliteTable for the table wrapper
// This gives us portable types across both engines.
// Column type mapping: uuid→text, timestamp→text(datetime), jsonb→text(json)

const timestamps = {
  createdAt: text('created_at').notNull().default('datetime(current_timestamp)'),
  updatedAt: text('updated_at').notNull().default('datetime(current_timestamp)'),
};

/**
 * ———————————————— Players ————————————————
 */
export const players = table(
  'players',
  {
    id: text('id').primaryKey(), // UUID stored as TEXT
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    salt: text('salt'),
    tokenVersion: integer('token_version').notNull().default(1),
    tokenHash: text('token_hash'),

    solde: integer('solde').notNull().default(0),
    credits: integer('credits').notNull().default(10000),
    creditsFictifs: integer('credits_fictifs').notNull().default(0),
    revenu: integer('revenu').notNull().default(0),
    totalBet: integer('total_bet').notNull().default(0),
    totalWin: integer('total_win').notNull().default(0),
    totalDeposit: integer('total_deposit').notNull().default(0),
    totalWithdrawal: integer('total_withdrawal').notNull().default(0),

    paymentMethod: text('payment_method'),
    paymentNumber: text('payment_number'),
    paymentName: text('payment_name'),
    pays: text('pays'),
    telephone: text('telephone'),

    isAdmin: boolean('is_admin').notNull().default(false),
    isFrozen: boolean('is_frozen').notNull().default(false),
    isOnline: boolean('is_online').notNull().default(false),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lastLoginAt: text('last_login_at'),
    lastLogoutAt: text('last_logout_at'),
    lastActivityAt: text('last_activity_at'),

    serverSeed: text('server_seed'),
    clientSeed: text('client_seed'),
    nonce: integer('nonce').notNull().default(0),

    ...timestamps,
  },
  (table) => ({
    soldeIdx: index('players_solde_idx').on(table.solde),
    usernameIdx: index('players_username_idx').on(table.username),
    isFrozenIdx: index('players_is_frozen_idx').on(table.is_frozen),
  })
);

/**
 * ———————————————— Sessions ————————————————
 */
export const sessions = table('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: text('expires_at').notNull(),
  ...timestamps,
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  isActiveIdx: index('sessions_is_active_idx').on(table.isActive),
}));

/**
 * ———————————————— Games ————————————————
 */
export const games = table('games', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  minBet: integer('min_bet').notNull(),
  maxBet: integer('max_bet').notNull(),
  houseEdge: integer('house_edge').notNull().default(4), // stored as percentage * 10
  config: text('config'), // JSON string
  ...timestamps,
});
