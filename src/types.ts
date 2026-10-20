export interface Player {
  id: string;
  username: string;
  credits: number; // Solde de jeu (legacy)
  credits_fictifs: number; // Crédits bonus / promotionnels
  solde: number;          // Solde réel disponible pour jouer/retirer
  revenu: number;         // Cumul historique des gains réels
  consecutiveLosses: number;
  totalBet: number;
  totalWin: number;
  isAdmin: boolean;
  isFrozen?: boolean;     // Gel administratif du compte en cas de drapeau rouge
  lastDailyClaim: string | null; // ISO string
  rakebackBalance?: number;      // Rakeback accumulé disponible
  rakebackClaimed?: number;      // Total rakeback réclamé historique
  streakDays?: number;           // Jours consécutifs de connexion (1-7)
  lastStreakClaim?: string | null;
  referralCode?: string;         // Code de parrainage personnel (legacy)
  referredBy?: string;           // ID du partenaire qui a parrainé ce joueur
  referralEarnings?: number;     // Commissions d'affiliation touchées (FCFA) - legacy
  // --- Système Partenaires (Affiliation) ---
  isPartner?: boolean;           // Compte partenaire actif
  partnerCode?: string;          // Code unique de parrainage (ex: FUN-ABC12)
  partnerBalance?: number;       // Solde commissions disponible au retrait
  totalReferralEarnings?: number;// Cumul historique des commissions
  commissionRate?: number;       // Taux de commission (défaut 0.20 = 20%)
  clientSeed?: string;           // Graine client pour le Provably Fair
  nonce?: number;                // Compteur de parties Provably Fair
  payment_method?: string; // Mode de paiement par défaut configuré par le joueur
  payment_number?: string; // Numéro ou IBAN de paiement configuré
  payment_name?: string;   // Nom associé au compte de paiement
  phone?: string;          // Numéro de téléphone de l'utilisateur
  email?: string;          // Adresse email de l'utilisateur
  password?: string;       // Mot de passe sécurisé de l'utilisateur
}

export interface ProvablyFairRound {
  serverSeedHash: string;
  serverSeed?: string; // Revealed after game round is over
  clientSeed: string;
  nonce: number;
  gameId: string;
  calculatedOutcome: string | number;
}

export interface LiveBetEvent {
  id: string;
  username: string;
  gameId: string;
  gameName: string;
  bet: number;
  multiplier: number;
  payout: number;
  isBigWin: boolean;
  timestamp: string;
}

export interface CrashMultiplayerPlayer {
  id: string;
  username: string;
  avatar: string;
  bet: number;
  status: 'playing' | 'cashed_out' | 'crashed';
  cashoutMultiplier?: number;
  payout?: number;
}

export interface RiskManagementSettings {
  maxWinCap: number;           // Plafond max de gain par mise (ex: 5 000 000 FCFA)
  maxBetLimit: number;          // Mise maximale autorisée
  targetRtp: number;            // RTP global cible (ex: 96%)
  houseEdge: number;            // Marge casino (ex: 3.5%)
  maxTreasuryRisk: number;      // Pourcentage max de la trésorerie mis en jeu (ex: 5%)
  dynamicRtpActive: boolean;    // Régulation dynamique selon le solde global
  autoWithdrawLimit: number;    // Seuil historique (non utilisé pour auto-paiement)
  isAutoWithdrawEnabled: boolean;
}

export interface RedFlagAlert {
  id: string;
  userId: string;
  username: string;
  reason: string;
  fraudScore: number;          // Score de risque 0-100
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'FLAGGED' | 'SUSPICIOUS' | 'FROZEN' | 'RESOLVED';
  details?: string;
  actionType?: 'CLICK_SPEED' | 'MINES_SCRIPT' | 'WIN_STREAK' | 'RAPID_WITHDRAW' | 'IP_CLONE' | 'SIMULATION';
  timestamp: string;
  isResolved?: boolean;
  totalProfit?: number;
  winRate?: number;
}

export interface RewardStreakDay {
  day: number;
  ftbReward: number;
  fcfaReward: number;
  isClaimed: boolean;
  isCurrent: boolean;
}

export interface EligibleCountry {
  id: string;
  name: string;      // Nom du pays (ex: Cameroun)
  code: string;      // Indicatif téléphonique (ex: +237)
  flag?: string;     // Emoji drapeau (optionnel)
  isActive: boolean; // Si le pays est actif ou pas
}

export interface PaymentConfiguration {
  id: string;
  moyen_paiement: string; // Ex: 'MTN', 'ORANGE', 'WAVE', 'BANK'
  nom_destination: string; // Nom du titulaire du compte de réception
  numero_destination: string; // Numéro ou IBAN de réception
  syntaxe_ussd?: string; // Syntaxe USSD d'aide au paiement (ex: *126*...)
  isActive: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  type: 'deposit' | 'withdrawal';
  moyen_paiement: string;
  numero_joueur?: string;
  nom_joueur?: string;
  amount: number; // Montant brut
  netAmount: number; // Montant net (frais déduits pour retraits)
  transactionId?: string; // ID Transaction déclaré (pour dépôts)
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface GameConfig {
  id: string;
  name: string;
  icon: string;
  minBet: number;
  maxBet: number;
  isActive: boolean;
  rtpGlobal: number; // e.g., 95 for 95%
}

export interface RuleCondition {
  balance_max?: number;
  balance_min?: number;
  hour_between?: [number, number]; // e.g. [18, 23]
  consecutive_loss_min?: number;
  is_new_player?: boolean; // e.g. first 3 games
  manual_player_username?: string; // override for a specific player
  play_mode?: 'REAL' | 'DEMO' | 'BOTH'; // filter rules by active game mode
}

export interface RuleAction {
  force_result: 'WIN' | 'LOSS' | 'RANDOM';
  multiplier_range: [number, number]; // e.g. [1.2, 5.0]
}

export interface GameRule {
  id: string;
  gameId: string; // "all", "mines", "crash"
  description: string;
  conditionJson: RuleCondition;
  actionJson: RuleAction;
  priority: number;
  isActive: boolean;
}

export interface GameLog {
  id: string;
  timestamp: string;
  username: string;
  gameId: string;
  bet: number;
  result: 'WIN' | 'LOSS';
  multiplier: number;
  payout: number;
  mode: 'REAL' | 'DEMO';
  ruleAppliedId: string | null;
  ruleAppliedDesc: string | null;
}

export interface GameStateMines {
  grid: ('MINE' | 'GEM')[];
  revealed: boolean[];
  minesCount: number;
  bet: number;
  status: 'playing' | 'won' | 'lost';
}
