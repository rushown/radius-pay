export const LINKPAY_ABI = [
  // ─── Events ───────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'ClaimCreated',
    inputs: [
      { name: 'claimId',   type: 'bytes32', indexed: true  },
      { name: 'creator',   type: 'address', indexed: true  },
      { name: 'amount',    type: 'uint256', indexed: false },
      { name: 'expiresAt', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ClaimClaimed',
    inputs: [
      { name: 'claimId',   type: 'bytes32', indexed: true  },
      { name: 'claimedBy', type: 'address', indexed: true  },
      { name: 'amount',    type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ClaimReclaimed',
    inputs: [
      { name: 'claimId', type: 'bytes32', indexed: true  },
      { name: 'creator', type: 'address', indexed: true  },
      { name: 'amount',  type: 'uint256', indexed: false },
    ],
  },
  // ─── Write Functions ──────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'createClaim',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'claimId',         type: 'bytes32' },
      { name: 'amount',          type: 'uint256' },
      { name: 'expiryTimestamp', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'secret', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'reclaim',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'claimId', type: 'bytes32' }],
    outputs: [],
  },
  // ─── Read Functions ───────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'getClaim',
    stateMutability: 'view',
    inputs: [{ name: 'claimId', type: 'bytes32' }],
    outputs: [
      { name: 'creator',   type: 'address' },
      { name: 'amount',    type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'claimedBy', type: 'address' },
      { name: 'claimed',   type: 'bool'    },
    ],
  },
  {
    type: 'function',
    name: 'deriveClaimId',
    stateMutability: 'pure',
    inputs: [{ name: 'secret', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'usdc',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'pause',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'unpause',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner',   type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount',  type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;
