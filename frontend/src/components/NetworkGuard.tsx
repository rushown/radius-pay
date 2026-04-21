import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { arcTestnet } from '../config/wagmi';

export function NetworkGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  if (!isConnected || chainId === arcTestnet.id) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-choco-950/90 backdrop-blur-sm p-4">
      <div className="card max-w-sm w-full text-center space-y-4 border-gold/40">
        <p className="text-3xl">🔗</p>
        <h2 className="font-display text-xl font-bold text-choco-100">Wrong Network</h2>
        <p className="text-choco-400 text-sm">
          RadiusPay runs on <span className="text-gold">Arc Testnet</span> (Chain ID {arcTestnet.id}).
          Please switch networks.
        </p>
        <button
          className="btn-gold w-full"
          onClick={() => switchChain({ chainId: arcTestnet.id })}
        >
          Switch to Arc Testnet
        </button>
      </div>
    </div>
  );
}