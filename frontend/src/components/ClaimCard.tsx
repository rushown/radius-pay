import type { ClaimMetadata } from '../utils/api';
import { formatExpiry, truncateAddress } from '../utils/crypto';

const STATUS_CLASSES: Record<string, string> = {
  pending:   'status-pending',
  claimed:   'status-claimed',
  expired:   'status-expired',
  reclaimed: 'status-reclaimed',
};

interface ClaimCardProps {
  claim: ClaimMetadata;
  onReclaim?: (claimId: string) => void;
}

export function ClaimCard({ claim, onReclaim }: ClaimCardProps) {
  const isExpired  = claim.claimStatus === 'expired';
  const isPending  = claim.claimStatus === 'pending';

  return (
    <div className="card animate-slide-up" role="article" aria-label={`Claim ${claim.claimId.slice(0,10)}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-choco-400 font-mono mb-1">{truncateAddress(claim.claimId, 10, 8)}</p>
          <p className="text-2xl font-display font-semibold text-choco-100">
            ${claim.amount} <span className="text-sm text-gold">USDC</span>
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium uppercase tracking-wide ${STATUS_CLASSES[claim.claimStatus] ?? ''}`}>
          {claim.claimStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-choco-400 text-xs mb-0.5">Created</p>
          <p className="text-choco-200">{new Date(claim.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-choco-400 text-xs mb-0.5">Expires</p>
          <p className={`${isExpired ? 'text-red-400' : 'text-choco-200'}`}>
            {formatExpiry(BigInt(Math.floor(new Date(claim.expiresAt).getTime() / 1000)))}
          </p>
        </div>
        {claim.claimedBy && (
          <div className="col-span-2">
            <p className="text-choco-400 text-xs mb-0.5">Claimed by</p>
            <p className="font-mono text-green-400 text-xs">{claim.claimedBy}</p>
          </div>
        )}
      </div>

      {isExpired && isPending && onReclaim && (
        <button
          onClick={() => onReclaim(claim.claimId)}
          className="btn-outline text-sm mt-4 w-full"
          aria-label="Reclaim expired funds"
        >
          Reclaim Funds
        </button>
      )}
    </div>
  );
}
