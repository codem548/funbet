import React from 'react';
import { LayoutGrid, Search, PlusCircle, Gift, Shield, User } from 'lucide-react';
import { Player } from '../types';

interface BottomNavigationBarProps {
  activeNavTab: string;
  onSelectNavTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenDeposit: () => void;
  onOpenRewards: () => void;
  onOpenProvablyFair: () => void;
  onOpenAuth: () => void;
  player: Player;
}

export default function BottomNavigationBar({
  activeNavTab,
  onSelectNavTab,
  onOpenSearch,
  onOpenDeposit,
  onOpenRewards,
  onOpenProvablyFair,
  onOpenAuth,
  player,
}: BottomNavigationBarProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#171a1c]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        {/* Lobby */}
        <button
          onClick={() => onSelectNavTab('casino')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeNavTab === 'casino' || activeNavTab === 'home'
              ? 'text-[#9ce800]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold">Lobby</span>
        </button>

        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-bold">Recherche</span>
        </button>

        {/* Deposit Express (Hero Action in center) */}
        <button
          onClick={onOpenDeposit}
          className="flex flex-col items-center gap-0.5 -mt-3 py-1 px-3 bg-[#9ce800] hover:bg-[#8bd100] text-[#171a1c] rounded-2xl shadow-lg shadow-[#9ce800]/25 transition-all transform active:scale-95 cursor-pointer font-black"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-tighter">Dépôt</span>
        </button>

        {/* Rewards */}
        <button
          onClick={onOpenRewards}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer relative"
        >
          <Gift className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-bold text-amber-300">Cadeaux</span>
          <span className="absolute top-1 right-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        </button>

        {/* Provably Fair */}
        <button
          onClick={onOpenProvablyFair}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <Shield className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-bold">Équité</span>
        </button>
      </div>
    </div>
  );
}
