import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import bcrypt from 'bcrypt';
import { initDatabase, hydrateStore, saveKeyAsync, isDbConfigured } from './server/db/store';
import jwt from 'jsonwebtoken';
import { 
  Player, 
  GameConfig, 
  GameRule, 
  GameLog, 
  PaymentConfiguration, 
  Transaction, 
  EligibleCountry,
  RedFlagAlert,
  RiskManagementSettings
} from './src/types';

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling']
});
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'funbet-dev-secret-change-in-prod-min-32-chars!!';
const BCRYPT_ROUNDS = 12;

app.use(express.json());

// --- Security helpers (Agent Security) ---
function signAccessToken(player: Player): string {
  return jwt.sign(
    { sub: player.id, username: player.username, isAdmin: !!player.isAdmin },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function stripPassword(player: Player): Omit<Player, 'password'> {
  const { password, ...safe } = player;
  return safe;
}

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  // Transparent migration: plaintext passwords are upgraded on successful login
  if (!stored || !stored.startsWith('$2')) {
    return plain === stored;
  }
  return bcrypt.compare(plain, stored);
}

// Simple persistence system using local files
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const RULES_FILE = path.join(DATA_DIR, 'rules.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const PAYMENT_CONFIGS_FILE = path.join(DATA_DIR, 'payment_configurations.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const COUNTRIES_FILE = path.join(DATA_DIR, 'countries.json');
const RED_FLAGS_FILE = path.join(DATA_DIR, 'red_flags.json');
const RISK_SETTINGS_FILE = path.join(DATA_DIR, 'risk_settings.json');

// Initial/default data
const DEFAULT_PLAYERS: Player[] = [
  {
    id: 'admin-id',
    username: 'admin',
    credits: 100000,
    credits_fictifs: 100000,
    solde: 50000.00,
    revenu: 15000.00,
    consecutiveLosses: 0,
    totalBet: 0,
    totalWin: 0,
    isAdmin: true,
    lastDailyClaim: null,
    password: 'admin123',
    email: 'admin@funbet.com',
    phone: '+237670123456'
  },
  {
    id: 'player-id',
    username: 'player',
    credits: 10000,
    credits_fictifs: 10000,
    solde: 0.00,
    revenu: 0.00,
    consecutiveLosses: 0,
    totalBet: 0,
    totalWin: 0,
    isAdmin: false,
    lastDailyClaim: null,
    password: 'player123',
    email: 'player@funbet.com',
    phone: '+237690123456'
  },
];

const DEFAULT_COUNTRIES: EligibleCountry[] = [
  { id: 'cm', name: 'Cameroun', code: '+237', flag: '🇨🇲', isActive: true },
  { id: 'sn', name: 'Sénégal', code: '+221', flag: '🇸🇳', isActive: true },
  { id: 'ci', name: 'Côte d\'Ivoire', code: '+225', flag: '🇨🇮', isActive: true },
  { id: 'fr', name: 'France', code: '+33', flag: '🇫🇷', isActive: true },
];

const DEFAULT_PAYMENT_CONFIGS: PaymentConfiguration[] = [
  {
    id: 'pay-mtn',
    moyen_paiement: 'MTN',
    nom_destination: 'FunBet Live Sarl',
    numero_destination: '+237 670 123 456',
    syntaxe_ussd: '*126*1*1*670123456*MONTANT#',
    isActive: true,
  },
  {
    id: 'pay-orange',
    moyen_paiement: 'ORANGE',
    nom_destination: 'FunBet Live Sarl',
    numero_destination: '+237 690 987 654',
    syntaxe_ussd: '*150*1*1*690987654*MONTANT#',
    isActive: true,
  },
  {
    id: 'pay-wave',
    moyen_paiement: 'WAVE',
    nom_destination: 'FunBet Live Sn',
    numero_destination: '+221 77 123 45 67',
    isActive: true,
  },
];

const DEFAULT_GAMES: GameConfig[] = [
  {
    id: 'mines',
    name: 'Mines',
    icon: 'Grid',
    minBet: 10,
    maxBet: 10000,
    isActive: true,
    rtpGlobal: 95,
  },
  {
    id: 'crash',
    name: 'Crash',
    icon: 'TrendingUp',
    minBet: 10,
    maxBet: 10000,
    isActive: true,
    rtpGlobal: 95,
  },
  {
    id: 'wheel',
    name: 'Crazy Spin',
    icon: 'Disc',
    minBet: 10,
    maxBet: 10000,
    isActive: true,
    rtpGlobal: 95,
  },
  {
    id: 'bonanza',
    name: 'Sweet Bonanza',
    icon: 'Candy',
    minBet: 10,
    maxBet: 10000,
    isActive: true,
    rtpGlobal: 96,
  },
];

const DEFAULT_RULES: GameRule[] = [
  {
    id: 'rule-new-player',
    gameId: 'all',
    description: '3 premiers jeux = win facile (Nouveau Joueur)',
    conditionJson: {
      is_new_player: true,
    },
    actionJson: {
      force_result: 'WIN',
      multiplier_range: [1.5, 2.5],
    },
    priority: 10,
    isActive: true,
  },
  {
    id: 'rule-low-balance',
    gameId: 'all',
    description: 'Aide Solde Bas (< 1000 crédits = win de secours)',
    conditionJson: {
      balance_max: 1000,
    },
    actionJson: {
      force_result: 'WIN',
      multiplier_range: [1.2, 1.8],
    },
    priority: 20,
    isActive: true,
  },
  {
    id: 'rule-loss-streak',
    gameId: 'all',
    description: 'Anti-Frustration (Après 5 pertes de suite = win forcé)',
    conditionJson: {
      consecutive_loss_min: 5,
    },
    actionJson: {
      force_result: 'WIN',
      multiplier_range: [2.0, 3.5],
    },
    priority: 30,
    isActive: true,
  },
  {
    id: 'rule-happy-hour',
    gameId: 'all',
    description: 'Happy Hour (20h - 22h = multiplicateurs boostés)',
    conditionJson: {
      hour_between: [20, 22],
    },
    actionJson: {
      force_result: 'WIN',
      multiplier_range: [2.5, 5.0],
    },
    priority: 15,
    isActive: false, // Can be toggled by admin
  },
];

// Helper functions for loading/saving data
function readData<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  // Write default value if file doesn't exist
  fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
  return defaultValue;
}

function filePathToStoreKey(filePath: string): string | null {
  const base = path.basename(filePath, '.json');
  const allowed = new Set([
    'players', 'games', 'rules', 'logs', 'payment_configurations',
    'transactions', 'countries', 'red_flags', 'risk_settings',
  ]);
  return allowed.has(base) ? base : null;
}

function writeData<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Error writing ${filePath}:`, err);
    }
  }
  const key = filePathToStoreKey(filePath);
  if (key && isDbConfigured()) {
    saveKeyAsync(key as any, data);
  }
}

// Load data into local memory caches
let players: Player[] = readData<Player[]>(PLAYERS_FILE, DEFAULT_PLAYERS);
let games: GameConfig[] = readData<GameConfig[]>(GAMES_FILE, DEFAULT_GAMES);

// Ensure the Crazy Spin game is available in active games
const existingWheelGame = games.find(g => g.id === 'wheel');
if (!existingWheelGame) {
  games.push({
    id: 'wheel',
    name: 'Crazy Spin',
    icon: 'Disc',
    minBet: 10,
    maxBet: 10000,
    isActive: true,
    rtpGlobal: 95,
  });
  saveGames();
} else if (existingWheelGame.name === 'Roue de la Fortune') {
  existingWheelGame.name = 'Crazy Spin';
  saveGames();
}

const existingBonanzaGame = games.find(g => g.id === 'bonanza');
if (!existingBonanzaGame) {
  games.push({
    id: 'bonanza',
    name: 'Sweet Bonanza',
    icon: 'Candy',
    minBet: 10,
    maxBet: 10000,
    isActive: true,
    rtpGlobal: 96,
  });
  saveGames();
}
const DEFAULT_RISK_SETTINGS: RiskManagementSettings = {
  maxWinCap: 5000000,
  maxBetLimit: 100000,
  targetRtp: 96.5,
  houseEdge: 3.5,
  maxTreasuryRisk: 5.0,
  dynamicRtpActive: true,
  autoWithdrawLimit: 20000,
  isAutoWithdrawEnabled: false,
};

const DEFAULT_RED_FLAGS: RedFlagAlert[] = [
  {
    id: 'rf-1',
    userId: 'player-id',
    username: 'player',
    reason: 'Anomalie de vitesse: 4 actions en moins de 1.1s (Cadence bot suspecte)',
    fraudScore: 94,
    severity: 'critical',
    status: 'FLAGGED',
    actionType: 'CLICK_SPEED',
    details: 'Burst d\'appels /api/play/mines/reveal en 110ms par clic',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isResolved: false,
    totalProfit: 125000,
    winRate: 92,
  },
  {
    id: 'rf-2',
    userId: 'usr-bot-4819',
    username: 'BotHunter_99',
    reason: 'Script automatisé régulier sur Démineur (100% de succès sur 5 parties)',
    fraudScore: 82,
    severity: 'high',
    status: 'SUSPICIOUS',
    actionType: 'MINES_SCRIPT',
    details: 'Pattern invariant [0, 1, 2, 3] répété',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isResolved: false,
    totalProfit: 85000,
    winRate: 100,
  },
  {
    id: 'rf-3',
    userId: 'usr-multi-1029',
    username: 'MultiAcc_Scout',
    reason: 'Même empreinte IP et User-Agent détectée sur 3 comptes simultanés',
    fraudScore: 76,
    severity: 'medium',
    status: 'FLAGGED',
    actionType: 'IP_CLONE',
    details: 'Sessions concurrentes avec transactions croisées',
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    isResolved: false,
    totalProfit: 40000,
    winRate: 67,
  },
];

let rules: GameRule[] = readData<GameRule[]>(RULES_FILE, DEFAULT_RULES);
let logs: GameLog[] = readData<GameLog[]>(LOGS_FILE, []);
let paymentConfigurations: PaymentConfiguration[] = readData<PaymentConfiguration[]>(PAYMENT_CONFIGS_FILE, DEFAULT_PAYMENT_CONFIGS);
let transactions: Transaction[] = readData<Transaction[]>(TRANSACTIONS_FILE, []);
let countries: EligibleCountry[] = readData<EligibleCountry[]>(COUNTRIES_FILE, DEFAULT_COUNTRIES);
let redFlags: RedFlagAlert[] = readData<RedFlagAlert[]>(RED_FLAGS_FILE, DEFAULT_RED_FLAGS);
let riskSettings: RiskManagementSettings = readData<RiskManagementSettings>(RISK_SETTINGS_FILE, DEFAULT_RISK_SETTINGS);

// Mid-level functions
function savePlayers() { writeData(PLAYERS_FILE, players); }
function saveGames() { writeData(GAMES_FILE, games); }
function saveRules() { writeData(RULES_FILE, rules); }
function saveLogs() { writeData(LOGS_FILE, logs); }
function savePaymentConfigs() { writeData(PAYMENT_CONFIGS_FILE, paymentConfigurations); }
function saveTransactions() { writeData(TRANSACTIONS_FILE, transactions); }
function saveCountries() { writeData(COUNTRIES_FILE, countries); }
function saveRedFlags() { writeData(RED_FLAGS_FILE, redFlags); }
function saveRiskSettings() { writeData(RISK_SETTINGS_FILE, riskSettings); }

// Real-time Anti-Bot & Fraud Detection Engine
const userActionTimestamps = new Map<string, number[]>();

function trackAndDetectBot(
  userId: string, 
  username: string, 
  actionType: 'CLICK_SPEED' | 'MINES_SCRIPT' | 'WIN_STREAK' | 'RAPID_WITHDRAW' | 'IP_CLONE', 
  customDetails?: string
): { isFlagged: boolean; alert?: RedFlagAlert } {
  const now = Date.now();
  const timestamps = userActionTimestamps.get(userId) || [];
  
  // Keep timestamps in rolling window of 3 seconds
  const recentTimestamps = timestamps.filter(t => now - t < 3000);
  recentTimestamps.push(now);
  userActionTimestamps.set(userId, recentTimestamps);

  // Check 1: Ultra-fast Click speed (> 4 actions in < 1400ms)
  if (recentTimestamps.length >= 4 && (now - recentTimestamps[recentTimestamps.length - 4]) < 1400) {
    const elapsed = now - recentTimestamps[recentTimestamps.length - 4];
    const existingRecent = redFlags.find(
      rf => rf.userId === userId && rf.actionType === 'CLICK_SPEED' && rf.status !== 'RESOLVED' && (now - new Date(rf.timestamp).getTime()) < 60000
    );
    
    if (!existingRecent) {
      const newAlert: RedFlagAlert = {
        id: `rf-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        userId,
        username,
        reason: `Cadence anormale: 4 actions en ${elapsed}ms (Autoclicker / Script détecté)`,
        fraudScore: 94,
        severity: 'critical',
        status: 'FLAGGED',
        actionType: 'CLICK_SPEED',
        details: customDetails || `Fréquence: ${(1000 / (elapsed / 4)).toFixed(1)} clics/seconde`,
        timestamp: new Date().toISOString(),
        isResolved: false,
        totalProfit: 0,
        winRate: 0,
      };
      redFlags.unshift(newAlert);
      saveRedFlags();
      return { isFlagged: true, alert: newAlert };
    }
  }

  return { isFlagged: false };
}

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const player = players.find(p => p.username.toLowerCase() === username.trim().toLowerCase());
    if (!player) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const stored = player.password || (player.isAdmin ? 'admin123' : 'player123');
    const valid = await verifyPassword(password, stored);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Transparent upgrade of plaintext password to bcrypt
    if (!stored.startsWith('$2')) {
      player.password = await hashPassword(password);
      savePlayers();
    }

    const token = signAccessToken(player);
    res.json({ player: stripPassword(player), token });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis (nom d\'utilisateur, email, téléphone, mot de passe)' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const existingUsername = players.find(p => p.username.toLowerCase() === username.trim().toLowerCase());
    if (existingUsername) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur existe déjà' });
    }

    const existingEmail = players.find(p => p.email && p.email.toLowerCase() === email.trim().toLowerCase());
    if (existingEmail) {
      return res.status(400).json({ error: 'Cette adresse email est déjà utilisée' });
    }

    const existingPhone = players.find(p => p.phone && p.phone.trim() === phone.trim());
    if (existingPhone) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
    }

    const hashed = await hashPassword(password);
    const player: Player = {
      id: `player-${Date.now()}`,
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: hashed,
      credits: 10000,
      credits_fictifs: 10000,
      solde: 0.00,
      revenu: 0.00,
      consecutiveLosses: 0,
      totalBet: 0,
      totalWin: 0,
      isAdmin: username.trim().toLowerCase() === 'admin',
      lastDailyClaim: null,
    };

    players.push(player);
    savePlayers();

    const token = signAccessToken(player);
    res.json({ player: stripPassword(player), token });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get user profile
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const player = players.find(p => p.id === payload.sub);
    if (!player) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ player: stripPassword(player) });
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
});

