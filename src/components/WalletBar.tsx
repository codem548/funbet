import React, { useState, useEffect, useRef } from 'react';
import { Wallet, LogOut, Gift, RefreshCw, AlertTriangle, UserCheck, ArrowUpRight, ArrowDownLeft, X, Check, Clock, Shield, DollarSign, RefreshCw as LoopIcon, ChevronDown } from 'lucide-react';
import { Player, PaymentConfiguration, Transaction } from '../types';

interface WalletBarProps {
  player: Player;
  onLogout: () => void;
  onUpdatePlayer: (updated: Player) => void;
  isAdminView: boolean;
  onToggleAdminView: () => void;
  playMode: 'REAL' | 'DEMO';
  onTogglePlayMode: (mode: 'REAL' | 'DEMO') => void;
  activeGameId?: string | null;
  onBackToGames?: () => void;
}

export default function WalletBar({ 
  player, 
  onLogout, 
  onUpdatePlayer, 
  isAdminView, 
  onToggleAdminView,
  playMode,
  onTogglePlayMode,
  activeGameId,
  onBackToGames
}: WalletBarProps) {
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Transaction Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfiguration[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);

  // Form states
  const [depAmount, setDepAmount] = useState('');
  const [depConfigId, setDepConfigId] = useState('');
  const [depTxId, setDepTxId] = useState('');
  const [depPhone, setDepPhone] = useState(player.payment_number || '');
  const [depName, setDepName] = useState(player.payment_name || '');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  const [witAmount, setWitAmount] = useState('');
  const [witMethod, setWitMethod] = useState(player.payment_method || 'MTN Mobile Money');
  const [witPhone, setWitPhone] = useState(player.payment_number || '');
  const [witName, setWitName] = useState(player.payment_name || '');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fictifBalance = player.credits_fictifs !== undefined ? player.credits_fictifs : player.credits;
  const realBalance = player.solde !== undefined ? player.solde : 0;
  const realIncome = player.revenu !== undefined ? player.revenu : 0;

  const refreshPlayerProfile = async () => {
    const storedToken = localStorage.getItem('funbet_token');
    if (!storedToken) return;
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        onUpdatePlayer(data.player);
      }
    } catch (e) {
      console.error('Error refreshing player profile:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (showModal) {
      setError(null);
      setSuccessMsg(null);
      refreshPlayerProfile();
      fetchPaymentConfigs();
      fetchUserTransactions();
    }
  }, [showModal]);

  const fetchPaymentConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const res = await fetch('/api/payment-configurations');
      if (res.ok) {
        const data = await res.json();
        setPaymentConfigs(data.paymentConfigurations || []);
        if (data.paymentConfigurations?.length > 0) {
          setDepConfigId(data.paymentConfigurations[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const fetchUserTransactions = async () => {
    setLoadingTxs(true);
    try {
      // For simplicity, we fetch all admin transactions and filter client-side for this user
      const res = await fetch('/api/admin/transactions');
      if (res.ok) {
        const data = await res.json();
        const userTxs = (data.transactions || []).filter((t: Transaction) => t.userId === player.id);
        setTxs(userTxs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTxs(false);
    }
  };

  const handleClaimDaily = async () => {
    setLoadingDaily(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/wallet/claim-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: player.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du claim');
      }
      onUpdatePlayer({ 
        ...player, 
        credits_fictifs: data.credits, 
        credits: data.credits, 
        lastDailyClaim: data.lastDailyClaim 
      });
      setSuccessMsg('Félicitations ! +10 000 FTB de démonstration ajoutés.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoadingDaily(false);
    }
  };

  const handleResetBankrupt = async () => {
    setLoadingReset(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/wallet/reset-bankrupt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: player.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du reset');
      }
      onUpdatePlayer({ 
        ...player, 
        credits_fictifs: data.credits, 
        credits: data.credits 
      });
      setSuccessMsg('Secours activé ! Solde de démonstration restauré à 10 000 FTB.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoadingReset(false);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    const amt = Number(depAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Veuillez saisir un montant valide supérieur à 0.');
      return;
    }
    if (!depTxId.trim()) {
      setError('Veuillez fournir l\'ID de transaction SMS reçu.');
      return;
    }

    const selectedConfig = paymentConfigs.find(c => c.id === depConfigId);
    const method = selectedConfig ? selectedConfig.moyen_paiement : 'Mobile Money';

    setSubmittingDeposit(true);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: player.id,
          amount: amt,
          moyen_paiement: method,
          transactionId: depTxId,
          nom_joueur: depName,
          numero_joueur: depPhone
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la déclaration.');
      }

      setSuccessMsg('Votre déclaration de dépôt a été transmise ! Un administrateur va la valider d\'ici quelques minutes.');
      setDepAmount('');
      setDepTxId('');
      fetchUserTransactions();
      refreshPlayerProfile();
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    const amt = Number(witAmount);
    if (isNaN(amt) || amt < 500) {
      setError('Le montant minimum de retrait est de 500 FCFA.');
      return;
    }
    if (realBalance < amt) {
      setError('Votre solde réel est insuffisant pour ce retrait.');
      return;
    }
    if (!witPhone.trim() || !witName.trim()) {
      setError('Veuillez saisir le numéro et le nom complet de réception.');
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: player.id,
          amount: amt,
          moyen_paiement: witMethod,
          nom_joueur: witName,
          numero_joueur: witPhone
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la demande de retrait.');
      }

      onUpdatePlayer({ ...player, solde: data.currentBalance });
      setSuccessMsg('Demande de retrait enregistrée avec succès ! (10% de frais appliqués. Traitement en cours)');
      setWitAmount('');
      fetchUserTransactions();
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const activeBalanceString = playMode === 'DEMO'
    ? `${fictifBalance.toLocaleString()} FTB`
    : `${realBalance.toLocaleString()} FCFA`;

  return (
    <div ref={dropdownRef} className="fixed top-4 right-4 z-50 select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-[#09090b]/95 border border-density-border hover:border-zinc-700/80 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md transition-all cursor-pointer select-none active:scale-95"
      >
        <div className="h-6 w-6 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center shadow-[0_0_8px_rgba(249,115,22,0.1)]">
          <span className="font-mono text-brand font-bold text-xs uppercase">{player.username.slice(0, 2)}</span>
        </div>
        
        <div className="flex flex-col items-start leading-none gap-0.5">
          <span className="text-[10px] text-zinc-400 font-mono font-medium">{player.username}</span>
          <span className={`text-xs font-mono font-bold ${playMode === 'DEMO' ? 'text-blue-400' : 'text-emerald-400'}`}>
            {activeBalanceString}
          </span>
        </div>

        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-zinc-200' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#09090b]/98 border border-density-border p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200 z-50 text-left">
          
          {/* User info & Role */}
          <div className="flex items-center gap-3 border-b border-density-border pb-3.5">
            <div className="h-10 w-10 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.15)] shrink-0">
              <span className="font-mono text-brand font-bold uppercase text-sm">{player.username.slice(0, 2)}</span>
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-100 truncate max-w-[120px]">{player.username}</span>
                {player.isAdmin && (
                  <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/30 rounded text-[8px] font-mono font-bold text-red-400 uppercase tracking-wider shrink-0">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate">ID: {player.id}</p>
            </div>
          </div>

          {/* Mode switch pills */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Choix du Mode</span>
            
            <div className="grid grid-cols-1 gap-1.5 bg-[#050507] p-1 border border-density-border rounded-xl">
              {/* DEMO mode tab */}
              <button
                onClick={() => { onTogglePlayMode('DEMO'); }}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  playMode === 'DEMO'
                    ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${playMode === 'DEMO' ? 'bg-blue-400 animate-pulse' : 'bg-zinc-500'}`} />
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold">MODE DÉMO</span>
                </div>
                <span className="font-mono font-bold text-[11px]">{fictifBalance.toLocaleString()} FTB</span>
              </button>

              {/* REAL mode tab */}
              <button
                onClick={() => { onTogglePlayMode('REAL'); }}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  playMode === 'REAL'
                    ? 'bg-emerald-600/15 border border-emerald-500/30 text-emerald-400'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${playMode === 'REAL' ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold">MODE RÉEL</span>
                </div>
                <span className="font-mono font-bold text-[11px] text-emerald-400">{realBalance.toLocaleString()} FCFA</span>
              </button>
            </div>
            
            <button
              onClick={refreshPlayerProfile}
              className="mt-1 w-full py-1.5 bg-[#050507] hover:bg-zinc-900 border border-density-border hover:border-zinc-800 text-zinc-400 hover:text-emerald-400 rounded-lg text-[10px] font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-zinc-400'}`} />
              <span>{isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir le solde'}</span>
            </button>
          </div>

          {/* Wallet Actions depending on active mode */}
          <div className="flex flex-col gap-2 pt-2 border-t border-density-border">
            <span className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Transactions & Bonus</span>
            
            {playMode === 'DEMO' ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleClaimDaily}
                  disabled={loadingDaily}
                  className="w-full px-3 py-2.5 bg-brand/10 hover:bg-brand/20 border border-brand/30 hover:border-brand/60 rounded-xl text-brand hover:text-brand-hover text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  title="Recevez 10 000 crédits de démo toutes les 24h"
                >
                  <Gift className="w-4 h-4" />
                  <span>Bonus Quotidien (+10k)</span>
                </button>

                {fictifBalance < 10 && (
                  <button
                    onClick={handleResetBankrupt}
                    disabled={loadingReset}
                    className="w-full px-3 py-2.5 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 hover:border-amber-600/60 rounded-xl text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer animate-pulse transition-all disabled:opacity-50"
                    title="Restaurer à 10 000 si ruiné"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>Secours Ruine</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setShowModal(true); setModalTab('deposit'); setIsOpen(false); }}
                  className="w-full px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-[#09090b] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-emerald-500/15"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Dépôt & Retrait</span>
                </button>

                {realIncome !== 0 && (
                  <div className="px-3 py-2 bg-zinc-950/80 border border-density-border rounded-xl flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">REVENU NET :</span>
                    <span className={`text-[11px] font-mono font-bold ${realIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {realIncome >= 0 ? '+' : ''}{realIncome.toLocaleString()} FCFA
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions at the bottom: Admin & Logout */}
          <div className="flex flex-col gap-1.5 pt-3 border-t border-density-border">
            {player.isAdmin && (
              <button
                onClick={() => { onToggleAdminView(); setIsOpen(false); }}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  isAdminView
                    ? 'bg-[#09090b] hover:bg-zinc-800 text-brand border-density-border shadow-md'
                    : 'bg-brand hover:bg-brand-hover text-[#09090b] border-brand shadow-lg'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{isAdminView ? 'Console Joueur' : "Administration"}</span>
              </button>
            )}

            <button
              onClick={() => { onLogout(); setIsOpen(false); }}
              className="w-full px-3 py-2 bg-[#050507] hover:bg-red-950/10 border border-density-border hover:border-red-900/30 rounded-xl text-zinc-400 hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Quitter</span>
            </button>
          </div>

        </div>
      )}

      {/* Dynamic feedback overlays */}
      {(error || successMsg) && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-lg px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          {error && (
            <div className="p-4 bg-red-950/95 border border-red-800 rounded-2xl text-xs text-red-200 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 p-1 cursor-pointer" type="button">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-emerald-950/95 border border-emerald-800 rounded-2xl text-xs text-emerald-200 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <Gift className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200 p-1 cursor-pointer" type="button">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================
          TRANSACTIONAL MODAL (DEPOSIT/WITHDRAWAL) 
          ========================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#000]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-density-panel border border-density-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-density-border bg-[#09090b]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-md font-bold text-zinc-100">Gestion Compte</h3>
                  <p className="text-[10px] text-zinc-500">Gérez vos dépôts et retraits en crédit réel (FCFA)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-density-border rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-density-border bg-[#050507]">
              <button
                onClick={() => { setModalTab('deposit'); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-3 text-xs font-bold font-mono tracking-wider uppercase border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'deposit'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                Dépôt
              </button>
              <button
                onClick={() => { setModalTab('withdraw'); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-3 text-xs font-bold font-mono tracking-wider uppercase border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'withdraw'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-amber-500" />
                Retrait Rapide
              </button>
              <button
                onClick={() => { setModalTab('history'); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-3 text-xs font-bold font-mono tracking-wider uppercase border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'history'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Clock className="w-4 h-4 text-blue-400" />
                Historique ({txs.length})
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">

              {/* Prominent Real Balance Display inside Deposit/Withdraw interface */}
              <div className="bg-[#09090b] border border-density-border rounded-xl p-4 flex items-center justify-between shadow-inner">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Solde Actuel</p>
                  <p className="text-xl font-mono font-black text-emerald-400">
                    {realBalance.toLocaleString()} <span className="text-xs text-emerald-500 font-bold">FCFA</span>
                  </p>
                </div>
                <button
                  onClick={refreshPlayerProfile}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-density-border rounded-xl text-xs text-zinc-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Rafraîchir le solde"
                  type="button"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-zinc-400'}`} />
                  <span>{isRefreshing ? 'Mise à jour...' : 'Rafraîchir'}</span>
                </button>
              </div>

              {/* High-visibility Error and Success Alert area inside the modal */}
              {(error || successMsg) && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  {error && (
                    <div className="p-3 bg-red-950/85 border border-red-900 rounded-xl text-xs text-red-400 flex items-start gap-2 shadow-xl">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-red-300">Erreur rencontrée</p>
                        <p className="opacity-90">{error}</p>
                      </div>
                    </div>
                  )}
                  {successMsg && (
                    <div className="p-3 bg-emerald-950/85 border border-emerald-900 rounded-xl text-xs text-emerald-400 flex items-start gap-2 shadow-xl">
                      <Gift className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-emerald-300">Opération réussie</p>
                        <p className="opacity-90">{successMsg}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* DEPOSIT FORM */}
              {modalTab === 'deposit' && (
                <div className="space-y-4">
                  {loadingConfigs ? (
                    <div className="py-12 text-center text-xs text-zinc-500 flex items-center justify-center gap-2 font-mono">
                      <LoopIcon className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Chargement des options de paiement...</span>
                    </div>
                  ) : paymentConfigs.length === 0 ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 text-center font-mono">
                      <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                      Aucun moyen de paiement actif configuré par l'administrateur. Veuillez contacter le support ou revoir la console d'administration.
                    </div>
                  ) : (
                    <form onSubmit={handleDepositSubmit} className="space-y-4">
                      
                      {/* Step 1: Instruct USSD manual transfer */}
                      <div className="p-4 bg-zinc-950 border border-density-border rounded-xl space-y-2">
                        <span className="text-[9px] font-mono font-bold uppercase text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                          CONSIGNE DE TRANSFERT
                        </span>
                        
                        {/* Selector of Config */}
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {paymentConfigs.map(cfg => (
                            <button
                              key={cfg.id}
                              type="button"
                              onClick={() => setDepConfigId(cfg.id)}
                              className={`p-2.5 rounded-lg text-left border text-xs cursor-pointer transition-all ${
                                depConfigId === cfg.id
                                  ? 'bg-emerald-500/10 border-emerald-500 text-zinc-100'
                                  : 'bg-[#09090b] border-density-border text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              <p className="font-mono font-bold text-[11px] uppercase text-emerald-400">{cfg.moyen_paiement}</p>
                              <p className="mt-0.5 font-semibold text-[10px] truncate">{cfg.nom_destination}</p>
                              <p className="font-mono text-[9px] opacity-75">{cfg.numero_destination}</p>
                            </button>
                          ))}
                        </div>

                        {/* Selected USSD Info */}
                        {(() => {
                          const activeCfg = paymentConfigs.find(c => c.id === depConfigId);
                          if (!activeCfg) return null;
                          return (
                            <div className="pt-2 border-t border-density-border mt-2 space-y-1">
                              <p className="text-xs font-semibold text-zinc-300">
                                📱 Étape 1 : Effectuez le transfert de votre choix sur ce compte :
                              </p>
                              <div className="bg-[#050507] p-2.5 rounded border border-density-border font-mono text-[11px] space-y-1 text-zinc-400">
                                <p>Opérateur : <span className="font-bold text-zinc-100">{activeCfg.moyen_paiement}</span></p>
                                <p>Numéro Récepteur : <span className="font-bold text-emerald-400">{activeCfg.numero_destination}</span></p>
                                <p>Nom du Destinataire : <span className="font-bold text-zinc-100">{activeCfg.nom_destination}</span></p>
                                {activeCfg.syntaxe_ussd && (
                                  <p>Code USSD de transfert : <span className="font-bold text-amber-400">{activeCfg.syntaxe_ussd}</span></p>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Step 2: Declaration form */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-zinc-300">
                          📨 Étape 2 : Déclarez votre transaction pour vérification administrative :
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-400 uppercase">Montant Transféré (FCFA)</label>
                            <input
                              type="number"
                              value={depAmount}
                              onChange={(e) => setDepAmount(e.target.value)}
                              placeholder="Ex: 5000"
                              className="w-full bg-[#09090b] border border-density-border rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                              required
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-400 uppercase">ID Transaction SMS (Référence)</label>
                            <input
                              type="text"
                              value={depTxId}
                              onChange={(e) => setDepTxId(e.target.value)}
                              placeholder="Ex: Ref: SMS-20261109"
                              className="w-full bg-[#09090b] border border-density-border rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-400 uppercase">Votre Numéro de Téléphone d'envoi</label>
                            <input
                              type="text"
                              value={depPhone}
                              onChange={(e) => setDepPhone(e.target.value)}
                              placeholder="Ex: +225 0707..."
                              className="w-full bg-[#09090b] border border-density-border rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-400 uppercase">Votre Nom complet sur le compte d'envoi</label>
                            <input
                              type="text"
                              value={depName}
                              onChange={(e) => setDepName(e.target.value)}
                              placeholder="Ex: Kouassi Konan"
                              className="w-full bg-[#09090b] border border-density-border rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                              required
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={submittingDeposit}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-[#09090b] font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {submittingDeposit ? (
                            <>
                              <LoopIcon className="w-4 h-4 animate-spin" />
                              <span>Envoi en cours...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Valider ma déclaration de dépôt</span>
                            </>
                          )}
                        </button>
                      </div>

                    </form>
                  )}
                </div>
              )}

              {/* WITHDRAW FORM */}
              {modalTab === 'withdraw' && (
                <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-zinc-300">
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1.5">
                    <span className="text-[9px] font-mono font-bold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                      RÈGLE DES RETRAITS ET FRAIS
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      • Les demandes de retrait sont examinées sous 24h par le service financier.<br />
                      • Des frais administratifs de <span className="font-bold text-amber-400">10%</span> sont prélevés lors de la validation.<br />
                      • Le montant minimum de retrait est fixé à <span className="font-bold text-zinc-100">500 FCFA</span>.
                    </p>
                  </div>

                  {/* Real Balance Display Banner */}
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Votre Solde Réel Disponible</p>
                      <p className="text-[11px] text-zinc-400">Retirable immédiatement</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono font-black text-emerald-400">{realBalance.toLocaleString()} FCFA</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase block">Opérateur de Réception</label>
                      <select
                        value={witMethod}
                        onChange={(e) => setWitMethod(e.target.value)}
                        className="w-full bg-[#09090b] border border-density-border rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                      >
                        <option value="MTN Mobile Money">MTN Mobile Money</option>
                        <option value="Orange Money">Orange Money</option>
                        <option value="Wave">Wave</option>
                        <option value="Moov Money">Moov Money</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase block">Montant Brut de retrait (FCFA)</label>
                      <input
                        type="number"
                        value={witAmount}
                        onChange={(e) => setWitAmount(e.target.value)}
                        placeholder="Ex: 5000"
                        className="w-full bg-[#09090b] border border-density-border rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase block">Numéro de Téléphone Récepteur</label>
                      <input
                        type="text"
                        value={witPhone}
                        onChange={(e) => setWitPhone(e.target.value)}
                        placeholder="Ex: +225 0505..."
                        className="w-full bg-[#09090b] border border-density-border rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase block">Nom Complet Associé au Compte</label>
                      <input
                        type="text"
                        value={witName}
                        onChange={(e) => setWitName(e.target.value)}
                        placeholder="Ex: Koffi Marc"
                        className="w-full bg-[#09090b] border border-density-border rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none"
                        required
                      />
                    </div>

                  </div>

                  {/* Calculations breakdown */}
                  {Number(witAmount) >= 500 && (
                    <div className="p-3 bg-[#09090b] rounded-xl border border-density-border flex justify-between items-center text-xs font-mono">
                      <span className="text-zinc-500">Montant net que vous recevrez :</span>
                      <span className="font-bold text-emerald-400">{(Number(witAmount) * 0.90).toLocaleString()} FCFA</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingWithdraw}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-[#09090b] font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {submittingWithdraw ? (
                      <>
                        <LoopIcon className="w-4 h-4 animate-spin" />
                        <span>Transmission...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft className="w-4 h-4" />
                        <span>Demander ce Retrait Rapide</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TRANSACTIONS HISTORY LOG */}
              {modalTab === 'history' && (
                <div className="space-y-3">
                  {loadingTxs ? (
                    <div className="py-12 text-center text-xs text-zinc-500 flex items-center justify-center gap-2 font-mono">
                      <LoopIcon className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Récupération de vos opérations...</span>
                    </div>
                  ) : txs.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-500 font-mono border border-dashed border-density-border rounded-2xl">
                      Aucune transaction trouvée pour votre compte.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                      {txs.map((t) => (
                        <div 
                          key={t.id} 
                          className="p-3 bg-zinc-950 border border-density-border rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {t.type === 'deposit' ? (
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold uppercase font-mono">
                                  DÉPÔT
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[9px] font-bold uppercase font-mono">
                                  RETRAIT
                                </span>
                              )}
                              <span className="font-mono text-zinc-400 text-[10px]">
                                {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-zinc-300">
                              {t.amount.toLocaleString()} FCFA ({t.moyen_paiement})
                            </div>
                            {t.transactionId && (
                              <p className="text-[10px] text-zinc-500 font-mono">Réf: {t.transactionId}</p>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1.5">
                              {t.status === 'pending' && (
                                <span className="flex items-center gap-1 text-amber-400 font-mono text-[10px] font-semibold bg-amber-400/5 px-2 py-1 rounded border border-amber-400/20">
                                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>En attente</span>
                                </span>
                              )}
                              {t.status === 'approved' && (
                                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px] font-semibold bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/20">
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>Validé</span>
                                </span>
                              )}
                              {t.status === 'rejected' && (
                                <span className="flex items-center gap-1 text-red-400 font-mono text-[10px] font-semibold bg-red-400/5 px-2 py-1 rounded border border-red-400/20">
                                  <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                  <span>Rejeté</span>
                                </span>
                              )}
                            </div>
                            {t.type === 'withdrawal' && t.status === 'approved' && (
                              <p className="text-[10px] text-zinc-500 font-mono mt-1">Montant net payé: {t.netAmount?.toLocaleString()} FCFA</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-density-border bg-[#050507] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Transactions 100% sécurisées
              </span>
              <span>Propulsé par FunBet Live Engine</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
