import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { metaMask } from '@wagmi/connectors';
import { useUsdcBalance } from '../hooks/useUsdcBalance';
import { truncateAddress } from '../utils/crypto';

export function Layout() {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { formatted: usdcBalance } = useUsdcBalance();

  const navLinks = [
    { to: '/create',    label: 'Send'      },
    { to: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-choco-700 bg-choco-900/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="Radius Pay home">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center shadow-md group-hover:bg-gold-light transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-choco-900">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M12 22V12M3 7l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display text-lg font-semibold text-choco-100 hidden sm:block">
              Radius<span className="text-gold">Pay</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1" role="navigation" aria-label="Main navigation">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  location.pathname === to
                    ? 'bg-choco-750 text-gold'
                    : 'text-choco-300 hover:text-choco-100 hover:bg-choco-800'
                }`}
                aria-current={location.pathname === to ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            {isConnected && address ? (
              <div className="flex items-center gap-3">
                {usdcBalance !== undefined && (
                  <span className="hidden sm:flex items-center gap-1 text-sm text-choco-300">
                    <span className="text-gold font-mono font-medium">${usdcBalance}</span>
                    <span className="text-choco-500">USDC</span>
                  </span>
                )}
                <button
                  onClick={() => disconnect()}
                  className="btn-outline text-sm py-2 px-4"
                  aria-label={`Disconnect wallet ${truncateAddress(address)}`}
                >
                  {truncateAddress(address)}
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: metaMask() })}
                className="btn-gold text-sm py-2 px-4"
                aria-label="Connect wallet"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 animate-fade-in">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-choco-700 py-6 text-center text-choco-500 text-sm">
        <p>RadiusPay · Built on <span className="text-gold">Arc</span> by Circle · Testnet</p>
      </footer>
    </div>
  );
}
