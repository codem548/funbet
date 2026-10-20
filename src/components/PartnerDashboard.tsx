import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Wallet, Users, TrendingUp, Link2, X, RefreshCw, ArrowDownToLine } from 'lucide-react';
import { Player } from '../types';

interface PartnerStats {
  partnerCode: string;
  commissionRate: number;
  partnerBalance: number;
  totalReferralEarnings: number;
  referralCount: number;
  referrals: { id: string; username: string; totalBet: number; totalWin: number }[];
}

interface PartnerDashboardProps {
  player: Player;
  onClose: () => void;
  onBalanceUpdate?: (solde: number, partnerBalance: number) => void;
}

export default function PartnerDashboard({ player, onClose, onBalanceUpdate }: PartnerDashboardProps) {
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('funbet_token') || '';

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/partner/stats', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Impossible de charger les stats');
      }
      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      setError(e.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const referralLink =
    typeof window !== 'undefined' && stats?.partnerCode
      ? `${window.location.origin}/?ref=${stats.partnerCode}`
      : stats?.partnerCode
        ? `/?ref=${stats.partnerCode}`
        : '';

  const copyCode = async () => {
    if (!stats?.partnerCode) return;
    try {
      await navigator.clipboard.writeText(stats.partnerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleWithdraw = async () => {
    if (!stats || stats.partnerBalance <= 0) return;
    setWithdrawing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/partner/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec du retrait');
      setSuccessMsg(`${data.transferred.toLocaleString()} FCFA transférés vers votre solde réel.`);
      setStats((prev) =>
        prev
          ? { ...prev, partnerBalance: data.partnerBalance }
          : prev
      );
      onBalanceUpdate?.(data.solde, data.partnerBalance);
      loadStats();
    } catch (e: any) {
      setError(e.message || 'Erreur retrait');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#171a1c] border border-[#2e3438] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e3438] bg-[#222629]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#9ce800]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">Espace Partenaire</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#2c3033] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-zinc-400 text-sm gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Chargement…
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl px-3 py-2">
              {successMsg}
            </div>
          )}

          {stats && !loading && (
            <>
              {/* Code + Lien */}
              <div className="bg-[#222629] border border-[#2e3438] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-zinc-500 font-mono">Code de parrainage</span>
                  <span className="text-[10px] text-[#9ce800] font-mono">
                    Commission {(stats.commissionRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-black tracking-widest text-white bg-[#171a1c] border border-[#2e3438] rounded-lg px-3 py-2 text-center">
                    {stats.partnerCode || '—'}
                  </code>
                  <button
                    onClick={copyCode}
                    className="p-2.5 bg-[#9ce800]/15 border border-[#9ce800]/30 text-[#9ce800] rounded-lg hover:bg-[#9ce800]/25 transition-colors cursor-pointer"
                    title="Copier le code"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-1.5 text-[11px] text-zinc-400 bg-[#171a1c] border border-[#2e3438] rounded-lg px-3 py-2 truncate">
                    <Link2 className="w-3.5 h-3.5 shrink-0 text-[#9ce800]" />
                    <span className="truncate font-mono">{referralLink}</span>
                  </div>
                  <button
                    onClick={copyLink}
                    className="p-2.5 bg-[#222629] border border-[#2e3438] text-zinc-300 rounded-lg hover:bg-[#2c3033] transition-colors cursor-pointer"
                    title="Copier le lien"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#222629] border border-[#2e3438] rounded-xl p-3 text-center">
                  <Wallet className="w-4 h-4 text-[#9ce800] mx-auto mb-1" />
                  <div className="text-sm font-bold text-white font-mono">
                    {(stats.partnerBalance || 0).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-zinc-500 uppercase">Solde commission</div>
                </div>
                <div className="bg-[#222629] border border-[#2e3438] rounded-xl p-3 text-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <div className="text-sm font-bold text-white font-mono">
                    {(stats.totalReferralEarnings || 0).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-zinc-500 uppercase">Total gagné</div>
                </div>
                <div className="bg-[#222629] border border-[#2e3438] rounded-xl p-3 text-center">
                  <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <div className="text-sm font-bold text-white font-mono">{stats.referralCount}</div>
                  <div className="text-[9px] text-zinc-500 uppercase">Filleuls</div>
                </div>
              </div>

              {/* Withdraw */}
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || (stats.partnerBalance || 0) <= 0}
                className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[#9ce800] text-[#171a1c] hover:bg-[#b8f000]"
              >
                <ArrowDownToLine className="w-4 h-4" />
                {withdrawing
                  ? 'Transfert…'
                  : `Retirer ${(stats.partnerBalance || 0).toLocaleString()} FCFA vers solde réel`}
              </button>

              {/* Referral list */}
              {stats.referrals.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] uppercase text-zinc-500 font-mono tracking-wide">Filleuls récents</h3>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {stats.referrals.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between bg-[#222629] border border-[#2e3438] rounded-lg px-3 py-2 text-xs"
                      >
                        <span className="font-medium text-white truncate max-w-[140px]">{r.username}</span>
                        <span className="font-mono text-zinc-400 text-[10px]">
                          Mise {(r.totalBet || 0).toLocaleString()} · Gain {(r.totalWin || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.referrals.length === 0 && (
                <p className="text-center text-[11px] text-zinc-500 py-2">
                  Aucun filleul pour le moment. Partagez votre code !
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
