import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, Award, Volume2, RotateCcw, Zap, AlertCircle, Flame, Gift, Coins, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Player, GameConfig } from '../types';

interface SweetBonanzaGameProps {
  player: Player;
  gameConfig: GameConfig;
  playMode: 'REAL' | 'DEMO';
  onUpdatePlayer: (updatedPlayer: Player) => void;
}

// Visual theme configurations for each symbol
const SYMBOL_THEMES: Record<string, { name: string; color: string; glow: string; scale: string; emoji: string }> = {
  '🍌': { name: 'Banane', color: '#eab308', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.4)]', scale: 'hover:scale-110', emoji: '🍌' },
  '🍇': { name: 'Raisin', color: '#a855f7', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]', scale: 'hover:scale-110', emoji: '🍇' },
  '🍉': { name: 'Pastèque', color: '#22c55e', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.4)]', scale: 'hover:scale-110', emoji: '🍉' },
  '🫐': { name: 'Prune', color: '#3b82f6', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]', scale: 'hover:scale-110', emoji: '🫐' },
  '🍎': { name: 'Pomme', color: '#ef4444', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]', scale: 'hover:scale-110', emoji: '🍎' },
  '🟦': { name: 'Bonbon Bleu', color: '#06b6d4', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]', scale: 'hover:scale-115', emoji: '🟦' },
  '🟩': { name: 'Bonbon Vert', color: '#10b981', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]', scale: 'hover:scale-115', emoji: '🟩' },
  '🟪': { name: 'Bonbon Violet', color: '#8b5cf6', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.5)]', scale: 'hover:scale-115', emoji: '🟪' },
  '❤️': { name: 'Cœur Rouge', color: '#ec4899', glow: 'shadow-[0_0_20px_rgba(236,72,153,0.6)]', scale: 'hover:scale-120', emoji: '❤️' },
  '🍭': { name: 'Sucette Scatter', color: '#f43f5e', glow: 'shadow-[0_0_25px_rgba(244,63,94,0.75)]', scale: 'hover:scale-120 animate-pulse', emoji: '🍭' },
  '💣': { name: 'Multiplier Bomb', color: '#f59e0b', glow: 'shadow-[0_0_25px_rgba(245,158,11,0.75)]', scale: 'hover:scale-125 animate-bounce', emoji: '💣' }
};

// Default initial grid (loss-free preview)
const INITIAL_PREVIEW_GRID = [
  '🍌', '🍎', '🟦', '🟩', '🟪', '🍌',
  '🍇', '🍉', '🫐', '❤️', '🟦', '🍉',
  '🍉', '🍇', '🍎', '🟩', '🟪', '🫐',
  '🍌', '🍎', '🟦', '❤️', '🍌', '🍇',
  '🍇', '🍉', '🫐', '🟩', '🟪', '❤️'
];

