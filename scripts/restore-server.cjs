const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

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
  // Last known good full server with hydrateStore
  const url = 'https://raw.githubusercontent.com/codem548/funbet-casino/160efb6c17c2dea92cfd339d130399e19d9465f6/server.ts';
  let src = await get(url);
  // Inject partner import if missing
  if (!src.includes('partner-routes')) {
    src = src.replace(
      "from './server/db/store';",
      "from './server/db/store';\nimport { creditPartnerCommission, registerPartnerRoutes, generatePartnerCode } from './server/partner-routes';"
    );
  }
  if (!src.includes('registerPartnerRoutes(app')) {
    src = src.replace(
      'function saveRiskSettings() { writeData(RISK_SETTINGS_FILE, riskSettings); }',
      `function saveRiskSettings() { writeData(RISK_SETTINGS_FILE, riskSettings); }\n\nregisterPartnerRoutes(app, {\n  players,\n  savePlayers,\n  jwtSecret: JWT_SECRET,\n  hashPassword,\n  stripPassword: stripPassword as any,\n});`.replace(' as any', '')
    );
  }
  // referralCode on register
  if (!src.includes('referralCode')) {
    src = src.replace(
      'const { username, email, phone, password } = req.body;',
      'const { username, email, phone, password, referralCode } = req.body;'
    );
    src = src.replace(
      'const hashed = await hashPassword(password);\n    const player: Player = {',
      `let referredBy: string | undefined;\n    if (referralCode && String(referralCode).trim()) {\n      const code = String(referralCode).trim().toUpperCase();\n      const partner = players.find(p => p.isPartner && (p.partnerCode === code || (p as any).referralCode === code));\n      if (partner) referredBy = partner.id;\n    }\n    const hashed = await hashPassword(password);\n    const player: Player = {`
    );
    src = src.replace(
      'lastDailyClaim: null,\n    };',
      'lastDailyClaim: null,\n      referredBy,\n      isPartner: false,\n      partnerBalance: 0,\n      totalReferralEarnings: 0,\n      commissionRate: 0.2,\n    };'
    );
  }
  // commission helper injection on savePlayers
  if (!src.includes('creditPartnerCommission')) {
    src = src.replace(
      'function savePlayers() { writeData(PLAYERS_FILE, players); }',
      `let __lastCommissionLogId: string | null = null;\nfunction savePlayers() {\n  const last = logs[0];\n  if (last && last.id !== __lastCommissionLogId && last.mode === 'REAL') {\n    __lastCommissionLogId = last.id;\n    const pl = players.find(p => p.username === last.username);\n    if (pl) creditPartnerCommission(players, pl, last.bet, last.payout || 0, last.mode);\n  }\n  writeData(PLAYERS_FILE, players);\n}`
    );
  }
  fs.writeFileSync('server.ts', src);
  console.log('restored+patched server.ts', fs.statSync('server.ts').size);
})().catch((e) => { console.error(e); process.exit(1); });