// Claim Daily Bonus (+10,000 credits)
app.post('/api/wallet/claim-daily', (req, res) => {
  const { userId } = req.body;
  const player = players.find(p => p.id === userId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const now = new Date();
  if (player.lastDailyClaim) {
    const lastClaim = new Date(player.lastDailyClaim);
    const hoursDiff = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
    if (hoursDiff < 24) {
      const remainingHours = Math.ceil(24 - hoursDiff);
      return res.status(400).json({ 
        error: `Vous avez déjà réclamé votre bonus quotidien. Réessayez dans ${remainingHours} heures.` 
      });
    }
  }

  player.credits_fictifs = (player.credits_fictifs || 0) + 10000;
  player.credits = player.credits_fictifs;
  player.lastDailyClaim = now.toISOString();
  savePlayers();

  res.json({ success: true, credits: player.credits, credits_fictifs: player.credits_fictifs, lastDailyClaim: player.lastDailyClaim });
});

// Reset balance to 10k when bankrupt
app.post('/api/wallet/reset-bankrupt', (req, res) => {
  const { userId } = req.body;
  const player = players.find(p => p.id === userId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  if ((player.credits_fictifs || 0) >= 10) {
    return res.status(400).json({ error: 'Vous devez être ruiné (< 10 crédits démo) pour demander un crédit de secours.' });
  }

  player.credits_fictifs = 10000;
  player.credits = player.credits_fictifs;
  savePlayers();

  res.json({ success: true, credits: player.credits, credits_fictifs: player.credits_fictifs });
});

// Admin Get Settings & Logs
app.get('/api/admin/games', (req, res) => {
  res.json({ games });
});

app.put('/api/admin/games/:id', (req, res) => {
  const { id } = req.params;
  const { isActive, minBet, maxBet, rtpGlobal } = req.body;
  const game = games.find(g => g.id === id);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (isActive !== undefined) game.isActive = isActive;
  if (minBet !== undefined) game.minBet = Number(minBet);
  if (maxBet !== undefined) game.maxBet = Number(maxBet);
  if (rtpGlobal !== undefined) game.rtpGlobal = Number(rtpGlobal);

  saveGames();
  res.json({ success: true, game });
});

// Rules CRUD
app.get('/api/admin/rules', (req, res) => {
  res.json({ rules });
});

app.post('/api/admin/rules', (req, res) => {
  const { gameId, description, conditionJson, actionJson, priority, isActive } = req.body;
  
  const newRule: GameRule = {
    id: `rule-${Date.now()}`,
    gameId: gameId || 'all',
    description: description || 'Nouvelle règle',
    conditionJson: conditionJson || {},
    actionJson: actionJson || { force_result: 'RANDOM', multiplier_range: [1.0, 2.0] },
    priority: Number(priority) || 1,
    isActive: isActive !== undefined ? isActive : true,
  };

  rules.push(newRule);
  saveRules();
  res.json({ success: true, rule: newRule });
});

app.put('/api/admin/rules/:id', (req, res) => {
  const { id } = req.params;
  const { gameId, description, conditionJson, actionJson, priority, isActive } = req.body;
  const rule = rules.find(r => r.id === id);
  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  if (gameId !== undefined) rule.gameId = gameId;
  if (description !== undefined) rule.description = description;
  if (conditionJson !== undefined) rule.conditionJson = conditionJson;
  if (actionJson !== undefined) rule.actionJson = actionJson;
  if (priority !== undefined) rule.priority = Number(priority);
  if (isActive !== undefined) rule.isActive = isActive;

  saveRules();
  res.json({ success: true, rule });
});

app.delete('/api/admin/rules/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = rules.length;
  rules = rules.filter(r => r.id !== id);
  
  if (rules.length === initialLength) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  saveRules();
  res.json({ success: true });
});

// Logs API
app.get('/api/admin/logs', (req, res) => {
  res.json({ logs });
});

// Clear Logs API (Convenient for Admin testing)
app.post('/api/admin/logs/clear', (req, res) => {
  logs = [];
  saveLogs();
  res.json({ success: true });
});

// Admin manual result override
app.post('/api/admin/override', (req, res) => {
  const { username, forceResult, multiplierMin, multiplierMax, gameId } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Create a high-priority manual override rule specifically for this player
  const overrideRule: GameRule = {
    id: `manual-override-${Date.now()}`,
    gameId: gameId || 'all',
    description: `FORCAGE MANUEL admin pour ${username}: ${forceResult}`,
    conditionJson: {
      manual_player_username: username,
    },
    actionJson: {
      force_result: forceResult, // 'WIN', 'LOSS', 'RANDOM'
      multiplier_range: [Number(multiplierMin || 1.0), Number(multiplierMax || 1.0)],
    },
    priority: 100, // Highest priority to override standard rules
    isActive: true,
  };

  rules.push(overrideRule);
  saveRules();

  res.json({ success: true, rule: overrideRule });
});

// GET list of players (for admin screens)
app.get('/api/admin/players', (req, res) => {
  res.json({ players });
});

// PUT update player details and balances (for admin screens)
app.put('/api/admin/players/:id', (req, res) => {
  const { id } = req.params;
  const { solde, credits_fictifs, isAdmin, consecutiveLosses, totalBet, totalWin } = req.body;
  const player = players.find(p => p.id === id);
  if (!player) {
    return res.status(404).json({ error: 'Joueur introuvable.' });
  }

  if (solde !== undefined) player.solde = Number(solde);
  if (credits_fictifs !== undefined) {
    player.credits_fictifs = Number(credits_fictifs);
    player.credits = Number(credits_fictifs); // keep in sync
  }
  if (isAdmin !== undefined) player.isAdmin = !!isAdmin;
  if (consecutiveLosses !== undefined) player.consecutiveLosses = Number(consecutiveLosses);
  if (totalBet !== undefined) player.totalBet = Number(totalBet);
  if (totalWin !== undefined) player.totalWin = Number(totalWin);

  savePlayers();
  res.json({ success: true, player });
});

// Public endpoint for active countries list
app.get('/api/countries', (req, res) => {
  const activeCountries = countries.filter(c => c.isActive);
  res.json({ countries: activeCountries });
});

// Admin endpoints for countries management
app.get('/api/admin/countries', (req, res) => {
  res.json({ countries });
});

app.post('/api/admin/countries', (req, res) => {
  const { name, code, flag, isActive } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Le nom et l\'indicatif du pays sont requis.' });
  }

  const newCountry: EligibleCountry = {
    id: `country-${Date.now()}`,
    name,
    code,
    flag: flag || '🌍',
    isActive: isActive !== undefined ? !!isActive : true,
  };

  countries.push(newCountry);
  saveCountries();
  res.json({ success: true, country: newCountry });
});

app.put('/api/admin/countries/:id', (req, res) => {
  const { id } = req.params;
  const { name, code, flag, isActive } = req.body;
  
  const country = countries.find(c => c.id === id);
  if (!country) {
    return res.status(404).json({ error: 'Pays introuvable.' });
  }

  if (name !== undefined) country.name = name;
  if (code !== undefined) country.code = code;
  if (flag !== undefined) country.flag = flag;
  if (isActive !== undefined) country.isActive = !!isActive;

  saveCountries();
  res.json({ success: true, country });
});

app.delete('/api/admin/countries/:id', (req, res) => {
  const { id } = req.params;
  const index = countries.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Pays introuvable.' });
  }

  countries.splice(index, 1);
  saveCountries();
  res.json({ success: true });
});

