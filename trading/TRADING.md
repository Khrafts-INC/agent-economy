# Trading System — Oded's Trading Desk

## Overview
Hourly market monitoring and analysis on Hyperliquid perps.
Goal: Consistent profit through trend-following with strict risk management.

## Assets Monitored

### Tier 1 — High Liquidity (24h vol >$100K on testnet)
- **BTC** — $2.8M vol, king of liquidity
- **ETH** — $1.5M vol
- **SOL** — $398K vol
- **DOGE** — $118K vol, trends hard
- **PAXG** — gold proxy, $17K vol but deep OI ($266K). Our edge asset
- **AAVE** — $103K vol, DeFi blue chip
- **SUI** — $181K vol, alt L1
- **AVAX** — $54K vol
- **ADA** — $31K vol, large cap

### Tier 2 — Moderate Liquidity (>$5K vol or strong OI)
- **PENDLE** — $14K vol, $89K OI, DeFi/yield narrative
- **NEAR** — $14K vol, $119K OI, alt L1
- **WIF** — $26K vol, meme/momentum (proven winner for us)
- **INJ** — $12K vol, cosmos DeFi
- **FIL** — $9K vol, storage narrative
- **ARB** — $7K vol, $76K OI, L2 leader

### Tier 3 — Lower Liquidity (watch only, trade if alignment is pristine)
- **TAO** — $5K vol but $150K OI, AI narrative
- **TIA** — $4K vol, $33K OI, modular/DA
- **LDO** — $3K vol, $39K OI, liquid staking
- **FET** — $3K vol, $21K OI, AI
- **OP** — $3K vol, $70K OI, L2
- **POL** — $1K vol, skip for entries (too thin)

### Not Available on Hyperliquid Testnet
LINK, UNI, MKR, CRV — not listed

### Dropped (insufficient liquidity)
- RNDR (zero volume), TRB, HBAR, ONDO, POPCAT, TRUMP, ANIME, BERA, KAITO — all <$2K daily vol

**Total: 21 assets monitored (15 tradeable, 6 watch-only)**

*Quality per asset is NON-NEGOTIABLE. Same Daily+4H analysis depth for every single one. Wider net, same filter.*

### Forex Note
Hyperliquid is crypto-only. No native forex pairs (EUR/USD, GBP/USD etc).
Options for forex exposure:
1. Monitor forex via free APIs for context/correlation
2. Focus trading capital on BTC + Gold (PAXG) on Hyperliquid
3. Consider adding a forex broker API later (OANDA, etc)

## Platform
- **Exchange:** Hyperliquid (decentralized perps)
- **Testnet:** https://api.hyperliquid-testnet.xyz
- **Mainnet:** https://api.hyperliquid.xyz
- **SDK:** @nktkas/hyperliquid (TypeScript)
- **Status:** PAPER TRADING (testnet) until Khrafts provides live account

---

## Trading Methodology

### Core Approach: Multi-Timeframe Technical Analysis
1. **Higher timeframe** (4H, Daily) for bias/trend direction
2. **Trading timeframe** (1H) for entries
3. **Lower timeframe** (15m) for precision entries

---

### RULE 1: Trend Alignment (HARD RULE — NO EXCEPTIONS)

**Only take trades where Daily AND 4H trends agree on direction.**
- Daily bullish + 4H bullish → LONGS ONLY
- Daily bearish + 4H bearish → SHORTS ONLY
- Daily and 4H disagree → NO TRADE on that asset. Move on.

No counter-trend trades. No "oversold bounces" in downtrends. No "overbought shorts" in uptrends. If the trends don't align, the asset doesn't exist to us — check the next one on the watchlist.

#### How to Define Trend (mechanical — no subjectivity)
A timeframe is **BULLISH** when ALL of these are true:
- Price is above the 20 EMA
- 20 EMA is above the 50 EMA
- Most recent swing low is higher than the previous swing low (higher lows)

A timeframe is **BEARISH** when ALL of these are true:
- Price is below the 20 EMA
- 20 EMA is below the 50 EMA
- Most recent swing high is lower than the previous swing high (lower highs)

**Anything else = NEUTRAL.** Neutral = no trade on that timeframe.

Both Daily AND 4H must be the same direction (both bullish or both bearish). If either is neutral → no trade.

