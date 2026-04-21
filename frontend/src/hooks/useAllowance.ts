import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { ERC20_ABI } from '../config/abi';
import { USDC_ADDRESS, LINKPAY_ADDRESS } from '../config/wagmi';

export function useAllowance() {
  const { address } = useAccount();

  const { data: allowance, refetch } = useReadContract({
    address:      USDC_ADDRESS,
    abi:          ERC20_ABI,
    functionName: 'allowance',
    args:         address ? [address, LINKPAY_ADDRESS] : undefined,
    query:        { enabled: !!address },
  });

  return { allowance: allowance as bigint | undefined, refetch };
}
