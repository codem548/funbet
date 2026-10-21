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

  if (!src.includes('players.splice(0, players.length')) {
    src = src.replace(
      "players = await hydrateStore('players', players);",
      "const hPlayers = await hydrateStore('players', players);\n      players.splice(0, players.length, ...hPlayers);"
    );
  }

  // Player transaction history (DepositWithdrawModal)
  if (!src.includes("/api/wallet/transactions")) {
    src = src.replace(
      "app.post('/api/wallet/deposit'",
      `app.get('/api/wallet/transactions', (req, res) => {
  const userId = String(req.query.userId || '').trim();
  if (!userId) {
    return res.status(400).json({ error: 'userId requis' });
  }
  const list = (transactions || []).filter((t: any) => t.userId === userId);
  list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  res.json({ transactions: list });
});

app.post('/api/wallet/deposit'`
    );
  }

  fs.writeFileSync('server.ts', src);
  console.log('restored+patched server.ts', fs.statSync('server.ts').size, '(Supabase-first)');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
