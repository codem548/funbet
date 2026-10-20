/**
 * Module Affiliation / Partenaires — à monter depuis server.ts
 * Export: creditPartnerCommission, generatePartnerCode, registerPartnerRoutes
 */
import type { Express, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type PartnerPlayer = {
  id: string;
  username: string;
  isPartner?: boolean;
  partnerCode?: string;
  referralCode?: string;
  referredBy?: string;
  partnerBalance?: number;
  totalReferralEarnings?: number;
  referralEarnings?: number;
  commissionRate?: number;
  solde?: number;
  email?: string;
  phone?: string;
  totalBet?: number;
  totalWin?: number;
  isAdmin?: boolean;
  password?: string;
  credits?: number;
  credits_fictifs?: number;
  revenu?: number;
  consecutiveLosses?: number;
  lastDailyClaim?: string | null;
};

type Ctx = {
  players: PartnerPlayer[];
  savePlayers: () => void;
  jwtSecret: string;
  hashPassword: (plain: string) => Promise<string>;
  stripPassword: (p: PartnerPlayer) => Omit<PartnerPlayer, 'password'>;
};

export function creditPartnerCommission(
  players: PartnerPlayer[],
  player: PartnerPlayer,
  bet: number,
  payout: number,
  mode: string
) {
  if (mode !== 'REAL') return;
  if (!player.referredBy) return;
  const netLoss = bet - payout;
  if (netLoss <= 0) return;
  const partner = players.find((p) => p.id === player.referredBy && p.isPartner);
  if (!partner) return;
  const rate = typeof partner.commissionRate === 'number' ? partner.commissionRate : 0.2;
  const commission = Math.floor(netLoss * rate);
  if (commission <= 0) return;
  partner.partnerBalance = (partner.partnerBalance || 0) + commission;
  partner.totalReferralEarnings = (partner.totalReferralEarnings || 0) + commission;
  partner.referralEarnings = (partner.referralEarnings || 0) + commission;
}

export function generatePartnerCode(players: PartnerPlayer[]): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'FUN-';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  if (players.some((p) => p.partnerCode === code)) return generatePartnerCode(players);
  return code;
}

export function registerPartnerRoutes(app: Express, ctx: Ctx) {
  const { players, savePlayers, jwtSecret, hashPassword, stripPassword } = ctx;

  const authPlayer = (req: Request, res: Response): PartnerPlayer | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }
    try {
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, jwtSecret) as { sub: string };
      const player = players.find((p) => p.id === payload.sub);
      if (!player) {
        res.status(404).json({ error: 'User not found' });
        return null;
      }
      return player;
    } catch {
      res.status(401).json({ error: 'Token invalide ou expiré' });
      return null;
    }
  };

  app.get('/api/partner/stats', (req, res) => {
    const player = authPlayer(req, res);
    if (!player) return;
    if (!player.isPartner) return res.status(403).json({ error: 'Compte partenaire requis' });
    const referrals = players.filter((p) => p.referredBy === player.id);
    res.json({
      partnerCode: player.partnerCode || player.referralCode || '',
      commissionRate: player.commissionRate ?? 0.2,
      partnerBalance: player.partnerBalance || 0,
      totalReferralEarnings: player.totalReferralEarnings || player.referralEarnings || 0,
      referralCount: referrals.length,
      referrals: referrals.map((r) => ({
        id: r.id,
        username: r.username,
        totalBet: r.totalBet || 0,
        totalWin: r.totalWin || 0,
      })),
    });
  });

  app.post('/api/partner/withdraw', (req, res) => {
    const player = authPlayer(req, res);
    if (!player) return;
    if (!player.isPartner) return res.status(403).json({ error: 'Compte partenaire requis' });
    const amount = Number(req.body?.amount);
    const available = player.partnerBalance || 0;
    const toTransfer = Number.isFinite(amount) && amount > 0 ? Math.min(amount, available) : available;
    if (toTransfer <= 0) return res.status(400).json({ error: 'Solde partenaire insuffisant' });
    player.partnerBalance = available - toTransfer;
    player.solde = (player.solde || 0) + toTransfer;
    savePlayers();
    res.json({
      success: true,
      transferred: toTransfer,
      partnerBalance: player.partnerBalance,
      solde: player.solde,
    });
  });

  app.get('/api/admin/partners', (_req, res) => {
    const partners = players
      .filter((p) => p.isPartner)
      .map((p) => {
        const refs = players.filter((r) => r.referredBy === p.id);
        return {
          id: p.id,
          username: p.username,
          partnerCode: p.partnerCode || p.referralCode || '',
          commissionRate: p.commissionRate ?? 0.2,
          partnerBalance: p.partnerBalance || 0,
          totalReferralEarnings: p.totalReferralEarnings || p.referralEarnings || 0,
          referralCount: refs.length,
          email: p.email,
          phone: p.phone,
        };
      });
    res.json(partners);
  });

  app.post('/api/admin/partners', async (req, res) => {
    try {
      const { username, email, phone, password, commissionRate } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'username et password requis' });
      if (players.some((p) => p.username.toLowerCase() === String(username).trim().toLowerCase())) {
        return res.status(400).json({ error: "Nom d'utilisateur déjà pris" });
      }
      const rate = typeof commissionRate === 'number' ? Math.min(1, Math.max(0, commissionRate)) : 0.2;
      const hashed = await hashPassword(password);
      const code = generatePartnerCode(players);
      const partner: PartnerPlayer = {
        id: `partner-${Date.now()}`,
        username: String(username).trim(),
        email: email ? String(email).trim() : undefined,
        phone: phone ? String(phone).trim() : undefined,
        password: hashed,
        credits: 10000,
        credits_fictifs: 10000,
        solde: 0,
        revenu: 0,
        consecutiveLosses: 0,
        totalBet: 0,
        totalWin: 0,
        isAdmin: false,
        lastDailyClaim: null,
        isPartner: true,
        partnerCode: code,
        referralCode: code,
        partnerBalance: 0,
        totalReferralEarnings: 0,
        commissionRate: rate,
      };
      players.push(partner);
      savePlayers();
      res.json({ success: true, partner: stripPassword(partner) });
    } catch (err) {
      console.error('Create partner error', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.put('/api/admin/partners/:id', (req, res) => {
    const partner = players.find((p) => p.id === req.params.id && p.isPartner);
    if (!partner) return res.status(404).json({ error: 'Partenaire introuvable' });
    const { commissionRate, isPartner } = req.body;
    if (typeof commissionRate === 'number') partner.commissionRate = Math.min(1, Math.max(0, commissionRate));
    if (typeof isPartner === 'boolean') partner.isPartner = isPartner;
    savePlayers();
    res.json({ success: true, partner: stripPassword(partner) });
  });

  app.post('/api/admin/partners/:id/promote', (req, res) => {
    const player = players.find((p) => p.id === req.params.id);
    if (!player) return res.status(404).json({ error: 'Joueur introuvable' });
    if (player.isPartner) return res.status(400).json({ error: 'Déjà partenaire' });
    const rate =
      typeof req.body?.commissionRate === 'number' ? Math.min(1, Math.max(0, req.body.commissionRate)) : 0.2;
    player.isPartner = true;
    player.partnerCode = player.partnerCode || generatePartnerCode(players);
    player.referralCode = player.partnerCode;
    player.commissionRate = rate;
    player.partnerBalance = player.partnerBalance || 0;
    player.totalReferralEarnings = player.totalReferralEarnings || 0;
    savePlayers();
    res.json({ success: true, partner: stripPassword(player) });
  });
}
