/** Harden DepositWithdrawModal: only parse JSON, avoid HTML SPA body */
const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/components/DepositWithdrawModal.tsx');
if (!fs.existsSync(file)) {
  console.warn('[patch-tx] DepositWithdrawModal missing');
  process.exit(0);
}
let src = fs.readFileSync(file, 'utf8');
const from = `  const fetchUserTransactions = async () => {
    setLoadingTxs(true);
    try {
      const res = await fetch(\`/api/wallet/transactions?userId=\${encodeURIComponent(player.id)}\`);
      if (res.ok) {
        const data = await res.json();
        setTxs(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTxs(false);
    }
  };`;

const to = `  const fetchUserTransactions = async () => {
    setLoadingTxs(true);
    try {
      const res = await fetch(\`/api/wallet/transactions?userId=\${encodeURIComponent(player.id)}\`);
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('application/json')) {
        setTxs([]);
        return;
      }
      const data = await res.json();
      setTxs(data.transactions || []);
    } catch (e) {
      console.error(e);
      setTxs([]);
    } finally {
      setLoadingTxs(false);
    }
  };`;

if (src.includes(from)) {
  src = src.replace(from, to);
  fs.writeFileSync(file, src);
  console.log('[patch-tx] fetchUserTransactions hardened');
} else if (src.includes('content-type') && src.includes('wallet/transactions')) {
  console.log('[patch-tx] already hardened');
} else {
  const softFrom = `      const res = await fetch(\`/api/wallet/transactions?userId=\${encodeURIComponent(player.id)}\`);
      if (res.ok) {
        const data = await res.json();
        setTxs(data.transactions || []);
      }`;
  const softTo = `      const res = await fetch(\`/api/wallet/transactions?userId=\${encodeURIComponent(player.id)}\`);
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('application/json')) {
        setTxs([]);
        return;
      }
      const data = await res.json();
      setTxs(data.transactions || []);`;
  if (src.includes(softFrom)) {
    src = src.replace(softFrom, softTo);
    fs.writeFileSync(file, src);
    console.log('[patch-tx] soft patch applied');
  } else {
    console.warn('[patch-tx] pattern not found');
  }
}