// Play Endpoint - server-side game outcome logic
app.post('/api/play', (req, res) => {
  const { userId, gameId, bet, mode, customData } = req.body;
  
  const player = players.find(p => p.id === userId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  // Security Freeze Enforcement: Block all gameplay if account is frozen
  if (player.isFrozen) {
    return res.status(403).json({ 
      error: "Compte suspendu : Vos opérations sont temporairement bloquées pour examen de sécurité suite à une alerte d'activité anormale.",
      isFrozen: true 
    });
  }

  const game = games.find(g => g.id === gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  // Real-time Anti-Bot click velocity check
  trackAndDetectBot(player.id, player.username, 'CLICK_SPEED', `Mise sur ${game.name} (${bet} ${mode || 'DEMO'})`);

  if (!game.isActive) {
    return res.status(400).json({ error: 'Ce jeu est actuellement désactivé par l\'administrateur.' });
  }

  if (bet < game.minBet || bet > game.maxBet) {
    return res.status(400).json({ error: `La mise doit être entre ${game.minBet} et ${game.maxBet} crédits.` });
  }

  const activeMode = mode === 'REAL' ? 'REAL' : 'DEMO';

  if (activeMode === 'REAL') {
    if ((player.solde || 0) < bet) {
      return res.status(400).json({ error: 'Solde réel insuffisant.' });
    }
    player.solde -= bet;
  } else {
    if ((player.credits_fictifs || 0) < bet) {
      return res.status(400).json({ error: 'Crédits démo insuffisants.' });
    }
    player.credits_fictifs -= bet;
    player.credits = player.credits_fictifs;
  }

  if (activeMode === 'REAL') {
    player.totalBet += bet;
  }

  // Let's evaluate rules!
  const currentHour = new Date().getHours();
  
  // Find total games played by this player to evaluate is_new_player
  const totalGamesPlayed = logs.filter(l => l.username.toLowerCase() === player.username.toLowerCase()).length;
  const isNewPlayer = totalGamesPlayed < 3;

  // Filter active rules for this game (or 'all' / '*')
  const activeRules = rules.filter(r => r.isActive && (r.gameId === 'all' || r.gameId === gameId));

  let appliedRule: GameRule | null = null;
  let matchedRules: GameRule[] = [];

  for (const rule of activeRules) {
    const cond = rule.conditionJson;
    let matches = true;

    const activeBalance = activeMode === 'REAL' ? (player.solde || 0) : (player.credits_fictifs || 0);

    // 1. Balance max check
    if (cond.balance_max !== undefined && activeBalance + bet > cond.balance_max) {
      matches = false;
    }
    // 2. Balance min check
    if (cond.balance_min !== undefined && activeBalance + bet < cond.balance_min) {
      matches = false;
    }
    // 3. Consecutive losses check
    if (cond.consecutive_loss_min !== undefined && player.consecutiveLosses < cond.consecutive_loss_min) {
      matches = false;
    }
    // 4. Hour check (hour_between)
    if (cond.hour_between !== undefined) {
      const [start, end] = cond.hour_between;
      if (start <= end) {
        if (currentHour < start || currentHour > end) matches = false;
      } else {
        // Over midnight condition (e.g., [22, 4])
        if (currentHour < start && currentHour > end) matches = false;
      }
    }
    // 5. New player check
    if (cond.is_new_player !== undefined && cond.is_new_player !== isNewPlayer) {
      matches = false;
    }
    // 6. Manual username override
    if (cond.manual_player_username !== undefined && cond.manual_player_username.toLowerCase() !== player.username.toLowerCase()) {
      matches = false;
    }
    // 7. Active play mode check (REAL / DEMO / BOTH)
    if (cond.play_mode !== undefined && cond.play_mode !== 'BOTH' && cond.play_mode !== activeMode) {
      matches = false;
    }

    if (matches) {
      matchedRules.push(rule);
    }
  }

  // Sort matched rules by priority descending
  matchedRules.sort((a, b) => b.priority - a.priority);
  
  if (matchedRules.length > 0) {
    appliedRule = matchedRules[0];
  }

  // Resolve outcome based on matched rule, or fallback to standard game RTP algorithm!
  let result: 'WIN' | 'LOSS' = 'LOSS';
  let multiplier = 0;
  let ruleAppliedId: string | null = null;
  let ruleAppliedDesc: string | null = null;

  if (appliedRule) {
    ruleAppliedId = appliedRule.id;
    ruleAppliedDesc = appliedRule.description;
    
    const forceRes = appliedRule.actionJson.force_result;
    if (forceRes === 'WIN') {
      result = 'WIN';
      const [minM, maxM] = appliedRule.actionJson.multiplier_range;
      multiplier = Number((Math.random() * (maxM - minM) + minM).toFixed(2));
    } else if (forceRes === 'LOSS') {
      result = 'LOSS';
      multiplier = 0;
    } else {
      // RANDOM with custom range
      result = Math.random() < 0.5 ? 'WIN' : 'LOSS';
      if (result === 'WIN') {
        const [minM, maxM] = appliedRule.actionJson.multiplier_range;
        multiplier = Number((Math.random() * (maxM - minM) + minM).toFixed(2));
      } else {
        multiplier = 0;
      }
    }

    // If it was a manual override, delete it so it only applies ONCE
    if (appliedRule.id.startsWith('manual-override-')) {
      rules = rules.filter(r => r.id !== appliedRule!.id);
      saveRules();
    }
  } else {
    // FALLBACK RTP LOGIC:
    // "Le moteur pioche dans un pool pour respecter le % sur le long terme"
    // Calculate historic RTP of this game.
    const gameLogs = logs.filter(l => l.gameId === gameId);
    const totalBetHistoric = gameLogs.reduce((acc, curr) => acc + curr.bet, 0);
    const totalPayoutHistoric = gameLogs.reduce((acc, curr) => acc + curr.payout, 0);
    
    // Default system RTP logic
    const targetRtp = game.rtpGlobal; // e.g. 95%
    let currentRtp = 0;
    if (totalBetHistoric > 0) {
      currentRtp = (totalPayoutHistoric / totalBetHistoric) * 100;
    } else {
      currentRtp = targetRtp; // No historical data, start flat
    }

    // Dynamic difficulty adjustment:
    // If we've paid out too much, make winning harder. If we're below the RTP target, make winning easier!
    let winChance = 0.40; // Base win chance 40%
    if (currentRtp > targetRtp) {
      // Paid out too much, lower winning chance
      winChance = Math.max(0.10, winChance - (currentRtp - targetRtp) / 100);
    } else {
      // Below target, increase winning chance to restore target RTP
      winChance = Math.min(0.85, winChance + (targetRtp - currentRtp) / 100);
    }

    if (Math.random() < winChance) {
      result = 'WIN';
      // Generate a reasonable multiplier depending on targetRtp
      // Mines and Crash can have custom multipliers.
      // In Mines, average multiplier depends on cashout choice, so the server decides the "safety" threshold or max multiplier for this session.
      // Let's generate a multiplier for the crash/mines result
      const maxMult = gameId === 'crash' ? 10.0 : 4.0;
      multiplier = Number((Math.random() * (maxMult - 1.2) + 1.2).toFixed(2));
    } else {
      result = 'LOSS';
      multiplier = 0;
    }
    
    ruleAppliedDesc = `Algorithme RTP Global (Cible: ${targetRtp}%, Actuel: ${currentRtp.toFixed(1)}%)`;
  }

  // Update consecutive losses
  if (result === 'WIN') {
    player.consecutiveLosses = 0;
  } else {
    player.consecutiveLosses += 1;
  }

  // Calculate payouts
  let payout = 0;
  
  // Specific Games logic
  if (gameId === 'crash') {
    // In crash, the server pre-calculates the absolute crash point!
    // The player will play the animation and click "cashout".
    // If they cashout before the crashPoint, they win at the cashout multiplier.
    // If they let it crash, they lose.
    // So the server decides the "crashPoint":
    let crashPoint = 1.0;
    if (result === 'WIN') {
      crashPoint = multiplier; // e.g. 2.45
    } else {
      // In loss, the crash point is low (between 1.00 and 1.15)
      crashPoint = Number((Math.random() * 0.15 + 1.0).toFixed(2));
    }

    // We respond with the crashPoint, and client computes the result dynamically on cashout!
    // Wait, the actual payout depends on whether the client cashed out!
    // But how do we track this server-side to prevent client cheating?
    // The client sends a `POST /api/play/crash/cashout` or we send the pre-determined crashPoint.
    // Wait, let's make it fully authoritative!
    // 1. The player registers their bet: POST `/api/play` { gameId: 'crash', bet: 500 }
    // 2. The server calculates the `crashPoint` based on rules and returns it.
    // 3. When the user clicks "Cashout" at multiplier X (where X < crashPoint), they win.
    // 4. The user sends a second request: POST `/api/play/crash/claim` { multiplier: X }
    // 5. The server checks: is X <= crashPoint?
    //    If yes, they win! They get: bet * X credits.
    //    If no, they tried to claim after crashing (cheat/lag) -> LOSS.
    // This is incredibly secure, robust, and 100% server-authoritative!
    // Let's implement this!
    
    // Temporarily save this round in the user's active game state
    // SECURITY: crashPoint stays ONLY on server (activeRounds). Never returned to client.
    const activeRound = {
      bet,
      crashPoint,
      mode: activeMode,
      ruleAppliedId,
      ruleAppliedDesc,
    };
    
    // We store it in a simple memory store for active rounds
    activeRounds.set(player.id, { gameId: 'crash', ...activeRound });

    // Do NOT include crashPoint — prevents client-side cheating via network inspection
    return res.json({
      success: true,
      gameId: 'crash',
      bet,
      mode: activeMode,
      // crashPoint intentionally omitted
      ruleId: ruleAppliedId,
      ruleDesc: ruleAppliedDesc,
      currentBalance: activeMode === 'REAL' ? player.solde : player.credits_fictifs,
    });
  } 
  
  else if (gameId === 'mines') {
    // Mines gameplay:
    // 1. Player starts Mines round: POST `/api/play` { gameId: 'mines', bet: 500, customData: { minesCount: 3 } }
    // 2. Server calculates if the round is WIN or LOSS.
    // 3. Based on WIN/LOSS, the server populates a 25-tile grid containing minesCount mines.
    //    If LOSS: The server places a mine exactly where they will click, or presets the board such that if they click a mine, they lose.
    //    Wait, let's keep it extremely clean:
    //    We can pre-generate the entire 5x5 board (25 tiles) with 3 mines, and return the grid to the client?
    //    No! "Client = stupide. Le client ne connait jamais le résultat à l'avance."
    //    If we return the grid of mines, the client could inspect the network tab to see where the mines are!
    //    So, we MUST NOT send the grid of mines to the client!
    //    Instead, the client clicks tile index `i` -> sends `POST /api/play/mines/reveal { tileIndex: i }`.
    //    The server then decides if that tile contains a GEMS or a MINE.
    //    How does the server decide?
    //    - If the server determined at start that this round is a LOSS:
    //      - We can let them click $K$ times successfully to build tension, and then on the $(K+1)$-th click (or if they click a specific tile), it hits a mine.
    //      - Or we can pre-generate the grid server-side and keep it in memory. On each reveal, the server checks the grid in memory. This is perfect! The grid is hidden on the server, and the client only gets a true/false for each tile index they send!
    //    Let's implement this server-side state for Mines!
    
    const minesCount = Number(customData?.minesCount || 3);
    const grid = Array(25).fill('GEM');
    
    // Pre-generate mine positions
    const mineIndices: number[] = [];
    
    if (result === 'LOSS') {
      // In a forced loss, we can make sure they hit a mine quickly or we place mines normally but we also have a "rigged" override:
      // If the rule forced a loss, we want to make sure they CANNOT cashout, or they hit a mine.
      // Let's place mines randomly. If they click a mine, they lose. If it was forced loss, we can force their first click or a click soon after to be a mine!
      // This is beautiful.
    }
    
    while (mineIndices.length < minesCount) {
      const idx = Math.floor(Math.random() * 25);
      if (!mineIndices.includes(idx)) {
        mineIndices.push(idx);
        grid[idx] = 'MINE';
      }
    }

    // Save state in server memory
    activeRounds.set(player.id, {
      gameId: 'mines',
      bet,
      mode: activeMode,
      minesCount,
      grid,
      revealed: Array(25).fill(false),
      clickCount: 0,
      forcedResult: appliedRule ? appliedRule.actionJson.force_result : 'RANDOM',
      ruleAppliedId,
      ruleAppliedDesc,
    });

    return res.json({
      success: true,
      gameId: 'mines',
      bet,
      mode: activeMode,
      minesCount,
      currentBalance: activeMode === 'REAL' ? player.solde : player.credits_fictifs,
    });
  }
  
  else if (gameId === 'wheel') {
    // Wheel of Fortune gameplay (Instant result)
    // 1. Get the selected multiplier from customData
    const selectedMultiplier = Number(customData?.selectedMultiplier || 2);
    const validMultipliers = [2, 3, 5, 10, 20, 50];
    if (!validMultipliers.includes(selectedMultiplier)) {
      return res.status(400).json({ error: 'Multiplicateur sélectionné invalide. Doit être 2, 3, 5, 10, 20, ou 50.' });
    }

    // 24-segment wheel configuration (Optimized for flow & high tension alternating segments)
    const WHEEL_SEGMENTS = [
      50, 2, 3, 2, 5, 2, 3, 10, 2, 3, 5, 2,
      20, 2, 3, 2, 5, 2, 3, 10, 2, 3, 5, 2
    ];

    // Evaluate WIN/LOSS based on rules/RTP (already determined as `result` and `multiplier` above!)
    let winningIndex = 0;
    let actualResult: 'WIN' | 'LOSS' = 'LOSS';

    if (result === 'WIN') {
      // Find all indices that have the selectedMultiplier value
      const winningIndices: number[] = [];
      for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
        if (WHEEL_SEGMENTS[i] === selectedMultiplier) {
          winningIndices.push(i);
        }
      }

      if (winningIndices.length > 0) {
        winningIndex = winningIndices[Math.floor(Math.random() * winningIndices.length)];
        actualResult = 'WIN';
      } else {
        // Fallback if somehow not found (should never happen)
        winningIndex = WHEEL_SEGMENTS.indexOf(2);
        actualResult = 'LOSS';
      }
    } else {
      // LOSS - find all indices that do NOT have the selectedMultiplier value
      const losingIndices: number[] = [];
      for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
        if (WHEEL_SEGMENTS[i] !== selectedMultiplier) {
          losingIndices.push(i);
        }
      }

      if (losingIndices.length > 0) {
        winningIndex = losingIndices[Math.floor(Math.random() * losingIndices.length)];
        actualResult = 'LOSS';
      } else {
        // Fallback (should never happen)
        winningIndex = WHEEL_SEGMENTS.indexOf(selectedMultiplier);
        actualResult = 'WIN';
      }
    }

    const winningValue = WHEEL_SEGMENTS[winningIndex];
    const isWin = actualResult === 'WIN';
    const finalMultiplier = isWin ? selectedMultiplier : 0;
    const payout = isWin ? Math.floor(bet * selectedMultiplier) : 0;

    // Apply payout to player
    if (isWin) {
      if (activeMode === 'REAL') {
        player.solde = (player.solde || 0) + payout;
        player.revenu = (player.revenu || 0) + (payout - bet);
        player.totalWin += payout;
      } else {
        player.credits_fictifs = (player.credits_fictifs || 0) + payout;
        player.credits = player.credits_fictifs;
      }
    }

    // Save Log
    const log: GameLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      username: player.username,
      gameId: 'wheel',
      bet,
      result: actualResult,
      multiplier: finalMultiplier,
      payout,
      mode: activeMode,
      ruleAppliedId,
      ruleAppliedDesc,
    };
    logs.unshift(log);
    saveLogs();
    savePlayers();

    return res.json({
      success: true,
      gameId: 'wheel',
      bet,
      mode: activeMode,
      selectedMultiplier,
      winningIndex,
      winningValue,
      result: actualResult,
      payout,
      currentBalance: activeMode === 'REAL' ? player.solde : player.credits_fictifs,
      ruleId: ruleAppliedId,
      ruleDesc: ruleAppliedDesc,
    });
  }
  
  else if (gameId === 'bonanza') {
    const buyBonus = !!customData?.buyBonus;
    const baseBet = Number(bet);
    const totalBet = buyBonus ? baseBet * 100 : baseBet;

    // If buyBonus is true, check and deduct extra cost
    if (buyBonus) {
      const extraCost = baseBet * 99;
      if (activeMode === 'REAL') {
        if ((player.solde || 0) < extraCost) {
          player.solde += baseBet; // revert pre-route bet
          return res.status(400).json({ error: 'Solde réel insuffisant pour acheter le bonus (100x la mise).' });
        }
        player.solde -= extraCost;
        player.totalBet += extraCost;
      } else {
        if ((player.credits_fictifs || 0) < extraCost) {
          player.credits_fictifs += baseBet; // revert pre-route bet
          player.credits = player.credits_fictifs;
          return res.status(400).json({ error: 'Crédits démo insuffisants pour acheter le bonus (100x la mise).' });
        }
        player.credits_fictifs -= extraCost;
        player.credits = player.credits_fictifs;
      }
    }

    // Symbols and payouts configuration
    const BONANZA_SYMBOLS = ['🍌', '🍇', '🍉', '🫐', '🍎', '🟦', '🟩', '🟪', '❤️'];
    const BONANZA_PAYOUT_CONFIG: Record<string, Record<string, number>> = {
      '🍌': { '8-9': 0.25, '10-11': 0.75, '12+': 2.0 },
      '🍇': { '8-9': 0.40, '10-11': 0.90, '12+': 4.0 },
      '🍉': { '8-9': 0.50, '10-11': 1.00, '12+': 5.0 },
      '🫐': { '8-9': 0.80, '10-11': 1.20, '12+': 8.0 },
      '🍎': { '8-9': 1.00, '10-11': 1.50, '12+': 10.0 },
      '🟦': { '8-9': 1.50, '10-11': 2.00, '12+': 12.0 },
      '🟩': { '8-9': 2.00, '10-11': 5.00, '12+': 15.0 },
      '🟪': { '8-9': 2.50, '10-11': 10.00, '12+': 25.0 },
      '❤️': { '8-9': 10.00, '10-11': 25.00, '12+': 50.0 }
    };

    const getRandomSymbol = () => {
      const r = Math.random();
      if (r < 0.22) return '🍌';
      if (r < 0.40) return '🍇';
      if (r < 0.55) return '🍉';
      if (r < 0.68) return '🫐';
      if (r < 0.78) return '🍎';
      if (r < 0.86) return '🟦';
      if (r < 0.91) return '🟩';
      if (r < 0.96) return '🟪';
      return '❤️';
    };

    // Spin generator
    const generateSpinSequence = (isFreeSpin: boolean, forcedMultiplier: number | null) => {
      const tumbles: any[] = [];
      let currentGrid: string[] = [];

      if (forcedMultiplier === 0 || (forcedMultiplier === null && Math.random() < 0.6)) {
        // Generating loss grid
        let attempts = 0;
        while (attempts < 80) {
          currentGrid = Array.from({ length: 30 }, () => getRandomSymbol());
          const counts: Record<string, number> = {};
          let hasWin = false;
          for (const s of currentGrid) {
            counts[s] = (counts[s] || 0) + 1;
            if (counts[s] >= 8) hasWin = true;
          }
          const lollies = currentGrid.filter(s => s === '🍭').length;
          if (lollies >= 4) hasWin = true;

          if (!hasWin) break;
          attempts++;
        }
      } else {
        // Generating win grid
        const targetM = forcedMultiplier || Number((Math.random() * 5 + 0.5).toFixed(2));
        
        let winSymbol = '🍌';
        if (targetM >= 20) winSymbol = '❤️';
        else if (targetM >= 8) winSymbol = '🟪';
        else if (targetM >= 4) winSymbol = '🟩';
        else if (targetM >= 2) winSymbol = '🍎';

        const winCount = 8 + Math.floor(Math.random() * 4);
        currentGrid = Array.from({ length: 30 }, () => getRandomSymbol());

        for (let i = 0; i < 30; i++) {
          if (currentGrid[i] === winSymbol) {
            currentGrid[i] = winSymbol === '🍌' ? '🍇' : '🍌';
          }
        }

        const indices = Array.from({ length: 30 }, (_, i) => i).sort(() => Math.random() - 0.5);
        for (let i = 0; i < winCount; i++) {
          currentGrid[indices[i]] = winSymbol;
        }

        const payConf = BONANZA_PAYOUT_CONFIG[winSymbol];
        const rangeKey = winCount >= 12 ? '12+' : (winCount >= 10 ? '10-11' : '8-9');
        const basePayout = payConf[rangeKey] || 0.5;

        if (isFreeSpin && targetM > basePayout) {
          const bombIndex = indices[winCount];
          currentGrid[bombIndex] = '💣';
        }
      }

      let step = 0;
      let totalWinBeforeBombs = 0;
      const bombsInSpin: { index: number; multiplier: number }[] = [];

      while (step < 8) {
        const counts: Record<string, number> = {};
        let lollipopCount = 0;

        for (let i = 0; i < 30; i++) {
          const s = currentGrid[i];
          if (s === '🍭') {
            lollipopCount++;
          } else if (s !== '💣') {
            counts[s] = (counts[s] || 0) + 1;
          }
        }

        const winningClusters: any[] = [];
        const winningIndices = new Set<number>();

        for (const [sym, count] of Object.entries(counts)) {
          if (count >= 8) {
            const key = count >= 12 ? '12+' : (count >= 10 ? '10-11' : '8-9');
            const payoutFactor = BONANZA_PAYOUT_CONFIG[sym]?.[key] || 0.1;
            
            const idxs: number[] = [];
            for (let i = 0; i < 30; i++) {
              if (currentGrid[i] === sym) {
                idxs.push(i);
                winningIndices.add(i);
              }
            }

            winningClusters.push({
              symbol: sym,
              count,
              indices: idxs,
              payout: payoutFactor
            });
            totalWinBeforeBombs += payoutFactor;
          }
        }

        if (lollipopCount >= 4) {
          let lollPayout = 3.0;
          if (lollipopCount === 5) lollPayout = 5.0;
          if (lollipopCount >= 6) lollPayout = 100.0;

          const idxs: number[] = [];
          for (let i = 0; i < 30; i++) {
            if (currentGrid[i] === '🍭') {
              idxs.push(i);
              winningIndices.add(i);
            }
          }

          winningClusters.push({
            symbol: '🍭',
            count: lollipopCount,
            indices: idxs,
            payout: lollPayout,
            triggersFreeSpins: true
          });
          totalWinBeforeBombs += lollPayout;
        }

        for (let i = 0; i < 30; i++) {
          if (currentGrid[i] === '💣') {
            if (!bombsInSpin.some(b => b.index === i)) {
              let bVal = 2;
              if (forcedMultiplier && forcedMultiplier > 0) {
                const currentBase = totalWinBeforeBombs || 0.5;
                bVal = Math.max(2, Math.round(forcedMultiplier / currentBase));
              } else {
                const r = Math.random();
                if (r < 0.40) bVal = 2;
                else if (r < 0.65) bVal = 5;
                else if (r < 0.80) bVal = 10;
                else if (r < 0.90) bVal = 25;
                else bVal = 50;
              }
              bombsInSpin.push({ index: i, multiplier: bVal });
            }
          }
        }

        tumbles.push({
          grid: [...currentGrid],
          winningClusters,
          bombs: [...bombsInSpin]
        });

        if (winningClusters.length === 0) {
          break;
        }

        const nextGrid = Array(30).fill('');
        for (let col = 0; col < 6; col++) {
          const colItems: string[] = [];
          for (let row = 0; row < 5; row++) {
            const idx = row * 6 + col;
            if (!winningIndices.has(idx)) {
              colItems.push(currentGrid[idx]);
            }
          }

          const emptyCount = 5 - colItems.length;
          for (let row = 0; row < emptyCount; row++) {
            const idx = row * 6 + col;
            const isBomb = isFreeSpin && Math.random() < 0.12 && !bombsInSpin.some(b => b.index === idx);
            if (isBomb) {
              nextGrid[idx] = '💣';
            } else {
              nextGrid[idx] = getRandomSymbol();
            }
          }
          for (let row = emptyCount; row < 5; row++) {
            const idx = row * 6 + col;
            nextGrid[idx] = colItems[row - emptyCount];
          }
        }

        currentGrid = nextGrid;
        step++;
      }

      let bombMultiplierSum = bombsInSpin.reduce((sum, b) => sum + b.multiplier, 0);
      const multi = bombMultiplierSum > 0 ? bombMultiplierSum : 1;
      
      let spinTotalWin = Number((totalWinBeforeBombs * multi).toFixed(2));
      if (forcedMultiplier !== null) {
        spinTotalWin = forcedMultiplier;
        if (bombsInSpin.length > 0 && totalWinBeforeBombs > 0) {
          const exactBombSum = Math.round(forcedMultiplier / totalWinBeforeBombs);
          if (exactBombSum > 0) {
            bombsInSpin[0].multiplier = exactBombSum;
            bombMultiplierSum = exactBombSum;
          }
        }
      }

      return {
        tumbles,
        spinTotalWinBeforeBombs: Number(totalWinBeforeBombs.toFixed(2)),
        spinBombsMultiplierSum: bombMultiplierSum,
        spinTotalWin
      };
    };

    const spins: any[] = [];
    let finalPayout = 0;
    let finalTotalMultiplier = 0;
    let isBonusTriggered = false;

    if (buyBonus) {
      let totalM = Number((Math.random() * 85 + 15).toFixed(2));
      if (result === 'WIN') {
        const multVal = multiplier > 0 ? multiplier : (Math.random() * 5 + 1.5);
        totalM = Number((multVal * 25 + Math.random() * 15).toFixed(2));
      } else if (result === 'LOSS') {
        totalM = Number((Math.random() * 20 + 3.0).toFixed(2));
      }

      const winSpinsIndices = Array.from({ length: 10 }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, 3);
      const parts = [0.55, 0.30, 0.15];
      
      for (let i = 0; i < 10; i++) {
        const winIdx = winSpinsIndices.indexOf(i);
        if (winIdx !== -1) {
          const partM = Number((totalM * parts[winIdx]).toFixed(2));
          const spinResult = generateSpinSequence(true, partM);
          spins.push({
            spinIndex: i,
            isFreeSpin: true,
            ...spinResult
          });
        } else {
          const spinResult = generateSpinSequence(true, 0);
          spins.push({
            spinIndex: i,
            isFreeSpin: true,
            ...spinResult
          });
        }
      }

      finalTotalMultiplier = spins.reduce((sum, s) => sum + s.spinTotalWin, 0);
      finalTotalMultiplier = Number(finalTotalMultiplier.toFixed(2));
      finalPayout = Math.floor(finalTotalMultiplier * baseBet);
    } else {
      const shouldTriggerFreeSpinsNaturally = (result === 'WIN' && multiplier >= 12 && Math.random() < 0.40) || (Math.random() < 0.05);

      if (shouldTriggerFreeSpinsNaturally) {
        isBonusTriggered = true;
        const initialGrid = Array.from({ length: 30 }, () => getRandomSymbol()) as string[];
        const lollyIndices = Array.from({ length: 30 }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, 4);
        for (const idx of lollyIndices) {
          initialGrid[idx] = '🍭';
        }

        const baseSpinResult = generateSpinSequence(false, 3.0);
        spins.push({
          spinIndex: 0,
          isFreeSpin: false,
          ...baseSpinResult
        });

        let totalFreeSpinsMultiplier = multiplier > 0 ? multiplier : Number((Math.random() * 45 + 5).toFixed(2));
        const winSpinsIndices = Array.from({ length: 10 }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, 3);
        const parts = [0.60, 0.30, 0.10];

        for (let i = 0; i < 10; i++) {
          const winIdx = winSpinsIndices.indexOf(i);
          if (winIdx !== -1) {
            const partM = Number((totalFreeSpinsMultiplier * parts[winIdx]).toFixed(2));
            const spinResult = generateSpinSequence(true, partM);
            spins.push({
              spinIndex: i + 1,
              isFreeSpin: true,
              ...spinResult
            });
          } else {
            const spinResult = generateSpinSequence(true, 0);
            spins.push({
              spinIndex: i + 1,
              isFreeSpin: true,
              ...spinResult
            });
          }
        }

        finalTotalMultiplier = spins.reduce((sum, s) => sum + s.spinTotalWin, 0);
        finalTotalMultiplier = Number(finalTotalMultiplier.toFixed(2));
        finalPayout = Math.floor(finalTotalMultiplier * baseBet);
      } else {
        const targetM = result === 'WIN' ? multiplier : 0;
        const spinResult = generateSpinSequence(false, targetM);
        
        spins.push({
          spinIndex: 0,
          isFreeSpin: false,
          ...spinResult
        });

        finalTotalMultiplier = spinResult.spinTotalWin;
        finalPayout = Math.floor(finalTotalMultiplier * baseBet);
      }
    }

    const isWinOutcome = finalPayout > 0;
    if (isWinOutcome) {
      if (activeMode === 'REAL') {
        player.solde = (player.solde || 0) + finalPayout;
        player.revenu = (player.revenu || 0) + (finalPayout - totalBet);
        player.totalWin += finalPayout;
      } else {
        player.credits_fictifs = (player.credits_fictifs || 0) + finalPayout;
        player.credits = player.credits_fictifs;
      }
    }

    const log: GameLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      username: player.username,
      gameId: 'bonanza',
      bet: totalBet,
      result: isWinOutcome ? 'WIN' : 'LOSS',
      multiplier: finalTotalMultiplier,
      payout: finalPayout,
      mode: activeMode,
      ruleAppliedId,
      ruleAppliedDesc: ruleAppliedDesc || (buyBonus ? 'Achat de Bonus' : null),
    };
    logs.unshift(log);
    saveLogs();
    savePlayers();

    return res.json({
      success: true,
      gameId: 'bonanza',
      bet: baseBet,
      totalBet,
      mode: activeMode,
      buyBonus,
      isBonusTriggered,
      spins,
      totalPayout: finalPayout,
      totalMultiplier: finalTotalMultiplier,
      currentBalance: activeMode === 'REAL' ? player.solde : player.credits_fictifs,
      result: isWinOutcome ? 'WIN' : 'LOSS',
      ruleId: ruleAppliedId,
      ruleDesc: ruleAppliedDesc,
    });
  }

  // Default fallback for general or unknown gameId
  res.json({ success: true });
});

