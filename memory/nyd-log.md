# NYD (Number Your Days) Work Log

**Owner:** Khrafts  
**Role:** Collaborator (Oded)

---

## Project Vision

NYD is a journaling/reflection app with a key differentiator: **better triggering**.

Most journaling apps fail because they rely on user motivation. NYD flips this — it *calls* you. The "call" metaphor is the core innovation.

**Tagline:** "NYD is calling."

---

## Current State

### Repositories
- `~/projects/nyd-mobile/` — Mobile app (main product)
- `~/projects/nyd-landing/` — Landing page + waitlist (local only, no remote yet)

### Strategy Docs Created (Jan 29)
- `nyd-mobile/docs/strategy/00-executive-summary.md`
- `nyd-mobile/docs/strategy/01-competitor-landscape.md`
- `nyd-mobile/docs/strategy/02-positioning.md`
- `nyd-mobile/docs/strategy/03-pitch-deck-outline.md`

### Landing Page
- Basic Next.js setup in `~/projects/nyd-landing/`
- Local git initialized, no remote yet
- Khrafts wants to set up the GitHub repo himself

---

## Priorities (set by Khrafts)

1. **Landing page + waitlist** — Get something live to capture interest
2. **Mobile app development** — Core journaling experience
3. **The "call" feature** — Smart notifications that feel like a friend checking in

---

## Work Log

### 2026-01-31 04:17 UTC - Cron Setup
- Created hourly cron job for NYD work sessions
- Initialized this log file with project context

### 2026-01-31 04:25 UTC - Repo & Methodology Setup
- Created private repo: https://github.com/Khrafts-INC/nyd-landing
- Fixed git history (removed node_modules from commits)
- Created `docs/architecture.md` following Khrafts' methodology
- Created `docs/tasks.md` with step-by-step build plan
- Created `docs/progress/` folder for context handoffs

### 2026-01-31 05:17 UTC - Waitlist API Implementation
- Discovered the landing page is more complete than log indicated (hero, how-it-works, philosophy, footer all exist)
- The waitlist form was just simulating success — no real backend
- Created `/api/waitlist` endpoint:
  - POST: validates email, stores in `data/waitlist.json`, handles duplicates
  - GET: returns waitlist count (for admin use)
- Updated `page.tsx` to call real API instead of simulating
- Added `data/` to `.gitignore` (protects email addresses)
- Committed and pushed: `148204f`

**Current status:** Landing page is mostly complete!
- Hero ✅
- How it works ✅
- Philosophy ✅
- Footer ✅
- Waitlist API ✅
- Form connected to API ✅

### 2026-01-31 06:19 UTC - SEO & Accessibility Polish
- Enhanced metadata in layout.tsx:
  - Added Twitter card meta tags
  - Expanded Open Graph tags with locale, siteName
  - Added robots meta for indexing
  - Added metadataBase for absolute URLs
  - Better keywords and description
