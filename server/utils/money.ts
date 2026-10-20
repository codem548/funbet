/**
 * FunBet Casino — Money / Decimal Utilities
 *
 * Toutes les monnaies sont manipulées en entiers (FCFA) pour éviter les
 * erreurs d'arrondi flottant. Les multiplicateurs sont validés à 2 décimales.
 *
 * Convention: toutes les valeurs monétaires sont des entiers (pas de décimales).
 * Les multiplicateurs de jeu sont des nombres à virgule flottante validés.
 */

// --- Balance Operations ---

/**
 * Safely add to a balance, returning the new value.
 * Ensures balance never goes negative.
 */
export function addBalance(balance: number, amount: number): number {
  return Math.max(0, Math.round((balance + amount) * 100) / 100);
}

/**
 * Safely deduct from a balance.
 * Returns { newBalance, success } — success is false if insufficient funds.
 */
export function deductBalance(balance: number, amount: number): { newBalance: number; success: boolean } {
  const current = Math.round((balance || 0) * 100) / 100;
  const toDeduct = Math.round(amount * 100) / 100;
  if (current < toDeduct) {
    return { newBalance: current, success: false };
  }
  return { newBalance: Math.round((current - toDeduct) * 100) / 100, success: true };
}

/**
 * Calculate payout = bet * multiplier, floored to integer.
 */
export function calculatePayout(bet: number, multiplier: number): number {
  return Math.floor(bet * multiplier);
}

/**
 * Calculate profit = payout - bet.
 */
export function calculateProfit(bet: number, multiplier: number): number {
  return calculatePayout(bet, multiplier) - bet;
}

/**
 * Round a monetary value to 2 decimal places.
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Apply a fee percentage to an amount.
 * e.g., applyFee(1000, 0.10) => 900
 */
export function applyFee(amount: number, feeRate: number): number {
  return Math.floor(amount * (1 - feeRate));
}

/**
 * Format a currency amount for display (e.g., 1500 → "1 500").
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return Math.round(amount).toLocaleString('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  });
}

/**
 * Clamp a bet between min and max bounds.
 */
export function clampBet(bet: number, minBet: number, maxBet: number): { bet: number; valid: boolean; error?: string } {
  if (isNaN(bet) || bet <= 0) {
    return { bet: 0, valid: false, error: 'La mise doit être un nombre positif.' };
  }
  if (bet < minBet) {
    return { bet: minBet, valid: true }; // Accept minimum
  }
  if (bet > maxBet) {
    return { bet: maxBet, valid: true }; // Accept maximum
  }
  return { bet: Math.round(bet), valid: true };
}
