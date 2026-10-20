import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Settings2, Sliders, UserPlus, FileText, 
  ToggleLeft, ToggleRight, Trash2, Edit2, Plus, 
  RefreshCw, Check, AlertCircle, TrendingUp, ShieldAlert, ShieldCheck,
  Wallet, DollarSign, CheckCircle, XCircle, ArrowUpRight, ArrowDownLeft, X, Globe,
  AlertTriangle, Zap, Play, Lock, Unlock, CheckCircle2, Shield, Activity, Users
} from 'lucide-react';
import { 
  Player, 
  GameConfig, 
  GameRule, 
  GameLog, 
  RuleCondition, 
  RuleAction, 
  PaymentConfiguration, 
  Transaction, 
  EligibleCountry,
  RedFlagAlert,
  RiskManagementSettings
} from '../types';

interface AdminPanelProps {
  adminPlayer: Player;
}

export default function AdminPanel({ adminPlayer }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'games' | 'rules' | 'override' | 'logs' | 'payment_configs' | 'transactions' | 'countries' | 'security' | 'risk' | 'partners'>('dashboard');

  // Partners (Affiliation)
  const [partnersList, setPartnersList] = useState<any[]>([]);
  const [newPartnerUsername, setNewPartnerUsername] = useState('');
  const [newPartnerPassword, setNewPartnerPassword] = useState('');
  const [newPartnerRate, setNewPartnerRate] = useState(20);
  const [creatingPartner, setCreatingPartner] = useState(false);

  // Risk Management State
  const [riskSettings, setRiskSettings] = useState<RiskManagementSettings>({
    maxWinCap: 5000000,
    maxBetLimit: 100000,
    targetRtp: 96.5,
    houseEdge: 3.5,
    maxTreasuryRisk: 5.0,
    dynamicRtpActive: true,
    autoWithdrawLimit: 20000,
    isAutoWithdrawEnabled: false,
  });

  // Red Flags Security Alerts State
  const [redFlags, setRedFlags] = useState<RedFlagAlert[]>([]);
  const [simulatingBot, setSimulatingBot] = useState(false);
  const [botSimType, setBotSimType] = useState<'CLICK_SPEED' | 'MINES_SCRIPT' | 'WIN_STREAK' | 'IP_CLONE'>('CLICK_SPEED');
  
  // Data caches from server
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<GameConfig[]>([]);
  const [rules, setRules] = useState<GameRule[]>([]);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfiguration[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Form states for Rule Editor
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleGameId, setRuleGameId] = useState<'all' | 'mines' | 'crash' | 'wheel' | 'bonanza'>('all');
  const [ruleDesc, setRuleDesc] = useState('');
  const [rulePriority, setRulePriority] = useState(1);
  const [ruleIsActive, setRuleIsActive] = useState(true);
  
  // Condition Inputs
  const [condBalMax, setCondBalMax] = useState<string>('');
  const [condBalMin, setCondBalMin] = useState<string>('');
  const [condLosses, setCondLosses] = useState<string>('');
  const [condIsNew, setCondIsNew] = useState<boolean>(false);
  const [condHourStart, setCondHourStart] = useState<string>('');
  const [condHourEnd, setCondHourEnd] = useState<string>('');
  const [condPlayMode, setCondPlayMode] = useState<'REAL' | 'DEMO' | 'BOTH'>('BOTH');
  
  // Action Inputs
  const [actForceResult, setActForceResult] = useState<'WIN' | 'LOSS' | 'RANDOM'>('WIN');
  const [actMultMin, setActMultMin] = useState<number>(1.5);
  const [actMultMax, setActMultMax] = useState<number>(2.5);

  // Override Manual state
  const [selectedUsername, setSelectedUsername] = useState('');
  const [overrideGameId, setOverrideGameId] = useState<'all' | 'mines' | 'crash' | 'wheel' | 'bonanza'>('all');
  const [overrideForceResult, setOverrideForceResult] = useState<'WIN' | 'LOSS'>('WIN');
  const [overrideMultMin, setOverrideMultMin] = useState<number>(2.0);
  const [overrideMultMax, setOverrideMultMax] = useState<number>(3.0);

  // Form states for Payment Config Editor
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [moyenPaiement, setMoyenPaiement] = useState('MTN Mobile Money');
  const [numeroDestination, setNumeroDestination] = useState('');
  const [nomDestination, setNomDestination] = useState('');
  const [syntaxeUssd, setSyntaxeUssd] = useState('');
  const [isActiveConfig, setIsActiveConfig] = useState(true);

  // Form states for Country Editor
  const [adminCountries, setAdminCountries] = useState<EligibleCountry[]>([]);
  const [editingCountryId, setEditingCountryId] = useState<string | null>(null);
  const [countryName, setCountryName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [countryFlag, setCountryFlag] = useState('');
  const [countryIsActive, setCountryIsActive] = useState(true);

  // Player Editing Modal States
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editSolde, setEditSolde] = useState<number>(0);
  const [editCredits, setEditCredits] = useState<number>(0);
  const [editIsAdmin, setEditIsAdmin] = useState<boolean>(false);
  const [editConsecutiveLosses, setEditConsecutiveLosses] = useState<number>(0);

  const handleOpenEditPlayer = (p: Player) => {
    setEditingPlayer(p);
    setEditSolde(p.solde || 0);
    setEditCredits(p.credits_fictifs !== undefined ? p.credits_fictifs : p.credits);
    setEditIsAdmin(!!p.isAdmin);
    setEditConsecutiveLosses(p.consecutiveLosses || 0);
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;

    try {
      const res = await fetch(`/api/admin/players/${editingPlayer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solde: editSolde,
          credits_fictifs: editCredits,
          isAdmin: editIsAdmin,
          consecutiveLosses: editConsecutiveLosses
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg('success', `Profil et soldes de ${editingPlayer.username} mis à jour avec succès !`);
      setEditingPlayer(null);
      fetchAllData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // Fetch all core datasets from Express backend
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        resPlayers, 
        resGames, 
        resRules, 
        resLogs, 
        resConfigs, 
        resTxs, 
        resCountries,
        resRedFlags,
        resRiskSettings,
        resPartners
      ] = await Promise.all([
        fetch('/api/admin/players'),
        fetch('/api/admin/games'),
        fetch('/api/admin/rules'),
        fetch('/api/admin/logs'),
        fetch('/api/payment-configurations'),
        fetch('/api/admin/transactions'),
        fetch('/api/admin/countries'),
        fetch('/api/admin/red-flags'),
        fetch('/api/admin/risk-settings'),
        fetch('/api/admin/partners'),
      ]);

      const playersData = await resPlayers.json();
      const gamesData = await resGames.json();
      const rulesData = await resRules.json();
      const logsData = await resLogs.json();
      const configsData = await resConfigs.json();
      const txsData = await resTxs.json();
      const countriesData = await resCountries.json();
      const redFlagsData = await resRedFlags.json();
      const riskSettingsData = await resRiskSettings.json();
      const partnersData = await resPartners.json();

      if (resPlayers.ok) setPlayers(playersData.players);
      if (resGames.ok) setGames(gamesData.games);
      if (resRules.ok) setRules(rulesData.rules);
      if (resLogs.ok) setLogs(logsData.logs);
      if (resConfigs.ok) setPaymentConfigs(configsData.paymentConfigurations || []);
      if (resTxs.ok) setTransactions(txsData.transactions || []);
      if (resCountries.ok) setAdminCountries(countriesData.countries || []);
      if (resRedFlags.ok) setRedFlags(redFlagsData.redFlags || []);
      if (resRiskSettings.ok && riskSettingsData.riskSettings) {
        setRiskSettings(riskSettingsData.riskSettings);
      }
      if (resPartners.ok) setPartnersList(Array.isArray(partnersData) ? partnersData : []);
    } catch (e) {
      console.error('Error fetching admin data', e);
    } finally {
      setLoading(false);
    }
  };

  // Anti-Bot & Security Flag Handlers
  const handleFreezeAccount = async (targetId: string, username?: string) => {
    try {
      const res = await fetch(`/api/admin/red-flags/${targetId}/freeze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg('success', data.message || `Compte ${username || 'joueur'} gelé avec succès.`);
      fetchAllData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleUnfreezeAccount = async (targetId: string, username?: string) => {
    try {
      const res = await fetch(`/api/admin/red-flags/${targetId}/unfreeze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg('success', data.message || `Compte ${username || 'joueur'} dégelé.`);
      fetchAllData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/admin/red-flags/${alertId}/resolve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg('success', 'Alerte acquittée et résolue.');
      fetchAllData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/admin/red-flags/${alertId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg('success', 'Alerte supprimée du journal de sécurité.');
      fetchAllData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleSimulateBotAttack = async () => {
    setSimulatingBot(true);
    try {
      const res = await fetch('/api/admin/red-flags/simulate-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: botSimType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg('success', `Alerte de test générée : [${botSimType}] détectée en direct !`);
      fetchAllData();
    } catch (err: any) {
      showMsg('error', err.message);
    } finally {
      setSimulatingBot(false);
    }
  };

  const handleSaveRiskSettings = async () => {
    try {
      const res = await fetch('/api/admin/risk-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(riskSettings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg('success', 'Paramètres de risque et plafonds enregistrés avec succès !');
      fetchAllData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [activeTab]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  // Game active toggle and parameters adjustment
  const handleUpdateGame = async (id: string, updates: Partial<GameConfig>) => {
    try {
      const res = await fetch(`/api/admin/games/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showMsg('success', `Configuration de ${id} mise à jour !`);
      fetchAllData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // Countries CRUD
  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName.trim() || !countryCode.trim()) {
      showMsg('error', 'Le nom et l\'indicatif sont requis.');
      return;
    }

    try {
      const url = editingCountryId 
        ? `/api/admin/countries/${editingCountryId}` 
        : '/api/admin/countries';
      const method = editingCountryId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: countryName.trim(),
          code: countryCode.trim(),
          flag: countryFlag.trim(),
          isActive: countryIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg('success', editingCountryId ? 'Pays mis à jour !' : 'Pays ajouté avec succès !');
      
      // Reset form
      setEditingCountryId(null);
      setCountryName('');
      setCountryCode('');
      setCountryFlag('');
      setCountryIsActive(true);
      
      fetchAllData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleEditCountry = (country: EligibleCountry) => {
    setEditingCountryId(country.id);
    setCountryName(country.name);
    setCountryCode(country.code);
    setCountryFlag(country.flag || '');
    setCountryIsActive(country.isActive);
  };

  const handleDeleteCountry = async (id: string) => {
    setConfirmDialog({
      title: 'Supprimer ce pays ?',
      message: 'Êtes-vous sûr de vouloir retirer ce pays des indicatifs éligibles ? Les utilisateurs ne pourront plus s\'inscrire avec.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/countries/${id}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          showMsg('success', 'Pays supprimé avec succès !');
          setConfirmDialog(null);
          fetchAllData();
        } catch (err: any) {
          showMsg('error', err.message);
          setConfirmDialog(null);
        }
      }
    });
  };

  // Rules CRUD
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleDesc.trim()) {
      showMsg('error', 'La description de la règle est requise.');
      return;
    }

    const conditionJson: RuleCondition = {};
    if (condBalMax) conditionJson.balance_max = Number(condBalMax);
    if (condBalMin) conditionJson.balance_min = Number(condBalMin);
    if (condLosses) conditionJson.consecutive_loss_min = Number(condLosses);
    if (condIsNew) conditionJson.is_new_player = true;
    if (condHourStart && condHourEnd) {
      conditionJson.hour_between = [Number(condHourStart), Number(condHourEnd)];
    }
    if (condPlayMode !== 'BOTH') {
      conditionJson.play_mode = condPlayMode;
    }

    const actionJson: RuleAction = {
      force_result: actForceResult,
      multiplier_range: [actMultMin, actMultMax],
    };

    const rulePayload = {
      gameId: ruleGameId,
      description: ruleDesc,
      conditionJson,
      actionJson,
      priority: Number(rulePriority),
      isActive: ruleIsActive,
    };

    try {
      let res;
      if (editingRuleId) {
        res = await fetch(`/api/admin/rules/${editingRuleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rulePayload),
        });
      } else {
        res = await fetch('/api/admin/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rulePayload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg('success', editingRuleId ? 'Règle modifiée avec succès' : 'Nouvelle règle ajoutée !');
      resetRuleForm();
      fetchAllData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleEditRule = (rule: GameRule) => {
    setEditingRuleId(rule.id);
    setRuleGameId(rule.gameId as any);
    setRuleDesc(rule.description);
    setRulePriority(rule.priority);
    setRuleIsActive(rule.isActive);
    
    // De-structure conditions
    setCondBalMax(rule.conditionJson.balance_max?.toString() || '');
    setCondBalMin(rule.conditionJson.balance_min?.toString() || '');
    setCondLosses(rule.conditionJson.consecutive_loss_min?.toString() || '');
    setCondIsNew(!!rule.conditionJson.is_new_player);
    setCondPlayMode(rule.conditionJson.play_mode || 'BOTH');
    if (rule.conditionJson.hour_between) {
      setCondHourStart(rule.conditionJson.hour_between[0].toString());
      setCondHourEnd(rule.conditionJson.hour_between[1].toString());
    } else {
      setCondHourStart('');
      setCondHourEnd('');
    }

    // De-structure actions
    setActForceResult(rule.actionJson.force_result);
    setActMultMin(rule.actionJson.multiplier_range[0]);
    setActMultMax(rule.actionJson.multiplier_range[1]);
  };

  const handleDeleteRule = (id: string) => {
    setConfirmDialog({
      title: 'Supprimer la règle',
      message: 'Êtes-vous sûr de vouloir supprimer cette règle ?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/rules/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          showMsg('success', 'Règle supprimée de la base de données');
          fetchAllData();
        } catch (err: any) {
          showMsg('error', err.message);
        }
      }
    });
  };

  const resetRuleForm = () => {
    setEditingRuleId(null);
    setRuleGameId('all');
    setRuleDesc('');
    setRulePriority(1);
    setRuleIsActive(true);
    setCondBalMax('');
    setCondBalMin('');
    setCondLosses('');
    setCondIsNew(false);
    setCondHourStart('');
    setCondHourEnd('');
    setCondPlayMode('BOTH');
    setActForceResult('WIN');
    setActMultMin(1.5);
    setActMultMax(2.5);
  };

  // Trigger manual override injection
  const handleInjectOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsername) {
      showMsg('error', "Veuillez sélectionner un nom d'utilisateur");
      return;
    }

    try {
      const res = await fetch('/api/admin/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedUsername.trim(),
          forceResult: overrideForceResult,
          multiplierMin: overrideMultMin,
          multiplierMax: overrideMultMax,
          gameId: overrideGameId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg('success', `Cible verrouillée ! La prochaine partie de ${selectedUsername} donnera un résultat ${overrideForceResult} !`);
      setSelectedUsername('');
      fetchAllData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleClearLogs = () => {
    setConfirmDialog({
      title: 'Purger les logs',
      message: 'Voulez-vous vraiment purger TOUS les logs d\'audit ?',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/logs/clear', { method: 'POST' });
          if (res.ok) {
            showMsg('success', 'Historique des logs vidé.');
            fetchAllData();
          }
        } catch (e) {
          showMsg('error', 'Erreur de purge');
        }
      }
    });
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroDestination.trim() || !nomDestination.trim()) {
      showMsg('error', 'Le numéro et le nom du récepteur sont requis.');
      return;
    }

    const payload = {
      moyen_paiement: moyenPaiement,
      numero_destination: numeroDestination.trim(),
      nom_destination: nomDestination.trim(),
      syntaxe_ussd: syntaxeUssd.trim(),
      isActive: isActiveConfig
    };

    try {
      let res;
      if (editingConfigId) {
        res = await fetch(`/api/admin/payment-configurations/${editingConfigId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/payment-configurations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg('success', editingConfigId ? 'Configuration mise à jour avec succès !' : 'Nouveau moyen de paiement ajouté !');
      resetPaymentConfigForm();
      fetchAllData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleEditPaymentConfig = (cfg: PaymentConfiguration) => {
    setEditingConfigId(cfg.id);
    setMoyenPaiement(cfg.moyen_paiement);
    setNumeroDestination(cfg.numero_destination);
    setNomDestination(cfg.nom_destination);
    setSyntaxeUssd(cfg.syntaxe_ussd || '');
    setIsActiveConfig(cfg.isActive);
  };

  const handleDeletePaymentConfig = (id: string) => {
    setConfirmDialog({
      title: 'Supprimer le moyen de paiement',
      message: 'Êtes-vous sûr de vouloir supprimer cette configuration de paiement ?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/payment-configurations/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          showMsg('success', 'Configuration de paiement supprimée !');
          fetchAllData();
        } catch (err: any) {
          showMsg('error', err.message);
        }
      }
    });
  };

  const resetPaymentConfigForm = () => {
    setEditingConfigId(null);
    setMoyenPaiement('MTN Mobile Money');
    setNumeroDestination('');
    setNomDestination('');
    setSyntaxeUssd('');
    setIsActiveConfig(true);
  };

  const handleApproveTransaction = (id: string) => {
    setConfirmDialog({
      title: 'Approuver la transaction',
      message: 'Voulez-vous vraiment APPROUVER cette transaction ? Les fonds seront crédités au joueur.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/transactions/${id}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          showMsg('success', 'Transaction APPROUVÉE avec succès ! Les fonds ont été crédités.');
          fetchAllData();
        } catch (err: any) {
          showMsg('error', err.message);
        }
      }
    });
  };

  const handleRejectTransaction = (id: string) => {
    setConfirmDialog({
      title: 'Rejeter la transaction',
      message: 'Voulez-vous vraiment REJETER cette transaction ?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/transactions/${id}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected' })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          showMsg('success', 'Transaction REJETÉE.');
          fetchAllData();
        } catch (err: any) {
          showMsg('error', err.message);
        }
      }
    });
  };

  // Math metrics for Dashboard
  const totalCirculatingCredits = players.reduce((sum, p) => sum + (p.credits_fictifs !== undefined ? p.credits_fictifs : p.credits), 0);
  const totalCirculatingReal = players.reduce((sum, p) => sum + (p.solde || 0), 0);

  // Real mode metrics
  const realLogs = logs.filter(l => l.mode === 'REAL');
  const realBet = realLogs.reduce((sum, l) => sum + l.bet, 0);
  const realPayout = realLogs.reduce((sum, l) => sum + l.payout, 0);
  const realCasinoRtp = realBet > 0 ? (realPayout / realBet) * 100 : 0;
  const realNetGains = realBet - realPayout;

  // Demo mode metrics
  const demoLogs = logs.filter(l => l.mode !== 'REAL');
  const demoBet = demoLogs.reduce((sum, l) => sum + l.bet, 0);
  const demoPayout = demoLogs.reduce((sum, l) => sum + l.payout, 0);
  const demoCasinoRtp = demoBet > 0 ? (demoPayout / demoBet) * 100 : 0;
  const demoNetGains = demoBet - demoPayout;

  return (
    <div className="bg-density-panel border border-density-border rounded-2xl p-6 shadow-xl max-w-7xl mx-auto font-sans">
      
      {/* Admin Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-density-border pb-5 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-brand" />
            Console d'Administration Globale
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Gérez les conditions de jeu, configurez le moteur de règles, injectez des forçages manuels, et étudiez le RTP réel.
          </p>
        </div>
        <button
          onClick={fetchAllData}
          disabled={loading}
          className="px-3.5 py-1.5 bg-[#09090b] hover:bg-zinc-850 border border-density-border rounded-xl text-xs font-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand ${loading ? 'animate-spin' : ''}`} />
          <span>Rafraîchir les données</span>
        </button>
      </div>

      {/* Global Alert messages banner */}
      {msg && (
        <div className={`p-4 rounded-xl text-xs font-medium mb-6 border flex items-center gap-2.5 shadow-md ${
          msg.type === 'success' 
            ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' 
            : 'bg-red-950/20 border-red-900/50 text-red-400'
        }`}>
          {msg.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex flex-wrap items-center gap-2 border-b border-density-border pb-4 mb-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'dashboard'
              ? 'bg-brand text-[#09090b] shadow-lg shadow-brand/10'
              : 'bg-[#09090b] hover:bg-zinc-800 border border-density-border text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tableau de Bord RTP</span>
        </button>

        <button
          onClick={() => setActiveTab('games')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'games'
              ? 'bg-brand text-[#09090b] shadow-lg shadow-brand/10'
              : 'bg-[#09090b] hover:bg-zinc-800 border border-density-border text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Gestion des Jeux</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'bg-brand text-[#09090b] shadow-lg shadow-brand/10'
              : 'bg-[#09090b] hover:bg-zinc-800 border border-density-border text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Moteur de Règles</span>
        </button>

        <button
          onClick={() => setActiveTab('override')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'override'
              ? 'bg-brand text-[#09090b] shadow-lg shadow-brand/10'
              : 'bg-[#09090b] hover:bg-zinc-800 border border-density-border text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Forçage Manuel</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-brand text-[#09090b] shadow-lg shadow-brand/10'
              : 'bg-[#09090b] hover:bg-zinc-800 border border-density-border text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit des Logs de Jeu</span>
        </button>

        <button
          onClick={() => setActiveTab('payment_configs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'payment_configs'
              ? 'bg-brand text-[#09090b] shadow-lg shadow-brand/10'
              : 'bg-[#09090b] hover:bg-zinc-800 border border-density-border text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Comptes Récepteurs</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 relative ${
            activeTab === 'transactions'
              ? 'bg-brand text-[#09090b] shadow-lg shadow-brand/10'
              : 'bg-[#09090b] hover:bg-zinc-800 border border-density-border text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Dépôts / Retraits</span>
          {transactions.filter(t => t.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
              {transactions.filter(t => t.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('countries')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'countries'
              ? 'bg-brand text-[#09090b] shadow-lg shadow-brand/10'
              : 'bg-[#09090b] hover:bg-zinc-800 border border-density-border text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Pays Éligibles</span>
        </button>

        <button
          onClick={() => setActiveTab('risk')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'risk'
              ? 'bg-brand text-[#09090b] shadow-lg shadow-brand/10'
              : 'bg-[#09090b] hover:bg-zinc-800 border border-density-border text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Gestion Risque & RTP</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 relative ${
            activeTab === 'security'
              ? 'bg-brand text-[#09090b] shadow-lg shadow-brand/10'
              : 'bg-[#09090b] hover:bg-zinc-800 border border-density-border text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>Sécurité & Red Flags</span>
          {redFlags.filter(r => r.status === 'FLAGGED').length > 0 && (
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping absolute top-1 right-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'partners'
              ? 'bg-brand text-[#09090b] shadow-lg shadow-brand/10'
              : 'bg-[#09090b] hover:bg-zinc-800 border border-density-border text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4 text-[#9ce800]" />
          <span>Partenaires</span>
        </button>
      </div>

      {/* --- TAB CONTENT: DASHBOARD --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Bento Stats Row - Mode Réel */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Statistiques Financières - Mode Réel (FCFA)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#09090b] border border-emerald-950/40 p-4 rounded-2xl">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Soldes Réels en circulation</p>
                <h3 className="text-2xl font-mono font-bold text-emerald-400 mt-1">{totalCirculatingReal.toLocaleString()} FCFA</h3>
                <p className="text-[10px] text-zinc-500 mt-1">Total déposé par les joueurs</p>
              </div>

              <div className="bg-[#09090b] border border-emerald-950/40 p-4 rounded-2xl">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Mises Réelles Totales</p>
                <h3 className="text-2xl font-mono font-bold text-zinc-100 mt-1">{realBet.toLocaleString()} FCFA</h3>
                <p className="text-[10px] text-zinc-500 mt-1">{realLogs.length} parties réelles jouées</p>
              </div>

              <div className="bg-[#09090b] border border-emerald-950/40 p-4 rounded-2xl">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">RTP Réel Global</p>
                <h3 className={`text-2xl font-mono font-bold mt-1 ${realCasinoRtp > 95 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {realCasinoRtp.toFixed(1)}%
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">Redistribution réelle</p>
              </div>

              <div className="bg-[#09090b] border border-emerald-950/40 p-4 rounded-2xl">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Bénéfices Réels Casino</p>
                <h3 className={`text-2xl font-mono font-bold mt-1 ${realNetGains >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {realNetGains.toLocaleString()} FCFA
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">Total profit net réel</p>
              </div>
            </div>
          </div>

          {/* Bento Stats Row - Crédits bonus */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-zinc-600" />
              Statistiques crédits bonus (FTB)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#09090b] border border-density-border p-4 rounded-2xl">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Crédits Démo en circulation</p>
                <h3 className="text-2xl font-mono font-bold text-brand mt-1">{totalCirculatingCredits.toLocaleString()} FTB</h3>
                <p className="text-[10px] text-zinc-500 mt-1">Total détenu par les joueurs</p>
              </div>

              <div className="bg-[#09090b] border border-density-border p-4 rounded-2xl">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Mises Démo Totales</p>
                <h3 className="text-2xl font-mono font-bold text-zinc-100 mt-1">{demoBet.toLocaleString()} FTB</h3>
                <p className="text-[10px] text-zinc-500 mt-1">{demoLogs.length} parties démo jouées</p>
              </div>

              <div className="bg-[#09090b] border border-density-border p-4 rounded-2xl">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">RTP Démo Global</p>
                <h3 className={`text-2xl font-mono font-bold mt-1 ${demoCasinoRtp > 100 ? 'text-red-400' : 'text-zinc-400'}`}>
                  {demoCasinoRtp.toFixed(1)}%
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">Redistribution démo</p>
              </div>

              <div className="bg-[#09090b] border border-density-border p-4 rounded-2xl">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Bénéfices Fictifs Casino</p>
                <h3 className={`text-2xl font-mono font-bold mt-1 ${demoNetGains >= 0 ? 'text-zinc-400' : 'text-red-400'}`}>
                  {demoNetGains.toLocaleString()} FTB
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">Total profit net fictif</p>
              </div>
            </div>
          </div>

          {/* Table: Registered Players */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-200">Liste des Joueurs Enregistrés ({players.length})</h3>
              <p className="text-[11px] text-zinc-500">Cliquez sur <Edit2 className="w-3 h-3 inline-block" /> pour ajuster les soldes ou modifier le statut d'un joueur.</p>
            </div>
            <div className="overflow-x-auto bg-[#09090b] border border-density-border rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-density-border text-zinc-400 bg-zinc-900/20">
                    <th className="p-3">Username</th>
                    <th className="p-3 text-emerald-400">Solde Réel (FCFA)</th>
                    <th className="p-3 text-brand">Solde Virtuel (FTB)</th>
                    <th className="p-3">Total Misé</th>
                    <th className="p-3">Total Gagné</th>
                    <th className="p-3 text-center">Pertes de suite</th>
                    <th className="p-3 text-center">Type</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-density-border/60 font-mono text-zinc-300">
                  {players.map((p) => (
                    <tr key={p.id} className={`hover:bg-zinc-900/10 ${p.isFrozen ? 'bg-red-950/10' : ''}`}>
                      <td className="p-3 font-semibold text-zinc-100">
                        <div className="flex items-center gap-1.5">
                          <span>{p.username}</span>
                          {p.isFrozen && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-950/60 border border-red-800/80 text-red-400 rounded text-[9px] font-mono font-bold">
                              <Lock className="w-2.5 h-2.5" /> GELÉ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-emerald-400 font-bold">{(p.solde || 0).toLocaleString()} FCFA</td>
                      <td className="p-3 text-brand">{(p.credits_fictifs !== undefined ? p.credits_fictifs : p.credits).toLocaleString()} FTB</td>
                      <td className="p-3 text-zinc-500">{p.totalBet.toLocaleString()}</td>
                      <td className="p-3 text-zinc-500">{p.totalWin.toLocaleString()}</td>
                      <td className="p-3 text-center text-red-400">{p.consecutiveLosses}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.isAdmin ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {p.isAdmin ? 'ADMIN' : 'JOUEUR'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {p.isFrozen ? (
                            <button
                              onClick={() => handleUnfreezeAccount(p.id, p.username)}
                              className="p-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded-lg text-emerald-400 cursor-pointer transition-colors"
                              title="Dégeler le compte"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFreezeAccount(p.id, p.username)}
                              className="p-1.5 bg-zinc-900 hover:bg-red-950/80 border border-density-border hover:border-red-800 rounded-lg text-zinc-400 hover:text-red-400 cursor-pointer transition-colors"
                              title="Geler ce compte pour sécurité"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditPlayer(p)}
                            className="p-1.5 bg-[#09090b] hover:bg-zinc-850 border border-density-border rounded-lg text-zinc-400 hover:text-brand cursor-pointer transition-colors"
                            title="Ajuster les soldes et modifier le statut"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {players.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-zinc-500">Aucun joueur enregistré pour le moment.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB CONTENT: GESTION JEUX --- */}
      {activeTab === 'games' && (
        <div className="space-y-6">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Configurez les contraintes financières de chaque jeu ainsi que leur taux cible de redistribution (RTP global).
            Si le RTP réel s'écarte de la cible, le moteur de jeu ajustera automatiquement la probabilité pour ramener le RTP vers la valeur cible.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((g) => {
              // Calculate RTP for this specific game
              const gameLogs = logs.filter(l => l.gameId === g.id);
              const gBet = gameLogs.reduce((s, curr) => s + curr.bet, 0);
              const gWin = gameLogs.reduce((s, curr) => s + curr.payout, 0);
              const gameRtpReal = gBet > 0 ? (gWin / gBet) * 100 : 0;

              return (
                <div key={g.id} className="bg-[#09090b] border border-density-border p-5 rounded-2xl space-y-4">
                  
                  {/* Game title with status indicator toggle */}
                  <div className="flex items-center justify-between border-b border-density-border pb-3">
                    <div>
                      <h3 className="text-md font-bold text-zinc-100 flex items-center gap-1.5">
                        {g.name}
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono">ID: {g.id}</p>
                    </div>

                    <button
                      onClick={() => handleUpdateGame(g.id, { isActive: !g.isActive })}
                      className="cursor-pointer text-zinc-400 hover:text-zinc-200 transition-colors"
                      title={g.isActive ? 'Désactiver le jeu' : 'Activer le jeu'}
                    >
                      {g.isActive ? (
                        <div className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-semibold">
                          <span>ACTIF</span>
                          <ToggleRight className="w-5 h-5 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-red-950/40 border border-red-900/50 text-red-400 px-3 py-1 rounded-full text-[10px] font-semibold">
                          <span>INACTIF</span>
                          <ToggleLeft className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Mise Min</label>
                      <input
                        type="number"
                        value={g.minBet}
                        onChange={(e) => handleUpdateGame(g.id, { minBet: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Mise Max</label>
                      <input
                        type="number"
                        value={g.maxBet}
                        onChange={(e) => handleUpdateGame(g.id, { maxBet: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">RTP Cible (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={g.rtpGlobal}
                        onChange={(e) => handleUpdateGame(g.id, { rtpGlobal: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                      />
                    </div>
                  </div>

                  {/* Realtime stats for this game */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono border-t border-density-border/50">
                    <div className="text-zinc-500">Mises totales : <strong className="text-zinc-300">{gBet.toLocaleString()} FTB</strong></div>
                    <div className="text-zinc-500">RTP Réel Actuel : <strong className={gameRtpReal > g.rtpGlobal ? 'text-red-400' : 'text-emerald-400'}>{gameRtpReal.toFixed(1)}%</strong></div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* --- TAB CONTENT: RULES ENGINE --- */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Side: Rules list */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-200">Règles Actives en Base ({rules.length})</h3>
                <button
                  onClick={resetRuleForm}
                  className="px-2.5 py-1 bg-brand/10 border border-brand/20 rounded-lg text-[10px] font-mono text-brand hover:bg-brand/20 cursor-pointer"
                >
                  + Nouvelle Règle
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {rules.map((rule) => (
                  <div 
                    key={rule.id} 
                    className={`p-4 bg-[#09090b] border rounded-xl space-y-2 relative transition-all ${
                      editingRuleId === rule.id ? 'border-brand shadow-md shadow-brand/5' : 'border-density-border hover:border-zinc-700'
                    }`}
                  >
                    {/* Badge and action row */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[9px] font-mono text-zinc-300">
                          Priorité {rule.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold border ${
                          rule.gameId === 'all' ? 'bg-zinc-900 text-zinc-400 border-zinc-800' : 'bg-brand/10 text-brand border-brand/20'
                        }`}>
                          Jeu: {rule.gameId.toUpperCase()}
                        </span>
                        {rule.isActive ? (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded text-[9px] font-mono">ACTIF</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-950 text-red-400 rounded text-[9px] font-mono">INACTIF</span>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-brand cursor-pointer transition-colors"
                          title="Modifier la règle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-400 cursor-pointer transition-colors"
                          title="Supprimer la règle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Rule Description */}
                    <h4 className="text-xs font-bold text-zinc-100">{rule.description}</h4>

                    {/* Conditions and Actions breakdown */}
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono pt-1.5 border-t border-density-border/40">
                      <div>
                        <p className="text-zinc-500 uppercase font-semibold">Conditions :</p>
                        <ul className="text-zinc-300 space-y-0.5 mt-1 list-disc list-inside">
                          {Object.keys(rule.conditionJson).length === 0 ? (
                            <li className="text-zinc-500 italic">Sans conditions (toujours valide)</li>
                          ) : (
                            Object.entries(rule.conditionJson).map(([k, v]) => (
                              <li key={k}>
                                {k}: <strong className="text-zinc-100">{JSON.stringify(v)}</strong>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-zinc-500 uppercase font-semibold">Action Forcée :</p>
                        <div className="mt-1 space-y-0.5 text-zinc-300">
                          <div>Résultat : <strong className={`text-xs ${
                            rule.actionJson.force_result === 'WIN' ? 'text-emerald-400' : rule.actionJson.force_result === 'LOSS' ? 'text-red-400' : 'text-zinc-400'
                          }`}>{rule.actionJson.force_result}</strong></div>
                          <div>Range Multi : <strong className="text-brand font-bold">[{rule.actionJson.multiplier_range.join(', ')}]</strong></div>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
                {rules.length === 0 && (
                  <p className="text-xs text-zinc-500 italic text-center p-8">Aucune règle active enregistrée.</p>
                )}
              </div>

            </div>

            {/* Right Side: Form Creator/Editor */}
            <div className="lg:col-span-5 bg-[#09090b] border border-density-border p-5 rounded-2xl">
              <form onSubmit={handleSaveRule} className="space-y-4">
                <div className="flex items-center justify-between border-b border-density-border pb-2 mb-2">
                  <h3 className="text-sm font-bold text-zinc-100">
                    {editingRuleId ? 'Modifier la Règle' : 'Créer une Règle de Forçage'}
                  </h3>
                  {editingRuleId && (
                    <button
                      type="button"
                      onClick={resetRuleForm}
                      className="text-[10px] text-zinc-500 hover:text-zinc-400 cursor-pointer"
                    >
                      Annuler
                    </button>
                  )}
                </div>

                {/* Desc */}
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Description explicative</label>
                  <input
                    type="text"
                    value={ruleDesc}
                    onChange={(e) => setRuleDesc(e.target.value)}
                    placeholder="Ex: Si le joueur perd beaucoup, donner un boost"
                    className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                    required
                  />
                </div>

                {/* Game & Priority & Active Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Jeu Cible</label>
                    <select
                      value={ruleGameId}
                      onChange={(e: any) => setRuleGameId(e.target.value)}
                      className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-brand/50 text-xs cursor-pointer"
                    >
                      <option value="all">Tous (all)</option>
                      <option value="mines">Mines</option>
                      <option value="crash">Crash</option>
                      <option value="wheel">Crazy Spin</option>
                      <option value="bonanza">Sweet Bonanza</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Priorité</label>
                    <input
                      type="number"
                      value={rulePriority}
                      onChange={(e) => setRulePriority(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                    />
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Statut</label>
                    <button
                      type="button"
                      onClick={() => setRuleIsActive(!ruleIsActive)}
                      className="text-xs font-semibold py-1.5 px-3 rounded-lg border cursor-pointer w-full text-center transition-colors mt-0.5"
                    >
                      {ruleIsActive ? (
                        <span className="text-emerald-400 bg-emerald-950/20 border-emerald-900/40">Actif</span>
                      ) : (
                        <span className="text-red-400 bg-red-950/20 border-red-900/40">Inactif</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Conditions (Accordion header) */}
                <div className="border-t border-density-border/40 pt-3 space-y-3">
                  <span className="text-[10px] font-bold text-brand font-mono uppercase tracking-widest">
                    Conditions requises pour le déclenchement
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Solde Joueur Max</label>
                      <input
                        type="number"
                        placeholder="Ex: 1000"
                        value={condBalMax}
                        onChange={(e) => setCondBalMax(e.target.value)}
                        className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Solde Joueur Min</label>
                      <input
                        type="number"
                        placeholder="Ex: 50"
                        value={condBalMin}
                        onChange={(e) => setCondBalMin(e.target.value)}
                        className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Pertes de suite Min</label>
                      <input
                        type="number"
                        placeholder="Ex: 5"
                        value={condLosses}
                        onChange={(e) => setCondLosses(e.target.value)}
                        className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Mode de jeu cible</label>
                      <select
                        value={condPlayMode}
                        onChange={(e: any) => setCondPlayMode(e.target.value)}
                        className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-brand/50 text-xs cursor-pointer font-mono"
                      >
                        <option value="BOTH">Tous les modes (BOTH)</option>
                        <option value="REAL">Réel uniquement (REAL)</option>
                        <option value="DEMO">Démo uniquement (DEMO)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="isNewCheck"
                        checked={condIsNew}
                        onChange={(e) => setCondIsNew(e.target.checked)}
                        className="w-4 h-4 bg-zinc-900 border-zinc-800 rounded text-brand focus:ring-brand focus:ring-opacity-25"
                      />
                      <label htmlFor="isNewCheck" className="text-[10px] font-medium text-zinc-300 font-mono select-none">Nouveau Joueur</label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Horaire Début (0-23)</label>
                      <input
                        type="number"
                        placeholder="Ex: 20"
                        value={condHourStart}
                        onChange={(e) => setCondHourStart(e.target.value)}
                        className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Horaire Fin (0-23)</label>
                      <input
                        type="number"
                        placeholder="Ex: 22"
                        value={condHourEnd}
                        onChange={(e) => setCondHourEnd(e.target.value)}
                        className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Output */}
                <div className="border-t border-density-border/40 pt-3 space-y-3">
                  <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-widest">
                    Action de forçage appliquée
                  </span>

                  <div>
                    <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1 font-semibold">Forcer le Résultat</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['WIN', 'LOSS', 'RANDOM'].map((opt: any) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setActForceResult(opt)}
                          className={`py-1.5 text-xs font-mono rounded-lg border cursor-pointer transition-colors ${
                            actForceResult === opt
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-bold'
                              : 'bg-zinc-900 hover:bg-zinc-800 border-density-border text-zinc-500'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Multiplicateur Min</label>
                      <input
                        type="number"
                        step="0.1"
                        value={actMultMin}
                        onChange={(e) => setActMultMin(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">Multiplicateur Max</label>
                      <input
                        type="number"
                        step="0.1"
                        value={actMultMax}
                        onChange={(e) => setActMultMax(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand hover:bg-brand-hover text-[#09090b] font-extrabold rounded-xl text-xs shadow-md shadow-brand/10 cursor-pointer transition-colors"
                >
                  {editingRuleId ? 'Enregistrer les Modifications' : 'Créer la règle active'}
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* --- TAB CONTENT: MANUAL OVERRIDE --- */}
      {activeTab === 'override' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          
          <div className="bg-[#09090b] border border-density-border p-6 rounded-2xl space-y-4">
            
            <div className="text-center space-y-1">
              <ShieldAlert className="w-10 h-10 text-brand mx-auto animate-pulse" />
              <h3 className="text-md font-bold text-zinc-100">Forcer le prochain résultat d'un joueur</h3>
              <p className="text-xs text-zinc-500 max-w-[400px] mx-auto">
                Choisissez un joueur actif. Configurez précisément l'issue de sa prochaine partie. 
                Une règle temporaire à priorité absolue sera injectée et supprimée immédiatement après sa partie.
              </p>
            </div>

            <form onSubmit={handleInjectOverride} className="space-y-4 pt-3">
              
              {/* Select target player */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1.5">
                  1. Choisir le joueur cible
                </label>
                <select
                  value={selectedUsername}
                  onChange={(e) => setSelectedUsername(e.target.value)}
                  className="w-full bg-zinc-900 border border-density-border rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-brand/50 text-xs cursor-pointer font-mono"
                  required
                >
                  <option value="">-- Sélectionnez un joueur --</option>
                  {players.filter(p => !p.isAdmin).map((p) => (
                    <option key={p.id} value={p.username}>
                      {p.username} (Solde : {p.credits.toLocaleString()} FTB)
                    </option>
                  ))}
                </select>
                {players.filter(p => !p.isAdmin).length === 0 && (
                  <p className="text-[10px] text-amber-500 mt-1 font-mono">
                    ⚠️ Aucun joueur standard trouvé en base. Ouvrez un autre navigateur/onglet ou connectez un utilisateur fictif.
                  </p>
                )}
              </div>

              {/* Select Game Cible */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1.5">
                  2. Limiter au jeu spécifique (facultatif)
                </label>
                <select
                  value={overrideGameId}
                  onChange={(e: any) => setOverrideGameId(e.target.value)}
                  className="w-full bg-zinc-900 border border-density-border rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-brand/50 text-xs cursor-pointer font-mono"
                >
                  <option value="all">N'importe quel jeu (all)</option>
                  <option value="mines">Mines uniquement</option>
                  <option value="crash">Crash uniquement</option>
                  <option value="wheel">Crazy Spin uniquement</option>
                  <option value="bonanza">Sweet Bonanza uniquement</option>
                </select>
              </div>

              {/* Force Outcome */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1.5">
                  3. Résultat forcé de la prochaine partie
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'WIN', label: 'VICTOIRE FORCÉE', desc: 'Le joueur gagne sa mise', color: 'border-emerald-500/40 text-emerald-400' },
                    { val: 'LOSS', label: 'PERTE FORCÉE', desc: 'Le joueur explose ou perd', color: 'border-red-500/40 text-red-400' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setOverrideForceResult(opt.val as any)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        overrideForceResult === opt.val
                          ? `${opt.color} bg-zinc-900 ring-2 ring-brand/20`
                          : 'bg-zinc-900 border-zinc-800/80 text-zinc-500'
                      }`}
                    >
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[10px] text-zinc-500 leading-none mt-1 font-sans">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiplier configuration */}
              {overrideForceResult === 'WIN' && (
                <div className="grid grid-cols-2 gap-4 bg-zinc-900/40 p-4 border border-density-border rounded-xl">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">
                      Multiplicateur Min
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.1"
                      value={overrideMultMin}
                      onChange={(e) => setOverrideMultMin(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1">
                      Multiplicateur Max
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.1"
                      value={overrideMultMax}
                      onChange={(e) => setOverrideMultMax(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-density-border rounded-lg p-2 font-mono text-zinc-100 focus:outline-none focus:border-brand/50 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Form submit */}
              <button
                type="submit"
                className="w-full py-3 bg-brand hover:bg-brand-hover text-[#09090b] rounded-xl font-extrabold text-xs shadow-lg shadow-brand/10 cursor-pointer transition-colors"
              >
                Infecter et Forcer le Prochain Résultat
              </button>

            </form>

          </div>

        </div>
      )}

      {/* --- TAB CONTENT: AUDIT LOGS --- */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-200">Rapports d'Audit de chaque Tour</h3>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Vérifiez précisément quelle règle s'est déclenchée lors de chaque partie.</p>
            </div>
            <button
              onClick={handleClearLogs}
              className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/50 rounded-xl text-red-400 text-xs font-mono cursor-pointer flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider l'historique</span>
            </button>
          </div>

          <div className="overflow-x-auto bg-[#09090b] border border-density-border rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-density-border text-zinc-400 bg-zinc-900/40">
                  <th className="p-3">Horodatage</th>
                  <th className="p-3">Joueur</th>
                  <th className="p-3">Jeu</th>
                  <th className="p-3">Mise</th>
                  <th className="p-3">Résultat</th>
                  <th className="p-3">Multiplicateur</th>
                  <th className="p-3">Payout</th>
                  <th className="p-3">Règle de gestion appliquée & explication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-density-border/40 font-mono text-zinc-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/10">
                    <td className="p-3 text-[10px] text-zinc-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-semibold text-zinc-200">{log.username}</td>
                    <td className="p-3 text-zinc-400 uppercase text-[10px]">{log.gameId}</td>
                    <td className="p-3 text-zinc-400">{log.bet.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.result === 'WIN' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                      }`}>
                        {log.result}
                      </span>
                    </td>
                    <td className="p-3 text-brand font-bold">{log.multiplier.toFixed(2)}x</td>
                    <td className="p-3 text-emerald-400 font-bold">{log.payout.toLocaleString()}</td>
                    <td className="p-3 text-zinc-400 max-w-[300px] truncate" title={log.ruleAppliedDesc || 'RTP standard'}>
                      {log.ruleAppliedDesc ? (
                        <span className="text-brand/90 text-[11px] font-semibold flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-brand shrink-0" />
                          {log.ruleAppliedDesc}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-[10px] italic">Automatique (RTP standard)</span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-zinc-500 italic">Aucune partie n'a encore été jouée sur la plateforme.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* --- TAB CONTENT: PAYMENT CONFIGURATIONS --- */}
      {activeTab === 'payment_configs' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Form Column */}
            <div className="w-full lg:w-1/3 bg-[#09090b] border border-density-border p-5 rounded-2xl space-y-4 h-fit">
              <h3 className="text-sm font-bold text-zinc-200">
                {editingConfigId ? 'Modifier un moyen de paiement' : 'Créer un moyen de paiement'}
              </h3>
              <form onSubmit={handleSavePaymentConfig} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Moyen de paiement</label>
                  <select
                    value={moyenPaiement}
                    onChange={(e) => setMoyenPaiement(e.target.value)}
                    className="w-full bg-[#050507] border border-density-border rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-brand/40"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                    <option value="Orange Money">Orange Money</option>
                    <option value="Wave">Wave</option>
                    <option value="Moov Money">Moov Money</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Numéro Récepteur</label>
                  <input
                    type="text"
                    value={numeroDestination}
                    onChange={(e) => setNumeroDestination(e.target.value)}
                    placeholder="Ex: +225 0707..."
                    className="w-full bg-[#050507] border border-density-border rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-brand/40"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Nom complet du destinataire</label>
                  <input
                    type="text"
                    value={nomDestination}
                    onChange={(e) => setNomDestination(e.target.value)}
                    placeholder="Ex: Kouassi Konan"
                    className="w-full bg-[#050507] border border-density-border rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-brand/40"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Syntaxe USSD suggérée (Optionnel)</label>
                  <input
                    type="text"
                    value={syntaxeUssd}
                    onChange={(e) => setSyntaxeUssd(e.target.value)}
                    placeholder="Ex: *133*1*1*N_DEST*MONTANT#"
                    className="w-full bg-[#050507] border border-density-border rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-brand/40"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Statut d'activation</span>
                  <button
                    type="button"
                    onClick={() => setIsActiveConfig(!isActiveConfig)}
                    className="text-zinc-400 hover:text-zinc-200 cursor-pointer focus:outline-none"
                  >
                    {isActiveConfig ? (
                      <ToggleRight className="w-8 h-8 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {editingConfigId && (
                    <button
                      type="button"
                      onClick={resetPaymentConfigForm}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 border border-density-border text-xs text-zinc-300 rounded-xl cursor-pointer"
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-grow py-2 bg-brand hover:bg-brand-hover text-[#09090b] font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-brand/10"
                  >
                    {editingConfigId ? 'Modifier' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="flex-1 bg-[#09090b] border border-density-border p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-zinc-200">Moyens de paiement actifs sur la Caisse</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentConfigs.map((cfg) => (
                  <div key={cfg.id} className="p-4 bg-[#050507] border border-density-border rounded-xl relative overflow-hidden group">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold ${
                          cfg.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {cfg.isActive ? 'ACTIF' : 'INACTIF'}
                        </span>
                        <h4 className="text-xs font-mono font-bold text-emerald-400 mt-2">{cfg.moyen_paiement}</h4>
                        <p className="text-[11px] font-bold text-zinc-200 mt-1">{cfg.nom_destination}</p>
                        <p className="text-xs font-mono text-zinc-400">{cfg.numero_destination}</p>
                        {cfg.syntaxe_ussd && (
                          <p className="text-[10px] font-mono text-zinc-500 mt-1 italic">USSD: {cfg.syntaxe_ussd}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditPaymentConfig(cfg)}
                          className="p-1.5 bg-zinc-900 border border-density-border text-zinc-400 hover:text-zinc-200 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePaymentConfig(cfg.id)}
                          className="p-1.5 bg-red-950/20 border border-red-900/40 text-red-400 hover:text-red-300 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {paymentConfigs.length === 0 && (
                  <div className="p-6 text-center text-zinc-500 text-xs italic font-mono col-span-2 border border-dashed border-density-border rounded-2xl">
                    Aucun compte récepteur configuré.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: TRANSACTIONS MANAGEMENT --- */}
      {activeTab === 'transactions' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-200">Traitement des demandes de Dépôts et Retraits</h3>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Validez ou rejetez les demandes financières des joueurs.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded text-[9px] font-mono font-bold">
                {transactions.filter(t => t.status === 'pending').length} EN ATTENTE
              </span>
            </div>
          </div>

          <div className="overflow-x-auto bg-[#09090b] border border-density-border rounded-xl">
            <table className="w-full text-left border-collapse text-xs text-zinc-300">
              <thead>
                <tr className="border-b border-density-border text-zinc-400 bg-zinc-900/40">
                  <th className="p-3">Horodatage</th>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Opération</th>
                  <th className="p-3">Montant (FCFA)</th>
                  <th className="p-3">Moyen & Compte Client</th>
                  <th className="p-3">Réf / SMS ID</th>
                  <th className="p-3 text-center">Statut</th>
                  <th className="p-3 text-right">Actions de Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-density-border/40 font-mono">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-900/10">
                    <td className="p-3 text-[10px] text-zinc-500">
                      {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-zinc-200">
                        {players.find(p => p.id === t.userId)?.username || `Joueur ID: ${t.userId.slice(0, 8)}`}
                      </div>
                      <div className="text-[9px] text-zinc-600">ID: {t.userId.slice(0, 12)}...</div>
                    </td>
                    <td className="p-3">
                      {t.type === 'deposit' ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold uppercase">DÉPÔT</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[9px] font-bold uppercase">RETRAIT</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-zinc-100">{t.amount.toLocaleString()}</div>
                      {t.type === 'withdrawal' && (
                        <div className="text-[10px] text-emerald-400 font-semibold" title="Frais de 10% déduits">Net: {t.netAmount?.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="p-3 space-y-0.5 text-zinc-400">
                      <p className="font-semibold text-zinc-300">{t.moyen_paiement}</p>
                      <p className="text-[10px]">Nom: {t.nom_joueur}</p>
                      <p className="text-[10px] text-zinc-500">N°: {t.numero_joueur}</p>
                    </td>
                    <td className="p-3 text-amber-400 text-[11px] font-semibold">
                      {t.transactionId || <span className="text-zinc-600 font-normal italic">N/A</span>}
                    </td>
                    <td className="p-3 text-center">
                      {t.status === 'pending' && (
                        <span className="px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded text-[9px] font-bold">EN ATTENTE</span>
                      )}
                      {t.status === 'approved' && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold">APPROUVÉ</span>
                      )}
                      {t.status === 'rejected' && (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[9px] font-bold">REJETÉ</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {t.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRejectTransaction(t.id)}
                            className="px-2 py-1 bg-red-950/40 hover:bg-red-900/40 border border-red-900/40 text-red-400 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Rejeter
                          </button>
                          <button
                            onClick={() => handleApproveTransaction(t.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-[#09090b] rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approuver
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-[10px] italic">Traité</span>
                      )}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-zinc-500 italic">Aucune transaction déclarée sur la plateforme.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: COUNTRIES --- */}
      {activeTab === 'countries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-density-panel border border-density-border p-6 rounded-2xl">
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-brand" />
                Gestion des Pays et Indicatifs Éligibles
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Configurez les pays, drapeaux et codes indicatifs autorisés lors de la création de compte par vos joueurs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="bg-density-panel border border-density-border p-5 rounded-2xl space-y-4 h-fit">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand">
                {editingCountryId ? 'Modifier un pays' : 'Ajouter un pays éligible'}
              </h3>

              <form onSubmit={handleSaveCountry} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono mb-1">
                    Nom du pays
                  </label>
                  <input
                    type="text"
                    value={countryName}
                    onChange={(e) => setCountryName(e.target.value)}
                    placeholder="Ex: Cameroun, Côte d'Ivoire, France..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs focus:outline-none focus:border-brand/40"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono mb-1">
                      Indicatif Tél
                    </label>
                    <input
                      type="text"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      placeholder="Ex: +237, +225, +33"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs focus:outline-none focus:border-brand/40"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono mb-1">
                      Drapeau (Emoji)
                    </label>
                    <input
                      type="text"
                      value={countryFlag}
                      onChange={(e) => setCountryFlag(e.target.value)}
                      placeholder="Ex: 🇨🇲, 🇨🇮, 🇫🇷"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs focus:outline-none focus:border-brand/40"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-zinc-900">
                  <span className="text-xs text-zinc-400">Activer ce pays</span>
                  <button
                    type="button"
                    onClick={() => setCountryIsActive(!countryIsActive)}
                    className="text-brand focus:outline-none"
                  >
                    {countryIsActive ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {editingCountryId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCountryId(null);
                        setCountryName('');
                        setCountryCode('');
                        setCountryFlag('');
                        setCountryIsActive(true);
                      }}
                      className="flex-1 py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-brand hover:bg-brand-hover text-[#09090b] rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md shadow-brand/10"
                  >
                    {editingCountryId ? 'Enregistrer' : 'Ajouter le pays'}
                  </button>
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2 bg-density-panel border border-density-border p-5 rounded-2xl">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 mb-4">
                Liste des indicatifs disponibles ({adminCountries.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Flag</th>
                      <th className="pb-3 font-semibold">Pays</th>
                      <th className="pb-3 font-semibold">Indicatif</th>
                      <th className="pb-3 font-semibold">Statut</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminCountries.map((c) => (
                      <tr key={c.id} className="border-b border-zinc-900/40 text-xs hover:bg-zinc-950/20">
                        <td className="py-3 font-mono text-lg">{c.flag || '🏳️'}</td>
                        <td className="py-3 font-semibold text-zinc-200">{c.name}</td>
                        <td className="py-3 font-mono text-brand font-semibold">{c.code}</td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.isActive 
                              ? 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-400' 
                              : 'bg-zinc-950 text-zinc-500 border border-zinc-850'
                          }`}>
                            {c.isActive ? 'ACTIF' : 'INACTIF'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleEditCountry(c)}
                              className="p-1 hover:bg-zinc-850 rounded text-zinc-400 hover:text-brand transition-colors cursor-pointer"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCountry(c.id)}
                              className="p-1 hover:bg-zinc-850 rounded text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {adminCountries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-zinc-500 italic">
                          Aucun pays configuré. Les inscriptions utiliseront +237 par défaut.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: RISK & DYNAMIC RTP --- */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="bg-density-panel border border-density-border p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-density-border pb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Gestion des Risques & Plafonds Automatisés
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Protégez la trésorerie du casino en régulant le House Edge, les plafonds par partie et le risque dynamique.
                </p>
              </div>
              <button
                onClick={handleSaveRiskSettings}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-[#09090b] rounded-xl text-xs font-bold transition-all shadow-md shadow-brand/10 cursor-pointer"
              >
                Sauvegarder les Paramètres
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* House Edge Setting */}
              <div className="bg-[#09090b] border border-density-border p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-wider">
                    Marge Casino (House Edge)
                  </label>
                  <span className="text-sm font-mono font-black text-brand">{(riskSettings.houseEdge || 3.5).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="12.0"
                  step="0.5"
                  value={riskSettings.houseEdge || 3.5}
                  onChange={(e) => setRiskSettings({ ...riskSettings, houseEdge: parseFloat(e.target.value) })}
                  className="w-full accent-brand cursor-pointer"
                />
                <p className="text-[11px] text-zinc-500 leading-tight">
                  Taux de rétention mathématique moyen appliqué sur tous les jeux Provably Fair.
                </p>
              </div>

              {/* Max Payout Single Round */}
              <div className="bg-[#09090b] border border-density-border p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-wider">
                    Plafond Max par Gain
                  </label>
                  <span className="text-sm font-mono font-black text-emerald-400">
                    {(riskSettings.maxWinCap || 5000000).toLocaleString()} FCFA
                  </span>
                </div>
                <input
                  type="number"
                  step="100000"
                  value={riskSettings.maxWinCap || 5000000}
                  onChange={(e) => setRiskSettings({ ...riskSettings, maxWinCap: parseInt(e.target.value) || 0 })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-brand/40"
                />
                <p className="text-[11px] text-zinc-500 leading-tight">
                  Gain maximum autorisé en un seul tour (limitation automatique des cotes extrêmes).
                </p>
              </div>

              {/* Max Risk % of Treasury */}
              <div className="bg-[#09090b] border border-density-border p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-wider">
                    Risque Max Trésorerie
                  </label>
                  <span className="text-sm font-mono font-black text-amber-400">{(riskSettings.maxTreasuryRisk || 5.0).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="15.0"
                  step="0.5"
                  value={riskSettings.maxTreasuryRisk || 5.0}
                  onChange={(e) => setRiskSettings({ ...riskSettings, maxTreasuryRisk: parseFloat(e.target.value) })}
                  className="w-full accent-brand cursor-pointer"
                />
                <p className="text-[11px] text-zinc-500 leading-tight">
                  Pourcentage max des réserves du casino mis en jeu sur un seul tour simultané.
                </p>
              </div>
            </div>

            {/* Dynamic RTP Engine status */}
            <div className="flex items-center justify-between p-4 bg-[#09090b] border border-density-border rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Ajustement Dynamique selon Solde Global</h4>
                <p className="text-[11px] text-zinc-500">
                  Régule automatiquement les multiplicateurs des mini-jeux pour maintenir un RTP cible de { (100 - (riskSettings.houseEdge || 3.5)).toFixed(1) }%.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRiskSettings({ ...riskSettings, dynamicRtpActive: !riskSettings.dynamicRtpActive })}
                className="text-brand focus:outline-none cursor-pointer"
              >
                {riskSettings.dynamicRtpActive ? <ToggleRight className="w-9 h-9 text-brand" /> : <ToggleLeft className="w-9 h-9 text-zinc-600" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: SECURITY & RED FLAGS --- */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-density-panel border border-density-border p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Alertes Actives</span>
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-red-400 mt-2">
                {redFlags.filter(r => r.status !== 'RESOLVED').length}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">Anomalies nécessitant attention</p>
            </div>

            <div className="bg-density-panel border border-density-border p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Comptes Gelés</span>
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-amber-400 mt-2">
                {players.filter(p => p.isFrozen).length}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">Opérations bloquées</p>
            </div>

            <div className="bg-density-panel border border-density-border p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Score Fraude Moyen</span>
                <Activity className="w-4 h-4 text-brand" />
              </div>
              <div className="text-2xl font-mono font-bold text-brand mt-2">
                {redFlags.length > 0 ? (redFlags.reduce((acc, f) => acc + (f.fraudScore || 0), 0) / redFlags.length).toFixed(0) : 0}/100
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">Niveau de risque global</p>
            </div>

            <div className="bg-density-panel border border-density-border p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Protection Anti-Bot</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-2">
                100% ACTIF
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">Surveillance temps réel</p>
            </div>
          </div>

          {/* Real-time Attack Simulation Test Box */}
          <div className="bg-density-panel border border-density-border p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Simulateur de Tests d'Attaques & Détection Anti-Bot en Direct
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Testez instantanément le moteur de détection en injectant une signature d'anomalie bot réelle sur le serveur.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={botSimType}
                  onChange={(e: any) => setBotSimType(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-200 focus:outline-none focus:border-brand/40"
                >
                  <option value="CLICK_SPEED">⚡ Cadence Autoclicker (&lt; 350ms)</option>
                  <option value="MINES_SCRIPT">💣 Script Démineur Mathématique</option>
                  <option value="WIN_STREAK">🏆 Série de Gains Anormale</option>
                  <option value="IP_CLONE">🌐 Multi-comptes / IP Clone</option>
                </select>

                <button
                  onClick={handleSimulateBotAttack}
                  disabled={simulatingBot}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-[#09090b] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {simulatingBot ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>Déclencher Test</span>
                </button>
              </div>
            </div>
          </div>

          {/* Red Flags Table */}
          <div className="bg-density-panel border border-density-border p-6 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-density-border pb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  Journal des Alertes de Sécurité (Red Flags)
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Alertes déclenchées automatiquement par le moteur de jeu lors de cadences suspectes, scripts et anomalies.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg text-xs font-mono font-bold">
                  {redFlags.filter(r => r.status !== 'RESOLVED').length} Alertes en Cours
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Joueur / Cible</th>
                    <th className="pb-3 font-semibold">Motif Détection</th>
                    <th className="pb-3 font-semibold">Détails / Signature</th>
                    <th className="pb-3 font-semibold">Score Risque</th>
                    <th className="pb-3 font-semibold">Statut</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold text-right">Actions Directes</th>
                  </tr>
                </thead>
                <tbody>
                  {redFlags.map((flag) => {
                    const isPlayerFrozen = players.some(p => p.id === flag.userId && p.isFrozen) || flag.status === 'FROZEN';
                    return (
                      <tr key={flag.id} className="border-b border-zinc-900/40 text-xs hover:bg-zinc-950/30">
                        <td className="py-3 font-medium text-zinc-200">
                          <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                            {flag.username}
                            {isPlayerFrozen && (
                              <span className="px-1.5 py-0.5 bg-red-950/80 border border-red-800 text-red-400 rounded text-[9px] font-mono font-bold">
                                GELÉ
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500">{flag.userId}</div>
                        </td>
                        <td className="py-3 text-zinc-300">
                          <div className="text-red-300 font-medium">{flag.reason}</div>
                          {flag.actionType && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded text-[9px] font-mono">
                              {flag.actionType}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-zinc-400 font-mono text-[11px]">
                          {flag.details || '—'}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            flag.fraudScore >= 85 
                              ? 'bg-red-950/60 text-red-400 border border-red-900' 
                              : 'bg-amber-950/60 text-amber-400 border border-amber-900'
                          }`}>
                            {flag.fraudScore}/100
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] ${
                            flag.status === 'FROZEN'
                              ? 'bg-red-950/80 text-red-400 border border-red-800'
                              : flag.status === 'RESOLVED'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                          }`}>
                            {flag.status}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-400 font-mono text-[11px]">
                          {new Date(flag.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {isPlayerFrozen ? (
                              <button
                                onClick={() => handleUnfreezeAccount(flag.id, flag.username)}
                                className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Dégeler le compte et autoriser à nouveau les opérations"
                              >
                                <Unlock className="w-3 h-3" />
                                <span>Dégeler</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleFreezeAccount(flag.id, flag.username)}
                                className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Geler immédiatement le compte et suspendre les mises et retraits"
                              >
                                <Lock className="w-3 h-3" />
                                <span>Geler</span>
                              </button>
                            )}

                            {flag.status !== 'RESOLVED' && (
                              <button
                                onClick={() => handleResolveAlert(flag.id)}
                                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg text-[10px] cursor-pointer"
                                title="Acquitter l'alerte"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteAlert(flag.id)}
                              className="p-1 hover:bg-zinc-850 rounded text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                              title="Supprimer l'alerte"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {redFlags.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-emerald-400 font-mono text-xs">
                        🛡️ Aucune anomalie ni activité suspecte détectée sur la plateforme.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#09090b] border border-density-border p-6 rounded-2xl max-w-sm w-full mx-4 space-y-4 shadow-2xl relative">
            <h3 className="text-sm font-bold text-zinc-100">{confirmDialog.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-density-border text-xs text-zinc-300 rounded-xl cursor-pointer font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-[#09090b] text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-brand/10"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Balance and Profile Adjustment Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200 p-4">
          <div className="bg-[#09090b] border border-density-border p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-density-border/40 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-100 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                  Ajuster le Joueur : <span className="text-brand">{editingPlayer.username}</span>
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {editingPlayer.id}</p>
              </div>
              <button
                onClick={() => setEditingPlayer(null)}
                className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-4">
              
              {/* Solde Réel Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  Solde Réel (FCFA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={editSolde}
                    onChange={(e) => setEditSolde(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-emerald-950/60 rounded-xl py-2 px-3 font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/50 text-sm"
                    required
                    min="0"
                    step="any"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-mono text-emerald-600 font-bold">
                    FCFA
                  </span>
                </div>
                <p className="text-[9px] text-zinc-500 italic">Ce solde est débité/crédité lors des jeux en argent réel.</p>
              </div>

              {/* Solde Fictif Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-brand uppercase tracking-wider font-mono">
                  Solde Virtuel (FTB)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={editCredits}
                    onChange={(e) => setEditCredits(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 font-mono text-brand font-bold focus:outline-none focus:border-brand/50 text-sm"
                    required
                    min="0"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-mono text-zinc-650 font-bold">
                    FTB
                  </span>
                </div>
                <p className="text-[9px] text-zinc-500 italic">Ce solde est utilisé en mode Simulation / Démo.</p>
              </div>

              {/* Status and Losses Row */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    Pertes consécutives
                  </label>
                  <input
                    type="number"
                    value={editConsecutiveLosses}
                    onChange={(e) => setEditConsecutiveLosses(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 font-mono text-zinc-200 focus:outline-none focus:border-brand/40 text-sm"
                    required
                    min="0"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    Rôle Administrateur
                  </label>
                  <div className="flex items-center h-10">
                    <button
                      type="button"
                      onClick={() => setEditIsAdmin(!editIsAdmin)}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                        editIsAdmin
                          ? 'bg-brand/10 border-brand/50 text-brand'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {editIsAdmin ? 'ADMINISTRATEUR' : 'JOUEUR CLASSIQUE'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-density-border/40">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-density-border text-xs text-zinc-300 rounded-xl cursor-pointer font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand hover:bg-brand-hover text-[#09090b] text-xs font-extrabold rounded-xl cursor-pointer shadow-md shadow-brand/10"
                >
                  Enregistrer
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: PARTENAIRES --- */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#9ce800]" /> Gestion des Partenaires (Affiliation)
            </h2>
            <button
              onClick={() => fetchAllData()}
              className="px-3 py-1.5 text-[10px] font-mono bg-zinc-900 border border-density-border rounded-lg text-zinc-400 hover:text-white cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Actualiser
            </button>
          </div>

          {/* Créer un partenaire */}
          <div className="bg-[#09090b] border border-density-border rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Créer un compte partenaire</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={newPartnerUsername}
                onChange={(e) => setNewPartnerUsername(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-brand/50"
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={newPartnerPassword}
                onChange={(e) => setNewPartnerPassword(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-brand/50"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={newPartnerRate}
                  onChange={(e) => setNewPartnerRate(Number(e.target.value))}
                  className="w-20 bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm font-mono text-brand focus:outline-none focus:border-brand/50"
                />
                <span className="text-xs text-zinc-500">% commission</span>
              </div>
              <button
                disabled={creatingPartner || !newPartnerUsername || !newPartnerPassword}
                onClick={async () => {
                  setCreatingPartner(true);
                  try {
                    const res = await fetch('/api/admin/partners', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        username: newPartnerUsername.trim(),
                        password: newPartnerPassword,
                        commissionRate: newPartnerRate / 100,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    showMsg('success', `Partenaire créé — code ${data.partner?.partnerCode}`);
                    setNewPartnerUsername('');
                    setNewPartnerPassword('');
                    setNewPartnerRate(20);
                    fetchAllData();
                  } catch (err: any) {
                    showMsg('error', err.message);
                  } finally {
                    setCreatingPartner(false);
                  }
                }}
                className="py-2 px-4 bg-brand hover:bg-brand-hover text-[#09090b] text-xs font-extrabold rounded-xl cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {creatingPartner ? 'Création…' : 'Créer'}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500">
              Un code unique (ex. FUN-A7K3P) est généré automatiquement. Le partenaire le partage pour parrainer des joueurs.
            </p>
          </div>

          {/* Liste */}
          <div className="bg-[#09090b] border border-density-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-density-border text-[10px] uppercase text-zinc-500 font-mono">
                    <th className="px-4 py-3">Partenaire</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Commission</th>
                    <th className="px-4 py-3">Solde</th>
                    <th className="px-4 py-3">Total gagné</th>
                    <th className="px-4 py-3">Filleuls</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partnersList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                        Aucun partenaire pour le moment.
                      </td>
                    </tr>
                  )}
                  {partnersList.map((p) => (
                    <tr key={p.id} className="border-b border-density-border/50 hover:bg-zinc-900/50">
                      <td className="px-4 py-3 font-medium text-white">{p.username}</td>
                      <td className="px-4 py-3">
                        <code className="text-[#9ce800] font-mono font-bold">{p.partnerCode}</code>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={Math.round((p.commissionRate ?? 0.2) * 100)}
                          onBlur={async (e) => {
                            const rate = Number(e.target.value) / 100;
                            try {
                              const res = await fetch(`/api/admin/partners/${p.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ commissionRate: rate }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error);
                              showMsg('success', `Taux de ${p.username} → ${(rate * 100).toFixed(0)}%`);
                              fetchAllData();
                            } catch (err: any) {
                              showMsg('error', err.message);
                            }
                          }}
                          className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2 font-mono text-brand text-xs focus:outline-none focus:border-brand/50"
                        />
                        <span className="text-zinc-500 ml-1">%</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-300">
                        {(p.partnerBalance || 0).toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-400">
                        {(p.totalReferralEarnings || 0).toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-400">{p.referralCount || 0}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/admin/partners/${p.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isPartner: false }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error);
                              showMsg('success', `${p.username} n'est plus partenaire`);
                              fetchAllData();
                            } catch (err: any) {
                              showMsg('error', err.message);
                            }
                          }}
                          className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          Révoquer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Promouvoir un joueur existant */}
          <div className="bg-[#09090b] border border-density-border rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Promouvoir un joueur existant</h3>
            <div className="flex flex-wrap gap-2">
              {players
                .filter((pl) => !pl.isPartner && !pl.isAdmin)
                .slice(0, 20)
                .map((pl) => (
                  <button
                    key={pl.id}
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/admin/partners/${pl.id}/promote`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ commissionRate: 0.2 }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        showMsg('success', `${pl.username} promu partenaire — code ${data.partner?.partnerCode}`);
                        fetchAllData();
                      } catch (err: any) {
                        showMsg('error', err.message);
                      }
                    }}
                    className="px-3 py-1.5 text-[10px] font-mono bg-zinc-900 border border-density-border rounded-lg text-zinc-300 hover:text-[#9ce800] hover:border-[#9ce800]/40 cursor-pointer"
                  >
                    + {pl.username}
                  </button>
                ))}
              {players.filter((pl) => !pl.isPartner && !pl.isAdmin).length === 0 && (
                <span className="text-[10px] text-zinc-500">Aucun joueur à promouvoir.</span>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
