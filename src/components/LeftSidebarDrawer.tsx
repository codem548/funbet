import React from 'react';
import { X, Trophy, Flame, Disc, Sparkles, Gift, RefreshCw, Wallet, Shield, HelpCircle, FileText, PhoneCall, LogOut, CheckCircle2, ChevronRight, Users } from 'lucide-react';
import { Player } from '../types';

interface LeftSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  playMode: 'REAL' | 'DEMO';
  onTogglePlayMode: (mode: 'REAL' | 'DEMO') => void;
  onSelectNavTab: (tab: string) => void;
  onOpenDeposit: () => void;
  onOpenDailyBonus: () => void;
  onOpenRuineReset: () => void;
  onOpenRules: () => void;
  onLogout: () => void;
  isAdminView: boolean;
  onToggleAdminView: () => void;
  onOpenPartner?: () => void;
}

export default function LeftSidebarDrawer({
  isOpen,
  onClose,
  player,
  playMode,
  onTogglePlayMode,
  onSelectNavTab,
  onOpenDeposit,
  onOpenDailyBonus,
  onOpenRuineReset,
  onOpenRules,
  onLogout,
  isAdminView,
  onToggleAdminView,
  onOpenPartner,
}: LeftSidebarDrawerProps) {
  if (!isOpen) return null;

  const fictifBalance = player.credits_fictifs !== undefined ? player.credits_fictifs : player.credits;
  const realBalance = player.solde !== undefined ? player.solde : 0;

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] bg-[#171a1c] border-r border-[#2e3438] h-full flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-250">
        
        {/* Header */}
        <div className="p-4 border-b border-[#2e3438] flex items-center justify-between bg-[#222629]">
          <div className="flex items-center gap-2">
            <div className="flex items-center font-black text-xl tracking-tighter uppercase italic">
              <span className="text-white">FUN</span>
              <span className="text-[#9ce800] bg-[#9ce800]/10 px-1 rounded ml-0.5 border border-[#9ce800]/30">BET</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#2c3033] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* User & Wallet Card */}
          <div className="bg-[#222629] p-3.5 rounded-2xl border border-[#2e3438] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#9ce800]/15 border border-[#9ce800]/30 text-[#9ce800] font-bold text-xs flex items-center justify-center font-mono">
                  {player.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{player.username}</h4>
                  <span className="text-[10px] font-mono text-zinc-400">ID: {player.id.slice(0, 8)}</span>
                </div>
              </div>

              {/* Mode switch */}
              <button
                onClick={() => onTogglePlayMode(playMode === 'REAL' ? 'DEMO' : 'REAL')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                  playMode === 'REAL'
                    ? 'bg-[#9ce800]/10 border-[#9ce800]/40 text-[#9ce800]'
                    : 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                }`}
              >
                {playMode === 'REAL' ? 'Mode Réel' : 'Mode Démo'}
              </button>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2e3438] font-mono">
              <div className="bg-[#171a1c] p-2 rounded-xl border border-[#2e3438]">
                <span className="text-[9px] text-zinc-500 block uppercase">Solde FCFA</span>
                <span className="text-xs font-bold text-[#9ce800] truncate block">{realBalance.toLocaleString()} F</span>
              </div>
              <div className="bg-[#171a1c] p-2 rounded-xl border border-[#2e3438]">
                <span className="text-[9px] text-zinc-500 block uppercase">Solde Démo</span>
                <span className="text-xs font-bold text-blue-400 truncate block">{fictifBalance.toLocaleString()} FTB</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { onOpenDeposit(); onClose(); }}
                className="flex-1 py-2 bg-[#9ce800] hover:bg-[#8ad400] text-[#171a1c] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Dépôt / Retrait</span>
              </button>
              <button
                onClick={() => { onOpenDailyBonus(); onClose(); }}
                className="px-3 py-2 bg-[#171a1c] hover:bg-[#2c3033] border border-[#2e3438] text-blue-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Bonus +10k FTB"
              >
                <Gift className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section: Navigation Universes */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider px-2">Univers Casino</span>
            
            <button
              onClick={() => { onSelectNavTab('casino'); onClose(); }}
              className="w-full px-3 py-2.5 hover:bg-[#222629] text-zinc-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span>🎰</span>
                <span>Lobby Casino & Arcade</span>
              </div>
              <span className="text-[10px] font-mono bg-[#9ce800]/10 text-[#9ce800] px-1.5 py-0.5 rounded">4 Jeux Pro</span>
            </button>
          </div>

          {/* Section: Jeux Phares */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider px-2">Mini-Jeux Directs</span>
            
            <button
              onClick={() => { onSelectNavTab('game-mines'); onClose(); }}
              className="w-full px-3 py-2 hover:bg-[#222629] text-zinc-300 hover:text-white rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>💣</span>
                <span>Démineur Pro (5x5)</span>
              </div>
              <span className="text-[9px] font-mono text-[#9ce800]">97% RTP</span>
            </button>

            <button
              onClick={() => { onSelectNavTab('game-crash'); onClose(); }}
              className="w-full px-3 py-2 hover:bg-[#222629] text-zinc-300 hover:text-white rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>🚀</span>
                <span>Rocket Crash Multiplier</span>
              </div>
              <span className="text-[9px] font-mono text-[#9ce800]">97% RTP</span>
            </button>

            <button
              onClick={() => { onSelectNavTab('game-wheel'); onClose(); }}
              className="w-full px-3 py-2 hover:bg-[#222629] text-zinc-300 hover:text-white rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>📀</span>
                <span>Roue de la Fortune (60 Seg)</span>
              </div>
              <span className="text-[9px] font-mono text-[#9ce800]">96% RTP</span>
            </button>

            <button
              onClick={() => { onSelectNavTab('game-bonanza'); onClose(); }}
              className="w-full px-3 py-2 hover:bg-[#222629] text-zinc-300 hover:text-white rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>🍬</span>
                <span>Sweet Bonanza Cascade</span>
              </div>
              <span className="text-[9px] font-mono text-[#9ce800]">96.5% RTP</span>
            </button>
          </div>

          {/* Section: Informations & Aide */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider px-2">Assistance & Légal</span>
            
            <button
              onClick={() => { onOpenRules(); onClose(); }}
              className="w-full px-3 py-2 hover:bg-[#222629] text-zinc-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-zinc-400" />
              <span>Règles du jeu & Fonctionnement</span>
            </button>

            <a
              href="https://wa.me/237600000000"
              target="_blank"
              rel="noreferrer"
              className="w-full px-3 py-2 hover:bg-[#222629] text-zinc-300 hover:text-emerald-400 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Support WhatsApp direct</span>
            </a>
          </div>

          {/* Section: Espace Partenaire */}
          {player.isPartner && onOpenPartner && (
            <div className="pt-2 border-t border-[#2e3438]">
              <button
                onClick={() => { onOpenPartner(); onClose(); }}
                className="w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#9ce800]/15 border border-[#9ce800]/30 text-[#9ce800] hover:bg-[#9ce800]/25"
              >
                <Users className="w-4 h-4" />
                <span>Espace Partenaire</span>
              </button>
            </div>
          )}

          {/* Section: Admin Console if applicable */}
          {player.isAdmin && (
            <div className="pt-2 border-t border-[#2e3438]">
              <button
                onClick={() => { onToggleAdminView(); onClose(); }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isAdminView
                    ? 'bg-[#9ce800] text-[#171a1c]'
                    : 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>{isAdminView ? 'Console Joueur' : 'Console d\'Administration'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2e3438] bg-[#222629] space-y-2">
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full py-2 bg-[#171a1c] hover:bg-red-950/20 text-zinc-400 hover:text-red-400 border border-[#2e3438] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
          <p className="text-[9px] text-zinc-500 text-center font-mono">
            Licence MINAT Cameroun • 18+ Uniquement
          </p>
        </div>

      </div>
    </div>
  );
}
