/**
 * FunBet Casino — Legacy Data Migration
 *
 * Migrates players, transactions, and logs from the old JSON file storage
 * (used by the legacy server.ts) into the new database.
 * Also hashes plaintext passwords to bcrypt.
 */
import { getDb } from './client';
import { hashPassword } from '../utils/crypto';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Migrate legacy JSON data files into the new database.
 * Reads from the `data/` directory used by the original server.ts.
 */
export async function migrateLegacyData(dataDir: string = path.join(process.cwd(), 'data')) {
  const db = getDb();

  // Check if already migrated
  const existing = await db.execute?.('SELECT COUNT(*) as count FROM players') as any[];
  const existingCount = existing?.[0]?.count || 0;

  if (existingCount > 0) {
    logger.info(`📦 Legacy data migration skipped — ${existingCount} players already exist`);
    return;
  }

  const playersPath = path.join(dataDir, 'players.json');
  if (!fs.existsSync(playersPath)) {
    logger.info('📦 No legacy data directory found — skipping migration');
    return;
  }

  const legacyPlayers = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  let migrated = 0;

  for (const player of legacyPlayers) {
    // Hash plaintext password
    const plainPassword = player.password || `migrated-${player.id}-${Date.now()}`;
    const passwordHash = await hashPassword(plainPassword, 12);

    try {
      await db.run(
        `INSERT OR REPLACE INTO players (
          id, username, email, password_hash, solde, credits, credits_fictifs,
          revenu, total_bet, total_win, total_deposit, total_withdrawal,
          payment_method, payment_number, payment_name, pays, telephone,
          is_admin, is_frozen, server_seed, client_seed, nonce, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          player.id,
          player.username,
          player.email || `${player.username}@casino.local`,
          passwordHash,
          player.solde || 0,
          player.credits || 10000,
          player.credits_fictifs || 0,
          player.revenu || 0,
          player.totalBet || 0,
          player.totalWin || 0,
          player.total_deposit || 0,
          player.total_retrait || 0,
          player.payment_method,
          player.payment_number,
          player.payment_name,
          player.pays,
          player.telephone,
          player.isAdmin ? 1 : 0,
          player.isFrozen ? 1 : 0,
          player.serverSeed || player.seed,
          player.clientSeed || player.clientseed,
          player.nonce || 0,
          player.created_at || new Date().toISOString(),
          player.updated_at || new Date().toISOString(),
        ]
      );
      migrated++;
    } catch (err) {
      logger.warn({ err, username: player.username }, 'Failed to migrate player — skipping');
    }
  }

  // Migrate transactions
  const txnsPath = path.join(dataDir, 'transactions.json');
  if (fs.existsSync(txnsPath)) {
    const legacyTxns = JSON.parse(fs.readFileSync(txnsPath, 'utf-8'));
    for (const tx of legacyTxns) {
      await db.run(
        `INSERT OR REPLACE INTO transactions (
          id, user_id, username, type, amount, net_amount, moyen_paiement,
          numero_joueur, nom_joueur, transaction_id, status, game_id, round_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tx.id, tx.userId, tx.username, tx.type, tx.amount, tx.netAmount,
          tx.moyen_paiement, tx.numero_joueur, tx.nom_joueur, tx.transactionId,
          tx.status, tx.gameId, tx.roundId, tx.timestamp, tx.timestamp
        ]
      ).catch(() => {});
    }
    logger.info(`📦 Migrated ${legacyTxns.length} transactions`);
  }

  logger.info(`📦 Migrated ${migrated}/${legacyPlayers.length} players with bcrypt-hashed passwords`);
}

/**
 * Migrate plaintext passwords to bcrypt hashes for existing records.
 * Run after deploying the new auth system.
 */
export async function migratePasswordsToHash() {
  const db = getDb();
  const playersToUpdate = await db.execute?.(
    `SELECT id, password_hash FROM players WHERE password_hash NOT LIKE '$2b$%' AND password_hash IS NOT NULL`
  ) as any[];

  if (!playersToUpdate || playersToUpdate.length === 0) {
    logger.info('🔒 All passwords already hashed — no migration needed');
    return;
  }

  let migrated = 0;
  for (const player of playersToUpdate) {
    try {
      const hash = await hashPassword(player.password_hash, 12);
      await db.execute?.(
        'UPDATE players SET password_hash = ? WHERE id = ?',
        [hash, player.id]
      );
      migrated++;
    } catch (err) {
      logger.error({ err, playerId: player.id }, 'Failed to hash password during migration');
    }
  }

  logger.info(`🔒 Migrated ${migrated}/${playersToUpdate.length} plaintext passwords to bcrypt`);
}
