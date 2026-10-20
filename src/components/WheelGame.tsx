import React, { useState } from 'react';
import { HelpCircle, AlertCircle, X, Disc, Play, Award, ShieldCheck, Flame, Droplet, Wind, Zap, Trees, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Player, GameConfig } from '../types';

interface WheelGameProps {
  player: Player;
  gameConfig: GameConfig;
  playMode: 'REAL' | 'DEMO';
  onUpdatePlayer: (player: Player) => void;
}

interface ElementConfig {
  name: string;
  symbol: string;
  multiplier: number;
  color: string;
  hoverColor: string;
  lightBg: string;
  borderColor: string;
  desc: string;
  count: number;
  textColor: string;
}

const ELEMENTS_MAP: Record<number, ElementConfig> = {
  2: {
    name: 'Terre',
    symbol: '🌱',
    multiplier: 2,
    color: '#15803d', // Green-700
    hoverColor: '#16a34a',
    lightBg: 'rgba(21, 128, 61, 0.15)',
    borderColor: 'border-emerald-700/60',
    desc: 'Grounded & stable. 10/24 chances.',
    count: 10,
    textColor: '#ffffff'
  },
  3: {
    name: 'Eau',
    symbol: '💧',
    multiplier: 3,
    color: '#1d4ed8', // Blue-700
    hoverColor: '#2563eb',
    lightBg: 'rgba(29, 78, 216, 0.15)',
    borderColor: 'border-blue-700/60',
    desc: 'Fluid & continuous. 6/24 chances.',
    count: 6,
    textColor: '#ffffff'
  },
  5: {
    name: 'Vent',
    symbol: '🌪️',
    multiplier: 5,
    color: '#0d9488', // Teal-600
    hoverColor: '#0f766e',
    lightBg: 'rgba(13, 148, 136, 0.15)',
    borderColor: 'border-teal-600/60',
    desc: 'Swift & light. 4/24 chances.',
    count: 4,
    textColor: '#ffffff'
  },
  10: {
    name: 'Feu',
    symbol: '🔥',
    multiplier: 10,
    color: '#b45309', // Amber-700
    hoverColor: '#d97706',
    lightBg: 'rgba(180, 83, 9, 0.15)',
    borderColor: 'border-amber-700/60',
    desc: 'Violent & intense. 2/24 chances.',
    count: 2,
    textColor: '#ffffff'
  },
  20: {
    name: 'Foudre',
    symbol: '⚡',
    multiplier: 20,
    color: '#6d28d9', // Purple-700
    hoverColor: '#7c3aed',
    lightBg: 'rgba(109, 40, 217, 0.15)',
    borderColor: 'border-purple-700/60',
    desc: 'Electric spark energy. 1/24 chance.',
    count: 1,
    textColor: '#ffffff'
  },
  50: {
    name: 'Éther',
    symbol: '🌌',
    multiplier: 50,
    color: '#be123c', // Rose-700
    hoverColor: '#e11d48',
    lightBg: 'rgba(190, 18, 60, 0.15)',
    borderColor: 'border-rose-700/60',
    desc: 'Cosmic fifth element. 1/24 chance.',
    count: 1,
    textColor: '#ffffff'
  }
};