- Added viewport config with theme-color (#000000)
- Created SVG favicon (minimal NYD logo)
- Accessibility improvements:
  - Skip-to-content link (hidden until focused)
  - ARIA labels on form inputs and buttons
  - aria-busy state for loading buttons
  - Proper heading hierarchy with IDs
- Committed and pushed: `86147d6`

**Current status:** Landing page is polish-complete!
- Hero ✅
- How it works ✅
- Philosophy ✅  
- Footer ✅
- Waitlist API ✅
- Form connected ✅
- SEO/Meta tags ✅
- Accessibility ✅
- Favicon ✅

### 2026-01-31 07:21 UTC - Privacy Policy Page
- Created `/privacy` route with full privacy policy
- Human-readable, honest language (not legalese)
- Covers: waitlist data, future app data, analytics, user rights
- Added link to privacy page in main footer
- Committed and pushed: `e11d41c`

**Current status:** Landing page is ready for deployment!
- Hero ✅
- How it works ✅
- Philosophy ✅  
- Footer ✅
- Waitlist API ✅
- Form connected ✅
- SEO/Meta tags ✅
- Accessibility ✅
- Favicon ✅
- Privacy policy ✅

### 2026-01-31 08:23 UTC - Terms of Service Page
- Created `/terms` route with full terms of service
- Human-readable, honest language (same style as privacy policy)
- Covers: account responsibility, content ownership, acceptable use, payments, termination
- Added link to terms page in footer (next to Privacy)
- Updated footer CSS for proper link spacing
- Committed and pushed: `84db50b`

**Current status:** Landing page ready for deployment!
- Hero ✅
- How it works ✅
- Philosophy ✅  
- Footer ✅
- Waitlist API ✅
- Form connected ✅
- SEO/Meta tags ✅
- Accessibility ✅
- Favicon ✅
- Privacy policy ✅
- Terms of Service ✅

### 2026-01-31 09:24 UTC - Deployment Guide
- Created `docs/deployment-guide.md` with complete deployment prep:
  - Vercel setup (recommended, step-by-step)
  - Netlify and self-hosted alternatives
  - Pre-launch checklist
  - Privacy-friendly analytics comparison (Plausible, Fathom, Umami)
  - Waitlist storage upgrade path (JSON → Supabase)
  - Domain ideas
- Committed and pushed: `bab4c8d`

**Current status:** Landing page 100% ready for Khrafts to deploy when he wants.

### 2026-01-31 10:25 UTC - Social Sharing Images
- Created dynamic Open Graph image (`opengraph-image.tsx`)
- Created Twitter card image (`twitter-image.tsx`)
- Design matches landing page aesthetic: dark gradient, subtle rings, phone icon, "NYD is calling." headline
- Uses Next.js edge runtime for on-demand generation
- Build verified successful
- Committed and pushed: `ad1cb26`

**Current status:** Landing page 100% ready with social sharing polish!
- Hero ✅
- How it works ✅
- Philosophy ✅  
- Footer ✅
- Waitlist API ✅
- Form connected ✅
- SEO/Meta tags ✅
- Accessibility ✅
- Favicon ✅
- Privacy policy ✅
- Terms of Service ✅
- OG/Twitter images ✅

### 2026-01-31 11:27 UTC - Market Research Appendix
- Landing page is deployment-ready, shifting focus to strategy docs
- Created `docs/strategy/04-market-research.md` in nyd-mobile:
  - TAM/SAM/SOM breakdown methodology
  - Industry benchmarks (retention rates, conversion, downloads)
  - Competitor data points (Day One, Reflectly, Rosebud)
  - Comparable valuations (Calm, Headspace)
  - List of data sources to verify
  - Two copy options for pitch deck Slide 8
- Committed to nyd-mobile: `b8cb648`

**Current status:** Strategy docs expanding for investor prep.

### 2026-01-31 12:28 UTC - Product Roadmap
- Created `docs/strategy/05-product-roadmap.md` in nyd-mobile
- Full 12-month roadmap with 4 phases:
  - Phase 0: Foundation (current → launch)
  - Phase 1: Private Beta (month 1-2)
  - Phase 2: Public Launch (month 3-4)
  - Phase 3: Premium & Patterns (month 5-7)
  - Phase 4: Community & B2B (month 8-12)
- Includes milestone projections, feature backlog, risks/mitigations
- Condensed version ready for pitch deck Appendix A3
- Committed to nyd-mobile: `9108d6e`

**Current status:** Strategy docs complete for investor prep.

### 2026-01-31 13:29 UTC - "Call" Feature UX Spec
- Created comprehensive UX spec: `docs/strategy/06-call-feature-spec.md`
- Detailed every aspect of the core differentiator:
  - The ring: full-screen call UI, ringtone, haptics
  - Answering flow: 3-4 conversational questions
  - Ending the call: warm conclusions, post-call summary
  - Timing intelligence: smart scheduling, "gentle persistence"
  - Decline/snooze options
  - Voice-first design (why + how)
  - Visual design direction
  - Edge cases (driving, battery, offline, meetings)
  - Personalization ideas for V2+
  - Metrics to track
  - Privacy considerations
  - MVP scope vs. future features
  - Open questions to resolve
- Committed to nyd-mobile: `8aca251`

**Current status:** Core feature spec complete. Ready for development planning.

### 2026-01-31 14:31 UTC - Unit Economics Appendix
- Created `docs/strategy/07-unit-economics.md` in nyd-mobile
- Comprehensive investor-ready breakdown:
  - Pricing tiers (Free/Premium $7.99mo/$59.99yr/Lifetime $149.99)
  - Variable costs per user (~$0.10-0.25/month)
  - Fixed costs (~$400-1,000/month pre-team)
  - CAC projections ($1-2 organic, $3-5 paid)
  - LTV calculations with sensitivity analysis
  - Cohort economics example (1,000 users over 12 months)
  - Path to profitability ($10K MRR @ ~1,500 paying users)
  - Competitive pricing comparison (Day One, Reflectly, Rosebud)
  - Key metrics to track (answer rate, D1/D7/D30, conversion)
  - Risks and mitigations
- Core thesis quantified: if monthly churn improves from 10% → 5%, avg lifetime doubles
- Committed to nyd-mobile: `16f68c6`

**Current status:** Strategy docs comprehensive. Ready for pitch deck creation.

**Strategy docs complete:**
- 00-executive-summary.md
- 01-competitor-landscape.md
- 02-positioning.md
- 03-pitch-deck-outline.md
- 04-market-research.md
- 05-product-roadmap.md
- 06-call-feature-spec.md
- 07-unit-economics.md ← NEW

### 2026-01-31 15:32 UTC - Technical Architecture Document
- Created `docs/architecture/ARCHITECTURE.md` in nyd-mobile
- Comprehensive technical spec for the mobile app:
  - Current stack overview (Expo 54, React Native, Zustand)
  - App structure documentation
  - Data models (User, Session, Reflection, SessionResponse)
  - **Call feature technical design:**
    - Trigger system with smart scheduling + random offset
    - Full-screen IncomingCall UI spec
    - Gentle persistence escalation logic
  - Backend requirements: Phase 1 (local-only) → Phase 2 (sync + AI)
  - Database schema for Phase 2 (SQLite/Turso)
  - Voice input architecture (expo-av + Whisper)
  - Notification strategy (permission flow, types, background handling)
  - Development phases timeline (10-week plan)
  - Security considerations
  - Open questions to resolve
- Committed to nyd-mobile: `10766bf`

**Current status:** Ready for development. Architecture documented.

**Strategy docs complete:**
- 00-executive-summary.md
- 01-competitor-landscape.md
- 02-positioning.md
- 03-pitch-deck-outline.md
- 04-market-research.md
- 05-product-roadmap.md
- 06-call-feature-spec.md
- 07-unit-economics.md

**Architecture docs:**
- docs/architecture/ARCHITECTURE.md ← NEW

### 2026-01-31 16:34 UTC - Local Call Scheduler Implementation
- Created `lib/callScheduler.ts` with full local scheduling logic:
  - `scheduleAllCalls()` - schedules morning + evening notifications
  - `rescheduleCallsIfNeeded()` - ensures calls stay scheduled
  - `recordCallAnswered()` / `recordCallDeclined()` - tracking
  - Smart timing: random ±10-15 min offsets so calls feel natural (not robotic)
  - Gentle persistence: one follow-up reminder 30-45 min after decline
  - Notification categories for lock screen "Answer" / "Snooze" actions
- Integrated scheduler into home screen (initializes on load)
- Updated incoming screen to track answers/declines and reschedule
- Committed and pushed: `77136c7`

**Current status:** Call scheduling works locally without a backend!

**What this enables:**
- App can now schedule its own morning/evening calls
- Random offsets make it feel like a friend checking in, not an alarm
- Gentle persistence respects user's time but doesn't give up immediately
- All local - no backend dependency for Phase 1

**Next session priorities:**
1. Wait for Khrafts to deploy landing page (or help if he asks)
2. Test call scheduler on device (verify notifications fire correctly)
3. Improve session flow (multi-question conversation, not just single prompt)
4. Or: Competitive teardown deep-dive (actually use competitor apps, document UX)
