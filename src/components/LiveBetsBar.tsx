import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Zap, Trophy } from 'lucide-react';
import { LiveBetEvent } from '../types';

interface LiveBetsBarProps {
  onSelectGame?: (gameId: string) => void;
}

const INITIAL_BETS: LiveBetEvent[] = [
  { id: '1', username: 'Moussa_82', gameId: 'crash', gameName: 'Rocket Crash', bet: 2500, multiplier: 12.45, payout: 31125, isBigWin: true, timestamp: 'À l\'instant' },
  { id: '2', username: 'Koffi_Pro', gameId: 'mines', gameName: 'Démineur Pro', bet: 1000, multiplier: 4.80, payout: 4800, isBigWin: false, timestamp: 'Il y a 10s' },
  { id: '3', username: 'Aicha_99', gameId: 'bonanza', gameName: 'Sweet Bonanza', bet: 5000, multiplier: 25.00, payout: 125000, isBigWin: true, timestamp: 'Il y a 22s' },
  { id: '4', username: 'Diallo_VIP', gameId: 'wheel', gameName: 'Crazy Spin', bet: 3000, multiplier: 10.00, payout: 30000, isBigWin: true, timestamp: 'Il y a 35s' },
  { id: '5', username: 'Paul_B', gameId: 'crash', gameName: 'Rocket Crash', bet: 500, multiplier: 2.30, payout: 1150, isBigWin: false, timestamp: 'Il y a 48s' },
];

const RANDOM_USERS = ['Ibrahim_C', 'Fatou_D', 'Yannick_K', 'Saliou_M', 'Ebenezer_T', 'Nathalie_G', 'Bakary_S', 'Junior_237', 'Ousmane_SN'];
const GAMES = [
  { id: 'crash', name: 'Rocket Crash', maxM: 25 },
  { id: 'mines', name: 'Démineur Pro', maxM: 8 },
  { id: 'wheel', name: 'Crazy Spin', maxM: 50 },
  { id: 'bonanza', name: 'Sweet Bonanza', maxM: 35 },
];

export default function LiveBetsBar({ onSelectGame }: LiveBetsBarProps) {
  const [liveBets, setLiveBets] = useState<LiveBetEvent[]>(INITIAL_BETS);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomUser = RANDOM_USERS[Math.floor(Math.random() * RANDOM_USERS.length)];
      const randomGame = GAMES[Math.floor(Math.random() * GAMES.length)];
      const bet = [500, 1000, 2000, 5000, 10000][Math.floor(Math.random() * 5)];
      const mult = Number((Math.random() * (randomGame.maxM - 1.5) + 1.5).toFixed(2));
      const payout = Math.floor(bet * mult);
      const isBigWin = mult >= 8 || payout >= 25000;

      const newEvent: LiveBetEvent = {
        id: `live-${Date.now()}`,
        username: randomUser,
        gameId: randomGame.id,
        gameName: randomGame.name,
        bet,
        multiplier: mult,
        payout,
        isBigWin,
        timestamp: 'À l\'instant',
      };

      setLiveBets(prev => [newEvent, ...prev.slice(0, 7)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#1b1f22]/90 backdrop-blur-md border-y border-white/5 py-2.5 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {/* Live Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[11px] font-mono font-bold text-red-400 uppercase tracking-wider">
            Gains en Direct
          </span>
        </div>

        {/* Horizontal Ticker */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {liveBets.map((bet) => (
            <div
              key={bet.id}
              onClick={() => onSelectGame && onSelectGame(bet.gameId)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap cursor-pointer transition-all border shrink-0 ${
                bet.isBigWin
                  ? 'bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border-amber-500/30 text-amber-200 hover:border-amber-400 shadow-sm'
                  : 'bg-[#24282c] border-white/5 text-zinc-300 hover:bg-[#2e3338] hover:border-white/10'
              }`}
            >
              {bet.isBigWin ? (
                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-[#9ce800] shrink-0" />
              )}
              <span className="font-semibold text-white">{bet.username}</span>
              <span className="text-zinc-400 text-[11px]">sur {bet.gameName}</span>
              <span className="font-mono font-bold text-[#9ce800] bg-[#9ce800]/10 px-1.5 py-0.5 rounded text-[11px]">
                {bet.multiplier.toFixed(2)}x
              </span>
              <span className="font-bold text-white font-mono">
                +{bet.payout.toLocaleString()} F
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