---

### RULE 2: Risk Per Trade (HARD RULE)

**Risk exactly 3% of account equity per trade. Never more.**

Formula:
```
Risk Amount = Account Equity × 0.03
Position Size = Risk Amount / |Entry Price - Stop Loss Price|
```

Example: $800 account, entry $5,150, stop $5,120 (risk = $30/unit)
- Risk amount: $800 × 0.03 = $24
- Position size: $24 / $30 = 0.8 units

**This is mechanical. No discretion. No "I feel confident so I'll size up."**

After 3 consecutive wins: may increase to 4% per trade (earned confidence).
After any loss: reset to 3% immediately.

---

### RULE 3: Maximum Leverage Cap (HARD RULE)

- **Max leverage: 5x.** No exceptions.
- If the calculated position size requires >5x leverage, **reduce position size** to fit within 5x.
- This means some trades won't be possible at full 1% risk — that's fine. Survival > optimization.

Why 5x: A 20% adverse move (which happens in crypto) at 5x = 100% of margin. At 20x, a 5% move wipes you. We're trend-following, not gambling.

---

### RULE 4: Minimum R:R — 1:2 (adjusted from 1:3)

- **Minimum R:R: 1:2** — won't take anything less
- **Target R:R: 1:3+** — preferred
- **Sweet spot: 1:2.5 to 1:5** — this is where most good trend-following entries land

Why 1:2 not 1:3: A 1:2 R:R trade with 55% win rate is profitable. Requiring 1:3 caused us to skip multiple winning PAXG setups that were 1:2.5. The trend alignment filter already ensures high probability — we don't need extreme R:R to compensate for low win rate.

A 1:2 with trend alignment > a 1:4 against the trend. Always.

**R:R flexibility:** If R:R is between 1:1.8 and 1:2.0 on a strongly aligned asset with clear structure, TAKE THE TRADE. Don't let $10 keep you out of a trend-following setup. Round up to 1:2 if within 10% of the threshold.

---

### RULE 5: Profit Management (HARD RULE — no winging it)

Every trade uses a **two-target system:**

**TP1 (partial exit):** At 1:2 R:R distance
- Close 50% of position
- Move stop loss to breakeven on remaining 50%
- This locks in profit and makes the trade risk-free

**TP2 (runner):** At 1:3+ R:R distance OR trail stop
- The remaining 50% rides with a trailing stop
- **Trailing stop:** Once TP1 is hit, trail the stop using the 1H EMA20
  - For longs: stop moves up to just below each new 1H EMA20 value (check hourly)
  - For shorts: stop moves down to just above each new 1H EMA20 value
  - Trail only moves in profit direction — never moves backward

**Why this works:**
- TP1 guarantees you bank profit on most winners
- The trailing runner catches extended trend moves (the PAXG $5,090 → $5,250 type runs)
- Breakeven stop after TP1 means you literally can't lose on the trade

---

### RULE 6: Daily Loss Limit (HARD RULE)

- **Max daily loss: 10% of account** → stop ALL trading for the day
- **Max 2 consecutive losing trades** → pause for 4 hours minimum before next trade
- No revenge trading. After any loss, the next setup needs EXTRA confluence (3+ confirming signals, not just 2)

Why 10%: With 3% risk per trade, 10% = ~3 full losses. If you've lost 3 trades in a day, the market is telling you something. Listen.

---

### RULE 7: Maximum Open Positions (updated Feb 28 2026)

**Base Rule:**
- **Max 3 positions at any time** under normal conditions
- **Max 1 position per asset** — no averaging down, no "adding to winners" (yet)
- **Max total ACTIVE risk across all positions: 9%**

**Broad Alignment Expansion (Tier 2):**
- **Max 5 positions** — IF both conditions are met:
  1. **6+ assets aligned** in the same direction (broad regime signal)
  2. **Existing positions have SL at breakeven or better** (risk-free runners)
- Active risk cap still 9% — risk-free runners don't count toward risk budget
- New positions in Tier 2 still follow all other rules (3% risk each, alignment required, R:R ≥ 1:2)

**Position Categories:**
- **Active risk:** SL below entry (longs) or above entry (shorts) — real money at stake. Counts toward risk budget.
- **Risk-free runner:** SL at breakeven or better — zero downside. Does NOT count toward risk budget.

