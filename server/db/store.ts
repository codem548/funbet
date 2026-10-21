/**
 * FunBet — persistance Postgres (Supabase) via DATABASE_URL
 * Table: app_store (key text PK, value jsonb)
 *
 * Source de vérité = Supabase. Les fichiers data/*.json ne sont plus
 * utilisés en production.
 */
import { Pool } from 'pg';
import type pg from 'pg';

export type StoreKey =
  | 'players'
  | 'games'
  | 'rules'
  | 'logs'
  | 'payment_configurations'
  | 'transactions'
  | 'countries'
  | 'red_flags'
  | 'risk_settings';

let pool: pg.Pool | null = null;
let ready = false;
/** Serialize writes per key to avoid last-write-wins races */
const writeChains = new Map<string, Promise<void>>();

function getDatabaseUrl(): string | null {
  let url =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL ||
    null;
  if (!url || !url.trim()) return null;
  url = url.trim();
  try {
    const u = new URL(url);
    u.searchParams.delete('sslmode');
    u.searchParams.delete('ssl');
    url = u.toString();
  } catch {
    /* keep raw */
  }
  return url;
}

export function isDbConfigured(): boolean {
  return !!getDatabaseUrl();
}

export function getPool(): pg.Pool {
  if (pool) return pool;
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
  pool = new Pool({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    family: 4,
  } as any);
  pool.on('error', (err) => {
    console.error('[db] pool error', err.message);
  });
  return pool;
}

export async function loadKey<T>(key: StoreKey): Promise<T | null> {
  const p = getPool();
  const res = await p.query<{ value: T }>(
    'SELECT value FROM app_store WHERE key = $1 LIMIT 1',
    [key]
  );
  if (!res.rows.length) return null;
  return res.rows[0].value as T;
}

export async function saveKey<T>(key: StoreKey, value: T): Promise<void> {
  const p = getPool();
  await p.query(
    `INSERT INTO app_store (key, value, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  );
}

/**
 * Persist to Supabase. Always attempts when DATABASE_URL is set.
 * Chains writes per key so concurrent saves don't overwrite each other randomly.
 */
export function saveKeyAsync<T>(key: StoreKey, value: T): void {
  if (!isDbConfigured()) return;
  const prev = writeChains.get(key) || Promise.resolve();
  // Snapshot value at call time (deep clone via JSON to freeze state)
  let snapshot: T;
  try {
    snapshot = JSON.parse(JSON.stringify(value)) as T;
  } catch {
    snapshot = value;
  }
  const next = prev
    .then(() => saveKey(key, snapshot))
    .then(() => {
      ready = true;
      const n = Array.isArray(snapshot) ? snapshot.length : undefined;
      console.log(`[db] saved ${key}${n !== undefined ? ` (${n} items)` : ''}`);
    })
    .catch((err) => {
      console.error(`[db] save failed for ${key}:`, (err as Error).message);
    });
  writeChains.set(key, next.then(() => undefined, () => undefined));
}

/** Await pending writes for a key (or all). */
export async function flushSaves(key?: StoreKey): Promise<void> {
  if (key) {
    await (writeChains.get(key) || Promise.resolve());
    return;
  }
  await Promise.all([...writeChains.values()]);
}

export async function hydrateStore<T>(
  key: StoreKey,
  defaultValue: T
): Promise<T> {
  if (!isDbConfigured()) {
    console.warn(`[db] DATABASE_URL missing — using defaults for ${key}`);
    return defaultValue;
  }
  try {
    const fromDb = await loadKey<T>(key);
    if (fromDb === null || fromDb === undefined) {
      await saveKey(key, defaultValue);
      console.log(`[db] seeded ${key}`);
      return defaultValue;
    }
    const n = Array.isArray(fromDb) ? (fromDb as unknown[]).length : undefined;
    console.log(`[db] loaded ${key}${n !== undefined ? ` (${n} items)` : ''}`);
    return fromDb;
  } catch (err) {
    console.error(`[db] hydrate ${key} failed:`, (err as Error).message);
    return defaultValue;
  }
}

export async function initDatabase(): Promise<boolean> {
  if (!isDbConfigured()) {
    console.warn('[db] No DATABASE_URL — data will NOT survive restarts');
    ready = false;
    return false;
  }
  try {
    const p = getPool();
    await p.query('SELECT 1');
    await p.query(`
      CREATE TABLE IF NOT EXISTS app_store (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT 'null'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    ready = true;
    console.log('[db] Connected to Postgres (Supabase) via DATABASE_URL');
    return true;
  } catch (err) {
    console.error('[db] init failed:', (err as Error).message);
    ready = false;
    return false;
  }
}

export function isStoreReady(): boolean {
  return ready;
}
