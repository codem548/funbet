import React, { useState } from 'react';
import { Gift, Sparkles, Trophy, Users, Check, Copy, Share2, Flame, Coins, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { Player, RewardStreakDay } from '../types';
import { sound } from '../utils/audioHaptics';

interface RewardsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  onUpdatePlayer: (player: Player) => void;
  playMode: 'REAL' | 'DEMO';
}

export default function RewardsCenterModal({
  isOpen,
  onClose,
  player,
  onUpdatePlayer,
  playMode,
}: RewardsCenterModalProps) {
  const [activeTab, setActiveTab] = useState<'rakeback' | 'streak' | 'referral'>('rakeback');
  const [copiedLink, setCopiedLink] = useState(false);
  const [claimedStreakSuccess, setClaimedStreakSuccess] = useState(false);
  const [claimedRakebackSuccess, setClaimedRakebackSuccess] = useState(false);

  if (!isOpen) return null;

  const referralCode = player.referralCode || `FUN-${player.username.toUpperCase().substring(0, 4)}-${player.id.substring(player.id.length - 4)}`;
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const rakebackAvailable = player.rakebackBalance || (player.totalBet > 0 ? Math.floor(player.totalBet * 0.05) : 1500);

  // 7-day streak rewards data
  const currentStreak = player.streakDays || 1;
  const streakDaysData: RewardStreakDay[] = [
    { day: 1, ftbReward: 5000, fcfaReward: 0, isClaimed: currentStreak > 1, isCurrent: currentStreak === 1 },
    { day: 2, ftbReward: 10000, fcfaReward: 0, isClaimed: currentStreak > 2, isCurrent: currentStreak === 2 },
    { day: 3, ftbReward: 15000, fcfaReward: 500, isClaimed: currentStreak > 3, isCurrent: currentStreak === 3 },
    { day: 4, ftbReward: 20000, fcfaReward: 1000, isClaimed: currentStreak > 4, isCurrent: currentStreak === 4 },
    { day: 5, ftbReward: 30000, fcfaReward: 1500, isClaimed: currentStreak > 5, isCurrent: currentStreak === 5 },
    { day: 6, ftbReward: 40000, fcfaReward: 2000, isClaimed: currentStreak > 6, isCurrent: currentStreak === 6 },
    { day: 7, ftbReward: 100000, fcfaReward: 5000, isClaimed: currentStreak > 7, isCurrent: currentStreak === 7 },
  ];

  const handleClaimRakeback = () => {
    if (rakebackAvailable <= 0) return;
    sound.playCashoutSound(5);
    const updated = { ...player };
    if (playMode === 'REAL') {
      updated.solde = (updated.solde || 0) + rakebackAvailable;
    } else {
      updated.credits_fictifs = (updated.credits_fictifs || 0) + rakebackAvailable;
      updated.credits = updated.credits_fictifs;
    }
    updated.rakebackClaimed = (updated.rakebackClaimed || 0) + rakebackAvailable;
    updated.rakebackBalance = 0;
    onUpdatePlayer(updated);

    setClaimedRakebackSuccess(true);
    setTimeout(() => setClaimedRakebackSuccess(false), 2500);
  };

  const handleClaimStreak = (dayData: RewardStreakDay) => {
    sound.playBigWinFanfare();
    const updated = { ...player };
    updated.credits_fictifs = (updated.credits_fictifs || 0) + dayData.ftbReward;
    updated.credits = updated.credits_fictifs;
    if (dayData.fcfaReward > 0) {
      updated.solde = (updated.solde || 0) + dayData.fcfaReward;
    }
    updated.streakDays = Math.min(7, (player.streakDays || 1) + 1);
    updated.lastStreakClaim = new Date().toISOString();
    onUpdatePlayer(updated);

    setClaimedStreakSuccess(true);
    setTimeout(() => setClaimedStreakSuccess(false), 2500);
  };

  const handleCopyReferral = () => {
    sound.playClick();
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Rejoins-moi sur FunBet Casino et reçois 10 000 FCFA de bonus d'accueil ! Inscris-toi ici : ${referralLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1e2225] border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#282e33] to-[#1e2225] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Centre de Récompenses & VIP
              </h2>
              <p className="text-[11px] text-zinc-400">Rakeback instantané, bonus de série & commissions d'affiliation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 bg-[#171a1c]">
          <button
            onClick={() => setActiveTab('rakeback')}
            className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'rakeback'
                ? 'text-[#9ce800] border-b-2 border-[#9ce800] bg-[#1e2225]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Rakeback (5%)</span>
          </button>
          <button
            onClick={() => setActiveTab('streak')}
            className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'streak'
                ? 'text-[#9ce800] border-b-2 border-[#9ce800] bg-[#1e2225]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Série 7 Jours ({currentStreak}/7)</span>
          </button>
          <button
            onClick={() => setActiveTab('referral')}
            className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'referral'
                ? 'text-[#9ce800] border-b-2 border-[#9ce800] bg-[#1e2225]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Parrainage VIP</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'rakeback' ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-emerald-950/40 via-[#24292d] to-[#1e2225] border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    Rakeback Débloqué Disponible
                  </span>
                  <div className="text-3xl font-black text-white font-mono flex items-center justify-center md:justify-start gap-2">
                    <span>{rakebackAvailable.toLocaleString()}</span>
                    <span className="text-sm font-bold text-[#9ce800]">
                      {playMode === 'REAL' ? 'FCFA' : 'FTB'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    5% de remboursement automatique sur toutes vos mises en cours de jeu.
                  </p>
                </div>

                <button
                  onClick={handleClaimRakeback}
                  disabled={rakebackAvailable <= 0}
                  className="w-full md:w-auto px-6 py-3 bg-[#9ce800] hover:bg-[#8bd100] text-[#171a1c] font-black rounded-xl transition-all shadow-lg hover:shadow-[#9ce800]/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-2 shrink-0"
                >
                  <Coins className="w-4 h-4" />
                  <span>Réclamer Immédiatement</span>
                </button>
              </div>

              {claimedRakebackSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 font-semibold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Rakeback crédité instantanément sur votre solde jouable !</span>
                </div>
              )}

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#171a1c] border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Total Rakeback Réclamé</span>
                  <div className="text-lg font-bold font-mono text-white">
                    {(player.rakebackClaimed || 0).toLocaleString()} {playMode === 'REAL' ? 'FCFA' : 'FTB'}
                  </div>
                </div>
                <div className="p-3.5 bg-[#171a1c] border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Niveau VIP Rakeback</span>
                  <div className="text-lg font-bold font-mono text-[#9ce800] flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    <span>Bronze Plus (5.0%)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'streak' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    Série de Connexion Quotidienne
                  </h3>
                  <p className="text-[11px] text-zinc-400">Connectez-vous 7 jours d'affilée pour décrocher le Jackpot VIP</p>
                </div>
                <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full font-mono font-bold text-xs">
                  Jour {currentStreak} / 7
                </span>
              </div>

              {claimedStreakSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 font-semibold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Récompense du jour débloquée et créditée avec succès !</span>
                </div>
              )}

              {/* 7-day visual roadmap */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {streakDaysData.map((s) => (
                  <div
                    key={s.day}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-between text-center gap-2 transition-all ${
                      s.isClaimed
                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                        : s.isCurrent
                        ? 'bg-amber-950/30 border-amber-500/40 shadow-md ring-1 ring-amber-400/30 text-white'
                        : 'bg-[#171a1c] border-white/5 text-zinc-400 opacity-70'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold uppercase">Jour {s.day}</span>
                    <div className="text-xl">
                      {s.day === 7 ? '👑' : s.isClaimed ? '✅' : '🎁'}
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-white font-mono text-[11px]">+{s.ftbReward / 1000}k FTB</div>
                      {s.fcfaReward > 0 && (
                        <div className="text-[10px] font-bold text-[#9ce800] font-mono">+{s.fcfaReward} FCFA</div>
                      )}
                    </div>
                    {s.isCurrent && (
                      <button
                        onClick={() => handleClaimStreak(s)}
                        className="w-full py-1 bg-[#9ce800] hover:bg-[#8bd100] text-[#171a1c] font-black rounded-lg text-[10px] transition-all cursor-pointer shadow-sm"
                      >
                        Ouvrir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[#171a1c] border border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-300">Votre Lien de Parrainage Personnel</span>
                  <span className="text-[10px] text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Commissions à vie
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="w-full bg-[#141719] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-[11px] outline-none"
                  />
                  <button
                    onClick={handleCopyReferral}
                    className="px-4 bg-[#2c3033] hover:bg-[#383d42] text-zinc-100 font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-[#9ce800]" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Partager sur WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Commission Tiers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#171a1c] border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Filleuls Actifs</span>
                  <div className="text-lg font-bold font-mono text-white">4 Joueurs</div>
                </div>
                <div className="p-3.5 bg-[#171a1c] border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Commissions Gagnées</span>
                  <div className="text-lg font-bold font-mono text-[#9ce800]">
                    {(player.referralEarnings || 12500).toLocaleString()} FCFA
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#171a1c] border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2c3033] hover:bg-[#383d42] text-white font-semibold rounded-xl transition-colors cursor-pointer text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
