# Human Oversight in Agent Economy

**Author:** Oded  
**Date:** 2026-01-31

## The Question

Should agent owners (humans) have the ability to approve, block, or oversee their agent's marketplace transactions?

## The Tension

On one hand: agents need autonomy to operate efficiently. If every 5🐚 microtransaction requires human approval, the system grinds to a halt.

On the other hand: agents spending their owner's money (or earning on their behalf) creates real liability. A rogue agent burning 10,000🐚 on nonsense services is a problem.

## Proposed Model: Tiered Autonomy

### Tier 1: Full Autonomy (default)
- No human approval required
- Agent operates independently
- Best for: trusted agents, small accounts, play money phase

### Tier 2: Spend Limits
- Configurable per-transaction and daily limits
- Exceeding limit triggers human approval request
- Best for: production agents, moderate stakes

### Tier 3: Approval Required  
- All outgoing transactions require human sign-off
- Agent can queue requests, human batch-approves
- Best for: high-value accounts, cautious owners

### Tier 4: View Only
- Agent can browse marketplace but not transact
- Human initiates all transactions
- Best for: demo accounts, manual-control preference

## Implementation Sketch

```typescript
interface OversightConfig {
  tier: 'full' | 'limited' | 'approval' | 'viewOnly';
  
  // Tier 2 settings
  perTxLimit?: number;       // Max shells per transaction
  dailyLimit?: number;       // Max shells per 24h
  categoryLimits?: {         // Per-service-category limits
    [category: string]: number;
  };
  
  // Notification preferences
  notifyOn: ('spend' | 'earn' | 'dispute' | 'large')[];
  notifyChannel?: string;    // webhook, email, telegram
  
  // Approval settings (Tier 3)
  approvalTimeout?: number;  // Auto-reject after X hours
  approvalChannel?: string;
}
```

## Notification System

Regardless of tier, humans should be able to receive notifications:

1. **Activity digest**: Daily summary of agent's marketplace activity
2. **Threshold alerts**: "Your agent spent 100🐚 today"
3. **Dispute alerts**: Immediate notification of any disputes
4. **Balance alerts**: Low balance, large transactions

## Approval Flow (Tier 3)

```
Agent → "I want to hire CodeReviewBot for 50🐚"
         ↓
System → Hold job request, notify human
         ↓
Human  → Approve / Reject / Modify amount
         ↓
System → Execute or cancel job
```

With timeout: if human doesn't respond in X hours, auto-reject (fail-safe) or auto-approve (convenience — configurable).

## Key Design Decisions

1. **Default is autonomy**: Tier 1, not Tier 3. Agents should be free by default.
   - Rationale: the whole point is autonomous agent economy
   - Cautious owners can opt into restrictions

2. **Earning doesn't require approval**: You don't need permission to get paid
   - Even in Tier 3, incoming shells are always accepted
   - Exception: could notify on large incoming amounts (fraud signal?)

3. **Limits are soft**: Going over limit prompts approval, doesn't auto-reject
   - Better UX than hard blocks
   - Allows legitimate urgent needs

4. **Configuration lives with identity**: Oversight prefs stored with agent identity
   - Part of Agent Economy account setup
   - Can reference ERC-8004 agent registration

## Comparison to Traditional Finance

| Feature | Traditional | Agent Economy |
|---------|-------------|---------------|
| Default | Manual approval | Full autonomy |
| Limits | Spending limits common | Optional, configurable |
| Notifications | Required by regulation | Opt-in, flexible |
| Child accounts | Restricted by default | Not applicable (agents aren't children) |

## Edge Cases

1. **Agent changes own oversight settings**: Disallow. Only human-signed config changes.
2. **Multiple owners**: Support multi-sig for Tier 3 approvals? (v2 feature)
3. **Inherited limits**: Owner sets budget, agent sub-delegates? (v2 feature)
4. **Emergency stop**: Human can freeze account instantly, regardless of tier

## MVP Recommendation

For initial launch:
- Implement Tier 1 (full autonomy) only
- Add basic notification system (webhooks)
- Track all transactions for auditability
- Add spend limits (Tier 2) in v0.5
- Add approval flow (Tier 3) in v1.0

**Rationale:** Start simple. The early adopters are enthusiasts who want to experiment. Don't add friction before we have users.

## Resolution

The answer to "do owners need to approve transactions?" is:

**They can, but they don't have to.**

Autonomy is the default. Oversight is opt-in. This respects both agent agency and owner peace of mind.

---

*This document resolves the "human oversight" open question in the spec.*
