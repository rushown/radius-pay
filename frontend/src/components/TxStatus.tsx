import { useWaitForTransactionReceipt } from 'wagmi';
import { arcTestnet } from '../config/wagmi';

interface TxStatusProps {
  hash?: `0x${string}`;
  onSuccess?: () => void;
  onError?: (e: Error) => void;
}

export function TxStatus({ hash, onSuccess, onError }: TxStatusProps) {
  const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
    onReplaced: () => {}, // silence wagmi warning
  });

  if (!hash) return null;

  return (
    <div className="mt-4 rounded-lg border p-4 text-sm font-mono animate-fade-in"
      role="status" aria-live="polite"
      style={{
        borderColor: isSuccess ? '#4ade80' : isError ? '#f87171' : '#FFB300',
        background:  isSuccess ? '#052e16' : isError ? '#2d0a0a' : '#1c1408',
        color:       isSuccess ? '#4ade80' : isError ? '#f87171' : '#FFB300',
      }}>
      {isLoading && (
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          Confirming transaction…
        </span>
      )}
      {isSuccess && <span>✓ Transaction confirmed!</span>}
      {isError && <span>✗ {error?.message ?? 'Transaction failed'}</span>}
      {hash && (
        <a
          href={`https://testnet.arcscan.app/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 underline opacity-70 hover:opacity-100 truncate"
        >
          View on ArcScan ↗
        </a>
      )}
    </div>
  );
}

// trigger callbacks imperatively via hook
export function useTxReceipt(hash?: `0x${string}`, onSuccess?: () => void) {
  return useWaitForTransactionReceipt({ hash, chainId: arcTestnet.id });
}
