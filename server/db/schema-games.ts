/**
 * FunBet Casino — Drizzle ORM Schema (Game-specific tables)
 * Tables for crash rounds, crash bets, transactions, and game logs.
 */
import {
  text,
  integer,
  real,
  boolean,
  index,
  sqliteTable,
} from 'drizzle-orm/better-sqlite3';

/**
 * ———————————————— Crash Rounds ————————————————
 */
export const crashRounds = sqliteTable(
  'crash_rounds',
  {
    id: text('id').primaryKey(),
    crashPoint: integer('crash_point').notNull(), // multiplier * 100 — NEVER sent to client
    hash: text('hash').notNull(),
    salt: text('salt'),
    status: text('status').notNull().default('waiting'),
    startedAt: text('started_at'),
    crashedAt: text('crashed_at'),
    betCount: integer('bet_count').notNull().default(0),
    totalBets: integer('total_bets').notNull().default(0),
    createdAt: text('created_at').notNull().default('datetime(current_timestamp)'),
    updatedAt: text('updated_at').notNull().default('datetime(current_timestamp)'),
  },
  (table) => ({
    statusIdx: index('crash_rounds_status_idx').on(table.status),
    startedAtIdx: index('crash_rounds_started_at_idx').on(table.startedAt),
  })
);

/**
 * ———————————————— Crash Bets ————————————————
 */
export const crashBets = sqliteTable(
  'crash_bets',
  {
    id: text('id').primaryKey(),
    roundId: text('round_id').notNull(),
    userId: text('user_id').notNull(),
    betAmount: integer('bet_amount').notNull(),
    autoCashoutAt: integer('auto_cashout_at'),
    cashedOut: boolean('cashed_out').notNull().default(false),
    cashoutAt: integer('cashout_at'),
    payout: integer('payout'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: text('created_at').notNull().default('datetime(current_timestamp)'),
    updatedAt: text('updated_at').notNull().default('datetime(current_timestamp)'),
  },
  (table) => ({
    roundIdIdx: index('crash_bets_round_id_idx').on(table.roundId),
    userIdIdx: index('crash_bets_user_id_idx').on(table.userId),
  })
);

/**
 * ———————————————— Transactions ————————————————
 */
export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    username: text('username'),
    type: text('type').notNull(),
    amount: integer('amount').notNull(),
    netAmount: integer('net_amount').notNull(),
    fee: integer('fee'),
    moyenPaiement: text('moyen_paiement'),
    numeroJoueur: text('numero_joueur'),
    nomJoueur: text('nom_joueur'),
    transactionId: text('transaction_id'),
    status: text('status').notNull().default('pending'),
    adminId: text('admin_id'),
    adminNotes: text('admin_notes'),
    gameId: text('game_id'),
    roundId: text('round_id'),
    createdAt: text('created_at').notNull().default('datetime(current_timestamp)'),
    updatedAt: text('updated_at').notNull().default('datetime(current_timestamp)'),
  },
  (table) => ({
    userIdIdx: index('transactions_user_id_idx').on(table.userId),
    statusIdx: index('transactions_status_idx').on(table.status),
    typeIdx: index('transactions_type_idx').on(table.type),
  })
);

/**
 * ———————————————— Game Logs ————————————————
 */
export const gameLogs = sqliteTable(
  'game_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    username: text('username'),
    gameId: text('game_id').notNull(),
    bet: integer('bet').notNull(),
    result: text('result').notNull(),
    multiplier: real('multiplier'),
    payout: integer('payout').notNull().default(0),
    mode: text('mode').notNull(),
    ruleAppliedId: text('rule_applied_id'),
    ruleAppliedDesc: text('rule_applied_desc'),
    details: text('details'),
    createdAt: text('created_at').notNull().default('datetime(current_timestamp)'),
  },
  (table) => ({
    userIdIdx: index('game_logs_user_id_idx').on(table.userId),
    gameIdIdx: index('game_logs_game_id_idx').on(table.gameId),
    createdAtIdx: index('game_logs_created_at_idx').on(table.createdAt),
  })
);
