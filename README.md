# RadiusPay — Secure Link Payments on Arc

> Send USDC via cryptographically-secure one-time claim links, powered by the Arc blockchain (by Circle).

---

## What Is RadiusPay?

RadiusPay lets you lock USDC into a smart contract and generate a **one-time claim URL**. Share the link with anyone — they connect a wallet and claim the funds in one click. No custodial wallets, no key management, no middlemen.

---

## How the Claim Link Works

1. **You click "Create Link"** — the frontend generates a cryptographically random 32-byte secret using `window.crypto.getRandomValues()`.
2. **The secret is hashed** — `claimId = keccak256(secret)`. Only the hash goes on-chain.
3. **USDC is locked** — the smart contract pulls your USDC and stores it against the `claimId`.
4. **You receive a link** — format: `https://app.com/claim/{claimId}/{secret}`. The secret travels *only* in the URL, never to any server.
5. **Recipient opens the link** — the contract hashes the URL secret, matches it to the stored `claimId`, verifies the claim is unclaimed and unexpired, then sends the USDC to `msg.sender`.
6. **One-time only** — the `claimed` flag is set atomically. No replay attacks possible.

---

## Security Properties

| Threat                | Mitigation |
|-----------------------|------------|
| Front-running         | `nonReentrant` + atomic state flip before transfer |
| Replay attack         | `claimed` flag checked on every call |
| Double-spend          | CEI pattern + SafeERC20 |
| Brute-force claim ID  | 256-bit secret space (2²⁵⁶ guesses needed) |
| Backend compromise    | Backend never receives the secret |
| XSS                   | Strict CSP headers + no secret in localStorage |

---

## Technologies

| Layer    | Stack |
|----------|-------|
| Frontend | React 18, TypeScript, Wagmi v2, Viem, TailwindCSS |
| Backend  | Node.js, Express, SQLite (better-sqlite3), Helmet |
| Contracts| Solidity 0.8.20, OpenZeppelin 5, Foundry |
| Blockchain | Arc Testnet (Chain ID 5042002) by Circle |

---

## Quick Start

See **[guide.md](./guide.md)** for full setup, deployment, and configuration instructions.

---

## Known Limitations

- **Testnet only** — do not use with real funds until audited.
- **Single token** — only USDC (the Arc ERC-20 at `0x3600...`).
- **USDC decimals** — the ERC-20 USDC uses 6 decimals; the native gas token uses 18. The frontend handles this transparently.
- **Link security** — the claim URL contains the secret. Treat it like a password.

---

## Contract Addresses (Arc Testnet)

| Contract | Address |
|----------|---------|
| USDC (ERC-20, 6 dec) | `0x3600000000000000000000000000000000000000` |
| LinkPay  | *set after deployment — see guide.md* |
