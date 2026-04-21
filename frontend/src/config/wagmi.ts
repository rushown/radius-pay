import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { metaMask, injected } from '@wagmi/connectors';

// ─── Arc Testnet Chain Definition ────────────────────────────────────────────

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet (Radius Pay)',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,  // native gas token uses 18 decimals
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
      webSocket: ['wss://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
});

// ─── Contract Addresses ───────────────────────────────────────────────────────

/** USDC ERC-20 on Arc (6 decimals — used for token transfers) */
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;

/** LinkPay contract — update after deployment */
export const LINKPAY_ADDRESS = (
  import.meta.env.VITE_LINKPAY_ADDRESS ?? '0x0000000000000000000000000000000000000000'
) as `0x${string}`;

// ─── Wagmi Config ─────────────────────────────────────────────────────────────

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    metaMask(),
    injected(),
  ],
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
  },
});
