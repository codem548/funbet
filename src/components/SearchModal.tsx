import React, { useState, useMemo } from 'react';
import { Search, X, Play, Grid as GridIcon, TrendingUp, Disc, Coins, Sparkles } from 'lucide-react';
import { GameConfig } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (gameId: string) => void;
  games: GameConfig[];
}

export default function SearchModal({
  isOpen,
  onClose,
  onSelectGame,
  games,
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const catalog = [
    {
      id: 'mines',
      name: 'Mines Pro (Démineur)',
      category: 'mines',
      provider: 'FunBet Studio',
      badge: 'Exclusivité',
      badgeColor: 'bg-purple-600',
      icon: '💣',
      image: 'https://www.betpawa.cm/media/casino/jelly/FORTUNEMINERV5I7/FM2%20Thumbnail_1%20%281%29-min_1.jpg',
      isReal: true,
      rtp: '97.0%',
      desc: 'Découvrez les gemmes scintillantes et encaissez avant d\'exploser sur une mine.',
    },
    {
      id: 'crash',
      name: 'Rocket Crash (Aviator Style)',
      category: 'crash',
      provider: 'FunBet Studio',
      badge: '🔥 Populaire',
      badgeColor: 'bg-amber-500 text-black font-bold',
      icon: '🚀',
      image: 'https://www.betpawa.cm/media/casino/spribe/aviator/Game_art_120x120.png',
      isReal: true,
      rtp: '97.0%',
      desc: 'Ascension exponentielle du multiplicateur en direct avec auto-cashout.',
    },
    {
      id: 'wheel',
      name: 'Wheel of Luck (60 Segments)',
      category: 'wheel',
      provider: 'FunBet Studio',
      badge: 'Exclusivité',
      badgeColor: 'bg-purple-600',
      icon: '📀',
      image: 'https://www.betpawa.cm/media/casino/jelly/WHEELOFLUCKV7P6/Wheel%20of%20Luck%202%20200x200.jpg',
      isReal: true,
      rtp: '96.0%',
      desc: 'Grande roue de fortune avec multiplicateurs 1.2x à 50x.',
    },
    {
      id: 'bonanza',
      name: 'Sweet Bonanza™ Cascade',
      category: 'slots',
      provider: 'Pragmatic Style',
      badge: '💫 NOUVEAU',
      badgeColor: 'bg-pink-600 text-white font-bold',
      icon: '🍬',
      image: 'https://thumbs.alea.com/0213b5b8_gamzix_juicy-win-hold-the-spin_400x400.webp',
      isReal: true,
      rtp: '96.5%',
      desc: 'Grille 6x5 avec explosion en cascade, Scatters et bombes multiplicatrices.',
    },
    // Popular catalog games for casino search experience
    {
      id: 'crash-jetx',
      name: 'JetX Turbo',
      category: 'crash',
      provider: 'SmartSoft',
      badge: '3x3 Slot',
      badgeColor: 'bg-orange-500',
      icon: '✈️',
      image: 'https://www.betpawa.cm/media/casino/smartsoft/18/JetXNew.jpg',
      isReal: false,
      rtp: '96.8%',
      desc: 'Faites décoller le jet haute vitesse et sautez en parachute à temps.',
    },
    {
      id: 'slots-multihot',
      name: 'Multi Hot 5',
      category: 'slots',
      provider: 'SmartSoft',
      badge: '3x3 Slot',
      badgeColor: 'bg-orange-500',
      icon: '🎰',
      image: 'https://www.betpawa.cm/media/casino/smartsoft/42/smartsoft_MultiHot5_no39.jpg',
      isReal: false,
      rtp: '96.2%',
      desc: 'Slot classique 3x3 aux fruits incandescents et gains instantanés.',
    },
    {
      id: 'roulette-777',
      name: 'Roulette x777 Live',
      category: 'live',
      provider: 'Alea Live',
      badge: '🎲 Live',
      badgeColor: 'bg-emerald-600',
      icon: '🎲',
      image: 'https://www.betpawa.cm/media/casino/alea/21323/Roulette777.jpg',
      isReal: false,
      rtp: '97.3%',
      desc: 'Roulette européenne avec croupiers en direct et multiplicateurs éclairs.',
    },
    {
      id: 'plinko-max',
      name: 'Plinko Xtreme',
      category: 'instant',
      provider: 'FunBet Arcade',
      badge: '⚡ Instant',
      badgeColor: 'bg-blue-600',
      icon: '⚡',
      image: 'https://www.betpawa.cm/media/casino/smartsoft/41/smartsoft_PlinkoX_4tl0.jpg',
      isReal: false,
      rtp: '98.0%',
      desc: 'Lâchez les billes sur la pyramide et touchez les cases extérieures x100.',
    },
  ];

  const filteredGames = useMemo(() => {
    return catalog.filter((g) => {
      const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.provider.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = selectedTag === 'all' || g.category === selectedTag;

      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#171a1c] border border-[#2e3438] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] mt-4 sm:mt-12">
        
        {/* Search Bar Header */}
        <div className="p-4 border-b border-[#2e3438] bg-[#222629] flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9ce800]">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un jeu (ex: Mines, Crash, Roue, Bonanza, Slots...)"
              autoFocus
              className="w-full pl-11 pr-4 py-3 bg-[#171a1c] border border-[#2e3438] rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#9ce800] text-sm transition-all"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-zinc-400 hover:text-white bg-[#171a1c] hover:bg-[#2c3033] border border-[#2e3438] rounded-2xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filter Tags */}
        <div className="px-4 py-2 bg-[#222629]/50 border-b border-[#2e3438] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'mines', label: '💣 Mines' },
            { id: 'crash', label: '🚀 Crash' },
            { id: 'wheel', label: '📀 Roues' },
            { id: 'slots', label: '🎰 Slots' },
            { id: 'instant', label: '⚡ Instant' },
            { id: 'live', label: '🎲 Live' },
          ].map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTag === tag.id
                  ? 'bg-[#9ce800] text-[#171a1c] font-bold'
                  : 'bg-[#171a1c] text-zinc-300 hover:text-white border border-[#2e3438]'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {filteredGames.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <p className="text-sm">Aucun jeu ne correspond à "{searchQuery}"</p>
              <p className="text-xs">Essayez un autre mot clé comme "Mines", "Crash", ou "Roue".</p>
            </div>
          ) : (
            filteredGames.map((game) => (
              <div
                key={game.id}
                onClick={() => {
                  if (game.isReal) {
                    onSelectGame(game.id);
                  } else {
                    // Default redirect to related core engine
                    if (game.category === 'crash') onSelectGame('crash');
                    else if (game.category === 'slots') onSelectGame('bonanza');
                    else if (game.category === 'wheel') onSelectGame('wheel');
                    else onSelectGame('mines');
                  }
                  onClose();
                }}
                className="group p-3 bg-[#222629] hover:bg-[#2c3033] border border-[#2e3438] hover:border-[#9ce800]/40 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cover bg-center overflow-hidden shrink-0 border border-[#2e3438] relative">
                    <img src={game.image} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#9ce800] transition-colors">{game.name}</h4>
                      {game.badge && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${game.badgeColor}`}>
                          {game.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{game.desc}</p>
                    <span className="text-[10px] font-mono text-zinc-500">{game.provider} • RTP {game.rtp}</span>
                  </div>
                </div>

                <button className="px-3 py-1.5 bg-[#9ce800] text-[#171a1c] font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Jouer</span>
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
