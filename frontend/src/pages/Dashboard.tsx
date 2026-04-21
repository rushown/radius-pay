import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { ClaimCard } from '../components/ClaimCard';
import { LINKPAY_ABI } from '../config/abi';
import { LINKPAY_ADDRESS } from '../config/wagmi';
import { useUsdcBalance } from '../hooks/useUsdcBalance';
import { truncateAddress } from '../utils/crypto';

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const { formatted: balance } = useUsdcBalance();

  const { data: claims, isLoading, refetch } = useQuery({
    queryKey:  ['user-claims', address],
    queryFn:   () => api.getUserClaims(address!),
    enabled:   !!address,
    refetchInterval: 30_000,
  });

  const { writeContract, data: txHash } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  if (isSuccess) {
    refetch();
    toast.success('Funds reclaimed!');
  }

  const handleReclaim = (claimId: string) => {
    writeContract({
      address:      LINKPAY_ADDRESS,
      abi:          LINKPAY_ABI,
      functionName: 'reclaim',
      args:         [claimId as `0x${string}`],
    });
    toast('Confirm reclaim in your wallet…', { icon: '⏳' });
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <p className="text-4xl mb-4">🔌</p>
        <h1 className="font-display text-2xl font-bold text-choco-100 mb-3">Connect Your Wallet</h1>
        <p className="text-choco-400 mb-6">Connect to view your claims and activity.</p>
      </div>
    );
  }

  const created  = claims?.filter(c => c.creatorAddress.toLowerCase() === address?.toLowerCase()) ?? [];
  const received = claims?.filter(c => c.claimedBy?.toLowerCase()     === address?.toLowerCase()) ?? [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-choco-100 mb-1">Dashboard</h1>
          <p className="text-choco-400 font-mono text-sm">{truncateAddress(address!, 10, 8)}</p>
        </div>
        <div className="flex items-center gap-4">
          {balance !== undefined && (
            <div className="card py-3 px-5 text-center">
              <p className="text-xs text-choco-400 mb-0.5">USDC Balance</p>
              <p className="font-display text-xl font-semibold text-gold">${balance}</p>
            </div>
          )}
          <Link to="/create" className="btn-gold">
            + New Link
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total Sent',     value: created.length  },
          { label: 'Pending',        value: created.filter(c => c.claimStatus === 'pending').length },
          { label: 'Total Received', value: received.length },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center py-5">
            <p className="font-display text-3xl font-bold text-gold">{value}</p>
            <p className="text-choco-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Created claims */}
      <section aria-labelledby="created-heading" className="mb-10">
        <h2 id="created-heading" className="font-display text-xl font-semibold text-choco-100 mb-4">
          Links You Created
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : created.length === 0 ? (
          <div className="card text-center py-10 text-choco-400">
            <p className="text-3xl mb-3">📭</p>
            <p>No claim links yet.</p>
            <Link to="/create" className="text-gold hover:underline text-sm mt-2 inline-block">
              Create your first link →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {created.map(c => (
              <ClaimCard key={c.claimId} claim={c} onReclaim={handleReclaim} />
            ))}
          </div>
        )}
      </section>

      {/* Received claims */}
      {received.length > 0 && (
        <section aria-labelledby="received-heading">
          <h2 id="received-heading" className="font-display text-xl font-semibold text-choco-100 mb-4">
            Links You Claimed
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {received.map(c => (
              <ClaimCard key={c.claimId} claim={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