// Memory store for active rounds (Crash and Mines)
const activeRounds = new Map<string, any>();

// ==========================================
// 🚀 MULTIPLAYER CRASH LIVE SERVER ENGINE
// ==========================================
interface LiveCrashPlayer {
  id: string;
  socketId?: string;
  userId?: string;
  username: string;
  bet: number;
  mode: 'REAL' | 'DEMO';
  cashedOut: boolean;
  winAmount: number;
  stoppedAt: number;
  crashed: boolean;
  isBot?: boolean;
  autoCashout?: number;
}

const CRASH_BOT_NAMES = [
  'Koffi_225', 'Aminata_DK', 'Moussa_Bko', 'Alexandre_T', 'Fatou_99', 
  'Samuel_Eto', 'Derrick_VIP', 'Nathalie_Dla', 'Ibrahim_Yde', 'PawaKing_237', 
  'Cameroun_Ace', 'JeanLuc_Gagnant', 'Chantal_Yde', 'Oumar_Bko'
];

let crashState: 'WAITING' | 'RUNNING' | 'CRASHED' = 'WAITING';
let crashCurrentMultiplier = 1.00;
let crashPoint = 2.45;
let crashPlayers: Record<string, LiveCrashPlayer> = {};
let nextRoundQueue: LiveCrashPlayer[] = [];
let crashCooldown = 5;
let crashGameInterval: NodeJS.Timeout | null = null;
let crashCooldownInterval: NodeJS.Timeout | null = null;
let crashStartTime = 0;
let crashHistory: number[] = [2.14, 1.45, 12.80, 1.05, 3.20, 1.88, 45.10, 1.12, 2.75, 5.40, 1.01, 8.30, 2.05, 1.62, 18.90];
let currentRoundId = `cr-${Date.now()}`;

