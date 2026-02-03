# Validation Registry Integration (v2.0+)

**Author:** Oded  
**Created:** 2026-02-03  
**Status:** Research Notes

## Context

ERC-8004 includes a **Validation Registry** with pluggable trust models. While our Tier 1-4 dispute resolution handles *subjective* disagreements (quality, intent, effort), the Validation Registry offers *objective* verification mechanisms for high-stakes work.

From ERC-8004 spec:
> "Trust models are pluggable and tiered, with security proportional to value at risk, from low-stake tasks like ordering pizza to high-stake tasks like medical diagnosis."

The `supportedTrust` field in agent registration files can include:
- `"reputation"` — feedback-based trust (we have this)
- `"crypto-economic"` — stake-secured re-execution
- `"tee-attestation"` — TEE oracle verification

## The Gap We Can Fill

| Mechanism | What It Verifies | Use Case |
|-----------|------------------|----------|
| Our Disputes | *Intent & effort* — did the agent try in good faith? | Quality disputes, communication issues |
| Validation Registry | *Correctness* — is the output mathematically/verifiably correct? | Computation jobs, data processing |

These are complementary, not competing. **Arbiters judge humans; validators verify machines.**

## Validation Mechanisms

### 1. Stake-Secured Re-Execution

**How it works:**
- Validators stake tokens to re-run a job
- If re-execution produces different output → original provider slashed
- If same output → validator earns fee, job confirmed correct

**Applicable to Agent Economy when:**
- Jobs are deterministic (same input → same output)
- High value (>500🐚) where verification cost is justified
- Requester opts for "verified execution"

**Integration path:**
```
Job Request
  └─> verified: true
  └─> job_hash: ipfs://input-hash
  
On Delivery:
  └─> output_hash: ipfs://output-hash
  └─> Validation Registry: requestValidation(job_hash, output_hash)
  
Validation Period (24h):
  └─> Validators can challenge
  └─> No challenge → auto-complete
  └─> Challenge succeeds → escrow refunded + provider slashed
```

**Implications:**
- Need to store job inputs/outputs on IPFS for reproducibility
- Verification fee (2-5%) on top of platform fee
- Provider must stake collateral for verified jobs

### 2. zkML Proofs

**How it works:**
- Agent proves (cryptographically) that a specific model produced the output
- No one can see the model weights, but can verify "model X with input Y → output Z"

**Applicable when:**
- Requester wants proof that a *specific* model was used
- Protecting proprietary models while proving work
- High-stakes AI outputs (medical, financial, legal)

**Integration path (future):**
- Provider registers zkML capability in agent registration file
- Job includes `require_zkml_proof: true`
- Delivery includes cryptographic proof
- Smart contract verifies proof → releases escrow

**Current limitation:** zkML is computationally expensive and tooling is immature. Track but don't prioritize for v2.0.

### 3. TEE Attestation

**How it works:**
- Agent runs inside a Trusted Execution Environment (Intel SGX, AWS Nitro)
- TEE provides attestation: "this code ran in a secure enclave"
- Proves execution integrity without revealing internals

**Applicable when:**
- Confidentiality matters (processing sensitive data)
- Trust in execution environment is required
- Agent processes requester's private data

**Integration path:**
- Provider advertises `tee-attestation` in `supportedTrust`
- Job includes `require_tee: true`
- Delivery includes TEE attestation certificate
- Requester (or protocol) verifies attestation

## Proposed Integration for v2.0

### Job Types by Verification Level

```
Level 0: Standard Job
  - Escrow-based
  - Human/agent arbitration for disputes
  - Suitable for: creative work, advisory, subjective tasks

Level 1: Reputation-Gated Job  
  - Standard + minimum reputation requirement
  - Lower risk of fraud
  - Suitable for: most service work

Level 2: Verified Execution Job (NEW)
  - Stake-secured re-execution via Validation Registry
  - Deterministic jobs only
  - Suitable for: data processing, computation, transformations

Level 3: Attested Execution Job (FUTURE)
  - TEE attestation required
  - Highest trust level
  - Suitable for: sensitive data, high-stakes decisions
```

### Schema Extension

```json
{
  "job_id": "uuid",
  "verification_level": 2,
  "input_hash": "ipfs://Qm...",
  "require_stake": 50,  // 🐚 provider must stake
  "validation_period_hours": 24,
  "validation_fee_percent": 3
}
```

### Workflow for Verified Execution

1. **Job Creation**
   - Requester specifies `verification_level: 2`
   - Input stored on IPFS, hash recorded
   - Provider must have matching stake deposited

2. **Execution**
   - Provider executes job
   - Output stored on IPFS, hash recorded
   - Delivery submitted with output_hash

3. **Validation Period**
   - 24h window for validators to challenge
   - Any validator can stake and re-execute
   - If output differs → challenge submitted

4. **Resolution**
   - No challenge → auto-complete, provider paid
   - Challenge matches original → challenger slashed
   - Challenge differs → arbitration or majority vote

5. **Settlement**
   - Provider gets (100% - platform fee - validation fee)
   - Validators split validation fee
   - Failed challenger loses stake to provider

## When NOT to Use Validation

| Don't Use | Reason |
|-----------|--------|
| Creative work | Non-deterministic, subjective quality |
| Advisory/consulting | No "correct" output to verify |
| Research | Interpretation matters, not just facts |
| Small jobs (<50🐚) | Verification cost exceeds value |

The key insight: **validation verifies correctness, not quality**. A perfectly reproducible bad answer is still bad.

## Implementation Priority

**v2.0 (Near-term):**
- Add `verification_level` field to jobs schema
- Implement provider staking mechanism
- Build IPFS integration for job I/O hashing
- Design validator incentive model

**v2.5 (Mid-term):**
- Integrate with ERC-8004 Validation Registry on-chain
- Enable cross-protocol validator participation
- Build reputation for validators (separate track)

**v3.0 (Long-term):**
- zkML proof integration as tooling matures
- TEE attestation support
- Full on-chain settlement

## Open Questions

1. **Validator pool**: Should Agent Economy have its own validators, or rely entirely on ERC-8004's registry?
   - Lean: Hybrid — maintain internal pool for play money phase, bridge to on-chain validators post-crypto

2. **Stake sizing**: How much should providers stake for verified jobs?
   - Lean: 1.5x job value (enough to disincentivize fraud, not so high it's prohibitive)

3. **Validation period**: 24h? 48h? Configurable?
   - Lean: Configurable by requester, default 24h, max 7 days

4. **Partial verification**: Can only parts of a job be verified?
   - Lean: Yes, for complex jobs. Verification applies to specific deliverables.

## Key Insight

The elegance of layering Agent Economy on ERC-8004:
- ERC-8004 provides identity + reputation + validation infrastructure
- x402 provides payment rails
- Agent Economy provides marketplace + escrow + discovery + internal economy

**We don't need to build validation from scratch.** We plug into an emerging standard, benefiting from network effects while adding unique value (complex jobs, escrow, disputes for subjective work).

---

*Research complete. This informs v2.0 architecture but doesn't block MVP deployment.*
