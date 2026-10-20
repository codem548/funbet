/**
 * FunBet Casino — Constantes globales
 */

// --- Game Configuration ---
export const GAME_CONFIG = {
  mines: { minBet: 10, maxBet: 10000, defaultMines: 3 },
  crash: { minBet: 10, maxBet: 10000, defaultHouseEdge: 4.0 },
  wheel: { minBet: 10, maxBet: 10000 },
  bonanza: { minBet: 10, maxBet: 10000, buyBonusMultiplier: 100 },
} as const;

// --- Default Settings ---
export const DEFAULT_SETTINGS = {
  startingCredits: 10000,
  bankruptResetAmount: 10000,
  dailyBonusAmount: 10000,
  withdrawalFee: 0.10, // 10%
  minWithdrawal: 1000,
  autoWithdrawThreshold: 20000,
  crashBotCount: { min: 4, max: 8 },
  crashCooldownSeconds: 5,
  crashTickIntervalMs: 50,
  crashHistoryLimit: 20,
  minNewPlayerGames: 3,
  houseEdge: 4.0,
  maxWinCap: 5000000,
  maxBetLimit: 10000,
  targetRtp: 96,
  maxTreasuryRisk: 5,
} as const;

// --- Rate Limit Windows ---
export const RATE_LIMIT_WINDOWS = {
  auth: 15 * 60 * 1000, // 15 minutes
  api: 60 * 1000, // 1 minute
  game: 60 * 1000, // 1 minute
  financial: 60 * 1000, // 1 minute
} as const;

// --- Crash Bot Names ---
export const CRASH_BOT_NAMES = [
  'Koffi_225', 'Aminata_DK', 'Moussa_Bko', 'Alexandre_T', 'Fatou_99',
  'Samuel_Eto', 'Derrick_VIP', 'Nathalie_Dla', 'Ibrahim_Yde', 'PawaKing_237',
  'Cameroun_Ace', 'JeanLuc_Gagnant', 'Chantal_Yde', 'Oumar_Bko',
] as const;

// --- Wheel Segments ---
export const WHEEL_SEGMENTS: ReadonlyArray<number> = [
  50, 2, 3, 2, 5, 2, 3, 10, 2, 3, 5, 2,
  20, 2, 3, 2, 5, 2, 3, 10, 2, 3, 5, 2,
] as const;

export const VALID_WHEEL_MULTIPLIERS = [2, 3, 5, 10, 20, 50] as const;

// --- Bonanza Symbols ---
export const BONANZA_SYMBOLS = ['🍌', '🍇', '🍉', '🫐', '🍎', '🟦', '🟩', '🟪', '❤️'] as const;

export const BONANZA_PAYOUT_CONFIG: Record<string, Record<string, number>> = {
  '🍌': { '8-9': 0.25, '10-11': 0.75, '12+': 2.0 },
  '🍇': { '8-9': 0.40, '10-11': 0.90, '12+': 4.0 },
  '🍉': { '8-9': 0.50, '10-11': 1.00, '12+': 5.0 },
  '🫐': { '8-9': 0.80, '10-11': 1.20, '12+': 8.0 },
  '🍎': { '8-9': 1.00, '10-11': 1.50, '12+': 10.0 },
  '🟦': { '8-9': 1.50, '10-11': 2.00, '12+': 12.0 },
  '🟩': { '8-9': 2.00, '10-11': 5.00, '12+': 15.0 },
  '🟪': { '8-9': 2.50, '10-11': 10.00, '12+': 25.0 },
  '❤️': { '8-9': 10.00, '10-11': 25.00, '12+': 50.0 },
} as const;

// --- Mines ---
export const MINES_GRID_SIZE = 25;
export const MINES_COUNT_OPTIONS = [1, 3, 5, 10, 15, 20] as const;
export const MINES_HOUSE_EDGE = 0.03; // 3%