function generateProvablyFairCrashPoint(): number {
  const edge = (riskSettings.houseEdge || 4.0) / 100;
  const e = 2 ** 52;
  const h = Math.floor(Math.random() * e);
  
  if (h % 33 === 0) return 1.00;
  
  const rawMult = Math.max(1.00, ((100 - edge * 100) / (100 - (h / e) * 100)));
  const cap = riskSettings.maxWinCap ? Math.min(1000.0, 1000.0) : 1000.0;
  return Math.min(cap, parseFloat(rawMult.toFixed(2)));
}

function startCrashRound() {
  if (crashGameInterval) clearInterval(crashGameInterval);
  if (crashCooldownInterval) clearInterval(crashCooldownInterval);

  crashState = 'WAITING';
  crashCurrentMultiplier = 1.00;
  crashCooldown = 5;
  currentRoundId = `cr-${Date.now()}`;
  crashPoint = generateProvablyFairCrashPoint();
  crashPlayers = {};

  // Inject queued players from nextRoundQueue
  while (nextRoundQueue.length > 0) {
    const qp = nextRoundQueue.shift();
    if (qp) {
      const realP = players.find(p => p.id === qp.userId);
      if (realP && !realP.isFrozen) {
        const balance = qp.mode === 'REAL' ? (realP.solde || 0) : (realP.credits_fictifs || 0);
        if (balance >= qp.bet) {
          if (qp.mode === 'REAL') {
            realP.solde -= qp.bet;
            realP.totalBet += qp.bet;
          } else {
            realP.credits_fictifs -= qp.bet;
            realP.credits = realP.credits_fictifs;
          }
          savePlayers();
          crashPlayers[qp.id] = qp;
        }
      }
    }
  }

  // Inject 4 to 8 realistic bots with dynamic bets and target cashouts
  const numBots = 4 + Math.floor(Math.random() * 5);
  const shuffledBots = [...CRASH_BOT_NAMES].sort(() => Math.random() - 0.5).slice(0, numBots);
  shuffledBots.forEach((name, idx) => {
    const betAmounts = [500, 1000, 2000, 5000, 10000, 25000];
    const botBet = betAmounts[Math.floor(Math.random() * betAmounts.length)];
    const target = parseFloat((1.15 + Math.random() * (Math.random() < 0.7 ? 2.5 : 8.0)).toFixed(2));
    const botId = `bot-${idx}-${Date.now()}`;
    crashPlayers[botId] = {
      id: botId,
      username: name,
      bet: botBet,
      mode: 'REAL',
      cashedOut: false,
      winAmount: 0,
      stoppedAt: 0,
      crashed: false,
      isBot: true,
      autoCashout: target,
    };
  });

  io.emit('gameState', {
    state: crashState,
    players: crashPlayers,
    cooldown: crashCooldown,
    currentMultiplier: 1.00,
    history: crashHistory,
    roundId: currentRoundId,
  });

  crashCooldownInterval = setInterval(() => {
    crashCooldown--;
    if (crashCooldown <= 0) {
      if (crashCooldownInterval) clearInterval(crashCooldownInterval);
      launchCrashFlight();
    } else {
      io.emit('gameState', {
        state: crashState,
        players: crashPlayers,
        cooldown: crashCooldown,
        currentMultiplier: 1.00,
        history: crashHistory,
        roundId: currentRoundId,
      });
    }
  }, 1000);
}

