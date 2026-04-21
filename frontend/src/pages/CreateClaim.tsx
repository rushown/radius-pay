import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import toast from 'react-hot-toast';
import { LINKPAY_ABI, ERC20_ABI } from '../config/abi';
import { LINKPAY_ADDRESS, USDC_ADDRESS } from '../config/wagmi';
import {
  generateSecret, deriveClaimId, buildClaimUrl,
  formatUsdc, parseUsdc, copyToClipboard
} from '../utils/crypto';
import { useUsdcBalance } from '../hooks/useUsdcBalance';
import { useAllowance } from '../hooks/useAllowance';
import { api } from '../utils/api';

type Step = 'form' | 'approve' | 'create' | 'done';

export function CreateClaim() {
  const { address, isConnected } = useAccount();
  const { raw: balance, formatted: balanceFormatted, refetch: refetchBalance } = useUsdcBalance();
  const { allowance, refetch: refetchAllowance } = useAllowance();

  const [step, setStep]           = useState<Step>('form');
  const [amount, setAmount]       = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [claimUrl, setClaimUrl]   = useState('');
  const [copied, setCopied]       = useState(false);

  // Kept in memory only — never logged or stored
  const [secret, setSecret]       = useState<`0x${string}` | null>(null);
  const [claimId, setClaimId]     = useState<`0x${string}` | null>(null);

  const { writeContract: approve, data: approveTxHash } = useWriteContract();
  const { writeContract: create,  data: createTxHash  } = useWriteContract();

  const approveTx = useWaitForTransactionReceipt({ hash: approveTxHash });
  const createTx  = useWaitForTransactionReceipt({ hash: createTxHash });

  // After approve confirms → proceed to create
  useEffect(() => {
    if (approveTx.isSuccess && step === 'approve') {
      refetchAllowance();
      setStep('create');
      toast.success('Approval confirmed!');
      handleCreate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveTx.isSuccess]);

  // After create confirms → register in backend + show link
  useEffect(() => {
    if (createTx.isSuccess && step === 'create' && claimId && secret) {
      refetchBalance();
      const expiresAt = new Date(
        Date.now() + parseInt(expiryDays, 10) * 86_400_000
      ).toISOString();

      api.createClaim({
        claimId,
        amountRaw:      parseUsdc(amount).toString(),
        creatorAddress: address!,
        expiresAt,
        txHash:         createTxHash!,
      }).catch(() => {/* backend is optional for trustless operation */});

      const url = buildClaimUrl(claimId, secret);
      setClaimUrl(url);
      setStep('done');
      toast.success('Claim link created!');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createTx.isSuccess]);

  const parsedAmount = parseUsdc(amount || '0');

  const needsApproval = allowance !== undefined && allowance < parsedAmount;

  const handleSubmit = useCallback(() => {
    if (!isConnected) { toast.error('Connect your wallet first'); return; }
    if (!amount || parsedAmount < 10_000n) { toast.error('Minimum amount is 0.01 USDC'); return; }
    if (balance !== undefined && parsedAmount > balance) {
      toast.error('Insufficient USDC balance'); return;
    }

    // Generate secret in memory — never stored, never logged
    const _secret  = generateSecret();
    const _claimId = deriveClaimId(_secret);
    setSecret(_secret);
    setClaimId(_claimId);

    if (needsApproval) {
      setStep('approve');
      approve({
        address:      USDC_ADDRESS,
        abi:          ERC20_ABI,
        functionName: 'approve',
        args:         [LINKPAY_ADDRESS, parsedAmount],
      });
      toast('Approve USDC spending in your wallet…', { icon: '⏳' });
    } else {
      setStep('create');
      submitCreate(_claimId, _secret);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, isConnected, needsApproval, balance, parsedAmount]);

  const submitCreate = useCallback((_claimId: `0x${string}`, _secret: `0x${string}`) => {
    const expiry = BigInt(
      Math.floor(Date.now() / 1000) + parseInt(expiryDays, 10) * 86400
    );
    create({
      address:      LINKPAY_ADDRESS,
      abi:          LINKPAY_ABI,
      functionName: 'createClaim',
      args:         [_claimId, parsedAmount, expiry],
    });
    toast('Confirm the transaction in your wallet…', { icon: '⏳' });
  }, [expiryDays, parsedAmount, create]);

  const handleCreate = useCallback(() => {
    if (claimId && secret) submitCreate(claimId, secret);
  }, [claimId, secret, submitCreate]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(claimUrl);
    if (ok) { setCopied(true); toast.success('Link copied!'); setTimeout(() => setCopied(false), 2000); }
  };

  const reset = () => {
    setStep('form'); setAmount(''); setClaimUrl('');
    setSecret(null); setClaimId(null);
  };

  // ── Done state ─────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="max-w-lg mx-auto animate-slide-up">
        <div className="card text-center">
          <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-choco-100 mb-2">Link Created!</h2>
          <p className="text-choco-400 text-sm mb-6">
            Share this link with the recipient. It can only be claimed once.
          </p>

          <div className="bg-choco-900 border border-choco-600 rounded-lg p-4 mb-4">
            <p className="text-xs text-choco-400 mb-2 text-left">Claim URL</p>
            <p className="font-mono text-xs text-gold break-all text-left leading-relaxed">{claimUrl}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleCopy} className="btn-gold flex-1" aria-label="Copy claim link">
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
            <button onClick={reset} className="btn-outline flex-1" aria-label="Create another claim">
              New Claim
            </button>
          </div>

          <p className="mt-4 text-xs text-red-400 text-center">
            ⚠ This link contains the secret. Store it safely — we do not save it.
          </p>
        </div>
      </div>
    );
  }

  // ── Form + pending states ──────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-choco-100 mb-2">Create Claim Link</h1>
        <p className="text-choco-400">Lock USDC and generate a one-time payment link.</p>
      </div>

      {!isConnected && (
        <div className="card border-gold/40 bg-gold/5 mb-6" role="alert">
          <p className="text-gold text-sm">Connect your wallet to create a claim link.</p>
        </div>
      )}

      <div className="card space-y-6">
        {/* Amount */}
        <div>
          <label htmlFor="amount" className="label">
            Amount (USDC)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-semibold">$</span>
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="input-field pl-8"
              placeholder="10.00"
              disabled={step !== 'form'}
              aria-describedby="balance-hint"
            />
          </div>
          {balanceFormatted !== undefined && (
            <p id="balance-hint" className="text-xs text-choco-400 mt-1">
              Balance: <button
                onClick={() => setAmount(balanceFormatted)}
                className="text-gold hover:underline"
                type="button"
              >${balanceFormatted}</button> USDC
            </p>
          )}
        </div>

        {/* Expiry */}
        <div>
          <label htmlFor="expiry" className="label">
            Expiry (days)
          </label>
          <select
            id="expiry"
            value={expiryDays}
            onChange={e => setExpiryDays(e.target.value)}
            className="input-field"
            disabled={step !== 'form'}
          >
            {['1','3','7','14','30'].map(d => (
              <option key={d} value={d}>{d} day{d !== '1' ? 's' : ''}</option>
            ))}
          </select>
          <p className="text-xs text-choco-400 mt-1">Unclaimed funds auto-return after expiry.</p>
        </div>

        {/* Progress steps */}
        {step !== 'form' && (
          <div className="space-y-3 pt-2">
            <StepRow active={step === 'approve'} done={step === 'create' || step === 'done'} tx={approveTxHash} label="1. Approve USDC" />
            <StepRow active={step === 'create'} done={step === 'done'} tx={createTxHash} label="2. Lock funds on-chain" />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isConnected || step !== 'form' || !amount}
          className="btn-gold w-full text-base py-4"
          aria-label="Create claim link"
        >
          {step === 'form' ? 'Generate Claim Link' : 'Processing…'}
        </button>
      </div>
    </div>
  );
}

function StepRow({ active, done, tx, label }: {
  active: boolean; done: boolean; tx?: `0x${string}`; label: string;
}) {
  return (
    <div className={`flex items-center gap-3 text-sm ${active ? 'text-gold' : done ? 'text-green-400' : 'text-choco-500'}`}>
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0 ${
        done ? 'border-green-400 bg-green-400/10' : active ? 'border-gold bg-gold/10' : 'border-choco-600'
      }`}>
        {done ? '✓' : active ? (
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
        ) : ''}
      </span>
      <span>{label}</span>
      {tx && (
        <a
          href={`https://testnet.arcscan.app/tx/${tx}`}
          target="_blank" rel="noopener noreferrer"
          className="ml-auto text-xs opacity-60 hover:opacity-100 underline"
          aria-label="View transaction on ArcScan"
        >↗</a>
      )}
    </div>
  );
}
