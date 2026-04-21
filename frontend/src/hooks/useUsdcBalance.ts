import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { ERC20_ABI } from '../config/abi';
import { USDC_ADDRESS } from '../config/wagmi';
import { formatUsdc } from '../utils/crypto';

export function useUsdcBalance() {
  const { address, isConnected } = useAccount();

  const { data: raw, isLoading, refetch } = useReadContract({
    address:      USDC_ADDRESS,
    abi:          ERC20_ABI,
    functionName: 'balanceOf',
    args:         address ? [address] : undefined,
    query:        { enabled: isConnected && !!address },
  });

  return {
    raw:       raw as bigint | undefined,
    formatted: raw !== undefined ? formatUsdc(raw as bigint) : undefined,
    isLoading,
    refetch,
  };
}