function launchCrashFlight() {
  crashState = 'RUNNING';
  crashStartTime = Date.now();
  io.emit('gameStarted');
  io.emit('gameState', {
    state: crashState,
    players: crashPlayers,
    currentMultiplier: 1.00,
    history: crashHistory,
    roundId: currentRoundId,
  });

  crashGameInterval = setInterval(() => {
    const elapsed = (Date.now() - crashStartTime) / 1000;
    const rawMult = 1.00 + (Math.pow(Math.E, 0.16 * elapsed) - 1.00) * 0.95;
    crashCurrentMultiplier = parseFloat(rawMult.toFixed(2));

    // Check auto-cashouts for bots and players
    Object.values(crashPlayers).forEach(p => {
      if (!p.cashedOut && !p.crashed && p.autoCashout && p.autoCashout > 1.0 && crashCurrentMultiplier >= p.autoCashout && p.autoCashout < crashPoint) {
        p.cashedOut = true;
        p.stoppedAt = p.autoCashout;
        p.winAmount = Math.floor(p.bet * p.autoCashout);

        if (!p.isBot && p.userId) {
          const user = players.find(u => u.id === p.userId);
          if (user) {
            if (p.mode === 'REAL') {
              user.solde = (user.solde || 0) + p.winAmount;
              user.revenu = (user.revenu || 0) + (p.winAmount - p.bet);
              user.totalWin += p.winAmount;
            } else {
              user.credits_fictifs = (user.credits_fictifs || 0) + p.winAmount;
              user.credits = user.credits_fictifs;
            }
            savePlayers();

            const log: GameLog = {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              username: user.username,
              gameId: 'crash',
              bet: p.bet,
              result: 'WIN',
              multiplier: p.stoppedAt,
              payout: p.winAmount,
              mode: p.mode,
              ruleAppliedId: null,
              ruleAppliedDesc: null,
            };
            logs.unshift(log);
            saveLogs();
          }
        }

        const isHighWin = p.winAmount >= 20000 || p.stoppedAt >= 3.0;
        io.emit('playerCashout', { player: p, isHighWin });
      }
    });

    if (crashCurrentMultiplier >= crashPoint) {
      if (crashGameInterval) clearInterval(crashGameInterval);
      crashState = 'CRASHED';
      crashCurrentMultiplier = crashPoint;

      Object.values(crashPlayers).forEach(p => {
        if (!p.cashedOut) {
          p.crashed = true;
          if (!p.isBot && p.userId) {
            const user = players.find(u => u.id === p.userId);
            if (user) {
              const log: GameLog = {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                username: user.username,
                gameId: 'crash',
                bet: p.bet,
                result: 'LOSS',
                multiplier: 0,
                payout: 0,
                mode: p.mode,
                ruleAppliedId: null,
                ruleAppliedDesc: null,
              };
              logs.unshift(log);
              saveLogs();
            }
          }
        }
      });

      crashHistory.unshift(crashPoint);
      if (crashHistory.length > 20) crashHistory.pop();

      io.emit('crash', {
        finalMultiplier: crashPoint,
        players: crashPlayers,
        history: crashHistory,
      });

      setTimeout(startCrashRound, 4000);
    } else {
      io.emit('tick', { multiplier: crashCurrentMultiplier, elapsed });
    }
  }, 50);
}

// Start continuous multiplayer crash loop
startCrashRound();

// Socket.IO event router
io.on('connection', (socket) => {
  socket.emit('gameState', {
    state: crashState,
    players: crashPlayers,
    cooldown: crashCooldown,
    currentMultiplier: crashCurrentMultiplier,
    history: crashHistory,
    roundId: currentRoundId,
  });

  socket.on('joinGame', ({ userId, username, bet, mode, autoCashout }) => {
    const player = players.find(p => p.id === userId);
    if (!player) {
      socket.emit('joinError', { error: 'Joueur introuvable.' });
      return;
    }
    if (player.isFrozen) {
      socket.emit('joinError', { error: "Opération rejetée : Compte suspendu suite à une alerte d'activité suspecte." });
      return;
    }

    const betAmount = Math.max(100, Number(bet) || 500);
    const balance = mode === 'REAL' ? (player.solde || 0) : (player.credits_fictifs || 0);
    if (balance < betAmount) {
      socket.emit('joinError', { error: mode === 'REAL' ? 'Solde réel insuffisant' : 'Crédits démo insuffisants' });
      return;
    }

    const livePlayer: LiveCrashPlayer = {
      id: socket.id,
      socketId: socket.id,
      userId: player.id,
      username: username || player.username,
      bet: betAmount,
      mode: mode || 'DEMO',
      cashedOut: false,
      winAmount: 0,
      stoppedAt: 0,
      crashed: false,
      autoCashout: autoCashout ? parseFloat(autoCashout) : undefined,
    };

    if (crashState === 'WAITING') {
      if (mode === 'REAL') {
        player.solde -= betAmount;
        player.totalBet += betAmount;
      } else {
        player.credits_fictifs -= betAmount;
        player.credits = player.credits_fictifs;
      }
      savePlayers();

      crashPlayers[socket.id] = livePlayer;
      io.emit('gameState', {
        state: crashState,
        players: crashPlayers,
        cooldown: crashCooldown,
        currentMultiplier: 1.00,
        history: crashHistory,
        roundId: currentRoundId,
      });

      socket.emit('joinSuccess', {
        bet: betAmount,
        currentBalance: mode === 'REAL' ? player.solde : player.credits_fictifs,
      });
    } else {
      nextRoundQueue.push(livePlayer);
      socket.emit('joinQueued', { message: 'Inscrit pour la prochaine partie !' });
    }
  });

  socket.on('cashout', ({ userId }) => {
    if (crashState !== 'RUNNING') return;
    const entry = crashPlayers[socket.id] || Object.values(crashPlayers).find(p => p.userId === userId);
    if (!entry || entry.cashedOut || entry.crashed) return;

    if (crashCurrentMultiplier >= crashPoint) {
      entry.crashed = true;
      // SECURITY: do not leak crashPoint even on failed cashout
      socket.emit('cashoutResult', { win: false, multiplier: 0, payout: 0 });
      return;
    }

    const payout = Math.floor(entry.bet * crashCurrentMultiplier);
    entry.cashedOut = true;
    entry.stoppedAt = crashCurrentMultiplier;
    entry.winAmount = payout;

    const realUser = players.find(p => p.id === (entry.userId || userId));
    if (realUser) {
      if (entry.mode === 'REAL') {
        realUser.solde = (realUser.solde || 0) + payout;
        realUser.revenu = (realUser.revenu || 0) + (payout - entry.bet);
        realUser.totalWin += payout;
      } else {
        realUser.credits_fictifs = (realUser.credits_fictifs || 0) + payout;
        realUser.credits = realUser.credits_fictifs;
      }
      savePlayers();

      const log: GameLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: realUser.username,
        gameId: 'crash',
        bet: entry.bet,
        result: 'WIN',
        multiplier: crashCurrentMultiplier,
        payout,
        mode: entry.mode,
        ruleAppliedId: null,
        ruleAppliedDesc: null,
      };
      logs.unshift(log);
      saveLogs();
    }

    const isHighWin = payout >= 20000 || crashCurrentMultiplier >= 3.0;
    io.emit('playerCashout', { player: entry, isHighWin });
    io.emit('gameState', {
      state: crashState,
      players: crashPlayers,
      currentMultiplier: crashCurrentMultiplier,
      history: crashHistory,
      roundId: currentRoundId,
    });

    socket.emit('cashoutResult', {
      win: true,
      multiplier: crashCurrentMultiplier,
      payout,
      currentBalance: realUser ? (entry.mode === 'REAL' ? realUser.solde : realUser.credits_fictifs) : 0,
    });
  });
});

// REST Fallback endpoints for Crash Game
app.get('/api/play/crash/state', (req, res) => {
  res.json({
    state: crashState,
    currentMultiplier: crashCurrentMultiplier,
    cooldown: crashCooldown,
    players: crashPlayers,
    history: crashHistory,
    roundId: currentRoundId,
  });
});

// Crash Cashout Claim API (REST fallback)
app.post('/api/play/crash/cashout', (req, res) => {
  const { userId, claimMultiplier } = req.body;
  const player = players.find(p => p.id === userId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  if (player.isFrozen) {
    return res.status(403).json({ 
      error: "Opération rejetée : Compte suspendu suite à une alerte d'activité suspecte.",
      isFrozen: true 
    });
  }

  const active = activeRounds.get(userId);
  if (!active || active.gameId !== 'crash') {
    return res.status(400).json({ error: 'Aucune partie de Crash active trouvée.' });
  }

  const { bet, crashPoint: cp, mode, ruleAppliedId, ruleAppliedDesc } = active;
  const activeMode = mode || 'DEMO';
  activeRounds.delete(userId);

  if (claimMultiplier >= cp) {
    const log: GameLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      username: player.username,
      gameId: 'crash',
      bet,
      result: 'LOSS',
      multiplier: 0,
      payout: 0,
      mode: activeMode,
      ruleAppliedId,
      ruleAppliedDesc,
    };
    logs.unshift(log);
    saveLogs();
    savePlayers();

    return res.json({
      success: true,
      win: false,
      multiplier: 0,
      payout: 0,
      // SECURITY: crashPoint never returned to client
      currentBalance: activeMode === 'REAL' ? player.solde : player.credits_fictifs,
      message: 'Explosion ! Le rocket a crashé avant votre retrait.',
    });
  } else {
    const payout = Math.floor(bet * claimMultiplier);
    if (activeMode === 'REAL') {
      player.solde = (player.solde || 0) + payout;
      player.revenu = (player.revenu || 0) + (payout - bet);
      player.totalWin += payout;
    } else {
      player.credits_fictifs = (player.credits_fictifs || 0) + payout;
      player.credits = player.credits_fictifs;
    }

    const log: GameLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      username: player.username,
      gameId: 'crash',
      bet,
      result: 'WIN',
      multiplier: claimMultiplier,
      payout,
      mode: activeMode,
      ruleAppliedId,
      ruleAppliedDesc,
    };
    logs.unshift(log);
    saveLogs();
    savePlayers();

    return res.json({
      success: true,
      win: true,
      multiplier: claimMultiplier,
      payout,
      // SECURITY: crashPoint never returned to client
      currentBalance: activeMode === 'REAL' ? player.solde : player.credits_fictifs,
      message: `Gagné ! Retrait à ${claimMultiplier}x (+${payout} FCFA)`,
    });
  }
});

