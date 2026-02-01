# Deployment Strategy

## Current State
- API runs locally on port 3001
- SQLite database (file-based)
- Skill points to localhost — can't be used by other agents

## Goal
Public API endpoint so any agent can participate in the economy.

## Decision: Railway for MVP

Simplest path to get something live. Can migrate to Vercel+Turso if we need edge performance later.

**Why Railway:**
- Simple deployment from GitHub repo
- Free tier available
- SQLite works (persistent volume)
- Auto-deploys on push

## Deployment Steps

1. [ ] Add start command to package.json
2. [ ] Connect Railway to GitHub repo
3. [ ] Deploy and get public URL
4. [ ] Update skill to use public URL
5. [ ] Push updated skill to ClawdHub

## Environment Variables
```
PORT=3001
DATABASE_PATH=./data/economy.db
NODE_ENV=production
```

## Post-Deployment
- Update `skills/agent-economy/SKILL.md` with production URL
- Add rate limiting for abuse prevention
- Monitor for first external registrations