export default function SweetBonanzaGame({ player, gameConfig, playMode, onUpdatePlayer }: SweetBonanzaGameProps) {
  const [bet, setBet] = useState(100);
  const [grid, setGrid] = useState<string[]>(INITIAL_PREVIEW_GRID);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation states
  const [activeTumbleIndex, setActiveTumbleIndex] = useState(0);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const [highlightedBombSum, setHighlightedBombSum] = useState<number | null>(null);
  const [showTotalWinsPopup, setShowTotalWinsPopup] = useState(false);

  // Free spins controller
  const [isBonusRoundActive, setIsBonusRoundActive] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [totalAccumulatedWin, setTotalAccumulatedWin] = useState(0);
  const [isAutoplayRunning, setIsAutoplayRunning] = useState(false);
  const [currentSpinIndex, setCurrentSpinIndex] = useState(0);

  const [lastWinDetails, setLastWinDetails] = useState<{
    payout: number;
    multiplier: number;
    desc?: string;
  } | null>(null);

  const autoplayRef = useRef(false);

  // Synchronize autoplay state
  useEffect(() => {
    autoplayRef.current = isAutoplayRunning;
  }, [isAutoplayRunning]);

  // Clean state helper
  const resetGameState = () => {
    setGrid(INITIAL_PREVIEW_GRID);
    setIsSpinning(false);
    setWinningCells([]);
    setLastWinDetails(null);
    setHighlightedBombSum(null);
    setShowTotalWinsPopup(false);
    setIsBonusRoundActive(false);
    setFreeSpinsLeft(0);
    setTotalAccumulatedWin(0);
    setIsAutoplayRunning(false);
    setError(null);
  };

  // Audio system helper
  const playSound = (type: 'pop' | 'bomb' | 'win' | 'lose' | 'click' | 'trigger' | 'bonus_start') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'pop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'bomb') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.setValueAtTime(650, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(780, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'trigger') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      } else if (type === 'bonus_start') {
        // Celestial rising synth chord
        const notes = [261.6, 329.6, 392.0, 523.3]; // C major chord
        notes.forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          g.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          o.start(ctx.currentTime + idx * 0.12);
          o.stop(ctx.currentTime + 0.8);
        });
      } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('AudioContext failed:', e);
    }
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

  const currentSolde = playMode === 'REAL' ? (player.solde || 0) : (player.credits_fictifs || 0);

  // Play routine that processes the API response
  const handlePlayBonanza = async (buyBonus: boolean) => {
    if (isSpinning) return;
    setError(null);
    setWinningCells([]);
    setHighlightedBombSum(null);

    const cost = buyBonus ? bet * 100 : bet;
    if (currentSolde < cost) {
      setError(buyBonus ? 'Solde insuffisant pour acheter le bonus (100x la mise).' : 'Solde insuffisant.');
      playSound('lose');
      return;
    }

    setIsSpinning(true);
    setLastWinDetails(null);
    
    // Optimistic balance deduction to avoid visual lagging
    updatePlayerBalance(currentSolde - cost);
    playSound('click');

    try {
      const response = await fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: player.id,
          gameId: 'bonanza',
          bet,
          mode: playMode,
          customData: { buyBonus }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du lancer.');
      }

      const { spins, totalPayout, totalMultiplier, isBonusTriggered, currentBalance } = data;

      // Check if we are starting a Bonus Buy / Free Spins series
      if (buyBonus || isBonusTriggered) {
        setIsBonusRoundActive(true);
        setTotalAccumulatedWin(0);
        
        // Show celestial visual notice
        playSound('bonus_start');
        
        // Run spins sequentially
        runFreeSpinsPlaybook(spins, currentBalance);
      } else {
        // Just a single normal spin
        runSingleSpinTimeline(spins[0], () => {
          setIsSpinning(false);
          updatePlayerBalance(currentBalance);
          
          if (totalPayout > 0) {
            playSound('win');
            setLastWinDetails({ payout: totalPayout, multiplier: totalMultiplier });
            
            // Grand winning fireworks
            if (totalMultiplier >= 15) {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
              setTimeout(() => {
                confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0.1 } });
                confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 0.9 } });
              }, 200);
            }
          } else {
            playSound('lose');
          }
        });
      }

    } catch (err: any) {
      setError(err.message || 'Une erreur de connexion est survenue.');
      setIsSpinning(false);
      setIsAutoplayRunning(false);
      // Refund optimistic deduction in case of fail
      updatePlayerBalance(currentSolde);
    }
  };

  // Run a single spin's tumbles timeline on screen
  const runSingleSpinTimeline = (spinData: any, onComplete: () => void) => {
    const { tumbles, spinTotalWinBeforeBombs, spinBombsMultiplierSum, spinTotalWin } = spinData;
    let stepIndex = 0;

    const playNextStep = () => {
      if (stepIndex >= tumbles.length) {
        // End of tumble sequences. Resolve multiplier bombs if active!
        if (spinBombsMultiplierSum > 0 && spinTotalWinBeforeBombs > 0) {
          playSound('bomb');
          setHighlightedBombSum(spinBombsMultiplierSum);
          
          // Confetti explosion on the bomb multiply step
          confetti({
            particleCount: 40,
            colors: ['#f59e0b', '#fbbf24', '#ffffff'],
            spread: 50,
            origin: { y: 0.75 }
          });
        }
        
        onComplete();
        return;
      }

      const step = tumbles[stepIndex];
      setGrid(step.grid);

      // Collect cells that are winning in this step
      const winningIndices: number[] = [];
      step.winningClusters.forEach((cluster: any) => {
        winningIndices.push(...cluster.indices);
      });

      if (winningIndices.length > 0) {
        setWinningCells(winningIndices);
        playSound('pop');
        
        // Stagger slightly, then clear highlights and move to next tumble
        setTimeout(() => {
          setWinningCells([]);
          stepIndex++;
          playNextStep();
        }, 1200);
      } else {
        // No wins in this step, end spin timeline
        stepIndex++;
        playNextStep();
      }
    };

    playNextStep();
  };

  // Run the whole playlist of 10 Free Spins
  const runFreeSpinsPlaybook = async (spinsList: any[], finalBalance: number) => {
    let spinIdx = 0;
    let accumulatedWin = 0;

    const executeNextSpin = () => {
      if (spinIdx >= spinsList.length) {
        // Finished all spins! Show grand sum!
        setIsSpinning(false);
        setIsAutoplayRunning(false);
        updatePlayerBalance(finalBalance);
        setShowTotalWinsPopup(true);
        playSound('win');
        
        // Big rewards shower
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.55 } });
        return;
      }

      setCurrentSpinIndex(spinIdx + 1);
      setFreeSpinsLeft(spinsList.length - spinIdx - 1);
      setHighlightedBombSum(null);

      runSingleSpinTimeline(spinsList[spinIdx], () => {
        const roundWin = spinsList[spinIdx].spinTotalWin;
        accumulatedWin += roundWin;
        setTotalAccumulatedWin(accumulatedWin);

        if (roundWin > 0) {
          playSound('win');
        }

        // Stagger to let user see individual spin wins, then launch next
        setTimeout(() => {
          spinIdx++;
          executeNextSpin();
        }, 1800);
      });
    };

    executeNextSpin();
  };

  return (
    <div className="bg-density-panel border border-density-border rounded-3xl p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6 select-none relative overflow-hidden font-sans">
      
      {/* Dynamic Sugar Candyland background element */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-950/10 via-purple-950/5 to-sky-950/10 pointer-events-none z-0" />
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-pink-500/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-sky-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Main header bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between border-b border-density-border pb-4 gap-4">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center justify-center md:justify-start gap-2">
            <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              Sweet Bonanza™
            </span>
            <button
              onClick={() => setShowRules(true)}
              className="p-2 bg-[#09090b]/60 hover:bg-zinc-800 border border-density-border rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Règles du jeu"
            >
              <AlertCircle className="w-4 h-4 text-pink-400" />
            </button>
          </h2>
          <p className="text-xs text-zinc-400">
            Faites exploser les bonbons colorés ! Le système de tumble génère des cascades de gains et des bombes multiplicatrices.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {isBonusRoundActive && (
            <button
              onClick={resetGameState}
              disabled={isSpinning}
              className="p-2 bg-red-950/20 hover:bg-red-900/40 border border-red-900/40 rounded-xl text-red-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Quitter le bonus"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Free Spins active scoreboard panel */}
      {isBonusRoundActive && (
        <div className="relative z-10 bg-gradient-to-r from-pink-950/30 via-zinc-900/60 to-purple-950/30 border border-pink-900/40 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center animate-bounce">
              <Gift className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold text-pink-400 uppercase tracking-widest">Partie Bonus Active</p>
              <h4 className="text-md font-bold text-zinc-100 flex items-center gap-1.5">
                Lancers restants : <span className="text-pink-400 font-extrabold text-lg">{freeSpinsLeft}</span> / 10
              </h4>
            </div>
          </div>
          
          <div className="bg-[#09090b]/60 px-4 py-2 rounded-xl border border-density-border flex flex-col items-center sm:items-end">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Cumul des Gains Bonus</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {(totalAccumulatedWin * bet).toLocaleString()} {playMode === 'REAL' ? 'FCFA' : 'FTB'}
            </span>
          </div>
        </div>
      )}

      {/* Errors / notifications banner */}
      {error && (
        <div className="relative z-10 p-3.5 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-red-400 font-mono text-center flex items-center justify-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Core game grid area */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* LEFT COLUMN: Controls sidebar (5 columns wide) */}
        <div className="lg:col-span-5 order-2 lg:order-1 space-y-3 sm:space-y-4">
          
          {/* Bet select card */}
          <div className="bg-[#09090b]/60 border border-density-border p-4 rounded-2xl space-y-3">
            <label className="block text-xs text-zinc-300 font-semibold font-mono uppercase tracking-wider">Mise (FCFA / FTB)</label>
            <input
              type="number"
              disabled={isSpinning}
              value={bet}
              onChange={(e) => setBet(Math.max(1, Number(e.target.value)))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-brand/50 disabled:opacity-50"
            />
          </div>

          {/* Normal Spin Button */}
          <button
            onClick={() => handlePlayBonanza(false)}
            disabled={isSpinning || currentSolde < bet}
            className={`w-full relative py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              isSpinning
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:via-rose-400 hover:to-amber-400 text-[#09090b] shadow-pink-500/10 hover:shadow-pink-500/20 hover:scale-[1.01]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Zap className={`w-4 h-4 fill-current ${isSpinning ? 'animate-spin' : 'animate-pulse'}`} />
            <span>{isSpinning ? 'Tirage...' : 'Jouer'}</span>
          </button>

          {/* BONUS BUY BUTTON (Pragmatic Play Core Mechanic) */}
          <div className="bg-gradient-to-b from-purple-950/30 to-[#09090b] border border-purple-500/20 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                <Gift className="w-3 h-3 text-purple-400" /> Achat de Bonus
              </span>
              <span className="text-[9px] bg-purple-950 text-purple-400 border border-purple-900/40 px-1.5 py-0.5 rounded font-mono uppercase font-bold">100x</span>
            </div>

            <button
              onClick={() => handlePlayBonanza(true)}
              disabled={isSpinning || currentSolde < bet * 100}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                isSpinning
                  ? 'bg-zinc-950 text-zinc-600 border-zinc-900 cursor-not-allowed'
                  : 'bg-purple-950/60 hover:bg-purple-500 border-purple-500/40 hover:border-purple-400 text-purple-200 hover:text-purple-950 font-black hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              Acheter 10 Free Spins ({(bet * 100).toLocaleString()} {playMode === 'REAL' ? 'FCFA' : 'FTB'})
            </button>
          </div>

          {/* Real-time statistics/info list */}
          {/* <div className="bg-[#09090b]/40 border border-density-border/40 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Spécifications de Gains</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
              <div className="p-2 bg-[#09090b]/40 rounded-lg border border-zinc-950">
                <span className="text-zinc-500 block text-[9px]">Gains Cluster</span>
                <span className="text-zinc-200 font-bold">8+ Identiques</span>
              </div>
              <div className="p-2 bg-[#09090b]/40 rounded-lg border border-zinc-950">
                <span className="text-zinc-500 block text-[9px]">Multiplicateurs</span>
                <span className="text-pink-400 font-bold">Jusqu'à x100</span>
              </div>
              <div className="p-2 bg-[#09090b]/40 rounded-lg border border-zinc-950">
                <span className="text-zinc-500 block text-[9px]">Moyenne RTP</span>
                <span className="text-zinc-200 font-bold">96.4%</span>
              </div>
              <div className="p-2 bg-[#09090b]/40 rounded-lg border border-zinc-950">
                <span className="text-zinc-500 block text-[9px]">Achat Bonus</span>
                <span className="text-purple-400 font-bold">Garanti 10 FS</span>
              </div>
            </div>
          </div> */}

        </div>

        {/* RIGHT COLUMN: The 6x5 Slot grid panel (7 columns wide) */}
        <div className="lg:col-span-7 order-1 lg:order-2 space-y-3 sm:space-y-4">
          
          {/* Main Slot Screen */}
          <div className="relative bg-gradient-to-b from-sky-950/20 via-[#09090b] to-purple-950/20 border-4 border-pink-500/20 p-4 rounded-3xl shadow-[0_0_40px_rgba(236,72,153,0.06)] relative">
            
            {/* Ambient grid divider grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16.66%_20%] rounded-2xl pointer-events-none" />

            {/* The 6x5 Cells Layout */}
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {grid.map((sym, idx) => {
                const isWinning = winningCells.includes(idx);
                const isBomb = sym === '💣';
                const theme = SYMBOL_THEMES[sym];
                
                // If it's a bomb inside a tumble, try to fetch some simulated multiplier from local bomb data
                // For simplified rendering, we show random bomb numbers, e.g. 5x, 15x or the final sum on multiply step!
                let bombValLabel = '';
                if (isBomb) {
                  // Standard simulated bomb multipliers
                  const bombValues = [2, 5, 10, 25, 50, 100];
                  const fakeValue = bombValues[idx % bombValues.length];
                  bombValLabel = `x${fakeValue}`;
                }

                return (
                  <motion.div
                    key={idx}
                    layoutId={`cell-${idx}`}
                    initial={{ scale: 1, opacity: 1 }}
                    animate={
                      isWinning
                        ? { scale: [1, 1.15, 0], opacity: [1, 1, 0], rotate: [0, 12, -12] }
                        : { scale: 1, opacity: 1 }
                    }
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className={`aspect-square rounded-2xl flex items-center justify-center relative cursor-pointer select-none transition-all duration-300 ${
                      isWinning 
                        ? 'bg-pink-500/20 border-2 border-pink-500' 
                        : isBomb
                          ? 'bg-amber-500/10 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800'
                    } ${theme?.scale || ''} ${isWinning ? '' : theme?.glow || ''}`}
                    title={theme?.name || sym}
                  >
                    {isBomb ? (
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-3xl animate-bounce">💣</span>
                        <span className="absolute bottom-1 bg-amber-950/80 border border-amber-500 text-amber-400 text-[8px] sm:text-[9px] font-black px-1 rounded-full font-mono shadow-md">
                          {bombValLabel}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl sm:text-3xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                        {sym}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Multiplier Bomb explosion screen overlay */}
            <AnimatePresence>
              {highlightedBombSum !== null && (
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090b]/85 rounded-3xl z-30 p-6 space-y-3 border border-pink-500/20"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                    <span className="text-4xl">💣</span>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">Multiplicateurs de Bombe cumulés !</p>
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-pink-500 font-mono tracking-tighter">
                      x{highlightedBombSum}
                    </h3>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Results dashboard overlay bar */}
          <AnimatePresence>
            {lastWinDetails && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-emerald-950/30 border border-emerald-500/20 p-4 rounded-2xl flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 animate-pulse">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-emerald-500 uppercase font-bold tracking-wider">Lancer Gagnant</span>
                    <h4 className="text-sm font-bold text-zinc-100">
                      Multiplicateur final : <span className="text-emerald-400 font-extrabold font-mono text-base">x{lastWinDetails.multiplier}</span>
                    </h4>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Gains Récupérés</span>
                  <span className="text-md font-black text-emerald-400 font-mono">
                    {lastWinDetails.payout.toLocaleString()} {playMode === 'REAL' ? 'FCFA' : 'FTB'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* MODAL: Final Free Spins total wins dashboard */}
      <AnimatePresence>
        {showTotalWinsPopup && (
          <div className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-purple-950 via-[#09090b] to-[#09090b] border-2 border-purple-500/30 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 relative overflow-hidden"
            >
              {/* Background ambient light */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
              
              <div className="w-16 h-16 bg-purple-500/15 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400 mx-auto animate-pulse">
                <Gift className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-extrabold text-zinc-100">Bonus Terminé !</h3>
                <p className="text-xs text-zinc-400">
                  Félicitations ! Vous avez complété vos 10 Lancers Gratuits Sweet Bonanza. Voici le bilan de vos tumbles :
                </p>
              </div>

              <div className="p-4 bg-purple-950/30 rounded-2xl border border-purple-500/10 space-y-1.5">
                <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest">Multiplicateur Cumulé Final</span>
                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-pink-500 font-mono">
                  x{totalAccumulatedWin.toFixed(2)}
                </p>
                <div className="h-px bg-purple-500/10 w-1/2 mx-auto my-1" />
                <span className="text-[9px] font-mono text-zinc-500 uppercase">Gains Totaux Crédités</span>
                <p className="text-lg font-bold text-amber-400 font-mono">
                  {(totalAccumulatedWin * bet).toLocaleString()} {playMode === 'REAL' ? 'FCFA' : 'FTB'}
                </p>
              </div>

              <button
                onClick={() => {
                  playSound('click');
                  setShowTotalWinsPopup(false);
                }}
                className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-purple-950 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Encaisser mes gains
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Games rules explaining (French) */}
      <AnimatePresence>
        {showRules && (
          <div className="fixed inset-0 bg-[#09090b]/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="bg-[#09090b] border border-density-border p-6 rounded-3xl max-w-md w-full relative z-50 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-density-border pb-3">
                <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-pink-400" />
                  Règles : Sweet Bonanza
                </h3>
                <button
                  onClick={() => {
                    playSound('click');
                    setShowRules(false);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-400 font-mono uppercase cursor-pointer"
                >
                  Fermer
                </button>
              </div>

              <div className="space-y-4 text-xs text-zinc-400 leading-relaxed max-h-[350px] overflow-y-auto pr-1">
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-200">1. Système "Pays Anywhere" (Scatter Pay)</h4>
                  <p>
                    Contrairement aux machines classiques, les symboles n'ont pas besoin d'être alignés sur des lignes spécifiques. 
                    Dès que <strong>8 symboles identiques ou plus</strong> apparaissent n'importe où sur la grille de 6x5, vous gagnez !
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-200">2. Système de "Tumble" (Chutes en Cascade)</h4>
                  <p>
                    Une fois que les combinaisons gagnantes explosent, elles disparaissent de la grille. 
                    Les symboles restants tombent au fond, et de nouveaux symboles tombent du haut pour remplir les vides. 
                    Les cascades continuent tant qu'il y a de nouveaux gains !
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-200">3. Lancers Gratuits & Multiplicateurs</h4>
                  <p>
                    Obtenez <strong>4 symboles Sucette Scatter (🍭)</strong> ou plus n'importe où pour déclencher <strong>10 Free Spins</strong> gratuits. 
                    Pendant les Free Spins, des <strong>bombes multiplicatrices (💣)</strong> avec des valeurs allant de <strong>2x à 100x</strong> peuvent apparaître. 
                    À la fin des tumbles, la somme des multiplicateurs est appliquée à votre gain total du lancer !
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-200">4. Achat de Bonus</h4>
                  <p>
                    Vous pouvez acheter instantanément la partie bonus de 10 Free Spins pour <strong>100 fois votre mise</strong> de base.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playSound('click');
                  setShowRules(false);
                }}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-density-border rounded-xl text-xs text-zinc-300 font-bold transition-all cursor-pointer"
              >
                Compris, c'est parti !
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
