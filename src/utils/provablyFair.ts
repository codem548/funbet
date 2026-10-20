// Cryptographic Provably Fair Utilities (SHA-256 & HMAC-SHA-256)

export async function sha256(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple hash for older environments
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export function generateRandomSeed(length: number = 32): string {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Calculate Provably Fair Crash multiplier from serverSeed, clientSeed, nonce
export async function calculateProvablyFairCrash(serverSeed: string, clientSeed: string, nonce: number): Promise<{ crashPoint: number; hash: string }> {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`;
  const hash = await sha256(combined);
  
  // Take first 52 bits (13 hex characters)
  const hexSubstring = hash.substring(0, 13);
  const intVal = parseInt(hexSubstring, 16);
  const maxInt = Math.pow(2, 52);
  
  // 3% house edge: 1 in 33 games instant crash at 1.00x
  if (intVal % 33 === 0) {
    return { crashPoint: 1.00, hash };
  }
  
  // Formula: (100 * maxInt - intVal * 3) / (maxInt - intVal) / 100
  const numerator = 100 * maxInt - intVal * 3;
  const denominator = (maxInt - intVal) * 100;
  let multiplier = numerator / denominator;
  multiplier = Math.max(1.01, Math.min(10000.00, Math.floor(multiplier * 100) / 100));
  
  return { crashPoint: multiplier, hash };
}

// Calculate Provably Fair Wheel Segment (0-23)
export async function calculateProvablyFairWheel(serverSeed: string, clientSeed: string, nonce: number): Promise<{ segmentIndex: number; value: number; hash: string }> {
  const WHEEL_SEGMENTS = [
    50, 2, 3, 2, 5, 2, 3, 10, 2, 3, 5, 2,
    20, 2, 3, 2, 5, 2, 3, 10, 2, 3, 5, 2
  ];
  const combined = `${serverSeed}:${clientSeed}:${nonce}`;
  const hash = await sha256(combined);
  const hexSubstring = hash.substring(0, 8);
  const intVal = parseInt(hexSubstring, 16);
  const segmentIndex = intVal % 24;
  
  return {
    segmentIndex,
    value: WHEEL_SEGMENTS[segmentIndex],
    hash
  };
}
