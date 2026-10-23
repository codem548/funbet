import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Lock, Sparkles, Mail, Phone, Eye, EyeOff, Check, X, Globe, ArrowRight } from 'lucide-react';
import { Player, EligibleCountry } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (player: Player, token: string) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Countries dropdown dynamic data
  const [countries, setCountries] = useState<EligibleCountry[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('+237');

  // 2FA Simulator state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);

  // Prefill referral from URL ?ref=CODE
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setReferralCode(ref.toUpperCase());
        setIsRegister(true);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetch('/api/countries')
      .then(res => res.json())
      .then(data => {
        if (data.countries && data.countries.length > 0) {
          setCountries(data.countries);
          setSelectedCountryCode(data.countries[0].code);
        }
      })
      .catch(err => console.error('Error fetching active countries:', err));
  }, []);

  // Password strength checks
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteriaList = [
    { label: '8 caractères min', met: hasMinLen },
    { label: 'Une majuscule (A-Z)', met: hasUpper },
    { label: 'Une minuscule (a-z)', met: hasLower },
    { label: 'Un chiffre (0-9)', met: hasDigit },
    { label: 'Un caractère spécial (@$!%)', met: hasSpecial }
  ];

  const metCount = criteriaList.filter(c => c.met).length;

  const getStrengthInfo = () => {
    if (password === '') return { score: 0, label: 'Vide', color: 'bg-zinc-800', textColor: 'text-zinc-500' };
    switch (metCount) {
      case 1:
        return { score: 20, label: 'Très faible', color: 'bg-red-500', textColor: 'text-red-400' };
      case 2:
        return { score: 40, label: 'Faible', color: 'bg-orange-500', textColor: 'text-orange-400' };
      case 3:
        return { score: 60, label: 'Moyen', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
      case 4:
        return { score: 80, label: 'Fort', color: 'bg-blue-400', textColor: 'text-blue-400' };
      case 5:
        return { score: 100, label: 'Très sécurisé', color: 'bg-[#9ce800]', textColor: 'text-[#9ce800]' };
      default:
        return { score: 10, label: 'Très faible', color: 'bg-red-500', textColor: 'text-red-400' };
    }
  };

  const strength = getStrengthInfo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError(isRegister ? 'Le nom d\'utilisateur est requis' : 'Nom d\'utilisateur ou numéro de téléphone requis');
      return;
    }

    if (isRegister) {
      if (!email.trim()) {
        setError('L\'adresse email est requise');
        return;
      }
      if (!phoneVal.trim()) {
        setError('Le numéro de téléphone est requis');
        return;
      }
      if (metCount < 5) {
        setError('Le mot de passe doit respecter tous les critères de sécurité');
        return;
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
    } else {
      if (!password) {
        setError('Le mot de passe est requis pour se connecter');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const fullPhone = isRegister
        ? `${selectedCountryCode}${phoneVal.trim().replace(/^\+/, '')}`
        : '';

      if (isRegister) {
        const checkRes = await fetch('/api/auth/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            phone: fullPhone,
          }),
        });
        if (checkRes.ok) {
          const avail = await checkRes.json();
          if (avail.phoneTaken) {
            throw new Error('Ce numéro de téléphone est déjà associé à un compte. Connectez-vous.');
          }
          if (avail.usernameTaken) {
            throw new Error('Ce nom d\'utilisateur existe déjà.');
          }
          if (avail.emailTaken) {
            throw new Error('Cette adresse email est déjà utilisée.');
          }
        }
      }

      const payload = isRegister
        ? {
            username: username.trim(),
            email: email.trim(),
            phone: fullPhone,
            password,
            referralCode: referralCode.trim() || undefined,
          }
        : { username: username.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      if (data.player.isAdmin && !show2FA) {
        setPendingUser(data);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      onLoginSuccess(data.player, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFACode === '1234' || twoFACode === '123456') {
      onLoginSuccess(pendingUser.player, pendingUser.token);
    } else {
      setError('Code 2FA incorrect (Saisissez 1234 ou 123456 pour le test)');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#171a1c] relative overflow-hidden font-sans select-none">
      
      {/* Top Simple Header */}
      <header className="border-b border-[#2e3438] bg-[#171a1c] px-4 py-3 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center font-black text-2xl tracking-tighter uppercase italic">
          <span className="text-white">FUN</span>
          <span className="text-[#9ce800] bg-[#9ce800]/10 px-1.5 py-0.5 rounded ml-1 border border-[#9ce800]/30 shadow-[0_0_12px_rgba(156,232,0,0.25)]">
            BET
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">
          🔞 21+ Uniquement
        </span>
      </header>

      {/* Main Form Center Box */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md bg-[#222629] border border-[#2e3438] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Logo & Headline */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isRegister ? 'Créer un Compte Joueur' : 'Connexion à FunBet'}
            </h1>
            <p className="text-xs text-zinc-400">
              Jouez en <strong>Mode Démo</strong> (FTB gratuit) ou en <strong>Mode Réel</strong> (CFA)
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 bg-[#171a1c] p-1 rounded-2xl border border-[#2e3438]">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-[#9ce800] text-[#171a1c] shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isRegister
                  ? 'bg-[#9ce800] text-[#171a1c] shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              S'inscrire
            </button>
          </div>

          {!show2FA ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 text-center font-medium">
                  {/* {error} */}
                  {"réseau instable"}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-mono uppercase tracking-wider">
                  {isRegister ? "Nom d'utilisateur" : "Nom d'utilisateur ou téléphone"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: player"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#171a1c] border border-[#2e3438] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#9ce800] text-sm transition-all"
                    required
                  />
                </div>
              </div>

              {isRegister && (
                <>
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-mono uppercase tracking-wider">
                      Adresse Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: contact@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#171a1c] border border-[#2e3438] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#9ce800] text-sm transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone & Country */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-mono uppercase tracking-wider">
                      Numéro Mobile Money
                    </label>
                    <div className="flex gap-2">
                      <div className="relative w-36 shrink-0">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-zinc-500">
                          <Globe className="w-3.5 h-3.5" />
                        </span>
                        <select
                          value={selectedCountryCode}
                          onChange={(e) => setSelectedCountryCode(e.target.value)}
                          className="w-full pl-8 pr-2 py-2.5 bg-[#171a1c] border border-[#2e3438] rounded-xl text-white text-xs focus:outline-none focus:border-[#9ce800] appearance-none transition-all cursor-pointer"
                        >
                          {countries.map((c) => (
                            <option key={c.id} value={c.code} className="bg-[#171a1c] text-white">
                              {c.flag} {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input
                          type="tel"
                          value={phoneVal}
                          onChange={(e) => setPhoneVal(e.target.value)}
                          placeholder="699123456"
                          className="w-full pl-9 pr-4 py-2.5 bg-[#171a1c] border border-[#2e3438] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#9ce800] text-sm transition-all font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Password input */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-mono uppercase tracking-wider">
                  Mot de passe
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#171a1c] border border-[#2e3438] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#9ce800] text-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength progress bar and checklist */}
                {isRegister && password.length > 0 && (
                  <div className="mt-3 p-3 bg-[#171a1c] border border-[#2e3438] rounded-xl space-y-2.5">
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-zinc-400">Robustesse :</span>
                      <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
                    </div>
                    
                    <div className="w-full h-1.5 bg-[#2e3438] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${strength.color}`} 
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 pt-1 border-t border-[#2e3438]">
                      {criteriaList.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px]">
                          {c.met ? (
                            <Check className="w-3 h-3 text-[#9ce800] shrink-0" />
                          ) : (
                            <X className="w-3 h-3 text-zinc-600 shrink-0" />
                          )}
                          <span className={c.met ? 'text-zinc-300' : 'text-zinc-600'}>
                            {c.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password (only for Register) */}
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-mono uppercase tracking-wider">
                    Confirmation du mot de passe
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmez votre mot de passe"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#171a1c] border border-[#2e3438] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#9ce800] text-sm transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Code de parrainage (optionnel) */}
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-mono uppercase tracking-wider">
                    Code de parrainage <span className="text-zinc-500 normal-case">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="ex: FUN-A7K3P"
                    className="w-full px-3.5 py-2.5 bg-[#171a1c] border border-[#2e3438] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#9ce800] text-sm font-mono tracking-widest transition-all"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#9ce800] hover:bg-[#8ad400] text-[#171a1c] rounded-xl font-black text-sm shadow-lg shadow-[#9ce800]/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Connexion en cours...' : isRegister ? "Créer mon Compte" : 'Entrer sur le Casino'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </form>
          ) : (
            /* 2FA Verification for Admin */
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center p-2.5 bg-[#9ce800]/10 rounded-full border border-[#9ce800]/20 mb-2">
                  <ShieldCheck className="w-6 h-6 text-[#9ce800]" />
                </div>
                <h3 className="text-sm font-bold text-white">Validation 2FA requise (Admin)</h3>
                <p className="text-xs text-zinc-400">
                  Saisissez le code temporaire pour accéder à la console de contrôle.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 text-center font-medium">
                  {error}
                </div>
              )}

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value)}
                  placeholder="Code (ex: 1234)"
                  className="w-full text-center tracking-[0.5em] py-3 bg-[#171a1c] border border-[#2e3438] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#9ce800] text-lg font-mono transition-all"
                  required
                  autoFocus
                />
                <p className="text-[10px] text-zinc-500 text-center mt-1.5">
                  Code de test : <strong className="text-[#9ce800] font-mono">1234</strong>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#9ce800] hover:bg-[#8ad400] text-[#171a1c] font-black rounded-xl text-sm transition-colors cursor-pointer"
              >
                Vérifier et Accéder
              </button>

              <button
                type="button"
                onClick={() => { setShow2FA(false); setPendingUser(null); setError(null); }}
                className="w-full py-1 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer text-center block"
              >
                Annuler
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Footer Notice */}
      <footer className="border-t border-[#2e3438] bg-[#171a1c] py-4 text-center text-xs text-zinc-500 font-mono">
        FunBet org © 2026 •  • Jouer avec modération
      </footer>

    </div>
  );
}
