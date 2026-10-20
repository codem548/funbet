import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Shield, FileText, AlertCircle } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import HeaderNavbar from './components/HeaderNavbar';
import LeftSidebarDrawer from './components/LeftSidebarDrawer';
import SearchModal from './components/SearchModal';
import CasinoLobby from './components/CasinoLobby';
import DepositWithdrawModal from './components/DepositWithdrawModal';
import Footer from './components/Footer';
import MinesGame from './components/MinesGame';
import CrashGame from './components/CrashGame';
import WheelGame from './components/WheelGame';
import SweetBonanzaGame from './components/SweetBonanzaGame';
import AdminPanel from './components/AdminPanel';
import InstallAppPrompt from './components/InstallAppPrompt';
import PartnerDashboard from './components/PartnerDashboard';
import { Player, GameConfig } from './types';

export default function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Navigation and view state
  const [activeNavTab, setActiveNavTab] = useState<string>('casino');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [games, setGames] = useState<GameConfig[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);
  const [playMode, setPlayMode] = useState<'REAL' | 'DEMO'>('REAL');

  // Modals & Drawers
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositModalTab, setDepositModalTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showPartnerDashboard, setShowPartnerDashboard] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [globalBannerMsg, setGlobalBannerMsg] = useState<string | null>(null);

  // Resume session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('funbet_token');
    if (storedToken) {
      setToken(storedToken);
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Session expirable');
          return res.json();
        })
        .then((data) => {
          setPlayer(data.player);
          if (data.player.isAdmin) {
            setIsAdminView(true);
          }
        })
        .catch(() => {
          localStorage.removeItem('funbet_token');
          setToken(null);
        })
        .finally(() => {
          setLoadingSession(false);
        });
    } else {
      setLoadingSession(false);
    }
  }, []);

  // Periodic balance sync
  useEffect(() => {
    if (!token) return;

    const intervalId = setInterval(() => {
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Sync error');
        })
        .then((data) => {
          setPlayer(prevPlayer => {
            if (!prevPlayer) return data.player;
            if (
              prevPlayer.solde !== data.player.solde ||
              prevPlayer.credits_fictifs !== data.player.credits_fictifs ||
              prevPlayer.revenu !== data.player.revenu ||
              prevPlayer.credits !== data.player.credits
            ) {
              return {
                ...prevPlayer,
                solde: data.player.solde,
                credits_fictifs: data.player.credits_fictifs,
                credits: data.player.credits,
                revenu: data.player.revenu,
                lastDailyClaim: data.player.lastDailyClaim,
              };
            }
            return prevPlayer;
          });
        })
        .catch((err) => {
          console.warn('Periodic balance sync error:', err);
        });
    }, 4000);

    return () => clearInterval(intervalId);
  }, [token]);

  // Fetch games config
  const fetchGamesConfig = async () => {
    try {
      const res = await fetch('/api/admin/games');
      const data = await res.json();
      if (res.ok) {
        setGames(data.games);
      }
    } catch (e) {
      console.error('Error fetching games config', e);
    }
  };

  useEffect(() => {
    if (player) {
      fetchGamesConfig();
    }
  }, [player, activeGameId, isAdminView]);

  const handleLoginSuccess = (loggedInPlayer: Player, jwtToken: string) => {
    setPlayer(loggedInPlayer);
    setToken(jwtToken);
    localStorage.setItem('funbet_token', jwtToken);
    if (loggedInPlayer.isAdmin) {
      setIsAdminView(true);
    }
  };

  const handleLogout = () => {
    setPlayer(null);
    setToken(null);
    setActiveGameId(null);
    setIsAdminView(false);
    localStorage.removeItem('funbet_token');
  };

  const handleRefreshBalance = async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlayer(data.player);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleClaimDailyBonus = async () => {
    if (!player) return;
    try {
      const res = await fetch('/api/wallet/claim-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: player.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du claim');
      }
      setPlayer({ 
        ...player, 
        credits_fictifs: data.credits, 
        credits: data.credits, 
        lastDailyClaim: data.lastDailyClaim 
      });
      setGlobalBannerMsg('🎉 Félicitations ! +10 000 FTB ont été ajoutés à votre compte Démo.');
      setTimeout(() => setGlobalBannerMsg(null), 5000);
    } catch (err: any) {
      setGlobalBannerMsg(`⚠️ ${err.message}`);
      setTimeout(() => setGlobalBannerMsg(null), 5000);
    }
  };

  const handleRuineReset = async () => {
    if (!player) return;
    try {
      const res = await fetch('/api/wallet/reset-bankrupt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: player.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du reset');
      }
      setPlayer({ 
        ...player, 
        credits_fictifs: data.credits, 
        credits: data.credits 
      });
      setGlobalBannerMsg('🛡️ Secours activé ! Solde Démo réinitialisé à 10 000 FTB.');
      setTimeout(() => setGlobalBannerMsg(null), 5000);
    } catch (err: any) {
      setGlobalBannerMsg(`⚠️ ${err.message}`);
      setTimeout(() => setGlobalBannerMsg(null), 5000);
    }
  };

  const handleSelectNavTab = (tab: string) => {
    if (tab === 'game-mines') {
      setActiveGameId('mines');
      setIsAdminView(false);
    } else if (tab === 'game-crash') {
      setActiveGameId('crash');
      setIsAdminView(false);
    } else if (tab === 'game-wheel') {
      setActiveGameId('wheel');
      setIsAdminView(false);
    } else if (tab === 'game-bonanza') {
      setActiveGameId('bonanza');
      setIsAdminView(false);
    } else {
      setActiveNavTab(tab);
      setActiveGameId(null);
      setIsAdminView(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#171a1c] flex flex-col items-center justify-center font-sans select-none">
        <div className="flex items-center font-black text-3xl tracking-tighter uppercase italic mb-4">
          <span className="text-white">FUN</span>
          <span className="text-[#9ce800] bg-[#9ce800]/10 px-2 py-0.5 rounded ml-1 border border-[#9ce800]/30 shadow-[0_0_15px_rgba(156,232,0,0.3)]">
            BET
          </span>
        </div>
        <div className="w-8 h-8 border-3 border-[#9ce800]/20 border-t-[#9ce800] rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-zinc-400">Chargement du lobby betPawa & Casino...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <>
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
        <InstallAppPrompt />
      </>
    );
  }

  const minesConfig = games.find((g) => g.id === 'mines');
  const crashConfig = games.find((g) => g.id === 'crash');
  const wheelConfig = games.find((g) => g.id === 'wheel');
  const bonanzaConfig = games.find((g) => g.id === 'bonanza');

  return (
    <div className="min-h-screen bg-[#171a1c] text-white flex flex-col font-sans relative selection:bg-[#9ce800]/30 selection:text-[#9ce800]">
      
      {/* Top Header Navbar */}
      <HeaderNavbar
        player={player}
        onLogout={handleLogout}
        playMode={playMode}
        onTogglePlayMode={setPlayMode}
        activeNavTab={activeNavTab}
        onSelectNavTab={handleSelectNavTab}
        onOpenLeftSidebar={() => setIsLeftSidebarOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenDeposit={() => { setDepositModalTab('deposit'); setIsDepositModalOpen(true); }}
        onOpenDailyBonus={handleClaimDailyBonus}
        onOpenRuineReset={handleRuineReset}
        onRefreshBalance={handleRefreshBalance}
        isRefreshing={isRefreshing}
        isAdminView={isAdminView}
        onToggleAdminView={() => setIsAdminView(!isAdminView)}
        onOpenPartner={() => setShowPartnerDashboard(true)}
      />

      {/* Global Notification Banner if message */}
      {globalBannerMsg && (
        <div className="bg-[#222629] border-b border-[#9ce800]/40 text-[#9ce800] py-2 px-4 text-xs font-mono font-bold text-center animate-in slide-in-from-top-2 flex items-center justify-center gap-2">
          <span>{globalBannerMsg}</span>
          <button onClick={() => setGlobalBannerMsg(null)} className="text-zinc-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-5 sm:py-6 relative z-10">
        
        {isAdminView ? (
          /* Admin Backoffice Console */
          <AdminPanel adminPlayer={player} />
        ) : activeGameId ? (
          /* Embedded Interactive Game Stage */
          <div className="space-y-4 animate-in zoom-in-98 duration-150">
            
            {/* Top Toolbar back link */}
            <div className="flex items-center justify-between bg-[#222629] p-3 rounded-2xl border border-[#2e3438]">
              <button
                onClick={() => setActiveGameId(null)}
                className="px-3 py-1.5 bg-[#171a1c] hover:bg-[#2c3033] border border-[#2e3438] text-xs font-bold text-zinc-200 hover:text-white rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour au Casino</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400 hidden sm:inline">Mode actif :</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                  playMode === 'REAL' ? 'bg-[#9ce800]/15 text-[#9ce800] border border-[#9ce800]/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                }`}>
                  {playMode === 'REAL' ? 'RÉEL (FCFA)' : 'DÉMO (FTB)'}
                </span>
              </div>
            </div>

            {/* Active Game Component Engine */}
            {activeGameId === 'mines' && minesConfig && (
              <MinesGame
                player={player}
                gameConfig={minesConfig}
                playMode={playMode}
                onUpdatePlayer={setPlayer}
              />
            )}

            {activeGameId === 'crash' && crashConfig && (
              <CrashGame
                player={player}
                gameConfig={crashConfig}
                playMode={playMode}
                onUpdatePlayer={setPlayer}
              />
            )}

            {activeGameId === 'wheel' && wheelConfig && (
              <WheelGame
                player={player}
                gameConfig={wheelConfig}
                playMode={playMode}
                onUpdatePlayer={setPlayer}
              />
            )}

            {activeGameId === 'bonanza' && bonanzaConfig && (
              <SweetBonanzaGame
                player={player}
                gameConfig={bonanzaConfig}
                playMode={playMode}
                onUpdatePlayer={setPlayer}
              />
            )}

          </div>
        ) : (
          /* Casino & Home Lobby */
          <CasinoLobby
            player={player}
            playMode={playMode}
            onLaunchGame={(id) => setActiveGameId(id)}
            onOpenDeposit={() => { setDepositModalTab('deposit'); setIsDepositModalOpen(true); }}
            onOpenDailyBonus={handleClaimDailyBonus}
            games={games}
          />
        )}

      </main>

      {/* Left Sidebar Drawer */}
      <LeftSidebarDrawer
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
        player={player}
        playMode={playMode}
        onTogglePlayMode={setPlayMode}
        onSelectNavTab={handleSelectNavTab}
        onOpenDeposit={() => { setDepositModalTab('deposit'); setIsDepositModalOpen(true); }}
        onOpenDailyBonus={handleClaimDailyBonus}
        onOpenRuineReset={handleRuineReset}
        onOpenRules={() => setShowRulesModal(true)}
        onLogout={handleLogout}
        isAdminView={isAdminView}
        onToggleAdminView={() => setIsAdminView(!isAdminView)}
        onOpenPartner={() => setShowPartnerDashboard(true)}
      />

      {/* Quick Search Drawer/Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectGame={(id) => setActiveGameId(id)}
        games={games}
      />

      {/* Deposit & Withdraw Mobile Money Modal */}
      <DepositWithdrawModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        player={player}
        onUpdatePlayer={setPlayer}
        defaultTab={depositModalTab}
      />

      {/* Espace Partenaire */}
      {showPartnerDashboard && player?.isPartner && (
        <PartnerDashboard
          player={player}
          onClose={() => setShowPartnerDashboard(false)}
          onBalanceUpdate={(solde, partnerBalance) => {
            setPlayer((prev) =>
              prev ? { ...prev, solde, partnerBalance } : prev
            );
          }}
        />
      )}

      {/* Rules & Info Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowRulesModal(false)} />
          <div className="relative w-full max-w-lg bg-[#171a1c] border border-[#2e3438] rounded-3xl p-6 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-[#2e3438] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#9ce800]" />
                <h3 className="font-extrabold text-base text-white">Règlement des Jeux FunBet</h3>
              </div>
              <button onClick={() => setShowRulesModal(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-sans">
              <div className="bg-[#222629] p-3 rounded-xl border border-[#2e3438]">
                <h4 className="font-bold text-white mb-1">💣 1. Démineur Pro (5x5)</h4>
                <p>Grille de 25 cases. Choisissez de 1 à 24 mines. Chaque gemme découverte augmente votre multiplicateur de gain. Vous pouvez encaisser (Cashout) à tout moment.</p>
              </div>

              <div className="bg-[#222629] p-3 rounded-xl border border-[#2e3438]">
                <h4 className="font-bold text-white mb-1">🚀 2. Rocket Crash</h4>
                <p>La fusée s'élève avec un multiplicateur qui grimpe en continu (1.00x à 100x+). Encaissez avant l'explosion pour remporter votre mise multipliée.</p>
              </div>

              <div className="bg-[#222629] p-3 rounded-xl border border-[#2e3438]">
                <h4 className="font-bold text-white mb-1">📀 3. Roue de la Fortune</h4>
                <p>Roue de 60 segments répartis selon le niveau de risque sélectionné (Bas, Moyen, Haut). Gains instantanés jusqu'à 50x.</p>
              </div>

              <div className="bg-[#222629] p-3 rounded-xl border border-[#2e3438]">
                <h4 className="font-bold text-white mb-1">🍬 4. Sweet Bonanza Cascade</h4>
                <p>Grille 6x5. Les groupes de symboles explosent en cascade. Les symboles Scatters déclenchent les tours gratuits avec multiplicateurs jusqu'à 100x.</p>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 bg-[#9ce800] text-[#171a1c] font-black rounded-xl text-xs"
            >
              Fermer et retourner au jeu
            </button>
          </div>
        </div>
      )}

      {/* Authentic betPawa / Sportsbook Footer */}
      <Footer />

      {/* PWA install banner — non-blocking */}
      <InstallAppPrompt />

    </div>
  );
}