export default function WheelGame({ player, gameConfig, playMode, onUpdatePlayer }: WheelGameProps) {
  const [bet, setBet] = useState(100);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(2);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [currentWinner, setCurrentWinner] = useState<{ value: number; index: number; isWin: boolean; payout: number } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<number[]>([]);

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

  // Sound generator helper (Web Audio API - highly robust, 0 network dependencies)
  const playSound = (type: 'tick' | 'win' | 'lose' | 'click') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'tick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
      } else if (type === 'win') {
        osc.type = 'sine';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        osc.frequency.setValueAtTime(1318.51, now + 0.32); // E6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start();
        osc.stop(now + 0.6);
      } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(55, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      // Audio context block by browser safely ignored
    }
  };

  // New, beautiful, alternating 24-segment wheel layout
  const WHEEL_SEGMENTS = [
    50, 2, 3, 2, 5, 2, 3, 10, 2, 3, 5, 2,
    20, 2, 3, 2, 5, 2, 3, 10, 2, 3, 5, 2
  ];

  const getElementIcon = (val: number) => {
    switch (val) {
      case 2: return <Trees className="w-3.5 h-3.5" />;
      case 3: return <Droplet className="w-3.5 h-3.5" />;
      case 5: return <Wind className="w-3.5 h-3.5" />;
      case 10: return <Flame className="w-3.5 h-3.5" />;
      case 20: return <Zap className="w-3.5 h-3.5" />;
      case 50: return <Sparkles className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const handleSpinWheel = async () => {
    if (isSpinning || loading) return;
    
    setError(null);
    setLoading(true);
    setCurrentWinner(null);

    const currentSolde = playMode === 'REAL' ? (player.solde || 0) : (player.credits_fictifs || 0);
    if (currentSolde < bet) {
      setError(playMode === 'REAL' ? 'Solde réel insuffisant.' : 'Crédits démo insuffisants.');
      setLoading(false);
      return;
    }

    // Deduct bet locally first to avoid race conditions
    updatePlayerBalance(currentSolde - bet);
    playSound('click');

    try {
      const response = await fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: player.id,
          gameId: 'wheel',
          bet,
          mode: playMode,
          customData: { selectedMultiplier }
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du lancer.');
      }

      const { winningIndex, winningValue, result, payout, currentBalance } = data;

      // Get the base full rotations from the current angle to ensure we always spin forward
      const baseRotation = Math.floor(wheelAngle / 360) * 360;

      // 24 segments means 15 degrees per segment (360 / 24)
      const degreesPerSegment = 15;
      const targetSegmentAngle = 360 - (winningIndex * degreesPerSegment) - (degreesPerSegment / 2);
      
      // Spin at least 15 full rounds to create high cinematic velocity and momentum
      let finalAngle = baseRotation + (360 * 15) + targetSegmentAngle;
      if (finalAngle <= wheelAngle) {
        finalAngle += 360;
      }

      setIsSpinning(true);
      setWheelAngle(finalAngle);

      // Play ticking sounds synced dynamically on deceleration
      let playedTicks = 0;
      const totalTicks = (24 * 15) + winningIndex;
      
      const playTickAnimation = () => {
        if (playedTicks >= totalTicks) return;
        playSound('tick');
        playedTicks++;

        const progress = playedTicks / totalTicks;
        // Cubic decay function for genuine physical deceleration feel
        const nextDelay = 15 + Math.pow(progress, 4.0) * 600;

        if (isSpinning) {
          setTimeout(playTickAnimation, nextDelay);
        }
      };
      setTimeout(playTickAnimation, 15);

      // Wait 4.5 seconds for the rotation animation to complete
      setTimeout(() => {
        setIsSpinning(false);
        setLoading(false);

        // Update player with official server balance
        updatePlayerBalance(currentBalance);

        const winState = result === 'WIN';
        setCurrentWinner({
          value: winningValue,
          index: winningIndex,
          isWin: winState,
          payout
        });

        // Add to interactive history stream
        setHistory(prev => [winningValue, ...prev.slice(0, 9)]);

        if (winState) {
          playSound('win');
          confetti({
            particleCount: 110,
            spread: 75,
            origin: { y: 0.65 },
            colors: [ELEMENTS_MAP[winningValue]?.color || '#fbbf24', '#f59e0b', '#ffffff']
          });
          // Secondary spark confetti
          setTimeout(() => {
            confetti({ particleCount: 40, angle: 60, spread: 50, origin: { x: 0.1 } });
            confetti({ particleCount: 40, angle: 120, spread: 50, origin: { x: 0.9 } });
          }, 200);
        } else {
          playSound('lose');
        }

      }, 4000);

    } catch (err: any) {
      // Refund on system exception
      updatePlayerBalance(currentSolde);
      setError(err.message || 'Une erreur est survenue.');
      setLoading(false);
    }
  };

  const adjustBet = (action: 'half' | 'double' | 'min' | 'max') => {
    if (isSpinning) return;
    playSound('click');
    const min = gameConfig.minBet;
    const max = gameConfig.maxBet;
    if (action === 'half') {
      setBet(prev => Math.max(min, Math.floor(prev / 2)));
    } else if (action === 'double') {
      setBet(prev => Math.min(max, prev * 2));
    } else if (action === 'min') {
      setBet(min);
    } else if (action === 'max') {
      setBet(max);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Interactive HUD Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-density-panel border border-density-border rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand/10 border border-brand/20 rounded-xl text-brand">
            <Disc className={`w-6 h-6 ${isSpinning ? 'animate-spin' : 'animate-[spin_10s_linear_infinite]'}`} />
          </div>
          <div>
            <h2 className="text-md font-bold text-[#fafafa] flex items-center gap-2">
              Crazy Spin • Édition des Éléments
              <span className="px-2 py-0.5 bg-brand/10 text-brand border border-brand/20 rounded-full text-[10px] font-mono tracking-widest uppercase">
                24 Secteurs
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Prédisez l'élément d'arrêt de la roue physique et multipliez instantanément votre mise !
            </p>
          </div>
        </div>

        {/* Live results history chain */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-xs scrollbar-none">
          <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider shrink-0 mr-1">Récents :</span>
          {history.length === 0 ? (
            <span className="text-[10px] font-mono text-zinc-600">En attente de spins</span>
          ) : (
            history.map((val, idx) => {
              const el = ELEMENTS_MAP[val];
              return (
                <span
                  key={idx}
                  style={{ backgroundColor: el?.color || '#333' }}
                  className="px-2 py-0.5 rounded text-[10px] font-black font-mono text-white flex items-center gap-1 shrink-0 shadow animate-in slide-in-from-right duration-200"
                  title={`${el?.name} x${val}`}
                >
                  <span>{el?.symbol}</span>
                  <span>{val}x</span>
                </span>
              );
            })
          )}
        </div>

        <button
          onClick={() => { playSound('click'); setShowRulesModal(true); }}
          className="p-2 text-zinc-400 bg-[#09090b] hover:bg-zinc-850 hover:text-zinc-200 rounded-xl border border-density-border transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center sm:self-center"
          title="Règles du jeu"
        >
          <AlertCircle className="w-4 h-4 text-brand" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* Left Control Panel */}
        <div className="lg:col-span-5 order-2 lg:order-1 bg-density-panel border border-density-border rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-2xl">
          <div className="space-y-4">
            
            {/* Bet Size control */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold text-zinc-400">
                <span>MONTANT DE LA MISE</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  disabled={isSpinning}
                  value={bet}
                  onChange={(e) => setBet(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-grow bg-[#09090b] border border-density-border rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-zinc-100 focus:outline-none focus:border-brand/40 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Element Multipliers selector */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold text-zinc-400">
                <span>CIBLE ÉLÉMENTAIRE</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(ELEMENTS_MAP).map((elem) => {
                  const isSelected = selectedMultiplier === elem.multiplier;
                  return (
                    <button
                      key={elem.multiplier}
                      type="button"
                      disabled={isSpinning}
                      onClick={() => { playSound('click'); setSelectedMultiplier(elem.multiplier); }}
                      className={`flex flex-col items-center justify-center p-2 border rounded-xl transition-all cursor-pointer disabled:opacity-50 ${
                        isSelected
                          ? 'border-brand bg-brand/10 text-brand font-bold scale-[1.02]'
                          : `${elem.borderColor} bg-zinc-950/20 text-zinc-400 hover:text-zinc-200`
                      }`}
                    >
                      <span className="text-md mb-0.5">{elem.symbol}</span>
                      <span className="text-xs font-black tracking-tight text-zinc-200">{elem.name}</span>
                      <span className="text-xs font-bold font-mono text-brand mt-0.5">{elem.multiplier}x</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive visual distribution bar */}
            <div className="bg-[#09090b]/60 border border-density-border/40 rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                <span>Distribution Éléments (24 Secteurs)</span>
                <span className="text-zinc-400 text-[9px]">Aperçu de la Roue</span>
              </div>
              <div className="flex h-3 rounded bg-zinc-950 border border-zinc-900 gap-[2px] p-[2px]">
                {WHEEL_SEGMENTS.map((val, idx) => {
                  const elem = ELEMENTS_MAP[val];
                  const isHighlighted = selectedMultiplier === val;
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: elem.color,
                        boxShadow: isHighlighted ? `0 0 8px ${elem.color}` : 'none',
                      }}
                      className={`h-full flex-grow rounded-[2px] transition-all duration-300 ${
                        isHighlighted ? 'scale-y-125 opacity-100 z-10 font-bold' : 'opacity-45'
                      }`}
                      title={`${elem.name} x${val} (Secteur ${idx + 1})`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                <span className="flex items-center gap-1">🌌 Éther (1)</span>
                <span className="flex items-center gap-1">⚡ Foudre (1)</span>
                <span className="flex items-center gap-1">🌱 Terre (10)</span>
              </div>
            </div>

          </div>

          <div className="space-y-4">
            
            {/* Play trigger button */}
            <button
              onClick={handleSpinWheel}
              disabled={isSpinning || loading || bet <= 0}
              className={`w-full py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer ${
                isSpinning || loading
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
                  : 'bg-brand hover:bg-brand-hover text-[#09090b] shadow-brand/15 active:scale-98'
              }`}
            >
              {isSpinning ? (
                <>
                  <Disc className="w-5 h-5 animate-spin" />
                  <span>Roue en rotation...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Activer la Roue</span>
                </>
              )}
            </button>

            {/* Error alerts */}
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-900/40 rounded-xl flex items-start gap-2 text-red-400 text-xs leading-relaxed animate-in slide-in-from-top duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Active outcome display */}
            {currentWinner && (
              <div className={`p-4 border rounded-xl animate-in zoom-in duration-300 flex flex-col items-center justify-center text-center space-y-1.5 ${
                currentWinner.isWin
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                  : 'bg-zinc-900/30 border-zinc-700/30 text-zinc-400'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Award className={`w-5 h-5 ${currentWinner.isWin ? 'text-brand animate-bounce' : 'text-zinc-500'}`} />
                  <span className="text-xs uppercase tracking-wider font-semibold">
                    {currentWinner.isWin ? 'Génération Réussie !' : 'Tentative Échouée'}
                  </span>
                </div>
                <p className="text-xs text-zinc-300">
                  La flèche pointe sur l'élément :{' '}
                  <strong className="text-[#fafafa] font-mono text-sm">
                    {ELEMENTS_MAP[currentWinner.value]?.symbol} {ELEMENTS_MAP[currentWinner.value]?.name} ({currentWinner.value}x)
                  </strong>
                </p>
                {currentWinner.isWin ? (
                  <p className="text-md font-extrabold font-mono text-emerald-400 mt-1">
                    +{currentWinner.payout.toLocaleString()} {playMode === 'REAL' ? 'FCFA' : 'FTB'} ({selectedMultiplier}x)
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Vous aviez misé sur l'élément {ELEMENTS_MAP[selectedMultiplier]?.name}. Essayez encore !
                  </p>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right Stage: Physical Spinner Wheel Frame */}
        <div className="lg:col-span-7 order-1 lg:order-2 bg-density-panel border border-density-border rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px] xs:min-h-[360px] sm:min-h-[420px] md:min-h-[480px] shadow-2xl">
          
          {/* Ambient Grid style */}
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

          {/* Indicator top indicator pointer */}
          <div className="absolute top-[18px] xs:top-[22px] sm:top-[32px] z-30 flex flex-col items-center">
            {/* Precision Triangle Pointer */}
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] sm:border-l-[14px] sm:border-l-transparent sm:border-r-[14px] sm:border-r-transparent sm:border-t-[22px] border-t-brand drop-shadow-[0_4px_8px_rgba(249,115,22,0.55)] animate-pulse" />
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#09090b] border border-brand rounded-full -mt-1.5 sm:-mt-2 shadow-inner" />
          </div>

          {/* Core Spinner container wrapper */}
          <div className="relative w-[250px] h-[250px] xs:w-[300px] xs:h-[300px] sm:w-[340px] sm:h-[340px] md:w-[410px] md:h-[410px] flex items-center justify-center select-none mt-2">
            
            {/* Radiant Outermost LED Ring */}
            <div className="absolute inset-0 rounded-full border-[5px] border-zinc-800 bg-[#09090b] shadow-[0_0_50px_rgba(0,0,0,0.85),_0_0_20px_rgba(249,115,22,0.06)] p-1">
              <div className="w-full h-full rounded-full border border-dashed border-zinc-700/60" />
            </div>

            {/* Golden pulsating halo */}
            <div className={`absolute inset-4 rounded-full border z-20 transition-all duration-1000 ${
              isSpinning ? 'border-brand/40 shadow-[0_0_25px_rgba(249,115,22,0.18)]' : 'border-zinc-800/80'
            }`} />

            {/* SVG Elements Sector wheel */}
            <svg
              className="w-full h-full drop-shadow-2xl z-10"
              viewBox="0 0 400 400"
              style={{
                transform: `rotate(${wheelAngle}deg)`,
                transition: isSpinning ? 'transform 4500ms cubic-bezier(0.1, 0.95, 0.15, 1)' : 'none',
              }}
            >
              {WHEEL_SEGMENTS.map((val, idx) => {
                const angle = 15; // 360 / 24
                const startAngle = idx * angle;
                const endAngle = startAngle + angle;

                const r = 191; // outermost radius
                const cx = 200;
                const cy = 200;

                const rad = (deg: number) => (deg - 90) * Math.PI / 180;
                const x1 = cx + r * Math.cos(rad(startAngle));
                const y1 = cy + r * Math.sin(rad(startAngle));
                const x2 = cx + r * Math.cos(rad(endAngle));
                const y2 = cy + r * Math.sin(rad(endAngle));

                const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;

                // Calculate center location for icon and label
                const midAngle = startAngle + (angle / 2);
                
                // Position for multiplier text
                const labelR = 142; 
                const lx = cx + labelR * Math.cos(rad(midAngle));
                const ly = cy + labelR * Math.sin(rad(midAngle));

                // Position for element Symbol Emoji (nearer outer edge)
                const symbolR = 170;
                const sx = cx + symbolR * Math.cos(rad(midAngle));
                const sy = cy + symbolR * Math.sin(rad(midAngle));

                const elem = ELEMENTS_MAP[val];
                const color = elem?.color || '#333';
                const labelColor = elem?.textColor || '#ffffff';

                return (
                  <g key={idx}>
                    {/* Element Sector path */}
                    <path
                      d={d}
                      fill={color}
                      stroke="#09090b"
                      strokeWidth="1.2"
                      className="transition-opacity hover:opacity-95"
                    />

                    {/* Small symbol Emoji at the edge */}
                    <text
                      x={sx}
                      y={sy}
                      fontSize="9"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${midAngle}, ${sx}, ${sy})`}
                      className="pointer-events-none select-none"
                    >
                      {elem?.symbol}
                    </text>
                    
                    {/* Multiplier label */}
                    <text
                      x={lx}
                      y={ly}
                      fill={labelColor}
                      fontSize="8.5"
                      fontWeight="900"
                      fontFamily="monospace"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${midAngle}, ${lx}, ${ly})`}
                      className="pointer-events-none select-none tracking-tighter"
                    >
                      {val}x
                    </text>
                  </g>
                );
              })}

              {/* Central Metallic Node */}
              <circle cx="200" cy="200" r="32" fill="#09090b" stroke="#3f3f46" strokeWidth="2.5" />
              <circle cx="200" cy="200" r="12" fill="#f97316" />
              <circle cx="200" cy="200" r="4" fill="#ffffff" />
            </svg>

            {/* Glossy radial lighting reflection glass cover */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-20" />

          </div>

          <div className="flex items-center gap-1.5 mt-6 px-4 py-1.5 bg-zinc-950 rounded-xl border border-density-border text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Algorithme certifié Provably Fair</span>
          </div>

        </div>

      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-density-panel border border-density-border p-6 rounded-2xl max-w-md w-full mx-4 space-y-4 shadow-2xl relative">
            <button
              onClick={() => { playSound('click'); setShowRulesModal(false); }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 border-b border-density-border pb-3">
              <div className="p-2 bg-brand/10 rounded-xl border border-brand/20 text-brand">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#fafafa]">Tableau des Éléments</h3>
            </div>
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-sans">
              <p>
                La roue est divisée en <strong className="text-zinc-100 font-semibold">24 secteurs physiques équitables</strong>. Plus l'élément est puissant, plus il offre un multiplicateur élevé :
              </p>
              
              <div className="space-y-2 bg-[#09090b]/40 p-3 rounded-xl border border-density-border">
                {Object.values(ELEMENTS_MAP).map((elem) => (
                  <div key={elem.multiplier} className="flex items-center justify-between text-[11px] font-mono py-1 border-b border-zinc-800/40 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded flex items-center justify-center text-xs" style={{ backgroundColor: elem.color }}>
                        {elem.symbol}
                      </span>
                      <span className="font-sans font-bold text-zinc-200">{elem.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-brand font-black mr-2">{elem.multiplier}x</span>
                      <span className="text-zinc-500">({elem.count} segments, {((elem.count / 24) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>

              <ul className="space-y-1.5 list-none pl-0 text-[11px]">
                <li className="flex gap-2">
                  <span className="text-brand font-bold">•</span>
                  <span>Sélectionnez votre mise et l'élément que vous ciblez.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand font-bold">•</span>
                  <span>Si la flèche s'arrête sur votre élément, vous gagnez <strong className="text-brand">votre mise × le multiplicateur !</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand font-bold">•</span>
                  <span>Dans le cas contraire, la mise est conservée par le temple.</span>
                </li>
              </ul>
            </div>
            <div className="pt-3 border-t border-density-border">
              <button
                onClick={() => { playSound('click'); setShowRulesModal(false); }}
                className="w-full py-2.5 bg-brand hover:bg-brand-hover text-[#09090b] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Retourner aux Portes Élémentaires
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
