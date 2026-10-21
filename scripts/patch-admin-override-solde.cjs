/** Patch AdminPanel: forçage manuel = solde réel FCFA (pas crédits démo) */
const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/components/AdminPanel.tsx');
if (!fs.existsSync(file)) {
  console.warn('[patch-admin] AdminPanel.tsx missing, skip');
  process.exit(0);
}
let src = fs.readFileSync(file, 'utf8');
const patterns = [
  [
    '{p.username} (Solde : {p.credits.toLocaleString()} FTB)',
    '{p.username} (Réel : {(p.solde || 0).toLocaleString()} FCFA)',
  ],
  [
    '{p.username} (Solde : {(p.credits_fictifs ?? p.credits).toLocaleString()} FTB)',
    '{p.username} (Réel : {(p.solde || 0).toLocaleString()} FCFA)',
  ],
];
let changed = false;
for (const [from, to] of patterns) {
  if (src.includes(from)) {
    src = src.split(from).join(to);
    changed = true;
  }
}
if (changed) {
  fs.writeFileSync(file, src);
  console.log('[patch-admin] override dropdown → solde réel FCFA');
} else if (src.includes('(Réel : {(p.solde || 0).toLocaleString()} FCFA)')) {
  console.log('[patch-admin] already patched');
} else {
  console.warn('[patch-admin] pattern not found — check AdminPanel override select');
}
