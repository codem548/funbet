import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Play, 
  Sparkles, 
  Award, 
  AlertCircle, 
  X, 
  Zap, 
  Users, 
  Volume2, 
  VolumeX, 
  Flame, 
  Eye, 
  CheckCircle2, 
  Radio, 
  Trophy,
  History,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { io, Socket } from 'socket.io-client';
import { Player, GameConfig } from '../types';
import { sound } from '../utils/audioHaptics';

interface CrashGameProps {
  player: Player;
  gameConfig: GameConfig;
  playMode: 'REAL' | 'DEMO';
  onUpdatePlayer: (updated: Player) => void;
  onOpenProvablyFair?: () => void;
}

interface LiveCrashPlayer {
  id: string;
  socketId?: string;
  userId?: string;
  username: string;
  bet: number;
  mode: 'REAL' | 'DEMO';
  cashedOut: boolean;
  winAmount: number;
  stoppedAt: number;
  crashed: boolean;
  isBot?: boolean;
  autoCashout?: number;
}

interface SocialProofToast {
  id: string;
  username: string;
  amount: number;
  multiplier: number;
}

export default function CrashGame({ 
  player, 
  gameConfig, 
  playMode, 
  onUpdatePlayer, 
  onOpenProvablyFair 
}: CrashGameProps) {
  // Betting states
  const [bet, setBet] = useState(1000);
  const [autoCashout, setAutoCashout] = useState<string>('2.00');
  const [enableAutoCashout, setEnableAutoCashout] = useState(false);
  const [autoBetNextRound, setAutoBetNextRound] = useState(false);
  
  // Game synchronization states
  const [gameState, setGameState] = useState<'WAITING' | 'RUNNING' | 'CRASHED'>('WAITING');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [cooldown, setCooldown] = useState(5);
  const [crashHistory, setCrashHistory] = useState<number[]>([
    2.14, 1.45, 12.80, 1.05, 3.20, 1.88, 45.10, 1.12, 2.75, 5.40, 1.01, 8.30, 2.05, 1.62, 18.90
  ]);
  const [playersMap, setPlayersMap] = useState<Record<string, LiveCrashPlayer>>({});
  
  // User participation states in current round
  const [isParticipating, setIsParticipating] = useState(false);
  const [isQueuedForNext, setIsQueuedForNext] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashoutMult, setCashoutMult] = useState<number | null>(null);
  const [cashoutAmount, setCashoutAmount] = useState<number | null>(null);
  const [finalCrashMultiplier, setFinalCrashMultiplier] = useState<number | null>(null);

  // Psychological Loop States
  const [nearMissAlert, setNearMissAlert] = useState<{ diff: number; target: number } | null>(null);
  const [socialProofToasts, setSocialProofToasts] = useState<SocialProofToast[]>([]);
  const [isRumble, setIsRumble] = useState(false);

  // UI Modals & Settings
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRoundResult, setLastRoundResult] = useState<{ type: 'WIN' | 'LOSS'; text: string; amount?: number } | null>(null);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const stateRef = useRef<'WAITING' | 'RUNNING' | 'CRASHED'>('WAITING');
  const multRef = useRef<number>(1.00);
  const isParticipatingRef = useRef(false);
  const hasCashedOutRef = useRef(false);
  const autoCashoutRef = useRef<number | null>(null);
  const lastTickAudioTime = useRef<number>(0);

  // Synchronize state refs for high-frequency game loop
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    multRef.current = currentMultiplier;
  }, [currentMultiplier]);

  useEffect(() => {
    isParticipatingRef.current = isParticipating;
  }, [isParticipating]);

  useEffect(() => {
    hasCashedOutRef.current = hasCashedOut;
  }, [hasCashedOut]);

  useEffect(() => {
    if (enableAutoCashout && autoCashout) {
      const val = parseFloat(autoCashout);
      autoCashoutRef.current = !isNaN(val) && val > 1.0 ? val : null;
    } else {
      autoCashoutRef.current = null;
    }
  }, [enableAutoCashout, autoCashout]);

  const updatePlayerBalance = (newBalance: number) => {
    const updated = { ...player };
    if (playMode === 'REAL') {
      updated.solde = newBalance;
    } else {
      updated.credits_fictifs = newBalance;
      updated.credits = newBalance;
    }
    onUpdatePlayer(updated);
  };

  // Helper for triggering Social Proof floating notification
  const triggerSocialProofToast = (username: string, amount: number, multiplier: number) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setSocialProofToasts(prev => [...prev.slice(-2), { id, username, amount, multiplier }]);
    sound.playSocialProof();
    setTimeout(() => {
      setSocialProofToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // =========================================================
  // 🔌 WEBSOCKET INITIALIZATION & EVENT LISTENERS
  // =========================================================
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setError(null);
    });

    // 1. Full Game State Sync
    socket.on('gameState', (data: {
      state: 'WAITING' | 'RUNNING' | 'CRASHED';
      players: Record<string, LiveCrashPlayer>;
      cooldown?: number;
      currentMultiplier?: number;
      history?: number[];
    }) => {
      setGameState(data.state);
      setPlayersMap(data.players || {});
      if (data.cooldown !== undefined) setCooldown(data.cooldown);
      if (data.history) setCrashHistory(data.history);
      
      // If server resets to WAITING
      if (data.state === 'WAITING') {
        setCurrentMultiplier(1.00);
        setNearMissAlert(null);
        setFinalCrashMultiplier(null);
        setCashoutMult(null);
        setCashoutAmount(null);
        setIsRumble(false);
        // Clear previous round result so "Retrait validé" never leaks into next round
        setLastRoundResult(null);

        // Check if current user is in player list (strict identity: userId first)
        const myEntry = Object.values(data.players || {}).find(
          p => !p.isBot && (p.userId === player.id || (p.socketId && p.socketId === socket.id))
        );
        if (myEntry) {
          setIsParticipating(true);
          setHasCashedOut(false);
          setIsQueuedForNext(false);
        } else {
          setIsParticipating(false);
          setHasCashedOut(false);
        }

        // Auto-join next round if user enabled auto-bet
        if (autoBetNextRound && !myEntry) {
          joinRound(bet);
        }
      }
    });

    // 2. High Frequency Multiplier Ticks
    socket.on('tick', ({ multiplier }: { multiplier: number }) => {
      setCurrentMultiplier(multiplier);

      // Sound Tension Loop: frequency and pitch accelerate
      const now = performance.now();
      const interval = Math.max(80, 400 / Math.pow(multiplier, 0.7));
      if (now - lastTickAudioTime.current > interval) {
        lastTickAudioTime.current = now;
        sound.playRocketAscent(multiplier);
      }
    });

    // 3. Round Launched
    socket.on('gameStarted', () => {
      setGameState('RUNNING');
      sound.playClick();
    });

    // 4. Cashout Broadcast (Social Proof)
    socket.on('playerCashout', ({ player: p, isHighWin }: { player: LiveCrashPlayer; isHighWin: boolean }) => {
      setPlayersMap(prev => ({
        ...prev,
        [p.id || p.socketId || '']: p,
      }));

      // Strict identity: only treat as "me" if real player, matching userId, and we are in this round
      const isMe =
        !p.isBot &&
        !!p.userId &&
        p.userId === player.id &&
        isParticipatingRef.current;

      if (isMe && typeof p.stoppedAt === 'number' && p.stoppedAt > 1.0) {
        setHasCashedOut(true);
        setCashoutMult(p.stoppedAt);
        setCashoutAmount(p.winAmount);
        setLastRoundResult({
          type: 'WIN',
          text: `Retrait validé à ${p.stoppedAt.toFixed(2)}x !`,
          amount: p.winAmount,
        });
        sound.playCashoutSound(p.stoppedAt);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#9ce800', '#22c55e', '#ffd700']
        });
      } else if (isHighWin && !p.isBot) {
        // High win by another human player -> Social Proof Toast
        triggerSocialProofToast(p.username, p.winAmount, p.stoppedAt);
      }
    });

    // 5. Crash Event
    socket.on('crash', ({ finalMultiplier, players: updatedPlayers, history: newHist }: {
      finalMultiplier: number;
      players: Record<string, LiveCrashPlayer>;
      history: number[];
    }) => {
      setGameState('CRASHED');
      setCurrentMultiplier(finalMultiplier);
      setFinalCrashMultiplier(finalMultiplier);
      setPlayersMap(updatedPlayers || {});
      if (newHist) setCrashHistory(newHist);

      sound.playExplosion();
      setIsRumble(true);
      setTimeout(() => setIsRumble(false), 800);

      // Psychological Near-Miss Detection:
      if (isParticipatingRef.current && !hasCashedOutRef.current) {
        // The player participated and didn't cash out
        const targetAuto = autoCashoutRef.current;
        const diffFromCrash = targetAuto ? Math.abs(targetAuto - finalMultiplier) : 0.08;
        
        if (targetAuto && targetAuto > finalMultiplier && (targetAuto - finalMultiplier) <= 0.15) {
          // Near miss on auto-cashout target!
          setNearMissAlert({ diff: parseFloat((targetAuto - finalMultiplier).toFixed(2)), target: targetAuto });
          sound.playNearMiss();
        } else if (finalMultiplier >= 1.5 && finalMultiplier <= 2.2) {
          // Natural near-miss tension
          setNearMissAlert({ diff: 0.04, target: parseFloat((finalMultiplier + 0.04).toFixed(2)) });
          sound.playNearMiss();
        }

        setLastRoundResult({
          type: 'LOSS',
          text: `Le rocket a crashé à ${finalMultiplier.toFixed(2)}x avant votre encaissement.`,
        });
      }
    });

    // 6. User Specific Events
    socket.on('joinSuccess', ({ bet: placedBet, currentBalance }: { bet: number; currentBalance: number }) => {
      setIsParticipating(true);
      setIsQueuedForNext(false);
      updatePlayerBalance(currentBalance);
      sound.playClick();
    });

    socket.on('joinQueued', () => {
      setIsQueuedForNext(true);
    });

    socket.on('joinError', ({ error: err }: { error: string }) => {
      setError(err);
      setIsParticipating(false);
      setIsQueuedForNext(false);
    });

    socket.on('cashoutResult', ({ win, multiplier: mult, payout, currentBalance }: any) => {
      if (win) {
        setHasCashedOut(true);
        setCashoutMult(mult);
        setCashoutAmount(payout);
        if (currentBalance !== undefined) {
          updatePlayerBalance(currentBalance);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [player.id, playMode, autoBetNextRound]);

  // =========================================================
  // 🎮 ACTIONS : JOIN & CASHOUT
  // =========================================================
  const joinRound = (amountToBet: number) => {
    setError(null);
    setLastRoundResult(null); // Reset banner before new bet
    const balance = playMode === 'REAL' ? (player.solde || 0) : (player.credits_fictifs || 0);
    if (balance < amountToBet) {
      setError(playMode === 'REAL' ? 'Solde réel insuffisant. Rechargez via Mobile Money.' : 'Crédits démo épuisés.');
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('joinGame', {
        userId: player.id,
        username: player.username || `User_${player.id.slice(-4)}`,
        bet: amountToBet,
        mode: playMode,
        // Only send autoCashout when explicitly enabled (avoid accidental auto at 1.x)
        autoCashout: enableAutoCashout && autoCashout && parseFloat(autoCashout) > 1.0
          ? parseFloat(autoCashout)
          : undefined,
      });
    }
  };

  const handleManualCashout = () => {
    if (!isParticipating || hasCashedOut || gameState !== 'RUNNING') return;
    if (socketRef.current) {
      socketRef.current.emit('cashout', { userId: player.id });
    }
  };

  // =========================================================
  // 🎨 CANVAS RENDERING ENGINE (60 FPS FLUID GRAPHICS)
  // =========================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
    let rocketFlames: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    // Initialize starry background particles
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * 800,
        y: Math.random() * 450,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.4 + 0.1,
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    const render = () => {
      // Dynamic canvas responsive sizing
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const w = canvas.width;
      const h = canvas.height;
      const state = stateRef.current;
      const mult = multRef.current;

      // 1. Clear & Dark Background
      ctx.fillStyle = '#171a1c';
      ctx.fillRect(0, 0, w, h);

      // 2. Starfield ambient animation
      particles.forEach(p => {
        p.x -= (state === 'RUNNING' ? p.speed * (1 + mult * 0.4) : p.speed);
        if (p.x < 0) p.x = w;
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * (state === 'RUNNING' ? 0.8 : 0.4)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Grid Lines & Dynamic Multiplier Scales on Y-axis
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#71717a';
      ctx.font = '10px monospace';

      const gridLevels = [1.5, 2.0, 5.0, 10.0, 50.0];
      gridLevels.forEach(lvl => {
        const normY = h - 35 - ((lvl - 1.0) / Math.max(mult, 4.0)) * (h - 90);
        if (normY > 20 && normY < h - 30) {
          ctx.beginPath();
          ctx.moveTo(35, normY);
          ctx.lineTo(w - 20, normY);
          ctx.stroke();
          ctx.fillText(`${lvl.toFixed(1)}x`, 8, normY + 3);
        }
      });

      // Base axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(35, 15);
      ctx.lineTo(35, h - 30);
      ctx.lineTo(w - 15, h - 30);
      ctx.stroke();

      // 4. Multiplier Curve and Rocket Path
      if (state === 'RUNNING' || state === 'CRASHED') {
        const startX = 35;
        const startY = h - 30;
        
        // Dynamic progress calculation
        const progressX = Math.min(w - 45, startX + ((Math.log(mult) / Math.log(100)) + 0.15) * (w - 80));
        const progressY = Math.max(35, startY - ((mult - 1.0) / Math.max(mult * 1.1, 3.5)) * (h - 80));

        // Control point for smooth exponential Bezier curve
        const cpX = startX + (progressX - startX) * 0.65;
        const cpY = startY;

        // Gradient filled area under the curve
        const areaGrad = ctx.createLinearGradient(0, progressY, 0, startY);
        areaGrad.addColorStop(0, state === 'CRASHED' ? 'rgba(255, 59, 48, 0.35)' : 'rgba(156, 232, 0, 0.35)');
        areaGrad.addColorStop(1, 'rgba(23, 26, 28, 0)');

        ctx.fillStyle = areaGrad;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, progressX, progressY);
        ctx.lineTo(progressX, startY);
        ctx.closePath();
        ctx.fill();

        // High glow stroke curve
        ctx.strokeStyle = state === 'CRASHED' ? '#ff3b30' : '#9ce800';
        ctx.lineWidth = 4;
        ctx.shadowColor = state === 'CRASHED' ? '#ff3b30' : '#9ce800';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, progressX, progressY);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset glow

        // 5. Rocket & Flame Particles
        if (state === 'RUNNING') {
          // Emit flame particles behind rocket
          for (let f = 0; f < 3; f++) {
            rocketFlames.push({
              x: progressX - 12,
              y: progressY + 6 + (Math.random() * 6 - 3),
              vx: -(Math.random() * 3 + 2),
              vy: (Math.random() * 2 - 1),
              life: 1.0,
              color: ['#ff3b30', '#ff9500', '#ffd700', '#9ce800'][Math.floor(Math.random() * 4)],
            });
          }

          // Draw Flames
          rocketFlames.forEach(rf => {
            rf.x += rf.vx;
            rf.y += rf.vy;
            rf.life -= 0.06;
            ctx.fillStyle = rf.color;
            ctx.globalAlpha = Math.max(0, rf.life);
            ctx.beginPath();
            ctx.arc(rf.x, rf.y, Math.max(1, rf.life * 4), 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.globalAlpha = 1.0;
          rocketFlames = rocketFlames.filter(rf => rf.life > 0);

          // Draw Sleek Rocket Head
          ctx.save();
          ctx.translate(progressX, progressY);
          ctx.rotate(-0.45); // angled upwards

          // Fuselage
          ctx.fillStyle = '#9ce800';
          ctx.beginPath();
          ctx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Cockpit glass
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(4, -1, 3, 0, Math.PI * 2);
          ctx.fill();

          // Fins
          ctx.fillStyle = '#ff3b30';
          ctx.beginPath();
          ctx.moveTo(-12, -6);
          ctx.lineTo(-4, 0);
          ctx.lineTo(-12, 6);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        } else if (state === 'CRASHED') {
          // Crash Explosion Graphic
          ctx.save();
          ctx.translate(progressX, progressY);
          
          // Shockwave circle
          ctx.strokeStyle = 'rgba(255, 59, 48, 0.8)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 26, 0, Math.PI * 2);
          ctx.stroke();

          // Fire starburst
          ctx.fillStyle = '#ff3b30';
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const r1 = 20;
            const r2 = 9;
            ctx.lineTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
            ctx.lineTo(Math.cos(angle + 0.39) * r2, Math.sin(angle + 0.39) * r2);
          }
          ctx.closePath();
          ctx.fill();

          // Inner gold core
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  const totalPlayersCount = Object.keys(playersMap).length;
  const currentBalance = playMode === 'REAL' ? (player.solde || 0) : (player.credits_fictifs || 0);

  return (
    <div className={`bg-[#171a1c] border border-white/10 rounded-2xl p-3 sm:p-5 shadow-2xl max-w-6xl mx-auto font-sans text-zinc-100 transition-transform ${
      isRumble ? 'animate-bounce' : ''
    }`}>
      
      {/* 1. Header Bar with Provably Fair & Mode Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3.5 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#9ce800]/10 rounded-xl border border-[#9ce800]/20 text-[#9ce800]">
            <Radio className="w-5 h-5 animate-pulse text-[#9ce800]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                Rocket Crash Live
              </h2>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                playMode === 'REAL'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {playMode === 'REAL' ? 'FCFA RÉEL' : 'DÉMO FTB'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span>Multiplayer Synchronisé</span>
              <span>•</span>
              <span className="text-[#9ce800] font-semibold">{totalPlayersCount} Joueurs en Direct</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenProvablyFair && (
            <button
              onClick={onOpenProvablyFair}
              className="px-3 py-1.5 bg-[#222629] hover:bg-[#2b3035] text-emerald-400 rounded-xl border border-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Provably Fair (SHA-256)</span>
            </button>
          )}

          <button
            onClick={() => setIsMuted(sound.toggleMute())}
            className="p-2 bg-[#222629] hover:bg-[#2b3035] text-zinc-300 rounded-xl border border-white/10 transition-all cursor-pointer"
            title={isMuted ? "Activer le son" : "Couper le son"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#9ce800]" />}
          </button>

          <button
            onClick={() => setShowRulesModal(true)}
            className="p-2 text-zinc-400 bg-[#222629] hover:bg-[#2b3035] hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer"
            title="Règles du Crash"
          >
            <AlertCircle className="w-4 h-4 text-[#9ce800]" />
          </button>
        </div>
      </div>

      {/* 2. Top History Multipliers Badges Strip */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1.5 no-scrollbar">
        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase flex items-center gap-1 flex-shrink-0">
          <History className="w-3 h-3 text-zinc-400" />
          <span>Historique :</span>
        </span>
        <div className="flex items-center gap-1.5">
          {crashHistory.slice(0, 14).map((hMult, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold flex-shrink-0 border transition-all ${
                hMult >= 50.0
                  ? 'bg-amber-400/15 text-amber-300 border-amber-400/40 shadow-sm shadow-amber-400/20'
                  : hMult >= 10.0
                  ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                  : hMult >= 2.0
                  ? 'bg-[#9ce800]/15 text-[#9ce800] border-[#9ce800]/30'
                  : 'bg-zinc-800 text-zinc-400 border-white/5'
              }`}
            >
              {hMult.toFixed(2)}x
            </span>
          ))}
        </div>
      </div>

      {/* 3. Main Stage: Left Controls / Right Canvas & Live Players */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Betting Panel & Addiction Controls */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {/* Near Miss Banner (Psychological Loop) */}
          {nearMissAlert && (
            <div className="p-3.5 bg-gradient-to-r from-amber-950/80 to-[#222629] border border-amber-500/50 rounded-xl space-y-1 animate-pulse shadow-lg shadow-amber-500/10">
              <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-400 fill-current animate-bounce" />
                <span>PRESQUE ! À {nearMissAlert.diff}x PRÈS !</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                La fusée a explosé juste avant votre cible ({nearMissAlert.target}x). Rejouez la prochaine !
              </p>
            </div>
          )}

          {/* Last Round Result Banner */}
          {lastRoundResult && gameState === 'CRASHED' && !nearMissAlert && (
            <div className={`p-3 rounded-xl border text-xs font-medium ${
              lastRoundResult.type === 'WIN'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/40 border-red-500/30 text-red-300'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                {lastRoundResult.type === 'WIN' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                <span>{lastRoundResult.text}</span>
              </div>
              {lastRoundResult.amount && (
                <div className="text-[11px] font-mono text-emerald-400 font-bold mt-0.5">
                  +{lastRoundResult.amount.toLocaleString()} {playMode === 'REAL' ? 'FCFA' : 'FTB'}
                </div>
              )}
            </div>
          )}

          {/* Bet Input and Quick Multipliers */}
          <div className="p-3.5 bg-[#222629] border border-white/5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
                Montant de la Mise ({playMode === 'REAL' ? 'FCFA' : 'FTB'})
              </label>
              <span className="text-[10px] font-mono text-zinc-400">
                Solde: {currentBalance.toLocaleString()} {playMode === 'REAL' ? 'FCFA' : 'FTB'}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                value={bet}
                onChange={(e) => setBet(Math.max(100, Number(e.target.value)))}
                disabled={isParticipating && gameState === 'RUNNING'}
                className="w-full bg-[#171a1c] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#9ce800] disabled:opacity-50"
              />
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {[500, 1000, 2500, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBet(val)}
                  disabled={isParticipating && gameState === 'RUNNING'}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                    bet === val
                      ? 'bg-[#9ce800] text-[#171a1c] border-[#9ce800]'
                      : 'bg-[#171a1c] text-zinc-300 border-white/5 hover:border-zinc-500'
                  }`}
                >
                  {val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Cashout Config */}
          <div className="p-3.5 bg-[#222629] border border-white/5 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#9ce800]" />
                <span>Auto-Cashout (Retrait Auto)</span>
              </span>
              <input
                type="checkbox"
                checked={enableAutoCashout}
                onChange={(e) => setEnableAutoCashout(e.target.checked)}
                className="w-4 h-4 accent-[#9ce800] cursor-pointer"
              />
            </div>
            {enableAutoCashout && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="1.05"
                  value={autoCashout}
                  onChange={(e) => setAutoCashout(e.target.value)}
                  placeholder="Ex: 2.00"
                  className="w-full bg-[#171a1c] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-[#9ce800]"
                />
                <span className="text-xs font-mono text-[#9ce800] font-black">x</span>
              </div>
            )}

            {/* Auto-Bet for Next Round Toggle */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">Rejouer automatiquement</span>
              <input
                type="checkbox"
                checked={autoBetNextRound}
                onChange={(e) => setAutoBetNextRound(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#9ce800] cursor-pointer"
              />
            </div>
          </div>

          {/* Primary Action Button (State-Driven) */}
          <div>
            {gameState === 'WAITING' ? (
              isParticipating ? (
                <button
                  disabled
                  className="w-full py-3.5 bg-[#9ce800]/20 border border-[#9ce800]/40 text-[#9ce800] rounded-xl font-black text-sm animate-pulse flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#9ce800]" />
                  <span>MISE VALIDÉE POUR LE DÉCOLLAGE ({bet.toLocaleString()} F)</span>
                </button>
              ) : (
                <button
                  onClick={() => joinRound(bet)}
                  className="w-full py-3.5 bg-[#9ce800] hover:bg-[#8bd100] text-[#171a1c] rounded-xl font-black text-sm shadow-xl shadow-[#9ce800]/20 active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>MISER {bet.toLocaleString()} {playMode === 'REAL' ? 'FCFA' : 'FTB'}</span>
                </button>
              )
            ) : gameState === 'RUNNING' ? (
              isParticipating && !hasCashedOut ? (
                <button
                  onClick={handleManualCashout}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-[#9ce800] text-[#171a1c] rounded-xl font-black text-base shadow-2xl shadow-emerald-500/30 active:scale-95 cursor-pointer transition-all animate-pulse"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-[10px] font-mono tracking-widest uppercase opacity-90">ENCAISSER MAINTENANT</span>
                    <span className="text-lg font-mono font-black">
                      {Math.floor(bet * currentMultiplier).toLocaleString()} {playMode === 'REAL' ? 'FCFA' : 'FTB'} ({currentMultiplier.toFixed(2)}x)
                    </span>
                  </div>
                </button>
              ) : hasCashedOut ? (
                <button
                  disabled
                  className="w-full py-3.5 bg-[#222629] text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-sm cursor-not-allowed"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-[10px] font-mono uppercase text-emerald-400">GAIN SÉCURISÉ !</span>
                    <span className="text-sm font-mono font-bold text-white">
                      +{cashoutAmount?.toLocaleString()} FCFA ({cashoutMult?.toFixed(2)}x)
                    </span>
                  </div>
                </button>
              ) : isQueuedForNext ? (
                <button
                  disabled
                  className="w-full py-3.5 bg-[#222629] text-[#9ce800] border border-[#9ce800]/30 rounded-xl font-bold text-xs animate-pulse"
                >
                  Inscrit pour la prochaine partie...
                </button>
              ) : (
                <button
                  onClick={() => joinRound(bet)}
                  className="w-full py-3.5 bg-[#9ce800] hover:bg-[#8bd100] text-[#171a1c] rounded-xl font-bold text-xs shadow-lg active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>REJOINDRE LA PROCHAINE PARTIE ({bet.toLocaleString()} F)</span>
                </button>
              )
            ) : (
              // CRASHED
              isQueuedForNext ? (
                <button
                  disabled
                  className="w-full py-3.5 bg-[#222629] text-[#9ce800] border border-[#9ce800]/30 rounded-xl font-bold text-xs animate-pulse"
                >
                  Prêt pour le prochain tour ({bet.toLocaleString()} F)...
                </button>
              ) : (
                <button
                  onClick={() => joinRound(bet)}
                  className="w-full py-3.5 bg-[#9ce800] hover:bg-[#8bd100] text-[#171a1c] rounded-xl font-black text-sm shadow-xl active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>MISER POUR LA PROCHAINE MANCHE ({bet.toLocaleString()} F)</span>
                </button>
              )
            )}
          </div>

          {/* Active Mode Indicator (Spectator vs Player) */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#171a1c] border border-white/5 rounded-xl text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#9ce800]" />
              <span>Votre Statut :</span>
            </span>
            <span className={`font-bold font-mono ${isParticipating ? 'text-[#9ce800]' : 'text-zinc-400'}`}>
              {isParticipating ? (hasCashedOut ? 'Retiré (Gagné)' : 'Joueur Actif En Vol') : 'Spectateur (Observateur)'}
            </span>
          </div>

        </div>

        {/* Right Column: HTML5 Canvas Stage & Live Social Proof */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Canvas Wrapper */}
          <div className="relative bg-[#222629] rounded-2xl border border-white/10 shadow-2xl h-[280px] sm:h-[360px] w-full overflow-hidden">
            
            {/* HTML5 Canvas Render */}
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Social Proof Toasts Floating Over Canvas */}
            <div className="absolute top-3 left-4 space-y-1.5 z-20 pointer-events-none">
              {socialProofToasts.map(toast => (
                <div 
                  key={toast.id}
                  className="bg-gradient-to-r from-amber-500/90 to-yellow-600/90 backdrop-blur-md text-[#171a1c] px-3 py-1.5 rounded-xl shadow-lg border border-amber-300/40 text-xs font-black flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#171a1c] fill-current" />
                  <span>🔥 {toast.username} vient de retirer {toast.amount.toLocaleString()} FCFA à {toast.multiplier.toFixed(2)}x !</span>
                </div>
              ))}
            </div>

            {/* HUD Status Overlay: WAITING */}
            {gameState === 'WAITING' && (
              <div className="absolute inset-0 bg-[#171a1c]/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 z-10">
                <div className="w-14 h-14 border-4 border-[#9ce800]/30 border-t-[#9ce800] rounded-full animate-spin mb-3 flex items-center justify-center">
                  <span className="text-base font-mono font-black text-[#9ce800]">{cooldown}</span>
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  PROCHAINE PARTIE DANS {cooldown}S
                </h3>
                <p className="text-xs text-zinc-300 mt-1 max-w-sm">
                  {isParticipating ? "Votre mise est enregistrée ! Tenez-vous prêt !" : "Placez votre mise maintenant pour monter à bord de la fusée !"}
                </p>
              </div>
            )}

            {/* Dynamic Multiplier Display in RUNNING */}
            {gameState === 'RUNNING' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
                <span className="text-5xl sm:text-6xl font-mono font-black text-[#9ce800] tracking-tight drop-shadow-[0_0_25px_rgba(156,232,0,0.4)]">
                  {currentMultiplier.toFixed(2)}x
                </span>
                <p className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest mt-1">VOL EN COURS...</p>
              </div>
            )}

            {/* Multiplier in CRASHED */}
            {gameState === 'CRASHED' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10 animate-in zoom-in-95">
                <span className="text-5xl sm:text-6xl font-mono font-black text-[#ff3b30] tracking-tight drop-shadow-[0_0_30px_rgba(255,59,48,0.5)]">
                  {finalCrashMultiplier ? finalCrashMultiplier.toFixed(2) : currentMultiplier.toFixed(2)}x
                </span>
                <p className="text-xs font-mono font-black text-[#ff3b30] uppercase tracking-widest mt-1">CRASHED !</p>
              </div>
            )}

          </div>

          {/* Live Multiplayer Participants List */}
          <div className="bg-[#222629] border border-white/5 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1.5 text-white">
                <Users className="w-4 h-4 text-[#9ce800]" />
                <span>Joueurs en Direct ({totalPlayersCount})</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Mise • Gain</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto no-scrollbar">
              {(Object.values(playersMap) as LiveCrashPlayer[]).map((p: LiveCrashPlayer) => {
                const isMe = p.userId === player.id || p.socketId === socketRef.current?.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg border transition-all ${
                      isMe 
                        ? 'bg-[#9ce800]/15 border-[#9ce800]/40 font-bold' 
                        : 'bg-[#171a1c] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`truncate max-w-[110px] ${isMe ? 'text-[#9ce800]' : 'text-zinc-200'}`}>
                        {p.username} {isMe && '(Vous)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-zinc-400 font-mono text-[11px]">{p.bet.toLocaleString()} F</span>
                      {p.cashedOut ? (
                        <span className="text-[10px] font-mono font-bold text-[#9ce800] bg-[#9ce800]/10 px-1.5 py-0.5 rounded border border-[#9ce800]/20">
                          {p.stoppedAt.toFixed(2)}x (+{p.winAmount.toLocaleString()} F)
                        </span>
                      ) : p.crashed ? (
                        <span className="text-[10px] font-mono text-[#ff3b30] font-bold">Perdu</span>
                      ) : (
                        <span className="text-[10px] font-mono text-amber-400 animate-pulse">En vol...</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#222629] border border-white/10 p-6 rounded-2xl max-w-md w-full mx-4 space-y-4 shadow-2xl relative text-zinc-100">
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="p-2 bg-[#9ce800]/10 rounded-xl border border-[#9ce800]/20 text-[#9ce800]">
                <Info className="w-5 h-5 text-[#9ce800]" />
              </div>
              <h3 className="text-base font-bold text-white">Règles Rocket Crash Live</h3>
            </div>
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p>
                <strong className="text-white">Rocket Crash</strong> est un jeu multijoueur en direct synchronisé entre tous les participants.
              </p>
              <ul className="space-y-2 list-none pl-0">
                <li className="flex gap-2">
                  <span className="text-[#9ce800] font-bold">•</span>
                  <span><strong>Misez</strong> pendant le compte à rebours de 5 secondes avant le départ.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#9ce800] font-bold">•</span>
                  <span>La fusée décolle et le <strong>multiplicateur</strong> grimpe en temps réel.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#9ce800] font-bold">•</span>
                  <span>Cliquez sur <strong>"ENCAISSER"</strong> avant le crash pour multiplier votre mise !</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#9ce800] font-bold">•</span>
                  <span>Si la fusée explose avant votre encaissement, la mise est perdue.</span>
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
