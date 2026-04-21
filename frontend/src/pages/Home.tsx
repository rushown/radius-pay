import { Link } from 'react-router-dom';

export function Home() {
  const features = [
    {
      icon: '🔗',
      title: 'One-Click Links',
      desc: 'Generate a secure payment link in seconds. Share it via any channel.',
    },
    {
      icon: '🔒',
      title: 'Cryptographically Secure',
      desc: 'Claims use keccak256 hashed secrets. Your funds cannot be front-run.',
    },
    {
      icon: '⚡',
      title: 'Arc Blockchain',
      desc: 'Gas fees paid in USDC. No volatile tokens. EVM-compatible and fast.',
    },
    {
      icon: '⏱',
      title: 'Auto-Expiry',
      desc: 'Unclaimed links expire and funds return to you automatically.',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="text-center py-16 sm:py-24">
        <div className="inline-flex items-center gap-2 bg-choco-800 border border-choco-700 rounded-full px-4 py-1.5 text-sm text-gold mb-8">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          Live on Arc Testnet
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-choco-50 leading-tight mb-6">
          Send USDC via<br />
          <span className="text-gold">Secure Claim Links</span>
        </h1>
        <p className="text-choco-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Lock funds on-chain. Generate a one-time link. Anyone with the link can claim — once.
          No wallets needed to receive.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/create" className="btn-gold text-base px-8 py-4 animate-pulse-gold">
            Create a Claim Link
          </Link>
          <Link to="/dashboard" className="btn-outline text-base px-8 py-4">
            View Dashboard
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t border-choco-700" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="font-display text-2xl font-semibold text-choco-100 text-center mb-12">
          How It Works
        </h2>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { step: '01', title: 'Lock USDC', desc: 'Approve and lock any USDC amount into the smart contract.' },
            { step: '02', title: 'Share the Link', desc: 'A unique, secret-protected URL is generated. Share it anywhere.' },
            { step: '03', title: 'Recipient Claims', desc: 'The recipient opens the link, connects a wallet, and claims the USDC instantly.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="card text-center">
              <p className="font-mono text-gold text-4xl font-bold mb-3 opacity-60">{step}</p>
              <h3 className="font-display text-lg font-semibold text-choco-100 mb-2">{title}</h3>
              <p className="text-choco-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16" aria-labelledby="features-heading">
        <h2 id="features-heading" className="font-display text-2xl font-semibold text-choco-100 text-center mb-12">
          Built for Security
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="card hover:border-choco-600 transition-colors duration-200">
              <p className="text-3xl mb-3" role="img" aria-hidden="true">{icon}</p>
              <h3 className="font-semibold text-choco-100 mb-2">{title}</h3>
              <p className="text-choco-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
