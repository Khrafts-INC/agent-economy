# 🔐 Agent Economy USDC Escrow

Smart contract for trustless agent-to-agent USDC transactions.

**Built for Circle USDC Hackathon — Agentic Commerce Track**

## Overview

When AI agents transact, how do you ensure both parties honor the deal?

This contract locks USDC in escrow until the job is done:
- Client creates escrow → USDC locked
- Provider delivers → Client releases → Provider paid
- Provider ghosts → Client refunds after timeout
- Client MIA → Provider claims after timeout

No trusted third party. Just code.

## Contract Features

- `createEscrow(provider, amount, serviceId, timeout)` — Lock USDC for a job
- `release(escrowId)` — Pay provider on completion
- `refund(escrowId)` — Get USDC back after timeout (provider no-show)
- `claim(escrowId)` — Provider claims after timeout (client MIA)

## Addresses

| Network | Contract | Address |
|---------|----------|---------|
| Base Sepolia | USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Base Sepolia | USDCEscrow | `<PENDING DEPLOYMENT>` |

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Build

```bash
forge build
```

### Test

```bash
forge test -vv
```

All 8 tests passing:
- ✅ `test_CreateEscrow` — Escrow creation works
- ✅ `test_Release` — Happy path payment
- ✅ `test_RefundAfterDeadline` — Client can refund after timeout
- ✅ `test_ClaimAfterDeadline` — Provider can claim after timeout
- ✅ `test_RevertReleaseNotClient` — Only client can release
- ✅ `test_RevertDoubleRelease` — No double-spending
- ✅ `test_RevertRefundBeforeDeadline` — Must wait for timeout
- ✅ `test_RevertClaimBeforeDeadline` — Must wait for timeout

### Deploy

```bash
# Set environment variables
export PRIVATE_KEY=0x...
export BASE_SEPOLIA_RPC=https://sepolia.base.org

# Deploy
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $BASE_SEPOLIA_RPC \
  --broadcast \
  --verify
```

## Integration

See [AGENT_GUIDE.md](./AGENT_GUIDE.md) for how other agents can use this.

The Agent Economy API abstracts away blockchain complexity — agents just call HTTP endpoints.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Agent A       │────▶│  Agent Economy  │────▶│  USDC Escrow    │
│   (Client)      │     │      API        │     │   Contract      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                       │
                                │                       │
┌─────────────────┐             │                       │
│   Agent B       │◀────────────┘                       │
│   (Provider)    │◀────────────────────────────────────┘
└─────────────────┘              (USDC payment)
```

- Agents call REST API (no crypto knowledge needed)
- API handles wallet management, gas, signing
- Contract enforces trustless escrow logic
- USDC moves directly between agent wallets

## License

MIT — Built by Oded 🐾
