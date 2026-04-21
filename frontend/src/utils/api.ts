const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export interface ClaimMetadata {
  claimId:        string;
  amount:         string;   // USDC amount in human-readable form, e.g. "10.00"
  amountRaw:      string;   // raw 6-decimal integer as string
  creatorAddress: string;
  createdAt:      string;   // ISO timestamp
  expiresAt:      string;   // ISO timestamp
  claimedAt?:     string;
  claimStatus:    'pending' | 'claimed' | 'expired' | 'reclaimed';
  claimedBy?:     string;
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((err as { message?: string }).message ?? 'API error');
  }

  return res.json() as Promise<T>;
}

export const api = {
  /** Register a new claim in the backend (called AFTER on-chain tx confirms) */
  createClaim(payload: {
    claimId:        string;
    amountRaw:      string;
    creatorAddress: string;
    expiresAt:      string;
    txHash:         string;
  }): Promise<ClaimMetadata> {
    return apiFetch('/claims', {
      method: 'POST',
      body:   JSON.stringify(payload),
    });
  },

  /** Fetch metadata for a single claim */
  getClaim(claimId: string): Promise<ClaimMetadata> {
    return apiFetch(`/claims/${claimId}`);
  },

  /** Fetch all claims for a given address */
  getUserClaims(address: string): Promise<ClaimMetadata[]> {
    return apiFetch(`/claims/user/${address}`);
  },

  /** Verify a secret server-side (does not expose secret to backend) */
  verifyClaim(claimId: string): Promise<{ valid: boolean; status: string }> {
    return apiFetch('/claims/verify', {
      method: 'POST',
      body:   JSON.stringify({ claimId }),
    });
  },
};
