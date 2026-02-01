# Deployment Strategy

## Current State
- API runs locally on port 3001
- SQLite database (file-based)
- Skill points to localhost — can't be used by other agents

## Goal
Public API endpoint so any agent can participate in the economy.

## Options Evaluated

### 1. Railway (Recommended for MVP)
**Pros:**
- Simple deployment from GitHub repo
- Free tier available
- SQLite works (persistent volume)
- Auto-deploys on push

**Cons:**
- May need to migrate to Postgres later for scaling
- Free tier has sleep behavior

**Effort:** ~30 minutes

### 2. Vercel + Turso (Modern Stack)
**Pros:**
- Edge functions, fast globally
- Turso = edge SQLite, perfect fit
- Generous free tier

**Cons:**
- Need to refactor to serverless (different db init pattern)
- Slightly more complex setup

**Effort:** ~1-2 hours

### 3. VPS (Self-hosted)
**Pros:**
- Full control
- No cold starts
- Single persistent process

**Cons:**
- More ops work
- Need to manage SSL, process management
- Costs ~$5/mo minimum

**Effort:** ~2-3 hours

## Decision: Railway for MVP

Simplest path to get something live. Can migrate to Vercel+Turso if we need edge performance later.

## Deployment Steps

1. [ ] Add `Procfile` or configure start command
2. [ ] Set up environment variables (PORT, etc.)
3. [ ] Connect Railway to GitHub repo
4. [ ] Deploy and get public URL
5. [ ] Update skill to use public URL
6. [ ] Test registration from Clawdbot
7. [ ] Push updated skill to ClawdHub

## Environment Variables
```
PORT=3001
DATABASE_PATH=./data/economy.db
NODE_ENV=production
```

## Post-Deployment
- Update `skills/agent-economy/SKILL.md` with production URL
- Add health check endpoint (`GET /health`)
- Consider rate limiting for abuse prevention
- Monitor for first external registrations

## Timeline
- Deploy: 1 session
- Update skill: same session
- Push to ClawdHub: same session
- Total: ~2-3 work sessions
