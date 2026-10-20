import React, { useState } from 'react';
import { Sparkles, Play, ChevronRight, Grid as GridIcon, TrendingUp, Disc, Coins, Flame, Award, ShieldCheck, Gift, ArrowRight } from 'lucide-react';
import { GameConfig, Player } from '../types';

interface CasinoLobbyProps {
  player: Player;
  playMode: 'REAL' | 'DEMO';
  onLaunchGame: (gameId: string) => void;
  onOpenDeposit: () => void;
  onOpenDailyBonus: () => void;
  games: GameConfig[];
}

export default function CasinoLobby({
  player,
  playMode,
  onLaunchGame,
  onOpenDeposit,
  onOpenDailyBonus,
  games,
}: CasinoLobbyProps) {
  const [selectedPill, setSelectedPill] = useState<string>('all');

  const minesConfig = games.find((g) => g.id === 'mines');
  const crashConfig = games.find((g) => g.id === 'crash');
  const wheelConfig = games.find((g) => g.id === 'wheel');
  const bonanzaConfig = games.find((g) => g.id === 'bonanza');

  const categories = [
    { id: 'all', label: 'Accueil' },
    { id: 'popular', label: '💥 Populaire' },
    { id: 'trending', label: '🔥 Tendances' },
    { id: 'crash', label: '🚀 Crash' },
    { id: 'mines', label: '💣 Mines' },
    { id: 'slots', label: '🎰 Slots' },
    { id: 'spinners', label: '🌀 Spinners' },
    { id: 'wheel', label: '📀 Roues' },
    { id: 'bonanza', label: '🍬 Bonanza' },
    { id: 'jackpots', label: '💰 Jackpots' },
    { id: 'instant', label: '⚡ Instantanés' },
    { id: 'live', label: '🎲 Live Casino' },
  ];

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      
      {/* 1. Category Pills Carousel (betPawa CasinoPills style) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => {
          const isActive = selectedPill === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedPill(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#9ce800] text-[#171a1c] shadow-md shadow-[#9ce800]/20'
                  : 'bg-[#222629] text-zinc-300 hover:text-white hover:bg-[#2c3033] border border-[#2e3438]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 2. Hero Promo Banner (betPawa Tournament Banner style) */}
      <div className="relative rounded-2xl overflow-hidden border border-[#2e3438] bg-gradient-to-r from-[#171a1c] via-[#222629] to-[#1a2312] p-5 sm:p-7 shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-full bg-[#9ce800]/10 rounded-full blur-[90px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#9ce800]/20 border border-[#9ce800]/40 text-[#9ce800] rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                🏆 Tournoi Africup & Casino
              </span>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-mono font-bold">
                EN COURS
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              Gagnez jusqu'à <span className="text-[#9ce800]">10 000 000 FCFA</span> sur les Mini-Jeux FunBet
            </h2>
            
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Misez sur <strong>Mines Pro</strong>, <strong>Rocket Crash</strong>, <strong>Roue de la Fortune</strong> et <strong>Sweet Bonanza</strong>. Dépôts & retraits instantanés via Orange Money, MTN MoMo et Wave !
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {playMode === 'REAL' ? (
              <button
                onClick={onOpenDeposit}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#9ce800] hover:bg-[#8ad400] text-[#171a1c] font-black text-xs rounded-xl transition-all shadow-lg shadow-[#9ce800]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Faire un Dépôt</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            ) : (
              <button
                onClick={onOpenDailyBonus}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Gift className="w-4 h-4" />
                <span>Réclamer +10k FTB</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Section: 🇨🇲 Les plus populaires au Cameroun & Afrique (Interactive Core Engine Tiles) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-extrabold text-white">🇨🇲 Les plus populaires au Cameroun</span>
            <span className="px-2 py-0.5 bg-[#222629] text-zinc-400 border border-[#2e3438] rounded-full text-[10px] font-mono">
              4 Jeux Pro
            </span>
          </div>
          <span className="text-xs font-mono text-[#9ce800] font-bold cursor-pointer hover:underline">
            Voir Tout →
          </span>
        </div>

        {/* 4 Featured Interactive Playable Game Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Démineur Pro */}
          <div 
            onClick={() => onLaunchGame('mines')}
            className="group game-tile border border-[#2e3438] hover:border-[#9ce800]/50 cursor-pointer overflow-hidden flex flex-col justify-between"
          >
            {/* Ribbon */}
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-purple-600 text-white font-bold text-[9px] font-mono rounded tracking-wider shadow">
              Exclusivité
            </div>

            {/* Background Image / Art */}
            <div className="absolute inset-0 w-full h-full">
              <img 
                src="https://www.betpawa.cm/media/casino/jelly/FORTUNEMINERV5I7/FM2%20Thumbnail_1%20%281%29-min_1.jpg" 
                alt="Mines Pro" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171a1c] via-[#171a1c]/40 to-transparent" />
            </div>

            {/* Content Bottom Overlay */}
            <div className="relative z-10 p-3 mt-auto space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-white group-hover:text-[#9ce800] transition-colors">
                  Démineur Pro
                </span>
                <span className="text-[10px] font-mono text-[#9ce800] font-bold">97%</span>
              </div>
              <p className="text-[10px] text-zinc-300 line-clamp-1">Grille 5x5 • Gemmes & Mines</p>
              
              <button className="w-full mt-2 py-1.5 bg-[#9ce800] text-[#171a1c] font-black text-xs rounded-lg flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                <Play className="w-3 h-3 fill-current" />
                <span>Jouer</span>
              </button>
            </div>
          </div>

          {/* Card 2: Rocket Crash Live */}
          <div 
            onClick={() => onLaunchGame('crash')}
            className="group game-tile border border-[#2e3438] hover:border-[#9ce800] ring-1 ring-emerald-500/20 hover:ring-[#9ce800]/50 cursor-pointer overflow-hidden flex flex-col justify-between relative shadow-lg"
          >
            {/* Ribbon */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white font-black text-[9px] font-mono rounded tracking-wider shadow animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>LIVE MULTI</span>
            </div>

            {/* Background Image / Art */}
            <div className="absolute inset-0 w-full h-full">
              <img 
                src="https://www.betpawa.cm/media/casino/spribe/aviator/Game_art_120x120.png" 
                alt="Rocket Crash Live" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171a1c] via-[#171a1c]/50 to-transparent" />
            </div>

            {/* Content Bottom Overlay */}
            <div className="relative z-10 p-3 mt-auto space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-white group-hover:text-[#9ce800] transition-colors flex items-center gap-1">
                  <span>Rocket Crash</span>
                  <span className="text-[10px] text-[#9ce800] font-mono font-bold">LIVE</span>
                </span>
                <span className="text-[10px] font-mono text-[#9ce800] font-bold">96%</span>
              </div>
              <p className="text-[10px] text-zinc-300 line-clamp-1">Multiplayer • Canvas 60 FPS</p>
              
              <button className="w-full mt-2 py-1.5 bg-[#9ce800] hover:bg-[#8cd300] text-[#171a1c] font-black text-xs rounded-lg flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity shadow-md shadow-[#9ce800]/20">
                <Play className="w-3 h-3 fill-current" />
                <span>Jouer en Direct</span>
              </button>
            </div>
          </div>

          {/* Card 3: Wheel of Luck */}
          <div 
            onClick={() => onLaunchGame('wheel')}
            className="group game-tile border border-[#2e3438] hover:border-[#9ce800]/50 cursor-pointer overflow-hidden flex flex-col justify-between"
          >
            {/* Ribbon */}
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-purple-600 text-white font-bold text-[9px] font-mono rounded tracking-wider shadow">
              Exclusivité
            </div>

            {/* Background Image / Art */}
            <div className="absolute inset-0 w-full h-full">
              <img 
                src="https://www.betpawa.cm/media/casino/jelly/WHEELOFLUCKV7P6/Wheel%20of%20Luck%202%20200x200.jpg" 
                alt="Wheel of Luck" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171a1c] via-[#171a1c]/40 to-transparent" />
            </div>

            {/* Content Bottom Overlay */}
            <div className="relative z-10 p-3 mt-auto space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-white group-hover:text-[#9ce800] transition-colors">
                  Roue de la Fortune
                </span>
                <span className="text-[10px] font-mono text-[#9ce800] font-bold">96%</span>
              </div>
              <p className="text-[10px] text-zinc-300 line-clamp-1">60 Segments • Multiplicateurs 50x</p>
              
              <button className="w-full mt-2 py-1.5 bg-[#9ce800] text-[#171a1c] font-black text-xs rounded-lg flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                <Play className="w-3 h-3 fill-current" />
                <span>Jouer</span>
              </button>
            </div>
          </div>

          {/* Card 4: Sweet Bonanza */}
          <div 
            onClick={() => onLaunchGame('bonanza')}
            className="group game-tile border border-[#2e3438] hover:border-pink-500/50 cursor-pointer overflow-hidden flex flex-col justify-between"
          >
            {/* Ribbon */}
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-pink-600 text-white font-bold text-[9px] font-mono rounded tracking-wider shadow">
              💫 NOUVEAU
            </div>

            {/* Background Image / Art */}
            <div className="absolute inset-0 w-full h-full">
              <img 
                src="https://thumbs.alea.com/0213b5b8_gamzix_juicy-win-hold-the-spin_400x400.webp" 
                alt="Sweet Bonanza" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171a1c] via-[#171a1c]/40 to-transparent" />
            </div>

            {/* Content Bottom Overlay */}
            <div className="relative z-10 p-3 mt-auto space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-white group-hover:text-pink-400 transition-colors">
                  Sweet Bonanza™
                </span>
                <span className="text-[10px] font-mono text-pink-400 font-bold">96.5%</span>
              </div>
              <p className="text-[10px] text-zinc-300 line-clamp-1">Explosions 6x5 • Bonus Free Spins</p>
              
              <button className="w-full mt-2 py-1.5 bg-pink-500 text-white font-black text-xs rounded-lg flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                <Play className="w-3 h-3 fill-current" />
                <span>Jouer</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Section: 🚀 Crash & Multiplicateurs */}
      <section className="space-y-3 pt-4 border-t border-[#2e3438]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-extrabold text-white">🚀 Jeux de Crash & Multiplicateurs</span>
            <span className="px-2 py-0.5 bg-[#222629] text-zinc-400 border border-[#2e3438] rounded-full text-[10px] font-mono">
              86 Jeux
            </span>
          </div>
          <button 
            onClick={() => onLaunchGame('crash')}
            className="text-xs font-mono text-[#9ce800] font-bold cursor-pointer hover:underline"
          >
            Lancer Crash →
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3">
          {[
            { id: 'crash', name: 'Rocket Crash', img: 'https://www.betpawa.cm/media/casino/spribe/aviator/Game_art_120x120.png', badge: 'Exclusivité', color: 'bg-purple-600', isCore: true },
            { id: 'crash', name: 'JetX', img: 'https://www.betpawa.cm/media/casino/smartsoft/18/JetXNew.jpg', badge: '💫 NOUVEAU', color: 'bg-amber-500 text-black', isCore: true },
            { id: 'crash', name: 'Air Ace', img: 'https://www.betpawa.cm/media/casino/jelly/AIRACE7ED3/Air%20Ace%20200x200.jpg', badge: 'Exclusivité', color: 'bg-purple-600', isCore: true },
            { id: 'crash', name: 'Navigator', img: 'https://www.betpawa.cm/media/casino/jelly/NAVIGATOR3O7/navigator-1000x1000%20%281%29.jpg', badge: 'Crash Pro', color: 'bg-blue-600', isCore: true },
            { id: 'crash', name: 'BalloonX', img: 'https://www.betpawa.cm/media/casino/smartsoft/BalloonX/BalloonX.jpg', badge: '', color: '', isCore: true },
            { id: 'crash', name: 'HelicopterX', img: 'https://www.betpawa.cm/media/casino/smartsoft/62/400x400%20%284%29_1.jpg', badge: '', color: '', isCore: true },
          ].map((game, i) => (
            <div
              key={i}
              onClick={() => onLaunchGame('crash')}
              className="group game-tile border border-[#2e3438] hover:border-[#9ce800]/50 cursor-pointer overflow-hidden flex flex-col justify-end"
            >
              {game.badge && (
                <div className={`absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 text-white font-bold text-[8px] font-mono rounded shadow ${game.color}`}>
                  {game.badge}
                </div>
              )}
              <img src={game.img} alt={game.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171a1c] via-transparent to-transparent opacity-80" />
              <div className="relative z-10 p-2">
                <span className="text-[11px] font-bold text-white block truncate group-hover:text-[#9ce800]">{game.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Section: 🎰 Machines à sous & Jackpots */}
      <section className="space-y-3 pt-4 border-t border-[#2e3438]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-extrabold text-white">🎰 Machines à sous & Jackpots Populaires</span>
            <span className="px-2 py-0.5 bg-[#222629] text-zinc-400 border border-[#2e3438] rounded-full text-[10px] font-mono">
              1,468 Jeux
            </span>
          </div>
          <button 
            onClick={() => onLaunchGame('bonanza')}
            className="text-xs font-mono text-[#9ce800] font-bold cursor-pointer hover:underline"
          >
            Lancer Bonanza →
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3">
          {[
            { id: 'bonanza', name: 'Sweet Bonanza™', img: 'https://thumbs.alea.com/0213b5b8_gamzix_juicy-win-hold-the-spin_400x400.webp', badge: '3x3 Slot', color: 'bg-orange-500' },
            { id: 'bonanza', name: 'Multi Hot 5', img: 'https://www.betpawa.cm/media/casino/smartsoft/42/smartsoft_MultiHot5_no39.jpg', badge: '3x3 Slot', color: 'bg-orange-500' },
            { id: 'bonanza', name: 'Shining Crown', img: 'https://thumbs.alea.com/c89a163e_amusnet_shining-crown_400x400.webp', badge: '💰Jackpot', color: 'bg-yellow-500 text-black' },
            { id: 'bonanza', name: 'Burning Classics', img: 'https://thumbs.alea.com/b2ec86b0_booming-games_burning-classics_400x400.webp', badge: 'WIN BIG!', color: 'bg-cyan-500 text-black' },
            { id: 'bonanza', name: 'Thunder Crown', img: 'https://www.betpawa.cm/media/casino/alea/22232/ThunderCrown.jpg', badge: '3x3 Slot', color: 'bg-orange-500' },
            { id: 'bonanza', name: 'African Gold', img: 'https://www.betpawa.cm/media/casino/alea/18788/African%20Gold%20200x200.jpg', badge: 'Exclusivité', color: 'bg-purple-600' },
          ].map((game, i) => (
            <div
              key={i}
              onClick={() => onLaunchGame('bonanza')}
              className="group game-tile border border-[#2e3438] hover:border-[#9ce800]/50 cursor-pointer overflow-hidden flex flex-col justify-end"
            >
              {game.badge && (
                <div className={`absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 text-white font-bold text-[8px] font-mono rounded shadow ${game.color}`}>
                  {game.badge}
                </div>
              )}
              <img src={game.img} alt={game.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171a1c] via-transparent to-transparent opacity-80" />
              <div className="relative z-10 p-2">
                <span className="text-[11px] font-bold text-white block truncate group-hover:text-[#9ce800]">{game.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Section: 📀 Roues de la Fortune & Spinners */}
      <section className="space-y-3 pt-4 border-t border-[#2e3438]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-extrabold text-white">📀 Roues de la Fortune & Spinners</span>
            <span className="px-2 py-0.5 bg-[#222629] text-zinc-400 border border-[#2e3438] rounded-full text-[10px] font-mono">
              48 Jeux
            </span>
          </div>
          <button 
            onClick={() => onLaunchGame('wheel')}
            className="text-xs font-mono text-[#9ce800] font-bold cursor-pointer hover:underline"
          >
            Lancer Roue →
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3">
          {[
            { id: 'wheel', name: 'Wheel of Luck 2', img: 'https://www.betpawa.cm/media/casino/jelly/WHEELOFLUCKV7P6/Wheel%20of%20Luck%202%20200x200.jpg', badge: 'Exclusivité', color: 'bg-purple-600' },
            { id: 'wheel', name: 'Rainbow Fruit Spinner', img: 'https://www.betpawa.cm/media/casino/blacklagoon/BLG_RAINBOW_FRUIT_KING_SPINNER/en/LARGE/cbfa485c-da6d-41c7-9746-c1e6feb76820.jpg', badge: '🌀 Spinner', color: 'bg-amber-500 text-black' },
            { id: 'wheel', name: 'Golden Fortune Spinner', img: 'https://www.betpawa.cm/media/casino/blacklagoon/BLG_GOLDEN_FORTUNE_SPINNER/Golden_Fortune_Spinner_Icon_400x400.jpg', badge: 'Exclusivité', color: 'bg-purple-600' },
            { id: 'wheel', name: 'Royal Lion Spinner', img: 'https://www.betpawa.cm/media/casino/blacklagoon/BLG_ROYAL_LION_SPINNER/Royal_Lion_Spinner_Icon_400x400.jpg', badge: 'Unique à bP', color: 'bg-green-600' },
            { id: 'wheel', name: 'Jungle Wheel', img: 'https://thumbs.alea.com/64402b65_galaxsys_jungle-wheel_400x400.webp', badge: '60 Seg', color: 'bg-blue-600' },
            { id: 'wheel', name: 'Roulette 777 Live', img: 'https://www.betpawa.cm/media/casino/alea/21323/Roulette777.jpg', badge: 'Live Roulette', color: 'bg-red-600' },
          ].map((game, i) => (
            <div
              key={i}
              onClick={() => onLaunchGame('wheel')}
              className="group game-tile border border-[#2e3438] hover:border-[#9ce800]/50 cursor-pointer overflow-hidden flex flex-col justify-end"
            >
              {game.badge && (
                <div className={`absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 text-white font-bold text-[8px] font-mono rounded shadow ${game.color}`}>
                  {game.badge}
                </div>
              )}
              <img src={game.img} alt={game.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171a1c] via-transparent to-transparent opacity-80" />
              <div className="relative z-10 p-2">
                <span className="text-[11px] font-bold text-white block truncate group-hover:text-[#9ce800]">{game.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
