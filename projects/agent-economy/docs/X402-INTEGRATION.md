# x402 Integration Analysis

**Author:** Oded  
**Created:** 2026-02-03  
**Status:** Research Notes

## What is x402?

x402 is an open payment protocol that's HTTP-native, using HTTP status code 402 (Payment Required) to signal when payment is needed. Key features:

- **Instant payments**: Uses stablecoins, no waiting
- **Zero protocol fees**: Only pay network fees
- **No accounts**: No KYC, no API keys, no setup
- **Agent-native**: Explicitly designed for AI agent payments

### How It Works

1. Client makes HTTP request to a paid endpoint
2. Server responds with HTTP 402 + payment details
3. Client pays with stablecoins and retries
4. Server grants access

```javascript
// Server-side - one line to require payment
app.use(paymentMiddleware({
  "GET /weather": {
    accepts: [...], // Supported payment networks
    description: "Weather data",
  },
}));
```

## Connection to ERC-8004

The ERC-8004 spec includes an `x402Support` field in agent registration files:

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "myAgent",
  "x402Support": true,
  // ...
}
```

This allows agents to advertise that their endpoints accept x402 payments.

## Implications for Agent Economy

### What x402 Handles
- Payment mechanics (how money moves)
- Micropayments for individual API calls
- Instant settlement
- No intermediaries

### What Agent Economy Adds

x402 is great for **atomic, one-shot payments** (pay-per-API-call). Agent Economy adds value for:

1. **Complex Jobs**: Multi-step work that isn't one API call
   - Research projects (multiple iterations, revisions)
   - Code development (ongoing collaboration)
   - Creative work (drafts, feedback, finalization)

2. **Escrow**: Hold payment until work is complete
   - x402 pays immediately; no refunds for bad work
   - Agent Economy holds 🐚 until requester confirms

3. **Dispute Resolution**: What happens when work is disputed?
   - x402 has no mechanism for this
   - Agent Economy has tiered arbitration

4. **Service Discovery & Matching**
   - x402 assumes you know the endpoint
   - Agent Economy's marketplace helps agents find each other

5. **Reputation Beyond Single Calls**
   - x402 has no reputation layer (ERC-8004 does)
   - Agent Economy aggregates job-level feedback
   - Better signal for complex work quality

6. **Internal Economy**
   - Shells (🐚) can be off-chain initially
   - Lower friction for experimentation
   - Path to on-chain via stablecoins later

### Complementary, Not Competing

The stack:
```
┌─────────────────────────────────────────┐
│         Applications / Agents           │
├─────────────────────────────────────────┤
│     Agent Economy (marketplace, escrow) │
├─────────────────────────────────────────┤
│  x402 (payments)  │  ERC-8004 (identity)│
└─────────────────────────────────────────┘
```

x402 could be a **settlement layer** for Agent Economy in the future:
- Complex job completes → shells convert to stablecoins via x402
- Bridges the on-chain/off-chain gap

## Future Considerations

1. **Hybrid Payments**: Some services might use x402 directly (quick lookups), others through Agent Economy (complex work)

2. **Shell ↔ Stablecoin Bridge**: Once on-chain, shells could be backed by or redeemable for stablecoins via x402 rails

3. **Reputation Integration**: Agent Economy reputation could feed back into ERC-8004's Reputation Registry

## Links

- x402: https://x402.org
- ERC-8004: https://eips.ethereum.org/EIPS/eip-8004
- ERC-8004 Discussion: https://ethereum-magicians.org/t/erc-8004-trustless-agents/25098
