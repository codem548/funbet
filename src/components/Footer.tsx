import React, { useState, useEffect } from 'react';
import { ArrowUp, Globe, Shield, HeartHandshake } from 'lucide-react';

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'FR' | 'EN'>('FR');
  const [selectedCountry, setSelectedCountry] = useState('Cameroun');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const countries = [
    { name: 'Cameroun', flag: '🇨🇲', code: 'cm' },
    { name: 'Bénin', flag: '🇧🇯', code: 'bj' },
    { name: 'Côte d\'Ivoire', flag: '🇨🇮', code: 'ci' },
    { name: 'Sénégal', flag: '🇸🇳', code: 'sn' },
    { name: 'Congo', flag: '🇨🇬', code: 'cg' },
    { name: 'RD Congo', flag: '🇨🇩', code: 'cd' },
  ];

  return (
    <footer className="bg-[#171a1c] border-t border-[#2e3438] text-white pt-8 pb-12 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* 1. Header Row: Logo & Jurisdiction Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#2e3438] pb-6">
          <div className="flex items-center font-black text-2xl tracking-tighter uppercase italic">
            <span className="text-white">FUN</span>
            <span className="text-[#9ce800] bg-[#9ce800]/10 px-1.5 py-0.5 rounded ml-1 border border-[#9ce800]/30">
              BET
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowCountryPicker(!showCountryPicker)}
              className="px-4 py-2 bg-[#222629] hover:bg-[#2c3033] border border-[#2e3438] rounded-full text-xs font-bold text-zinc-200 flex items-center gap-2 transition-all cursor-pointer shadow"
            >
              <span>{countries.find(c => c.name === selectedCountry)?.flag}</span>
              <span>{selectedCountry}</span>
              <span className="text-zinc-500 text-[10px]">▼</span>
            </button>

            {showCountryPicker && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#222629] border border-[#2e3438] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { setSelectedCountry(c.name); setShowCountryPicker(false); }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 text-left transition-colors cursor-pointer ${
                      selectedCountry === c.name ? 'bg-[#9ce800] text-[#171a1c] font-bold' : 'text-zinc-300 hover:bg-[#171a1c]'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Official Partner Section */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px bg-[#2e3438] flex-1 max-w-xs" />
            <span className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-[#9ce800]" />
              <span>Partenaire Officiel</span>
            </span>
            <div className="h-px bg-[#2e3438] flex-1 max-w-xs" />
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap pt-1">
            {/* <div className="px-4 py-2 bg-[#222629] border border-[#2e3438] rounded-xl flex items-center gap-2"> */}
              <span className="text-xl">FB</span>
              <div className="text-left font-mono">
                <div className="text-xs font-extrabold text-white">FunBet Ligue de Jeux</div>
                <div className="text-[10px] text-zinc-500">Elite One & Two</div>
              </div>
            {/* </div> */}
          </div>
        </div>

        <hr className="border-[#2e3438]" />

        {/* 3. Navigation Links (Casino, Providers & Help Center) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          
          <div className="space-y-2.5">
            <h4 className="font-mono font-bold text-zinc-400 uppercase tracking-wider text-[11px]">Univers Casino</h4>
            <ul className="space-y-1.5 text-zinc-400 font-medium">
              <li><span className="hover:text-white transition-colors cursor-pointer">Mini-Jeux Crash</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Démineur & Mines 5x5</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Roues Multiplicateurs</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Machines à Sous Cascades</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Jackpots Éclair</span></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-mono font-bold text-zinc-400 uppercase tracking-wider text-[11px]">Casino & Arcade</h4>
            <ul className="space-y-1.5 text-zinc-400 font-medium">
              <li><span className="text-[#9ce800] font-semibold cursor-pointer">Démineur Pro 5x5</span></li>
              <li><span className="text-[#9ce800] font-semibold cursor-pointer">Rocket Crash Multiplier</span></li>
              <li><span className="text-[#9ce800] font-semibold cursor-pointer">Roue de la Fortune</span></li>
              <li><span className="text-[#9ce800] font-semibold cursor-pointer">Sweet Bonanza™ Cascade</span></li>
              <li><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">Jackpots Progressifs</span></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-mono font-bold text-zinc-400 uppercase tracking-wider text-[11px]">Aide & Paiements</h4>
            <ul className="space-y-1.5 text-zinc-400 font-medium">
              <li><span className="hover:text-white transition-colors cursor-pointer">Dépôt Orange Money</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Dépôt MTN MoMo</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Retraits Rapides</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Bonus Quotidien +10k</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Centre d'assistance</span></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-mono font-bold text-zinc-400 uppercase tracking-wider text-[11px]">Légal & Jeu Responsable</h4>
            <ul className="space-y-1.5 text-zinc-400 font-medium">
              <li><span className="hover:text-white transition-colors cursor-pointer">Règles officielles</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Politique de confidentialité</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Jeu Responsable (+18)</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer"></span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Conditions générales</span></li>
            </ul>
          </div>

        </div>

        <hr className="border-[#2e3438]" />

        {/* 4. Language Switcher & Social */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 font-bold uppercase">Langue :</span>
            <div className="bg-[#222629] p-0.5 rounded-xl border border-[#2e3438] flex items-center font-mono text-xs">
              <button
                onClick={() => setSelectedLanguage('FR')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedLanguage === 'FR' ? 'bg-[#9ce800] text-[#171a1c]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                🇫🇷 FR
              </button>
              <button
                onClick={() => setSelectedLanguage('EN')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedLanguage === 'EN' ? 'bg-[#9ce800] text-[#171a1c]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
            <span>Réseaux officiels :</span>
            <span className="text-white hover:text-[#9ce800] cursor-pointer">Facebook</span>
            <span>•</span>
            <span className="text-white hover:text-[#9ce800] cursor-pointer">Twitter (X)</span>
            <span>•</span>
            <span className="text-white hover:text-[#9ce800] cursor-pointer">Instagram</span>
            <span>•</span>
            <span className="text-white hover:text-[#9ce800] cursor-pointer">Telegram</span>
          </div>
        </div>

        {/* 5. Legal MINAT Text and Warning */}
        <div className="bg-[#222629] p-4 rounded-2xl border border-[#2e3438] space-y-2 text-[11px] text-zinc-400 leading-relaxed font-sans">
          <p>
            Vos paris et paiements sont traités par <strong>omna Gaming Sarl</strong>
          </p>
          <p className="font-mono text-[10px] text-zinc-500">
            n° <strong>000975/A/SG/DAP/SDLP/SJ/</strong> • Jeux et paris en ligne.
          </p>
          <p className="text-red-400 font-medium pt-1">
            🔞 Vous devez être âgé d’au moins 21 ans pour parier. Les jeux d'argent comportent des risques d'addiction et d'isolement. Jouez de manière responsable.
          </p>
        </div>

      </div>

      {/* Floating Back To Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-[#222629]/90 hover:bg-[#9ce800] text-zinc-300 hover:text-[#171a1c] border border-[#2e3438] rounded-full shadow-2xl transition-all z-40 cursor-pointer active:scale-95 animate-in fade-in"
          title="Revenir en haut"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </footer>
  );
}
