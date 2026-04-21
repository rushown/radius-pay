import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useConnect } from 'wagmi';
import { metaMask } from '@wagmi/connectors';
import toast from 'react-hot-toast';
import { LINKPAY_ABI } from '../config/abi';
import { LINKPAY_ADDRESS } from '../config/wagmi';
import { formatUsdc, formatExpiry } from '../utils/crypto';

export function Claim() {
  const { claimId, secret } = useParams<{ claimId: `0x${string}`; secret: `0x${string}` }>();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [claimed, setClaimed] = useState(false);

  // Validate params format
  const isValidParams = claimId && secret &&
    /^0x[0-9a-fA-F]{64}$/.test(claimId) &&
    /^0x[0-9a-fA-F]{64}$/.test(secret);

  // Fetch claim data from contract
  const { data: claimData, isLoading, isError } = useReadContract({
    address:      LINKPAY_ADDRESS,
    abi:          LINKPAY_ABI,
    functionName: 'getClaim',
    args:         claimId ? [claimId as `0x${string}`] : undefined,
    query:        { enabled: !!claimId && isValidParams, refetchInterval: 10_000 },
  });

  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      setClaimed(true);
      toast.success('Funds claimed successfully!');
    }
  }, [isSuccess]);

  if (!isValidParams) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <p className="text-4xl mb-4">🔗</p>
        <h1 className="font-display text-2xl font-bold text-choco-100 mb-3">Invalid Link</h1>
        <p className="text-choco-400">This claim link is malformed or incomplete.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-choco-400">Loading claim details…</p>
      </div>
    );
  }

  if (isError || !claimData) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <p className="text-4xl mb-4">❓</p>
        <h1 className="font-display text-2xl font-bold text-choco-100 mb-3">Claim Not Found</h1>
        <p className="text-choco-400">This claim does not exist on-chain, or the contract address is wrong.</p>
      </div>
    );
  }

  const [creator, amountRaw, expiresAt, claimedBy, isClaimed] =
    claimData as [string, bigint, bigint, string, boolean];

  const isExpired  = BigInt(Math.floor(Date.now() / 1000)) >= expiresAt;
  const canClaim   = !isClaimed && !isExpired && !claimed;

  const handleClaim = () => {
    if (!isConnected || !address) {
      connect({ connector: metaMask() });
      return;
    }
    writeContract({
      address:      LINKPAY_ADDRESS,
      abi:          LINKPAY_ABI,
      functionName: 'claim',
      args:         [secret as `0x${string}`],
    });
    toast('Confirm the claim in your wallet…', { icon: '⏳' });
  };

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-choco-100 mb-2">Claim Your USDC</h1>
        <p className="text-choco-400">Someone sent you funds via a secure link.</p>
      </div>

      <div className="card space-y-6">
        {/* Amount */}
        <div className="text-center py-4 bg-choco-900 rounded-lg border border-choco-700">
          <p className="text-choco-400 text-sm mb-1">Amount</p>
          <p className="font-display text-5xl font-bold text-choco-50">
            ${formatUsdc(amountRaw)}
          </p>
          <p className="text-gold text-sm mt-1">USDC</p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-choco-900 rounded-lg p-3">
            <p className="text-choco-400 text-xs mb-1">From</p>
            <p className="font-mono text-xs text-choco-200 break-all">{creator.slice(0,10)}…{creator.slice(-6)}</p>
          </div>
          <div className="bg-choco-900 rounded-lg p-3">
            <p className="text-choco-400 text-xs mb-1">Expires</p>
            <p className={`text-xs ${isExpired ? 'text-red-400' : 'text-choco-200'}`}>
              {formatExpiry(expiresAt)}
            </p>
          </div>
        </div>

        {/* Status */}
        {(isClaimed || claimed) && (
          <div className="status-claimed rounded-lg p-4 text-center" role="alert">
            <p className="font-semibold">Already Claimed</p>
            {claimedBy && <p className="text-xs mt-1 opacity-70 font-mono">{claimedBy}</p>}
          </div>
        )}
        {isExpired && !isClaimed && (
          <div className="status-expired rounded-lg p-4 text-center" role="alert">
            <p className="font-semibold">This link has expired</p>
            <p className="text-xs mt-1 opacity-70">The creator can reclaim their funds.</p>
          </div>
        )}

        {/* CTA */}
        {canClaim && (
          <>
            {!isConnected && (
              <p className="text-choco-400 text-sm text-center">
                Connect a wallet to receive the funds.
              </p>
            )}
            {isConnected && address && (
              <div className="bg-choco-900 rounded-lg p-3 text-sm">
                <p className="text-choco-400 text-xs mb-1">Funds will go to</p>
                <p className="font-mono text-xs text-gold">{address}</p>
              </div>
            )}
            <button
              onClick={handleClaim}
              disabled={isConfirming}
              className="btn-gold w-full text-base py-4"
              aria-label={isConnected ? 'Claim USDC now' : 'Connect wallet to claim'}
            >
              {isConfirming
                ? 'Confirming…'
                : isConnected
                  ? `Claim $${formatUsdc(amountRaw)} USDC`
                  : 'Connect Wallet to Claim'}
            </button>
          </>
        )}

        {/* TX link */}
        {txHash && (
          <a
            href={`https://testnet.arcscan.app/tx/${txHash}`}
            target="_blank" rel="noopener noreferrer"
            className="block text-center text-xs text-gold underline opacity-70 hover:opacity-100"
          >
            View transaction on ArcScan ↗
          </a>
        )}
      </div>

      <p className="text-xs text-choco-500 text-center mt-4">
        This is a one-time link. Once claimed, it cannot be used again.
      </p>
    </div>
  );
}
