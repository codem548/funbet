/**
 * FunBet Casino — Database Seeder
 *
 * Populates initial data: game definitions, default settings, test accounts.
 */
import { getDb } from './client';
import { schema } from './schema';
import { hashPassword } from '../utils/crypto';
import { logger } from '../utils/logger';

export async function seed() {
  const db = getDb();
  logger.info('🌱 Starting database seed...');

  // --- Seed Games ---
  const games = [
    {
      id: 'crash',
      name: 'Crash',
      minBet: 10,
      maxBet: 10000,
      houseEdge: 40, // 4.0% (stored * 10)
      config: { botCount: { min: 4, max: 8 }, cooldownSeconds: 5 },
    },
    {
      id: 'mines',
      name: 'Mines',
      minBet: 10,
      maxBet: 5000,
      houseEdge: 30, // 3.0%
      config: { gridSize: 25, minesOptions: [1, 3, 5, 10, 15, 20] },
    },
    {
      id: 'wheel',
      name: 'Wheel',
      minBet: 10,
      maxBet: 5000,
      houseEdge: 70, // 7.0%
      config: {},
    },
    {
      id: 'bonanza',
      name: 'Bonanza',
      minBet: 10,
      maxBet: 10000,
      houseEdge: 40, // 4.0%
      config: { buyBonusCost: 100 },
    },
  ];

  for (const game of games) {
    await db
      .insert(schema.games)
      .values(game)
      .onConflictDoNothing({ target: schema.games.id })
      .catch(() => {});
  }
  logger.info(`🎮 Seeded ${games.length} games`);

  // --- Seed Admin ---
  const adminCount = await db.execute?.('SELECT COUNT(*) as count FROM players WHERE is_admin = 1') as any[];
  if (adminCount?.[0]?.count === 0) {
    await db.insert(schema.players).values({
      username: 'admin',
      email: 'admin@funbet.local',
      passwordHash: await hashPassword('Admin@123456!', 12),
      isAdmin: true,
      solde: 0,
      credits: 999999,
      creditsFictifs: 999999,
    });
    logger.info('👮 Seeded admin account (username: admin, password: Admin@123456!)');
  }

  // --- Seed Test Player ---
  const testPlayerCount = await db.execute?.('SELECT COUNT(*) as count FROM players WHERE username = ?', ['testplayer']) as any[];
  if (testPlayerCount?.[0]?.count === 0) {
    await db.insert(schema.players).values({
      username: 'testplayer',
      email: 'test@funbet.local',
      passwordHash: await hashPassword('Test@123456', 12),
      solde: 50000,
      credits: 50000,
      creditsFictifs: 50000,
      totalBet: 0,
      totalWin: 0,
    });
    logger.info('🧪 Seeded test player (username: testplayer, password: Test@123456)');
  }

  logger.info('🌱 Seed complete!');
}