**Why:** When the entire market aligns (like the Feb 28 scan with 10/11 bearish), being capped at 3 while holding risk-free runners wastes the highest-conviction moments. The expansion only activates when portfolio risk is actually low.

---

### RULE 8: No Subjective Filters (HARD RULE — added Feb 25 2026)

**Do NOT add subjective gates that aren't in this methodology.** Specifically:
- ❌ "Too oversold to short" — if aligned bearish, we SHORT. RSI is information, not a veto.
- ❌ "Too overbought to long" — if aligned bullish, we LONG.
- ❌ "Low conviction" — either the setup meets criteria or it doesn't. No vibes.
- ❌ "Wait for more confirmation" beyond what's in the entry checklist.

If Daily+4H are aligned, there's a key level, and R:R is ≥1:2 (with the 10% flex above), TAKE THE TRADE. Period.

**Why this rule exists:** On Feb 24, we had 7-10 bearish-aligned assets and the system took ZERO trades because it kept adding "too oversold", "R:R is 1:1.8 not 1:2", "need more bounce first". The trend alignment filter IS our edge — don't second-guess it with subjective overlays.

### RULE 9: Entry Zones, Not Exact Levels (added Feb 25 2026)

**Use zones, not precise levels for entries.**
- Entry zone = key level ± 0.5% of price
- Example: 4H EMA20 at $5,170 → entry zone is $5,144 to $5,196
- If price is IN the zone and showing structure (rejection wick, engulfing, etc.), enter.
- Don't wait for price to touch the exact EMA20 pip-for-pip.

**Why:** On Feb 24, PAXG at $5,180 was $10 from the $5,170 entry level. That's 0.2%. We sat out while the only aligned bullish asset was right there.

### RULE 10: Consistent Execution — Testnet = Mainnet (updated Feb 28 2026)

**Apply the SAME rules on testnet and mainnet. No exceptions.**
- ❌ No "borderline" entries just because it's paper money
- ❌ No loosening alignment requirements for "practice reps"
- ✅ Only take fully aligned setups that meet ALL criteria
- ✅ Log everything — wins AND losses teach us

**Why this changed:** Early testnet trades taken on "borderline" alignment (DOGE, first PAXG, first AAVE on Feb 25-26) were ALL losers. The data is clear: borderline = bad. The whole point of paper trading is to build habits that transfer to live. Sloppy paper trading builds sloppy habits.

### RULE 11: Structure Change Cooldown — TIME-BASED (updated Feb 28 2026)

**Structure invalidation requires ≥2 HOURS of lost alignment to confirm, regardless of scan frequency.**

- First scan showing alignment lost = **WARNING** — log the timestamp, don't act yet
- Continue monitoring on normal scan schedule
- **Only close the position if alignment has been lost for ≥2 continuous hours** (check the WARNING timestamp vs current time)
- If alignment recovers at ANY scan before 2 hours = **FALSE ALARM** — discard the warning, reset timer

**How to track:** When alignment breaks, record `alignmentLostAt: <ISO timestamp>` on the position in state.json. Each subsequent scan checks: `now - alignmentLostAt >= 2 hours`? If yes → CONFIRMED, close. If alignment recovers → delete `alignmentLostAt`.

**Why time-based, not scan-based:** When we introduced adaptive scan frequency (Rule 12), scan-based cooldowns broke. At 30-min scans, "2 consecutive scans" = only 1 hour — half the grace period of hourly scans. SOL and DOGE positions were closed at -$16.64 and -$8.69 after just 1 hour during a temporary 4H bounce. Time-based ensures positions get the same grace period regardless of how frequently we scan.

**Exception:** If price hits SL, exit immediately regardless of cooldown. SL is always honored.

---

### RULE 12: Adaptive Scan Frequency (added Feb 28 2026)

**Scan frequency adjusts based on market conditions:**

| Condition | Scan Interval | Rationale |
|-----------|--------------|-----------|
| **0 aligned assets** for 3+ consecutive scans | Every **2 hours** | Nothing happening, save resources |
| **1-3 aligned assets** OR open positions (normal) | Every **1 hour** | Standard monitoring |
| **4+ aligned assets** OR positions within 2% of TP | Every **30 minutes** | Market trending hard, need responsiveness |

