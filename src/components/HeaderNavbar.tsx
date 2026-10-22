import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, User, LogOut, Gift, RefreshCw, Shield, ArrowUpRight, ChevronDown, Sparkles, LayoutDashboard, Wallet, CreditCard, Users } from 'lucide-react';
import { Player } from '../types';

interface HeaderNavbarProps {
  player: Player;
  onLogout: () => void;
  playMode: 'REAL' | 'DEMO';
  onTogglePlayMode: (mode: 'REAL' | 'DEMO') => void;
  activeNavTab: string;
  onSelectNavTab: (tab: string) => void;
  onOpenLeftSidebar: () => void;
  onOpenSearch: () => void;
  onOpenDeposit: () => void;
  onOpenDailyBonus: () => void;
  onOpenRuineReset: () => void;
  onRefreshBalance: () => void;
  isRefreshing: boolean;
  isAdminView: boolean;
  onToggleAdminView: () => void;
  onOpenPartner?: () => void;
}

export default function HeaderNavbar({
  player,
  onLogout,
  playMode,
  onTogglePlayMode,
  activeNavTab,
  onSelectNavTab,
  onOpenLeftSidebar,
  onOpenSearch,
  onOpenDeposit,
  onOpenDailyBonus,
  onOpenRuineReset,
  onRefreshBalance,
  isRefreshing,
  isAdminView,
  onToggleAdminView,
  onOpenPartner,
}: HeaderNavbarProps) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const fictifBalance = player.credits_fictifs !== undefined ? player.credits_fictifs : player.credits;
  const realBalance = player.solde !== undefined ? player.solde : 0;
  const realIncome = player.revenu !== undefined ? player.revenu : 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#171a1c] border-b border-[#2e3438] select-none shadow-md">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Menu Hamburger + Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            onClick={onOpenLeftSidebar}
            aria-label="Menu principal"
            className="p-2 text-zinc-300 hover:text-white hover:bg-[#222629] rounded-lg transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* / FunBet Style Logo */}
          <button
            onClick={() => onSelectNavTab('casino')}
            className="flex items-center gap-1.5 cursor-pointer group text-left"
          >
            <div className="flex items-center font-black text-xl sm:text-2xl tracking-tighter uppercase italic leading-none">
              <span className="text-white">FUN</span>
              <span className="text-[#9ce800] bg-[#9ce800]/10 px-1.5 py-0.5 rounded ml-0.5 border border-[#9ce800]/30 shadow-[0_0_12px_rgba(156,232,0,0.25)]">
                BET
              </span>
            </div>
          </button>
        </div>

        {/* Right: Search, Mode Switch, Balance Pill, Deposit CTA, Account Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Search Button */}
          <button
            onClick={onOpenSearch}
            aria-label="Rechercher des jeux"
            className="p-2 text-zinc-300 hover:text-white hover:bg-[#222629] rounded-lg transition-colors cursor-pointer"
            title="Rechercher des jeux"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Mode Switch Button (DEMO / REAL) */}
          <div className="bg-[#222629] border border-[#2e3438] p-0.5 rounded-xl flex items-center">
            <button
              onClick={() => onTogglePlayMode('DEMO')}
              className={`px-2 sm:px-3 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${
                playMode === 'DEMO'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Jouer avec des crédits virtuels gratuits"
            >
              DÉMO
            </button>
            <button
              onClick={() => onTogglePlayMode('REAL')}
              className={`px-2 sm:px-3 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${
                playMode === 'REAL'
                  ? 'bg-[#9ce800]/20 text-[#9ce800] border border-[#9ce800]/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Jouer en argent réel (FCFA)"
            >
              RÉEL
            </button>
          </div>

          {/* Balance Display Pill */}
          <div
            onClick={onRefreshBalance}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#222629] border border-[#2e3438] rounded-xl cursor-pointer hover:border-zinc-600 transition-all text-xs font-mono font-bold"
            title="Cliquez pour rafraîchir votre solde"
          >
            <div className={`w-2 h-2 rounded-full ${playMode === 'DEMO' ? 'bg-blue-400' : 'bg-[#9ce800] animate-pulse'}`} />
            <span className={playMode === 'DEMO' ? 'text-blue-300' : 'text-[#9ce800]'}>
              {playMode === 'DEMO' ? `${fictifBalance.toLocaleString()} FTB` : `${realBalance.toLocaleString()} FCFA`}
            </span>
            <RefreshCw className={`w-3 h-3 text-zinc-400 ml-1 ${isRefreshing ? 'animate-spin text-[#9ce800]' : ''}`} />
          </div>

          {/* Quick Deposit Button */}
          {playMode === 'REAL' ? (
            <button
              onClick={onOpenDeposit}
              className="px-3 sm:px-4 py-1.5 bg-[#9ce800] hover:bg-[#8ad400] active:scale-95 text-[#171a1c] font-extrabold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(156,232,0,0.25)] flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
              <span>Dépôt</span>
            </button>
          ) : (
            <button
              onClick={onOpenDailyBonus}
              className="px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 active:scale-95 text-blue-400 border border-blue-500/30 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Réclamer +10 000 FTB de démo"
            >
              <Gift className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Bonus +10k</span>
            </button>
          )}

          {/* Account Profile Menu Button */}
          <div ref={accountMenuRef} className="relative">
            <button
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 bg-[#222629] hover:bg-[#2c3033] border border-[#2e3438] rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <div className="w-6 h-6 rounded-lg bg-[#9ce800]/15 text-[#9ce800] border border-[#9ce800]/30 font-mono font-bold text-xs flex items-center justify-center">
                {player.username.slice(0, 2).toUpperCase()}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isAccountMenuOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isAccountMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#222629] border border-[#2e3438] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                {/* User Info */}
                <div className="border-b border-[#2e3438] pb-3 mb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-white truncate">{player.username}</span>
                    {player.isAdmin && (
                      <span className="px-1.5 py-0.5 bg-red-500/15 border border-red-500/40 rounded text-[9px] font-mono font-bold text-red-400">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">ID: {player.id}</p>
                </div>

                {/* Balances detail */}
                <div className="space-y-2 bg-[#171a1c] p-2.5 rounded-xl border border-[#2e3438] mb-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px]">Mode Réel :</span>
                    <span className="font-bold text-[#9ce800]">{realBalance.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px]">Mode Démo :</span>
                    <span className="font-bold text-blue-400">{fictifBalance.toLocaleString()} FTB</span>
                  </div>
                  {realIncome !== 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                      <span className="text-zinc-500 text-[10px]">Revenu net :</span>
                      <span className={`text-[11px] font-bold ${realIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {realIncome >= 0 ? '+' : ''}{realIncome.toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-1.5">
                  <button
                    onClick={() => { onOpenDeposit(); setIsAccountMenuOpen(false); }}
                    className="w-full px-3 py-2 bg-[#9ce800] hover:bg-[#8ad400] text-[#171a1c] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Dépôt & Retrait</span>
                  </button>

                  <button
                    onClick={() => { onOpenDailyBonus(); setIsAccountMenuOpen(false); }}
                    className="w-full px-3 py-2 bg-[#171a1c] hover:bg-[#2c3033] border border-[#2e3438] text-zinc-200 text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Gift className="w-4 h-4 text-blue-400" />
                    <span>Bonus Quotidien (+10k FTB)</span>
                  </button>

                  {fictifBalance < 10 && (
                    <button
                      onClick={() => { onOpenRuineReset(); setIsAccountMenuOpen(false); }}
                      className="w-full px-3 py-2 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 text-amber-300 text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer animate-pulse"
                    >
                      <RefreshCw className="w-4 h-4 text-amber-400" />
                      <span>Secours Ruine (10k FTB)</span>
                    </button>
                  )}

                  {player.isPartner && onOpenPartner && (
                    <button
                      onClick={() => { onOpenPartner(); setIsAccountMenuOpen(false); }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer bg-[#9ce800]/15 border border-[#9ce800]/30 text-[#9ce800] hover:bg-[#9ce800]/25"
                    >
                      <Users className="w-4 h-4" />
                      <span>Espace Partenaire</span>
                    </button>
                  )}

                  {player.isAdmin && (
                    <button
                      onClick={() => { onToggleAdminView(); setIsAccountMenuOpen(false); }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isAdminView
                          ? 'bg-[#171a1c] text-[#9ce800] border border-[#9ce800]/40'
                          : 'bg-[#171a1c] text-zinc-200 border border-[#2e3438] hover:border-zinc-600'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-[#9ce800]" />
                      <span>{isAdminView ? 'Quitter Console Admin' : 'Console Administration'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => { onLogout(); setIsAccountMenuOpen(false); }}
                    className="w-full px-3 py-2 bg-[#171a1c] hover:bg-red-950/20 text-zinc-400 hover:text-red-400 border border-[#2e3438] hover:border-red-900/30 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer mt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Sub-Navbar Navigation Tabs ( subNavbar style) */}
      <div className="w-full bg-[#222629] border-t border-[#2e3438] px-2 sm:px-4">
        <nav className="max-w-7xl mx-auto flex items-center overflow-x-auto no-scrollbar gap-1 sm:gap-2 py-1.5">
          
          <button
            onClick={() => onSelectNavTab('casino')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeNavTab === 'casino' || activeNavTab === 'home'
                ? 'bg-[#9ce800] text-[#171a1c] shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-[#2c3033]'
            }`}
          >
            <span>🎰 Tous les Jeux</span>
          </button>

          <button
            onClick={() => onSelectNavTab('game-mines')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeNavTab === 'game-mines'
                ? 'bg-[#9ce800] text-[#171a1c] shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-[#2c3033]'
            }`}
          >
            <span>💣 Démineur Pro</span>
          </button>

          <button
            onClick={() => onSelectNavTab('game-crash')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeNavTab === 'game-crash'
                ? 'bg-[#9ce800] text-[#171a1c] shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-[#2c3033]'
            }`}
          >
            <span>🚀 Rocket Crash</span>
          </button>

          <button
            onClick={() => onSelectNavTab('game-wheel')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeNavTab === 'game-wheel'
                ? 'bg-[#9ce800] text-[#171a1c] shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-[#2c3033]'
            }`}
          >
            <span>📀 Roue de la Fortune</span>
          </button>

          <button
            onClick={() => onSelectNavTab('game-bonanza')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeNavTab === 'game-bonanza'
                ? 'bg-[#9ce800] text-[#171a1c] shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-[#2c3033]'
            }`}
          >
            <span>🍬 Sweet Bonanza</span>
          </button>

          {player.isAdmin && (
            <button
              onClick={() => onToggleAdminView()}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isAdminView
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-red-400 hover:text-red-300 hover:bg-red-950/20'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Backoffice</span>
            </button>
          )}

        </nav>
      </div>

    </header>
  );
}