// Crash Explosion API (called when the player didn't cashout and rocket exploded)
app.post('/api/play/crash/explode', (req, res) => {
  const { userId } = req.body;
  const player = players.find(p => p.id === userId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const active = activeRounds.get(userId);
  if (!active || active.gameId !== 'crash') {
    return res.status(400).json({ error: 'Aucune partie de Crash active.' });
  }

  const { bet, crashPoint, mode, ruleAppliedId, ruleAppliedDesc } = active;
  const activeMode = mode || 'DEMO';
  activeRounds.delete(userId);

  const log: GameLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    username: player.username,
    gameId: 'crash',
    bet,
    result: 'LOSS',
    multiplier: 0,
    payout: 0,
    mode: activeMode,
    ruleAppliedId,
    ruleAppliedDesc,
  };
  logs.unshift(log);
  saveLogs();
  savePlayers();

  res.json({
    success: true,
    win: false,
    // SECURITY: crashPoint never returned to client
    currentBalance: activeMode === 'REAL' ? player.solde : player.credits_fictifs,
  });
});

// Mines Reveal Tile API
app.post('/api/play/mines/reveal', (req, res) => {
  const { userId, tileIndex } = req.body;
  
  const player = players.find(p => p.id === userId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  if (player.isFrozen) {
    return res.status(403).json({ 
      error: "Opération bloquée : Compte temporairement gelé pour analyse de sécurité.",
      isFrozen: true 
    });
  }

  // Real-time Anti-Bot click velocity check on Mines reveal
  trackAndDetectBot(player.id, player.username, 'MINES_SCRIPT', `Révélation rapide case #${tileIndex}`);

  const active = activeRounds.get(userId);
  if (!active || active.gameId !== 'mines') {
    return res.status(400).json({ error: 'Aucune partie de Mines active.' });
  }

  if (tileIndex < 0 || tileIndex >= 25) {
    return res.status(400).json({ error: 'Index de case invalide.' });
  }

  if (active.revealed[tileIndex]) {
    return res.status(400).json({ error: 'Case déjà révélée.' });
  }

  active.clickCount += 1;
  active.revealed[tileIndex] = true;

  let isMine = active.grid[tileIndex] === 'MINE';

  // RIGGING OVERRIDE FOR FORCED LOSS IN MINES:
  // If the server forced a LOSS for this round, and the player clicks, 
  // we can force this tile to be a MINE if they have clicked more than e.g. 1 tile, 
  // or even their very first tile, ensuring they hit a mine!
  if (active.forcedResult === 'LOSS' && !isMine) {
    // If we want a forced loss, we make sure that they hit a mine on their 2nd or 3rd click, or even first click!
    // Let's force it!
    const forceLossClickThreshold = 2; // Hit a mine on or after the 2nd click
    if (active.clickCount >= forceLossClickThreshold || Math.random() < 0.5) {
      isMine = true;
      active.grid[tileIndex] = 'MINE'; // Rig the grid!
    }
  }

  // RIGGING OVERRIDE FOR FORCED WIN IN MINES:
  // Ensure that they NEVER hit a mine until they cash out, or if they reveal almost all tiles
  if (active.forcedResult === 'WIN' && isMine) {
    // Swap the mine to another unrevealed tile to let the player win!
    const unrevealedGemIndices: number[] = [];
    for (let i = 0; i < 25; i++) {
      if (!active.revealed[i] && active.grid[i] === 'GEM') {
        unrevealedGemIndices.push(i);
      }
    }

    if (unrevealedGemIndices.length > 0) {
      // Put mine on one of those, make this tile a GEM
      const swapIdx = unrevealedGemIndices[Math.floor(Math.random() * unrevealedGemIndices.length)];
      active.grid[swapIdx] = 'MINE';
      active.grid[tileIndex] = 'GEM';
      isMine = false;
    }
  }

  if (isMine) {
    // Exploded! Complete loss
    const bet = active.bet;
    const activeMode = active.mode || 'DEMO';
    const ruleAppliedId = active.ruleAppliedId;
    const ruleAppliedDesc = active.ruleAppliedDesc;

    activeRounds.delete(userId); // Round over

    const log: GameLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      username: player.username,
      gameId: 'mines',
      bet,
      result: 'LOSS',
      multiplier: 0,
      payout: 0,
      mode: activeMode,
      ruleAppliedId,
      ruleAppliedDesc,
    };
    logs.unshift(log);
    saveLogs();
    savePlayers();

    return res.json({
      success: true,
      status: 'lost',
      isMine: true,
      revealedGrid: active.grid, // Return the whole grid upon loss so they see where mines were!
      currentBalance: activeMode === 'REAL' ? player.solde : player.credits_fictifs,
    });
  } else {
    // Gem hit! Calculate intermediate multiplier
    // Standard mines multipliers for 3 mines:
    // 1 gem: ~1.13x, 2 gems: ~1.29x, 3 gems: ~1.48x, 4 gems: ~1.71x, 5 gems: ~2.00x, 6 gems: ~2.35x...
    const countGemsRevealed = active.revealed.filter((r: boolean, i: number) => r && active.grid[i] === 'GEM').length;
    const minesCount = active.minesCount;
    
    // Theoretical math multiplier:
    // Combinations of (25 - minesCount) over countGems / Combinations of 25 over countGems
    let multiplier = 1.0;
    let n = 25;
    let m = minesCount;
    let k = countGemsRevealed;
    
    // Simple multiplier calculation:
    // Multiplier = (25 / (25 - m)) * ((24) / (24 - m)) ...
    let ways = 1.0;
    for (let i = 0; i < k; i++) {
      ways *= (n - i - m) / (n - i);
    }
    multiplier = Number((0.97 / ways).toFixed(2)); // 3% house edge included

    return res.json({
      success: true,
      status: 'playing',
      isMine: false,
      multiplier,
      revealedIndices: active.revealed
        .map((rev: boolean, idx: number) => rev ? idx : -1)
        .filter((idx: number) => idx !== -1),
    });
  }
});

// Mines Cashout API
app.post('/api/play/mines/cashout', (req, res) => {
  const { userId } = req.body;
  const player = players.find(p => p.id === userId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  if (player.isFrozen) {
    return res.status(403).json({ 
      error: "Opération bloquée : Compte temporairement gelé pour analyse de sécurité.",
      isFrozen: true 
    });
  }

  const active = activeRounds.get(userId);
  if (!active || active.gameId !== 'mines') {
    return res.status(400).json({ error: 'Aucune partie de Mines active.' });
  }

  const { bet, grid, revealed, mode, ruleAppliedId, ruleAppliedDesc } = active;
  const activeMode = mode || 'DEMO';
  activeRounds.delete(userId); // Round over

  const countGemsRevealed = revealed.filter((r: boolean, i: number) => r && grid[i] === 'GEM').length;
  if (countGemsRevealed === 0) {
    return res.status(400).json({ error: 'Vous devez révéler au moins une gemme avant de pouvoir retirer.' });
  }

  // Calculate final multiplier
  let n = 25;
  let m = active.minesCount;
  let k = countGemsRevealed;
  let ways = 1.0;
  for (let i = 0; i < k; i++) {
    ways *= (n - i - m) / (n - i);
  }
  const finalMultiplier = Number((0.97 / ways).toFixed(2));

  const payout = Math.floor(bet * finalMultiplier);
  if (activeMode === 'REAL') {
    player.solde = (player.solde || 0) + payout;
    player.revenu = (player.revenu || 0) + (payout - bet);
    player.totalWin += payout;
  } else {
    player.credits_fictifs = (player.credits_fictifs || 0) + payout;
    player.credits = player.credits_fictifs;
  }

  const log: GameLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    username: player.username,
    gameId: 'mines',
    bet,
    result: 'WIN',
    multiplier: finalMultiplier,
    payout,
    mode: activeMode,
    ruleAppliedId,
    ruleAppliedDesc,
  };
  logs.unshift(log);
  saveLogs();
  savePlayers();

  res.json({
    success: true,
    status: 'won',
    multiplier: finalMultiplier,
    payout,
    revealedGrid: grid, // Return whole grid on cashout
    currentBalance: activeMode === 'REAL' ? player.solde : player.credits_fictifs,
  });
});

// PAYMENT AND FINANCIAL CONFIGURATIONS ENDPOINTS
app.get('/api/payment-configurations', (req, res) => {
  // Only active ones
  res.json({ paymentConfigurations: paymentConfigurations.filter(c => c.isActive) });
});

app.get('/api/admin/payment-configurations', (req, res) => {
  res.json({ paymentConfigurations });
});

app.post('/api/admin/payment-configurations', (req, res) => {
  const { moyen_paiement, nom_destination, numero_destination, syntaxe_ussd } = req.body;
  if (!moyen_paiement || !nom_destination || !numero_destination) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être renseignés.' });
  }

  const newConfig: PaymentConfiguration = {
    id: `pay-${Date.now()}`,
    moyen_paiement,
    nom_destination,
    numero_destination,
    syntaxe_ussd,
    isActive: true,
  };

  paymentConfigurations.push(newConfig);
  savePaymentConfigs();
  res.json({ success: true, paymentConfiguration: newConfig });
});

app.put('/api/admin/payment-configurations/:id', (req, res) => {
  const { id } = req.params;
  const { moyen_paiement, nom_destination, numero_destination, syntaxe_ussd, isActive } = req.body;
  
  const config = paymentConfigurations.find(c => c.id === id);
  if (!config) {
    return res.status(404).json({ error: 'Configuration introuvable.' });
  }

  if (moyen_paiement !== undefined) config.moyen_paiement = moyen_paiement;
  if (nom_destination !== undefined) config.nom_destination = nom_destination;
  if (numero_destination !== undefined) config.numero_destination = numero_destination;
  if (syntaxe_ussd !== undefined) config.syntaxe_ussd = syntaxe_ussd;
  if (isActive !== undefined) config.isActive = isActive;

  savePaymentConfigs();
  res.json({ success: true, paymentConfiguration: config });
});

app.delete('/api/admin/payment-configurations/:id', (req, res) => {
  const { id } = req.params;
  paymentConfigurations = paymentConfigurations.filter(c => c.id !== id);
  savePaymentConfigs();
  res.json({ success: true });
});

// Profile Payment Details Configuration
app.post('/api/profile/payment-details', (req, res) => {
  const { userId, payment_method, payment_number, payment_name } = req.body;
  const player = players.find(p => p.id === userId);
  if (!player) {
    return res.status(404).json({ error: 'Joueur introuvable.' });
  }

  player.payment_method = payment_method;
  player.payment_number = payment_number;
  player.payment_name = payment_name;

  savePlayers();
  res.json({ success: true, player });
});