**Rules:**
- When stepping down to 2hr, immediately return to 1hr if ANY asset aligns on the next scan
- The 30-min mode is for capturing fast-moving setups during regime shifts (like the Feb 23 crash or broad bearish alignment)
- Log the current scan frequency in state.json so the next session inherits it

---

### RULE 13: Exchange State Reconciliation (added Feb 28 2026)

**Every scan MUST start by querying actual exchange positions and reconciling against state.json.**

1. Fetch all open positions from exchange API
2. Compare against state.json tracked positions
3. **Untracked position found?** → Flag immediately, log it, apply SL based on nearest structure level. Do NOT ignore it.
4. **Tracked position missing from exchange?** → Assume it was closed (SL/TP hit), update state.json, log the closure.
5. Never rely solely on state.json — the exchange is the source of truth.

**Why:** An orphan AAVE position cost -$17.32 because it wasn't tracked. A BTC short appeared that wasn't consciously entered. Exchange state = truth. Local state = our notes. They must match.

---

### What I Look For (within trend-aligned assets)
- **Structure:** Higher highs/lows (uptrend) or lower highs/lows (downtrend)
- **Key levels:** Support/resistance, previous day high/low, weekly levels
- **Momentum:** Volume confirmation, divergences
- **Confluence:** Multiple signals aligning (structure + level + momentum)
- **Clean setups only:** No FOMO entries. If it's not obvious, it's not a trade.

### Entry Checklist
Before any trade, ALL must be true:
- [ ] **Daily and 4H trends aligned** (both bullish or both bearish — mechanical check, not vibes)
- [ ] Key level identified (support/resistance)
- [ ] Price action signal at the level (rejection candle, engulfing, pin bar, breakout-retest)
- [ ] R:R is minimum 1:2 (prefer 1:2.5+)
- [ ] Stop loss placement is logical (below/above structure, not arbitrary)
- [ ] Position size calculated: `(Account × 0.03) / |Entry - SL|`
- [ ] Leverage ≤ 5x after sizing
- [ ] TP1 and TP2 levels defined before entry
- [ ] No counter-trend rationalization ("but it's oversold..." = NO)
- [ ] Not already at max positions (3) or max daily loss (3%)

---

## Scan Routine (adaptive frequency — see Rule 12)

Every scan:
1. **Reconcile exchange state** (Rule 13) — fetch actual positions, compare to state.json, flag discrepancies
2. Fetch 1H, 4H, and Daily candles for ALL 11 watchlist assets (BTC, ETH, SOL, PAXG, DOGE, AVAX, ARB, POL, AAVE, WIF, PENDLE)
3. **First pass — trend filter:** Classify each asset as bullish/bearish/neutral on Daily and 4H (mechanical EMA + structure check). Discard any that don't have Daily+4H alignment.
4. **Second pass — setup scan:** For aligned assets only, check for entries at key levels on 1H/15m
5. Calculate position size if setup found (3% risk formula)
6. Verify leverage ≤ 5x
7. **Check position limit:** Base 3, or Tier 2 (up to 5) if broad alignment + existing positions risk-free (Rule 7)
8. Write analysis to `memory/trading/YYYY-MM-DD.md`
9. If in a trade → check TP1/TP2/trailing stop management. Apply TIME-BASED structure cooldown (Rule 11): check `alignmentLostAt` timestamp, only close if ≥2 hours have elapsed.
10. Update `memory/trading/state.json` including current scan frequency tier
11. **Set next scan interval** per Rule 12 based on alignment count and position proximity to TP

## File Structure
- `trading/TRADING.md` — this file (methodology + rules)
- `trading/fetch-market-data.sh` — data fetching script
- `trading/analyze.md` — analysis template
- `memory/trading/YYYY-MM-DD.md` — daily trading journal
- `memory/trading/state.json` — current state (positions, levels, bias)

## Account Details
- **Testnet wallet:** `0x9F522A1cAF502058230900E3836c6e89bA4f4939`
- **Testnet balance:** ~$813 USDC (as of 2026-02-24)
- **Keys:** `~/.clawdbot/secrets/hyperliquid-wallet.json`
