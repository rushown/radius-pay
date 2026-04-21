import { keccak256 } from 'viem';

/**
 * Generate a cryptographically secure 32-byte random secret.
 * Uses window.crypto.getRandomValues — never Math.random().
 * The secret is returned as a hex string (0x-prefixed).
 */
export function generateSecret(): `0x${string}` {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;
}

/**
 * Derive the claimId from a secret using keccak256.
 * Matches the on-chain computation: keccak256(abi.encodePacked(secret))
 *
 * Note: viem's keccak256 on a bytes32 hex string already packs correctly.
 */
export function deriveClaimId(secret: `0x${string}`): `0x${string}` {
  // keccak256 the raw bytes (32 bytes → 32-byte hash)
  return keccak256(secret);
}

/**
 * Build the claim URL that will be shared with the recipient.
 * The URL contains BOTH the claimId (for lookup) AND the secret (for claiming).
 * The backend NEVER receives the secret — it's only in the URL fragment.
 *
 * URL format: https://app.com/claim/{claimId}/{secret}
 */
export function buildClaimUrl(claimId: string, secret: string): string {
  const base = window.location.origin;
  return `${base}/claim/${claimId}/${secret}`;
}

/**
 * Parse claimId and secret from the claim URL path.
 * Returns null if the URL is malformed.
 */
export function parseClaimUrl(pathname: string): {
  claimId: `0x${string}`;
  secret: `0x${string}`;
} | null {
  const parts = pathname.split('/').filter(Boolean);
  // Expect: ['claim', claimId, secret]
  if (parts.length < 3 || parts[0] !== 'claim') return null;
  const claimId = parts[1];
  const secret  = parts[2];
  if (!/^0x[0-9a-fA-F]{64}$/.test(claimId)) return null;
  if (!/^0x[0-9a-fA-F]{64}$/.test(secret))  return null;
  return {
    claimId: claimId as `0x${string}`,
    secret:  secret  as `0x${string}`,
  };
}

/**
 * Format a USDC amount (6 decimals) for display.
 * e.g., 1_500_000 → "1.50"
 */
export function formatUsdc(raw: bigint, decimals = 2): string {
  const divisor = 10n ** 6n;
  const whole   = raw / divisor;
  const frac    = raw % divisor;
  const fracStr = frac.toString().padStart(6, '0').slice(0, decimals);
  return `${whole}.${fracStr}`;
}

/**
 * Parse a human-readable USDC string into the raw 6-decimal bigint.
 * e.g., "1.5" → 1_500_000n
 */
export function parseUsdc(human: string): bigint {
  const [whole = '0', frac = ''] = human.split('.');
  const fracPadded = frac.slice(0, 6).padEnd(6, '0');
  return BigInt(whole) * 1_000_000n + BigInt(fracPadded || '0');
}

/**
 * Format a Unix timestamp into a human-readable date/time string.
 */
export function formatExpiry(ts: bigint): string {
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleString(undefined, {
    year:   'numeric',
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/**
 * Copy text to clipboard. Returns true on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Truncate a hex address for display: 0x1234...5678
 */
export function truncateAddress(addr: string, start = 6, end = 4): string {
  if (addr.length < start + end + 2) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}
