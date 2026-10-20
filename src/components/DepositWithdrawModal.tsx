import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Clock, Check, AlertTriangle, ShieldCheck, Copy, Phone, User, DollarSign, Wallet, Zap, Smartphone, Sparkles } from 'lucide-react';
import { Player, PaymentConfiguration, Transaction } from '../types';
import { sound } from '../utils/audioHaptics';

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  onUpdatePlayer: (updated: Player) => void;
  defaultTab?: 'deposit' | 'withdraw' | 'history';
}

export default function DepositWithdrawModal({
  isOpen,
  onClose,
  player,
  onUpdatePlayer,
  defaultTab = 'deposit',
}: DepositWithdrawModalProps) {
  const [modalTab, setModalTab] = useState<'deposit' | 'withdraw' | 'history'>(defaultTab);
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfiguration[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);

  const [depAmount, setDepAmount] = useState('2000');
  const [depConfigId, setDepConfigId] = useState('');
  const [depTxId, setDepTxId] = useState('');
  const [depPhone, setDepPhone] = useState(player.phone || player.payment_number || '');
  const [depName, setDepName] = useState(player.payment_name || player.username || '');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  // Withdrawal states
  const [witAmount, setWitAmount] = useState('2000');
  const [witMethod, setWitMethod] = useState(player.payment_method || 'MTN Mobile Money');
  const [witPhone, setWitPhone] = useState(player.phone || player.payment_number || '670123456');
  const [witName, setWitName] = useState(player.payment_name || player.username || 'Joueur FunBet');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setModalTab(defaultTab);
      setError(null);
      setSuccessMsg(null);
      fetchPaymentConfigs();
      fetchUserTransactions();
    }
  }, [isOpen, defaultTab]);

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
      const res = await fetch(`/api/wallet/transactions?userId=${encodeURIComponent(player.id)}`);
      if (res.ok) {
        const data = await res.json();
        setTxs(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTxs(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    const amt = Number(depAmount);
    if (isNaN(amt) || amt < 500) {
      setError('Le montant minimum de dépôt est de 500 FCFA.');
      return;
    }
    if (!depTxId.trim()) {
      setError('Veuillez indiquer la référence de transaction reçue après votre transfert.');
      return;
    }
    if (!depPhone.trim()) {
      setError('Veuillez indiquer le numéro utilisé pour le transfert.');
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
          transactionId: depTxId.trim(),
          nom_joueur: depName,
          numero_joueur: depPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la déclaration de dépôt.');
      }

      sound.playClick();
      setSuccessMsg('Demande de dépôt enregistrée. Statut : en attente de validation par l\'administrateur. Votre solde sera crédité une fois approuvée.');
      setDepTxId('');
      setModalTab('history');
      fetchUserTransactions();
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
    if ((player.solde || 0) < amt) {
      setError('Solde insuffisant pour ce retrait.');
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
          numero_joueur: witPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la demande de retrait.');
      }

      if (data.currentBalance !== undefined) {
        onUpdatePlayer({ ...player, solde: data.currentBalance });
      }
      sound.playClick();
      setSuccessMsg('Demande de retrait enregistrée. Statut : en attente de validation par l\'administrateur. Le montant est réservé sur votre solde.');
      setModalTab('history');
      fetchUserTransactions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (!isOpen) return null;

  const activeConfig = paymentConfigs.find(c => c.id === depConfigId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[#171a1c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-[#222629] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#9ce800]/10 border border-[#9ce800]/20 text-[#9ce800]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">Gestion de Caisse Mobile Money</h3>
              <p className="text-[10px] text-zinc-400">Dépôts & retraits en FCFA • Orange Money, MTN MoMo, Wave</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#2c3033] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Dépôt / Retrait / Historique */}
        <div className="flex border-b border-white/5 bg-[#171a1c] p-1.5 gap-1.5">
          <button
            onClick={() => { setModalTab('deposit'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              modalTab === 'deposit'
                ? 'bg-[#9ce800] text-[#171a1c] shadow'
                : 'text-zinc-400 hover:text-white hover:bg-[#222629]'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>Déposer (FCFA)</span>
          </button>

          <button
            onClick={() => { setModalTab('withdraw'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              modalTab === 'withdraw'
                ? 'bg-[#9ce800] text-[#171a1c] shadow'
                : 'text-zinc-400 hover:text-white hover:bg-[#222629]'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Retirer (FCFA)</span>
          </button>

          <button
            onClick={() => { setModalTab('history'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              modalTab === 'history'
                ? 'bg-[#9ce800] text-[#171a1c] shadow'
                : 'text-zinc-400 hover:text-white hover:bg-[#222629]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Historique ({txs.length})</span>
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 mt-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: DEPOSIT — transfert Mobile Money + déclaration (validation admin) */}
          {modalTab === 'deposit' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#222629] border border-white/5 text-[11px] text-zinc-400 leading-relaxed">
                Transférez le montant vers le compte affiché, puis déclarez votre dépôt avec la référence reçue.
                {/* Le solde est crédité <span className="text-white font-semibold">uniquement après validation</span> par l&apos;administration (statut : en attente). */}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  1. Choisissez l&apos;opérateur
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentConfigs.map((cfg) => (
                    <div
                      key={cfg.id}
                      onClick={() => setDepConfigId(cfg.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        depConfigId === cfg.id
                          ? 'bg-[#222629] border-[#9ce800] text-white shadow-md'
                          : 'bg-[#171a1c] border-white/5 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{cfg.moyen_paiement}</div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{cfg.nom_destination}</div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-3">
                {activeConfig && (
                  <div className="bg-[#222629] p-3.5 rounded-2xl border border-white/5 space-y-2 font-mono text-xs">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      Coordonnées de réception
                    </div>
                    <div className="flex items-center justify-between bg-[#171a1c] p-2.5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Numéro de transfert :</span>
                        <span className="text-sm font-bold text-[#9ce800]">{activeConfig.numero_destination}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeConfig.numero_destination, 'phone')}
                        className="px-2.5 py-1 bg-[#222629] hover:bg-[#2c3033] border border-white/10 text-zinc-300 text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedKey === 'phone' ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>
                    {activeConfig.syntaxe_ussd && (
                      <div className="flex items-center justify-between bg-[#171a1c] p-2.5 rounded-xl border border-white/5">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Code de paiement :</span>
                          <span className="text-xs font-bold text-amber-400">{activeConfig.syntaxe_ussd}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activeConfig.syntaxe_ussd || '', 'code')}
                          className="px-2.5 py-1 bg-[#222629] hover:bg-[#2c3033] border border-white/10 text-zinc-300 text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedKey === 'code' ? 'Copié !' : 'Copier'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1 font-mono">2. Montant envoyé (FCFA)</label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {['1000', '2000', '5000', '10000'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDepAmount(val)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                          depAmount === val
                            ? 'bg-[#9ce800] text-[#171a1c] border-[#9ce800]'
                            : 'bg-[#1e2225] text-zinc-300 border-white/5 hover:border-zinc-500'
                        }`}
                      >
                        {Number(val).toLocaleString()} F
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={depAmount}
                    onChange={(e) => setDepAmount(e.target.value)}
                    placeholder="Ex: 5000"
                    min="500"
                    step="100"
                    required
                    className="w-full px-3.5 py-2.5 bg-[#222629] border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#9ce800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1 font-mono">3. Votre numéro Mobile Money</label>
                  <input
                    type="tel"
                    value={depPhone}
                    onChange={(e) => setDepPhone(e.target.value)}
                    placeholder="Ex: 690123456"
                    required
                    className="w-full px-3.5 py-2.5 bg-[#222629] border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#9ce800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1 font-mono">4. Référence de transaction (SMS / reçu)</label>
                  <input
                    type="text"
                    value={depTxId}
                    onChange={(e) => setDepTxId(e.target.value)}
                    placeholder="Ex: TXN123456789 ou MP240816..."
                    required
                    className="w-full px-3.5 py-2.5 bg-[#222629] border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#9ce800]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingDeposit}
                  className="w-full py-3 bg-[#9ce800] hover:bg-[#8ad400] text-[#171a1c] font-black text-sm rounded-xl transition-all shadow-lg shadow-[#9ce800]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                  <span>{submittingDeposit ? 'Envoi...' : 'Soumettre le dépôt (en attente)'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: WITHDRAW */}
          {modalTab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
              <div className="bg-[#222629] p-3.5 rounded-2xl border border-white/5 flex items-center justify-between font-mono text-xs">
                <span className="text-zinc-400">Solde Disponible :</span>
                <span className="font-black text-[#9ce800] text-sm">{(player.solde || 0).toLocaleString()} FCFA</span>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-[11px] text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Les retraits sont traités dans les 48 heures.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1 font-mono">
                  Montant du retrait (FCFA)
                </label>
                <input
                  type="number"
                  value={witAmount}
                  onChange={(e) => setWitAmount(e.target.value)}
                  placeholder="Min: 500 FCFA"
                  min="500"
                  step="100"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#222629] border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#9ce800]"
                />
                <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
                  Frais de traitement : 10% • Réception nette : {Math.round(Number(witAmount || 0) * 0.9).toLocaleString()} FCFA
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1 font-mono">
                  Moyen de Réception
                </label>
                <select
                  value={witMethod}
                  onChange={(e) => setWitMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#222629] border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#9ce800] cursor-pointer"
                >
                  <option value="MTN Mobile Money">MTN Mobile Money</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="Wave">Wave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1 font-mono">
                  Numéro de Téléphone Bénéficiaire
                </label>
                <input
                  type="tel"
                  value={witPhone}
                  onChange={(e) => setWitPhone(e.target.value)}
                  placeholder="Ex: 670123456"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#222629] border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#9ce800]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1 font-mono">
                  Nom & Prénom du Titulaire
                </label>
                <input
                  type="text"
                  value={witName}
                  onChange={(e) => setWitName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#222629] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#9ce800]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingWithdraw}
                className="w-full py-3 bg-[#9ce800] hover:bg-[#8ad400] text-[#171a1c] font-black text-sm rounded-xl transition-all shadow-lg shadow-[#9ce800]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
                <span>{submittingWithdraw ? 'Traitement...' : 'Exécuter le Retrait Immédiat'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: TRANSACTION HISTORY */}
          {modalTab === 'history' && (
            <div className="space-y-2.5 font-mono text-xs">
              {txs.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-1">
                  <p>Aucune transaction enregistrée.</p>
                  <p className="text-[10px]">Vos dépôts et retraits (en attente, approuvés ou refusés) apparaissent ici.</p>
                </div>
              ) : (
                txs.map((t) => {
                  const isDep = t.type === 'deposit';
                  const isSuccess = t.status === 'approved';
                  const isPending = t.status === 'pending';
                  
                  return (
                    <div 
                      key={t.id}
                      className="p-3 bg-[#222629] border border-white/5 rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${
                          isDep ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {isDep ? <ArrowUpRight className="w-4 h-4 stroke-[2.5]" /> : <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />}
                        </div>
                        <div>
                          <div className="font-bold text-white text-[11px]">{t.moyen_paiement}</div>
                          <div className="text-[10px] text-zinc-500">
                            {new Date(t.timestamp).toLocaleDateString('fr-FR')} {new Date(t.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-sm text-white">
                          {isDep ? '+' : '-'}{t.amount.toLocaleString()} F
                        </div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          isSuccess
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : isPending
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}>
                          {isSuccess ? 'Validé' : isPending ? 'En cours' : 'Rejeté'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
