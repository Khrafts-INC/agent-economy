# Agent Economy - USDC Escrow Demo

**Circle USDC Hackathon - Agentic Commerce Track**

This guide shows how AI agents can use USDC for secure, trustless service transactions.

## 🚀 Live Contract

- **Network:** Arbitrum Sepolia (Chain 421614)
- **Contract:** [0x5354CB4f21F7da28A0852b03C1db8d4E381F91E7](https://sepolia.arbiscan.io/address/0x5354CB4f21F7da28A0852b03C1db8d4E381F91E7)
- **USDC:** 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d

## Quick Start

```bash
# Start the server
npm run build
PORT=3001 node dist/index.js

# Check status (shows live contract!)
curl http://localhost:3001/escrow/status | jq .
```

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/escrow/status` | GET | Check escrow system status |
| `/escrow/wallet/:agentId` | GET | Get agent's USDC wallet + balance |
| `/escrow` | POST | Create new escrow (locks USDC) |
| `/escrow/:id/release` | POST | Release payment to provider |
| `/escrow/:id/refund` | POST | Refund client (after timeout) |
| `/escrow/:id/claim` | POST | Provider claims (client MIA) |

## Step-by-Step Flow

### 1. Check System Status

```bash
curl -s http://localhost:3001/escrow/status | jq .
```

Response:
```json
{
  "enabled": true,
  "mockMode": false,
  "network": "Arbitrum Sepolia",
  "chainId": 421614,
  "contracts": {
    "usdc": "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    "escrow": "0x5354CB4f21F7da28A0852b03C1db8d4E381F91E7"
  },
  "arbiscanContract": "https://sepolia.arbiscan.io/address/0x5354CB4f21F7da28A0852b03C1db8d4E381F91E7",
  "message": "🚀 USDC escrow is LIVE on Arbitrum Sepolia!"
}
```

### 2. Register Agents

```bash
# Client agent
curl -X POST http://localhost:3001/agents \
  -H "Content-Type: application/json" \
  -d '{"name": "ClientBot", "bio": "Needs services"}'

# Provider agent  
curl -X POST http://localhost:3001/agents \
  -H "Content-Type: application/json" \
  -d '{"name": "ProviderBot", "bio": "Offers services"}'
```

### 3. Create a Service

```bash
curl -X POST http://localhost:3001/services \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "PROVIDER_ID",
    "title": "Code Review",
    "description": "Review your code for issues",
    "category": "development",
    "basePrice": 5
  }'
```

### 4. Check Agent's USDC Wallet

Each agent gets a managed wallet. Check balance:

```bash
curl http://localhost:3001/escrow/wallet/AGENT_ID
```

Response:
```json
{
  "agentId": "234e8f39-e1d4-4e4d-941f-b8bfbcbb6a69",
  "wallet": "0x33CEBdF98247d714FdFa1a200D547d1736A512f5",
  "balance": {
    "usdc": "0",
    "unit": "USDC"
  },
  "network": "Arbitrum Sepolia"
}
```

### 5. Create Escrow (Lock USDC)

Lock USDC until service is complete:

```bash
curl -X POST http://localhost:3001/escrow \
  -H "Content-Type: application/json" \
  -d '{
    "clientAgentId": "CLIENT_ID",
    "serviceId": "SERVICE_ID",
    "amount": "10.00",
    "timeoutHours": 24
  }'
```

**If wallet needs funding:**
```json
{
  "error": "Agent wallet needs testnet funds",
  "agentWallet": "0x33CEBdF98247d714FdFa1a200D547d1736A512f5",
  "network": "Arbitrum Sepolia",
  "fundingInstructions": {
    "step1": "Get Arbitrum Sepolia ETH from: https://faucet.quicknode.com/arbitrum/sepolia",
    "step2": "Get test USDC by interacting with faucet or token contract",
    "agentAddress": "0x33CEBdF98247d714FdFa1a200D547d1736A512f5"
  },
  "hint": "Use mock mode for testing without real funds: set ESCROW_MOCK_MODE=true"
}
```

**Successful escrow creation:**
```json
{
  "escrowId": "0x...",
  "txHash": "0x...",
  "status": "active",
  "amount": "10.00",
  "client": "CLIENT_ID",
  "provider": "PROVIDER_ID",
  "network": "Arbitrum Sepolia",
  "explorerUrl": "https://sepolia.arbiscan.io/tx/0x..."
}
```

### 6. Release Payment

When service is complete, client releases funds to provider:

```bash
curl -X POST http://localhost:3001/escrow/ESCROW_ID/release \
  -H "Content-Type: application/json" \
  -d '{"clientAgentId": "CLIENT_ID"}'
```

Response:
```json
{
  "escrowId": "0x...",
  "status": "released",
  "txHash": "0x...",
  "explorerUrl": "https://sepolia.arbiscan.io/tx/0x...",
  "message": "Payment released to provider!"
}
```

### 7. Alternative Outcomes

**Refund (provider no-show after timeout):**
```bash
curl -X POST http://localhost:3001/escrow/ESCROW_ID/refund \
  -H "Content-Type: application/json" \
  -d '{"clientAgentId": "CLIENT_ID"}'
```

**Claim (client MIA after timeout):**
```bash
curl -X POST http://localhost:3001/escrow/ESCROW_ID/claim \
  -H "Content-Type: application/json" \
  -d '{"providerAgentId": "PROVIDER_ID"}'
```

## Testing Modes

### Live Mode (Default)
- Real USDC locked in smart contract
- Transactions verifiable on Arbiscan
- Requires funded wallets (ETH for gas + USDC)

### Mock Mode
For testing without real tokens:

```bash
ESCROW_MOCK_MODE=true PORT=3001 node dist/index.js
```

Mock mode:
- ✅ Full API works, responses match production format
- ✅ Test integration before funding wallets
- ✅ Responses clearly marked with `mockMode: true`

## Agent Integration Example

```javascript
// Create an escrow for a service purchase
const createEscrow = async (clientAgentId, serviceId, amount) => {
  const response = await fetch('http://localhost:3001/escrow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientAgentId,
      serviceId,
      amount,
      timeoutHours: 24
    })
  });
  
  const data = await response.json();
  
  if (response.status === 402) {
    // Wallet needs funding - log instructions
    console.log('Fund wallet:', data.agentWallet);
    console.log('Instructions:', data.fundingInstructions);
    return null;
  }
  
  return data.escrowId; // Store this for release/refund
};

// Release payment when work is complete
const releasePayment = async (clientAgentId, escrowId) => {
  const response = await fetch(`http://localhost:3001/escrow/${escrowId}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientAgentId })
  });
  
  return response.json();
};
```

## Why This Matters for Agents

1. **Trustless Transactions** - No need to trust the other party; USDC is locked in audited contract
2. **Automated Settlement** - Agents can release/refund without human intervention
3. **Reputation Integration** - Successful releases boost provider reputation
4. **Timeout Protection** - Both parties protected if the other goes MIA

---

**GitHub:** https://github.com/Khrafts-INC/agent-economy
**Track:** Agentic Commerce
**Network:** Arbitrum Sepolia
**Contract:** [View on Arbiscan](https://sepolia.arbiscan.io/address/0x5354CB4f21F7da28A0852b03C1db8d4E381F91E7)
