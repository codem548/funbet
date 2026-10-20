import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  HelpCircle, 
  Trophy, 
  AlertCircle, 
  X, 
  Coins, 
  Flame, 
  TrendingUp, 
  Info,
  Bomb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Player, GameConfig } from '../types';
import { sound } from '../utils/audioHaptics';

interface MinesGameProps {
  player: Player;
  gameConfig: GameConfig;
  playMode: 'REAL' | 'DEMO';
  onUpdatePlayer: (updated: Player) => void;
  onOpenProvablyFair?: () => void;
}

export default function MinesGame({ player, gameConfig, playMode, onUpdatePlayer, onOpenProvablyFair }: MinesGameProps) {
  const [bet, setBet] = useState(500);
  const [minesCount, setMinesCount] = useState(3);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [showRulesModal, setShowRulesModal] = useState(false);
  
  // Grid tracking
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [userRevealedIndices, setUserRevealedIndices] = useState<number[]>([]);
  const [explodedIndex, setExplodedIndex] = useState<number | null>(null);
  const [minesGrid, setMinesGrid] = useState<('MINE' | 'GEM' | null)[]>(Array(25).fill(null));
  
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Multiplier Steps Generator (house edge included, 3% on average)
  const getMultiplierForStep = (stepCount: number, mines: number): number => {
    if (stepCount <= 0 || stepCount > 25 - mines) return 1.0;
    let ways = 1.0;
    const n = 25;
    for (let i = 0; i < stepCount; i++) {
      ways *= (n - i - mines) / (n - i);
    }
    return Number((0.97 / ways).toFixed(2));
  };

  const updatePlayerBalance = (currentBalance: number) => {
    const updatedPlayer = { ...player };
    if (playMode === 'REAL') {
      updatedPlayer.solde = currentBalance;
    } else {
      updatedPlayer.credits_fictifs = currentBalance;
      updatedPlayer.credits = currentBalance;
    }
    onUpdatePlayer(updatedPlayer);
  };

  const handleStartGame = async () => {
    if (bet < gameConfig.minBet || bet > gameConfig.maxBet) {
      setError(`La mise doit être comprise entre ${gameConfig.minBet.toLocaleString()} et ${gameConfig.maxBet.toLocaleString()} ${playMode === 'REAL' ? 'FCFA' : 'FTB'}`);
      return;
    }
    
    const activeBalance = playMode === 'REAL' ? (player.solde || 0) : (player.credits_fictifs || 0);
    if (activeBalance < bet) {
      setError(playMode === 'REAL' ? "Solde réel insuffisant" : "Crédits démo insuffisants");
      return;
    }

    sound.playClick();
    setLoading(true);
    setError(null);
    setRevealedIndices([]);
    setUserRevealedIndices([]);
    setExplodedIndex(null);
    setMinesGrid(Array(25).fill(null));
    setCurrentMultiplier(1.0);

    try {
      const res = await fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: player.id,
          gameId: 'mines',
          bet,
          mode: playMode,
          customData: { minesCount },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du démarrage');
      }

      updatePlayerBalance(data.currentBalance);
      setGameStatus('playing');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTileClick = async (idx: number) => {
    if (gameStatus !== 'playing' || userRevealedIndices.includes(idx) || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/play/mines/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: player.id,
          tileIndex: idx,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur de révélation');
      }

      if (data.isMine) {
        sound.playExplosion();
        setGameStatus('lost');
        setExplodedIndex(idx);
        setMinesGrid(data.revealedGrid);
        setRevealedIndices(Array.from({ length: 25 }, (_, i) => i));

        const meRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer simulated-jwt-token-for-${player.id}` }
        });
        const meData = await meRes.json();
        if (meRes.ok) onUpdatePlayer(meData.player);
      } else {
        const nextStepsCount = userRevealedIndices.length + 1;
        sound.playGemClick(nextStepsCount);
        
        const updatedUserReveals = [...userRevealedIndices, idx];
        setUserRevealedIndices(updatedUserReveals);
        setRevealedIndices(data.revealedIndices);
        setCurrentMultiplier(data.multiplier);

        const newGrid = [...minesGrid];
        newGrid[idx] = 'GEM';
        setMinesGrid(newGrid);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCashout = async () => {
    if (gameStatus !== 'playing' || userRevealedIndices.length === 0 || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/play/mines/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: player.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur d\'encaissement');
      }

      sound.playCashoutSound(currentMultiplier);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#9ce800', '#22c55e', '#f59e0b']
      });

      setGameStatus('won');
      setMinesGrid(data.revealedGrid);
      setRevealedIndices(Array.from({ length: 25 }, (_, i) => i));
      updatePlayerBalance(data.currentBalance);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1e2225] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl max-w-5xl mx-auto font-sans text-zinc-100">
      
      {/* Upper header summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 mb-4 sm:mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#9ce800]/10 rounded-xl border border-[#9ce800]/20 text-[#9ce800]">
            <Grid className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Démineur Pro {playMode === 'REAL' ? '(Argent Réel)' : '(Démo)'}
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              Dévoilez les diamants sans toucher de bombe. Encaissez vos gains à tout instant !
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenProvablyFair && (
            <button
              onClick={onOpenProvablyFair}
              className="px-3 py-1.5 bg-[#262b2f] hover:bg-[#32393e] text-emerald-400 rounded-xl border border-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Provably Fair</span>
            </button>
          )}

          <button
            onClick={() => setShowRulesModal(true)}
            className="p-2 text-zinc-400 bg-[#262b2f] hover:bg-[#32393e] hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer"
            title="Règles du Démineur"
          >
            <AlertCircle className="w-4 h-4 text-[#9ce800]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* Left Control Panel */}
        <div className="lg:col-span-4 order-2 lg:order-1 space-y-4 bg-[#171a1c] p-4 rounded-2xl border border-white/5">
          
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-400 font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Bet Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
                Mise ({playMode === 'REAL' ? 'FCFA' : 'FTB'})
              </label>
              <span className="text-[10px] font-mono text-zinc-400">
                Min: {gameConfig.minBet} • Max: {gameConfig.maxBet}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={bet}
                onChange={(e) => setBet(Math.max(1, Number(e.target.value)))}
                disabled={gameStatus === 'playing'}
                className="w-full bg-[#141719] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#9ce800] disabled:opacity-50"
              />
            </div>
            
            {/* Quick Multipliers */}
            <div className="grid grid-cols-4 gap-1.5">
              {[500, 1000, 2500, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBet(val)}
                  disabled={gameStatus === 'playing'}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                    bet === val
                      ? 'bg-[#9ce800] text-[#171a1c] border-[#9ce800]'
                      : 'bg-[#141719] text-zinc-300 border-white/5 hover:border-zinc-500'
                  }`}
                >
                  {val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Mines Count */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
              Nombre de Mines
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 3, 5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMinesCount(n)}
                  disabled={gameStatus === 'playing'}
                  className={`py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                    minesCount === n
                      ? 'bg-[#9ce800] text-[#171a1c] border-[#9ce800] shadow-sm'
                      : 'bg-[#141719] hover:bg-[#222629] border-white/5 text-zinc-300'
                  }`}
                >
                  {n} 💣
                </button>
              ))}
            </div>
          </div>

          {/* Action Button (Play / Cashout) */}
          {gameStatus !== 'playing' ? (
            <button
              onClick={handleStartGame}
              disabled={loading}
              className="w-full py-3.5 bg-[#9ce800] hover:bg-[#8bd100] text-[#171a1c] rounded-xl font-black text-sm tracking-wide shadow-lg shadow-[#9ce800]/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>{loading ? 'Démarrage...' : `Jouer (${bet.toLocaleString()} ${playMode === 'REAL' ? 'FCFA' : 'FTB'})`}</span>
            </button>
          ) : (
            <button
              onClick={handleCashout}
              disabled={userRevealedIndices.length === 0 || loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-[#9ce800] text-[#171a1c] rounded-xl font-black text-sm tracking-wider shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex flex-col items-center justify-center gap-0.5"
            >
              <span className="uppercase text-[10px] font-bold tracking-widest opacity-85">ENCAISSER DIRECT</span>
              <span className="text-base font-mono font-black">
                {userRevealedIndices.length === 0 
                  ? 'Cliquez sur une case...' 
                  : `${Math.floor(bet * currentMultiplier).toLocaleString()} ${playMode === 'REAL' ? 'FCFA' : 'FTB'} (${currentMultiplier.toFixed(2)}x)`
                }
              </span>
            </button>
          )}

          {/* Live Game Stats / Multiplier Board */}
          {gameStatus === 'playing' && (
            <div className="bg-[#141719] border border-white/5 rounded-xl p-3 text-center space-y-1">
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">MULTIPLICATEUR ACTUEL</p>
              <h3 className="text-3xl font-mono font-black text-[#9ce800] tracking-tight">
                {currentMultiplier.toFixed(2)}x
              </h3>
              <div className="text-xs text-zinc-300">
                Gains sécurisables : <strong className="text-emerald-400 font-mono font-bold">{(Math.floor(bet * currentMultiplier)).toLocaleString()}</strong> {playMode === 'REAL' ? 'FCFA' : 'FTB'}
              </div>
            </div>
          )}

          {/* End Round Visual Feedbacks */}
          {gameStatus === 'won' && (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-center space-y-1 animate-in fade-in">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">RETRAIT EFFECTUÉ !</h4>
              <p className="text-xs text-zinc-300">
                Gains de <strong className="font-mono text-emerald-300">+{Math.floor(bet * currentMultiplier).toLocaleString()}</strong> {playMode === 'REAL' ? 'FCFA' : 'FTB'}
              </p>
            </div>
          )}

          {gameStatus === 'lost' && (
            <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-center space-y-1 animate-in fade-in">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">BOUM ! MINE TOUCHÉE</h4>
              <p className="text-[11px] text-zinc-400 font-mono">Perte de : {bet.toLocaleString()} {playMode === 'REAL' ? 'FCFA' : 'FTB'}</p>
            </div>
          )}

        </div>

        {/* Right Stage: 5x5 Grid */}
        <div className="lg:col-span-8 order-1 lg:order-2 flex flex-col justify-center items-center gap-4">
 
          {/* 5x5 Interactive Board */}
          <div className="w-full max-w-[320px] sm:max-w-[420px] aspect-square bg-[#141719] rounded-2xl p-3 sm:p-4 border border-white/10 shadow-2xl grid grid-cols-5 gap-2 sm:gap-2.5 relative overflow-hidden">
            
            {/* Waiting configuration state overlay */}
            {gameStatus === 'idle' && (
              <div className="absolute inset-0 bg-[#141719]/85 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-center p-6 z-10 transition-all">
                <div className="h-14 w-14 rounded-full bg-[#1e2225] border border-white/10 flex items-center justify-center mb-3 text-zinc-400 shadow-inner">
                  <Grid className="w-6 h-6 text-[#9ce800] animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-white">Grille Prête</h3>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-[260px] leading-relaxed">
                  Choisissez votre mise et le nombre de bombes, puis lancez la partie pour déminer !
                </p>
              </div>
            )}

            {Array.from({ length: 25 }).map((_, i) => {
              const isRevealed = revealedIndices.includes(i);
              const isUserClicked = userRevealedIndices.includes(i);
              const isExploded = explodedIndex === i;
              const val = minesGrid[i];
              
              let btnClass = "w-full h-full rounded-xl flex items-center justify-center font-mono font-bold text-lg cursor-pointer border transition-all duration-200 select-none relative overflow-hidden";
              let content = "";

              if (!isRevealed) {
                btnClass += " bg-[#1e2225] border-white/5 hover:bg-[#282e33] hover:border-[#9ce800]/40 active:scale-95 shadow-md";
                content = "?";
              } else {
                if (val === 'MINE') {
                  if (isExploded) {
                    btnClass += " bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-bounce";
                    content = "💥";
                  } else {
                    btnClass += " bg-[#1e2225]/40 border-white/5 text-red-400/50 opacity-50";
                    content = "💣";
                  }
                } else if (val === 'GEM') {
                  if (isUserClicked) {
                    btnClass += " bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400";
                    content = "💎";
                  } else {
                    btnClass += " bg-[#1e2225]/30 border-white/5 text-zinc-600 opacity-40";
                    content = "💎";
                  }
                } else {
                  btnClass += " bg-[#141719] border-white/5 text-zinc-700 opacity-30";
                  content = "💎";
                }
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleTileClick(i)}
                  disabled={gameStatus !== 'playing' || isRevealed || loading}
                  className={btnClass}
                >
                  <span className={isRevealed ? "text-2xl transition-all scale-110" : "text-zinc-500 text-xs font-mono"}>
                    {content}
                  </span>
                </button>
              );
            })}

          </div>

          <div className="flex items-center justify-between w-full max-w-[320px] sm:max-w-[420px] px-2 text-[10px] text-zinc-400 font-mono">
            <span>{gameStatus === 'playing' ? "💎 Chaque diamant augmente la cote" : "🔒 Tirage mathématique sécurisé"}</span>
            <span className="text-emerald-400">100% PROVABLY FAIR</span>
          </div>

        </div>

      </div>

      {/* Rules Information Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e2225] border border-white/10 p-6 rounded-2xl max-w-md w-full mx-4 space-y-4 shadow-2xl relative text-zinc-100">
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="p-2 bg-[#9ce800]/10 rounded-xl border border-[#9ce800]/20 text-[#9ce800]">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Règles du Démineur</h3>
            </div>
            
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <ul className="space-y-2 list-none pl-0">
                <li className="flex gap-2">
                  <span className="text-[#9ce800] font-bold">•</span>
                  <span>Choisissez la <strong className="text-white">mise</strong> et le nombre de bombes cachées.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#9ce800] font-bold">•</span>
                  <span>Chaque diamant dévoilé <strong className="text-emerald-400">💎</strong> augmente votre multiplicateur.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#9ce800] font-bold">•</span>
                  <span>Si vous touchez une <strong className="text-red-400 font-semibold">bombe 💣</strong>, la mise est perdue.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#9ce800] font-bold">•</span>
                  <span>Encaissez à tout moment pour sécuriser vos gains instantanément !</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-3 border-t border-white/5 text-center">
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full py-2.5 bg-[#9ce800] hover:bg-[#8bd100] text-[#171a1c] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Compris !
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
