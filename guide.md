# RadiusPay — Configuration & Deployment Guide

## Prerequisites

| Tool        | Version   | Install |
|-------------|-----------|---------|
| Node.js     | ≥ 18.x    | https://nodejs.org |
| npm         | ≥ 9.x     | bundled with Node |
| Foundry     | latest    | `curl -L https://foundry.paradigm.xyz | bash && foundryup` |
| MetaMask    | latest    | https://metamask.io |
| Git         | any       | https://git-scm.com |

---

## 1. Add Arc Testnet to MetaMask

1. Open MetaMask → Settings → Networks → Add Network → Add manually.
2. Fill in:

| Field              | Value |
|--------------------|-------|
| Network Name       | Arc Testnet (Radius Pay) |
| RPC URL            | `https://rpc.testnet.arc.network` |
| Chain ID           | `5042002` |
| Currency Symbol    | `USDC` |
| Block Explorer URL | `https://testnet.arcscan.app` |

3. Click **Save**.

---

## 2. Get Testnet USDC

1. Visit **https://faucet.circle.com**
2. Select **Arc Testnet** from the network dropdown.
3. Paste your wallet address and request USDC.
4. You'll need USDC for both gas fees (native, 18-dec) AND the ERC-20 USDC for claim locks.

> **Decimal note:** Arc uses USDC as its native gas token (18 decimals). The ERC-20 USDC used for locking funds is at `0x3600000000000000000000000000000000000000` and uses 6 decimals — the same as standard USDC.

---

## 3. Clone & Install

```bash
git clone https://github.com/yourname/radius-pay.git
cd radius-pay
```

---

## 4. Deploy the Smart Contract (Foundry)

### 4a. Install dependencies

```bash
cd radius-pay    # project root
forge install OpenZeppelin/openzeppelin-contracts
```

### 4b. Set environment variables

```bash
export PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY   # never commit this!
export ARCSCAN_API_KEY=your_arcscan_key           # for contract verification
```

Or create a `.env` file in the project root (already in `.gitignore`):

```env
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
ARCSCAN_API_KEY=your_arcscan_key
```

Then `source .env` (Linux/macOS) or set manually on Windows.

### 4c. Run tests first

```bash
forge test -vvv
```

Expected output: all tests pass including fuzz tests.

### 4d. Deploy

```bash
forge script script/Deploy.s.sol:DeployLinkPay \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast \
  --verify \
  --verifier-url https://testnet.arcscan.app/api \
  -vvvv
```

Note the deployed contract address from the output (e.g. `0xABC...`).

### 4e. Verify on ArcScan (manual, if auto-verify fails)

```bash
forge verify-contract \
  0xYOUR_CONTRACT_ADDRESS \
  contracts/LinkPay.sol:LinkPay \
  --rpc-url https://rpc.testnet.arc.network \
  --verifier-url https://testnet.arcscan.app/api \
  --constructor-args $(cast abi-encode "constructor(address)" 0x3600000000000000000000000000000000000000)
```

---

## 5. Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
DB_PATH=./data/radiuspay.db
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
ARC_RPC_URL=https://rpc.testnet.arc.network
LINKPAY_CONTRACT=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

Install and start:

```bash
npm install
npm run dev
```

The API will start on `http://localhost:3001`.

---

## 6. Configure the Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```env
VITE_LINKPAY_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
VITE_API_URL=http://localhost:3001/api
```

Install and start:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 7. End-to-End Test

1. Connect MetaMask (Arc Testnet) in the browser.
2. Navigate to **Create Link**.
3. Enter an amount (e.g. `1.00`), select expiry `7 days`.
4. Click **Generate Claim Link**.
5. Approve USDC spending (first transaction).
6. Confirm the lock transaction (second transaction).
7. Copy the generated link.
8. Open the link in an incognito window (or different wallet).
9. Connect a different wallet and click **Claim**.
10. Verify USDC arrives in the recipient wallet.

---

## 8. Production Deployment Checklist

- [ ] Set `NODE_ENV=production` in backend `.env`
- [ ] Configure HTTPS (TLS cert) for both frontend and backend
- [ ] Set `ALLOWED_ORIGINS` to your production domain only
- [ ] Use a process manager (PM2, systemd) for the backend
- [ ] Store `PRIVATE_KEY` in a secrets manager (AWS Secrets Manager, Vault, etc.) — never in `.env` files on production servers
- [ ] Enable Foundry's encrypted keystore for contract deployment: `cast wallet import deployer --interactive`
- [ ] Set strict `Content-Security-Policy` headers on the frontend server
- [ ] Configure a reverse proxy (nginx) with rate limiting
- [ ] Set up monitoring and alerts (e.g., Sentry, Datadog)
- [ ] Run `forge test --fuzz-runs 10000` before mainnet deployment
- [ ] Get an independent security audit before handling real funds

---

## 9. Troubleshooting

### "Insufficient allowance" error
The USDC approve transaction must confirm before createClaim. The UI handles this sequentially — if you see this error, wait for the approve tx to confirm and retry.

### USDC decimal confusion
- ERC-20 USDC (for locking) = **6 decimals** → 1 USDC = `1_000_000`
- Native gas USDC = **18 decimals** → used automatically by MetaMask for gas
- The frontend always works in 6-decimal units for amounts.

### MetaMask shows wrong gas price
Arc gas is paid in USDC (18-dec). Ensure you have sufficient USDC in your wallet for both gas and the locked amount.

### Contract not found / wrong address
Update `VITE_LINKPAY_ADDRESS` in `frontend/.env` to match your deployed contract.

### CORS errors from backend
Ensure `ALLOWED_ORIGINS` in `backend/.env` includes your exact frontend origin (including protocol and port).

### Claim link "not found" on-chain
The backend is optional metadata. The on-chain data is authoritative. The Claim page reads directly from the contract — if it says "not found", the contract address or claimId may be wrong.

---

## 10. Security Reminders

> ⚠ The claim URL contains the raw secret. Anyone with the link can claim the funds. Treat it like a bearer token or a cash cheque.

- **Never share claim links publicly** — only send directly to the intended recipient.
- **Use HTTPS** in production so the link secret is encrypted in transit.
- **The backend never sees the secret** — it only stores the claimId (the hash).
- **Private keys** should never appear in code, git history, or log files.
- **Expiry** is enforced on-chain — set a short expiry for high-value transfers.