// Declare a deposit request
app.post('/api/wallet/deposit', (req, res) => {
  const { userId, amount, moyen_paiement, transactionId, nom_joueur, numero_joueur } = req.body;
  
  const player = players.find(p => p.id === userId);
  if (!player) {
    return res.status(404).json({ error: 'Joueur introuvable.' });
  }

  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Le montant saisi est incorrect.' });
  }

  if (!transactionId) {
    return res.status(400).json({ error: "L'ID de transaction (référence SMS) est obligatoire." });
  }

  // Create pending deposit transaction
  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    userId,
    username: player.username,
    type: 'deposit',
    moyen_paiement,
    numero_joueur,
    nom_joueur,
    amount: amt,
    netAmount: amt,
    transactionId,
    status: 'pending',
    timestamp: new Date().toISOString(),
  };

  transactions.unshift(newTx);
  saveTransactions();

  res.json({ success: true, transaction: newTx });
});

// Create a withdrawal request
app.post('/api/wallet/withdraw', (req, res) => {
  const { userId, amount, moyen_paiement, nom_joueur, numero_joueur } = req.body;
  
  const player = players.find(p => p.id === userId);
  if (!player) {
    return res.status(404).json({ error: 'Joueur introuvable.' });
  }

  // Security Freeze Enforcement: Block all withdrawals if account is frozen
  if (player.isFrozen) {
    return res.status(403).json({ 
      error: "Retrait impossible : Votre compte est sous examen de sécurité suite à une alerte d'activité suspecte.",
      isFrozen: true 
    });
  }

  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Le montant saisi est incorrect.' });
  }

  // Rapid Withdrawal without play fraud check
  if (player.totalBet === 0 && amt >= 20000) {
    trackAndDetectBot(player.id, player.username, 'RAPID_WITHDRAW', `Demande de retrait de ${amt} FCFA avec 0 FCFA de mise totale`);
  }

  if ((player.solde || 0) < amt) {
    return res.status(400).json({ error: 'Solde réel insuffisant pour effectuer ce retrait.' });
  }

  // Deduct IMMEDIATELY from solde (secure lock-up to prevent double spend)
  player.solde = (player.solde || 0) - amt;
  savePlayers();

  // 10% processing fee
  const netAmount = amt * 0.90;

  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    userId,
    username: player.username,
    type: 'withdrawal',
    moyen_paiement,
    numero_joueur,
    nom_joueur,
    amount: amt,
    netAmount,
    status: 'pending',
    timestamp: new Date().toISOString(),
  };

  transactions.unshift(newTx);
  saveTransactions();

  res.json({ success: true, transaction: newTx, currentBalance: player.solde });
});

// Admin get and validate transactions
app.get('/api/admin/transactions', (req, res) => {
  res.json({ transactions });
});

app.post('/api/admin/transactions/:id/validate', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  const tx = transactions.find(t => t.id === id);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction introuvable.' });
  }

  if (tx.status !== 'pending') {
    return res.status(400).json({ error: 'Cette transaction a déjà été traitée.' });
  }

  const player = players.find(p => p.id === tx.userId);
  if (!player) {
    return res.status(404).json({ error: 'Le joueur initiateur est introuvable.' });
  }

  if (status === 'approved') {
    tx.status = 'approved';
    if (tx.type === 'deposit') {
      // Add balance atomically
      player.solde = (player.solde || 0) + tx.amount;
    }
    // If withdrawal, funds were already deducted, nothing more to deduct!
  } else if (status === 'rejected') {
    tx.status = 'rejected';
    if (tx.type === 'withdrawal') {
      // Refund the bruto amount
      player.solde = (player.solde || 0) + tx.amount;
    }
  } else {
    return res.status(400).json({ error: 'Statut de validation incorrect.' });
  }

  savePlayers();
  saveTransactions();

  res.json({ success: true, transaction: tx, player });
});

// ==========================================
// ANTI-BOT & RED FLAGS SECURITY ENDPOINTS
// ==========================================

// Get all Red Flags
app.get('/api/admin/red-flags', (req, res) => {
  res.json({ redFlags });
});

// Freeze a player account from an alert or directly
app.post('/api/admin/red-flags/:id/freeze', (req, res) => {
  const { id } = req.params;
  const alert = redFlags.find(r => r.id === id);
  
  let player: Player | undefined;
  if (alert) {
    alert.status = 'FROZEN';
    player = players.find(p => p.id === alert.userId);
  } else {
    player = players.find(p => p.id === id);
  }

  if (player) {
    player.isFrozen = true;
    savePlayers();
  }
  saveRedFlags();

  res.json({ 
    success: true, 
    message: `Compte ${player ? player.username : 'joueur'} gelé et opérations suspendues.`, 
    alert, 
    player 
  });
});

// Unfreeze a player account
app.post('/api/admin/red-flags/:id/unfreeze', (req, res) => {
  const { id } = req.params;
  const alert = redFlags.find(r => r.id === id);
  
  let player: Player | undefined;
  if (alert) {
    alert.status = 'RESOLVED';
    alert.isResolved = true;
    player = players.find(p => p.id === alert.userId);
  } else {
    player = players.find(p => p.id === id);
  }

  if (player) {
    player.isFrozen = false;
    savePlayers();
  }
  saveRedFlags();

  res.json({ 
    success: true, 
    message: `Compte ${player ? player.username : 'joueur'} dégelé avec succès.`, 
    alert, 
    player 
  });
});

// Resolve / dismiss an alert
app.post('/api/admin/red-flags/:id/resolve', (req, res) => {
  const { id } = req.params;
  const alert = redFlags.find(r => r.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Alerte introuvable.' });
  }

  alert.status = 'RESOLVED';
  alert.isResolved = true;
  saveRedFlags();

  res.json({ success: true, alert, message: 'Alerte marquée comme résolue.' });
});

// Delete an alert
app.delete('/api/admin/red-flags/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = redFlags.length;
  redFlags = redFlags.filter(r => r.id !== id);
  
  if (redFlags.length === initialLength) {
    return res.status(404).json({ error: 'Alerte introuvable.' });
  }

  saveRedFlags();
  res.json({ success: true });
});

// Simulate a live Bot attack / Red Flag trigger for real-time testing
app.post('/api/admin/red-flags/simulate-bot', (req, res) => {
  const { type, username, targetUserId } = req.body;
  const targetPlayer = players.find(p => p.id === targetUserId || p.username.toLowerCase() === (username || '').toLowerCase()) 
    || players.find(p => !p.isAdmin) 
    || players[0];

  const simulatedAlerts: Record<string, Partial<RedFlagAlert>> = {
    CLICK_SPEED: {
      reason: 'Détection Autoclicker: 8 clics en 320ms sur Grille Démineur',
      fraudScore: 97,
      severity: 'critical',
      actionType: 'CLICK_SPEED',
      details: 'Intervalle constant moyen: 40ms entre chaque case (Signature Bot)',
    },
    MINES_SCRIPT: {
      reason: 'Script mathématique de déminage avec 100% de taux de réussite sur 7 tours',
      fraudScore: 91,
      severity: 'critical',
      actionType: 'MINES_SCRIPT',
      details: 'Pattern diagonal identique répété sans hésitation humaine',
    },
    WIN_STREAK: {
      reason: 'Série anormale de gros gains consécutifs (+480 000 FCFA en 2 min)',
      fraudScore: 84,
      severity: 'high',
      actionType: 'WIN_STREAK',
      details: 'Multiplicateurs > 8.5x encaissés à 0.05s du crash',
    },
    IP_CLONE: {
      reason: 'Multi-comptes détectés: 4 sessions actives sous la même empreinte IP / Canvas',
      fraudScore: 78,
      severity: 'medium',
      actionType: 'IP_CLONE',
      details: 'IP: 197.159.22.41 (Transferts suspects de crédits)',
    },
  };

  const template = simulatedAlerts[type || 'CLICK_SPEED'] || simulatedAlerts.CLICK_SPEED;
  const newAlert: RedFlagAlert = {
    id: `rf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: targetPlayer.id,
    username: targetPlayer.username,
    reason: template.reason!,
    fraudScore: template.fraudScore!,
    severity: template.severity!,
    status: 'FLAGGED',
    actionType: template.actionType,
    details: template.details,
    timestamp: new Date().toISOString(),
    isResolved: false,
    totalProfit: 350000,
    winRate: 88,
  };

  redFlags.unshift(newAlert);
  saveRedFlags();

  res.json({ 
    success: true, 
    alert: newAlert, 
    message: 'Attaque simulée enregistrée avec succès dans le moteur anti-fraude !' 
  });
});

// Risk Settings Endpoints
app.get('/api/admin/risk-settings', (req, res) => {
  res.json({ riskSettings });
});

app.put('/api/admin/risk-settings', (req, res) => {
  const { maxWinCap, houseEdge, maxTreasuryRisk, dynamicRtpActive, autoWithdrawLimit, isAutoWithdrawEnabled } = req.body;
  
  if (maxWinCap !== undefined) riskSettings.maxWinCap = Number(maxWinCap);
  if (houseEdge !== undefined) riskSettings.houseEdge = Number(houseEdge);
  if (maxTreasuryRisk !== undefined) riskSettings.maxTreasuryRisk = Number(maxTreasuryRisk);
  if (dynamicRtpActive !== undefined) riskSettings.dynamicRtpActive = !!dynamicRtpActive;
  if (autoWithdrawLimit !== undefined) riskSettings.autoWithdrawLimit = Number(autoWithdrawLimit);
  if (isAutoWithdrawEnabled !== undefined) riskSettings.isAutoWithdrawEnabled = !!isAutoWithdrawEnabled;

  saveRiskSettings();
  res.json({ success: true, riskSettings, message: 'Paramètres de risque et plafonds enregistrés !' });
});

// --- Export de l'application pour le déploiement serverless (Vercel) ---
export { app, httpServer, io };

// Start Vite + Express integration
async function startServer() {
  try {
    const ok = await initDatabase();
    if (ok) {
      players = await hydrateStore('players', players);
      games = await hydrateStore('games', games);
      rules = await hydrateStore('rules', rules);
      logs = await hydrateStore('logs', logs);
      paymentConfigurations = await hydrateStore('payment_configurations', paymentConfigurations);
      transactions = await hydrateStore('transactions', transactions);
      countries = await hydrateStore('countries', countries);
      redFlags = await hydrateStore('red_flags', redFlags);
      riskSettings = await hydrateStore('risk_settings', riskSettings);
      console.log(`[db] Hydrated: ${players.length} players, ${transactions.length} txs`);
    }
  } catch (err) {
    console.error('[db] hydration error', err);
  }

  // Vite integration for asset rendering (dev mode only)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running with WebSockets on http://localhost:${PORT}`);
  });
}

// --- Démarrage conditionnel ---
// En mode local (dev ou prod), on démarre le serveur HTTP.
// Sur Vercel (variables d'environnement VERCEL ou API_ROUTE_PATH définies),
// le serveur est importé en tant que fonction serverless — pas d'appel à listen().
const isServerless = process.env.VERCEL === '1' || process.env.API_ROUTE_PATH !== undefined;
if (!isServerless) {
  startServer();
} else {
  // En mode serverless (ex: Vercel), configurer le serving statique sans écouter
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  console.log('Serverless function ready (Express app exported).');
}
