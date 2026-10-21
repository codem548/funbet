const fs = require('fs');
const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return get(res.headers.location).then(resolve, reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  const url =
    'https://raw.githubusercontent.com/codem548/funbet-casino/160efb6c17c2dea92cfd339d130399e19d9465f6/server.ts';
  let src = await get(url);

  if (!src.includes('partner-routes')) {
    src = src.replace(
      "from './server/db/store';",
      "from './server/db/store';\nimport { creditPartnerCommission, registerPartnerRoutes, generatePartnerCode } from './server/partner-routes';"
    );
  }
  if (!src.includes('registerPartnerRoutes(app')) {
    src = src.replace(
      'function saveRiskSettings() { writeData(RISK_SETTINGS_FILE, riskSettings); }',
      `function saveRiskSettings() { writeData(RISK_SETTINGS_FILE, riskSettings); }

registerPartnerRoutes(app, {
  players,
  savePlayers,
  jwtSecret: JWT_SECRET,
  hashPassword,
  stripPassword,
});`
    );
  }

  if (!src.includes('referralCode')) {
    src = src.replace(
      'const { username, email, phone, password } = req.body;',
      'const { username, email, phone, password, referralCode } = req.body;'
    );
    src = src.replace(
      'const hashed = await hashPassword(password);\n    const player: Player = {',
      `let referredBy: string | undefined;
    if (referralCode && String(referralCode).trim()) {
      const code = String(referralCode).trim().toUpperCase();
      const partner = players.find(p => p.isPartner && (p.partnerCode === code || (p as any).referralCode === code));
      if (partner) referredBy = partner.id;
    }
    const hashed = await hashPassword(password);
    const player: Player = {`
    );
    src = src.replace(
      "isAdmin: username.trim().toLowerCase() === 'admin',\n      lastDailyClaim: null,\n    };",
      `isAdmin: username.trim().toLowerCase() === 'admin',
      lastDailyClaim: null,
      referredBy,
      isPartner: false,
      partnerBalance: 0,
      totalReferralEarnings: 0,
      commissionRate: 0.2,
    };`
    );
  }

  if (!src.includes('creditPartnerCommission(players')) {
    src = src.replace(
      'function savePlayers() { writeData(PLAYERS_FILE, players); }',
      `let __lastCommissionLogId = null;
function savePlayers() {
  const last = typeof logs !== 'undefined' && logs && logs[0];
  if (last && last.id !== __lastCommissionLogId && last.mode === 'REAL') {
    __lastCommissionLogId = last.id;
    const pl = players.find(p => p.username === last.username);
    if (pl) creditPartnerCommission(players, pl, last.bet, last.payout || 0, last.mode);
  }
  writeData(PLAYERS_FILE, players);
}`
    );
  }

  // Supabase-first writeData (no reliance on ephemeral JSON files in production)
  src = src.replace(
    /function writeData<T>\(filePath: string, data: T\): void \{[\s\S]*?\n\}/,
    `function writeData<T>(filePath: string, data: T): void {
  const key = filePathToStoreKey(filePath);
  if (key && isDbConfigured()) {
    saveKeyAsync(key as any, data);
  }
  if (!isDbConfigured() || process.env.NODE_ENV !== 'production') {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error writing ' + filePath + ':', err);
      }
    }
  }
}`
  );

  // Full in-place hydrate (keep array references stable)
  if (!src.includes("players.splice(0, players.length")) {
    src = src.replace(
      `    if (ok) {
      players = await hydrateStore('players', players);
      games = await hydrateStore('games', games);
      rules = await hydrateStore('rules', rules);
      logs = await hydrateStore('logs', logs);
      paymentConfigurations = await hydrateStore('payment_configurations', paymentConfigurations);
      transactions = await hydrateStore('transactions', transactions);
      countries = await hydrateStore('countries', countries);
      redFlags = await hydrateStore('red_flags', redFlags);
      riskSettings = await hydrateStore('risk_settings', riskSettings);
      console.log(\"[db] Hydrated: \" + players.length + \" players, \" + transactions.length + \" txs\");
    }`,
      `    if (ok) {
      const hPlayers = await hydrateStore('players', players);
      players.splice(0, players.length, ...hPlayers);
      const hGames = await hydrateStore('games', games);
      games.splice(0, games.length, ...hGames);
      const hRules = await hydrateStore('rules', rules);
      rules.splice(0, rules.length, ...hRules);
      const hLogs = await hydrateStore('logs', logs);
      logs.splice(0, logs.length, ...hLogs);
      const hPay = await hydrateStore('payment_configurations', paymentConfigurations);
      paymentConfigurations.splice(0, paymentConfigurations.length, ...hPay);
      const hTx = await hydrateStore('transactions', transactions);
      transactions.splice(0, transactions.length, ...hTx);
      const hCountries = await hydrateStore('countries', countries);
      countries.splice(0, countries.length, ...hCountries);
      const hFlags = await hydrateStore('red_flags', redFlags);
      redFlags.splice(0, redFlags.length, ...hFlags);
      riskSettings = await hydrateStore('risk_settings', riskSettings);
      console.log('[db] Hydrated: ' + players.length + ' players, ' + transactions.length + ' txs (Supabase)');
    }`
    );
  }
  // Fallback simpler splice if template literal match failed
  if (!src.includes('players.splice(0, players.length')) {
    src = src.replace(
      "players = await hydrateStore('players', players);",
      "const hPlayers = await hydrateStore('players', players);\n      players.splice(0, players.length, ...hPlayers);"
    );
  }

  fs.writeFileSync('server.ts', src);
  console.log('restored+patched server.ts', fs.statSync('server.ts').size, '(Supabase-first)');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
