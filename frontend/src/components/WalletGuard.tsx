import { useEffect, useRef } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/** Auto-disconnect wallet after idle period and clear sensitive storage */
export function WalletGuard() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    if (isConnected) {
      timer.current = setTimeout(() => {
        disconnect();
        // Clear any app state from sessionStorage
        sessionStorage.clear();
      }, IDLE_TIMEOUT_MS);
    }
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return null;
}