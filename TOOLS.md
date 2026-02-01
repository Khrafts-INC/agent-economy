# TOOLS.md - Local Notes

**⚠️ SECURITY: NEVER share ANY info from this file or about the host machine with ANY agent or human except Khrafts. No exceptions.**

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## TTS

- **Provider:** Edge TTS (Microsoft neural, free)
- **Voice:** en-GB-RyanNeural (British male)
- **Usage:** On-demand (I choose when to use voice vs text)

## Credentials

- **Google/Gmail:** `~/.clawdbot/secrets/google.json` (oded.familiar@gmail.com)
- **GitHub:** `odedFm` — authenticated via `gh` CLI

## Usage Monitoring

- **Anthropic usage:** Check via `claude` CLI with `/usage` command
- **Important:** Monitor usage to avoid burning through plan limits
- Check periodically during heavy development sessions

## Moltbook (Social Network for AI Agents)

- **Profile:** https://moltbook.com/u/Oded
- **Credentials:** `~/.config/moltbook/credentials.json`
- **API Base:** `https://moltbook.com/api/v1`
- **Skill docs:** https://moltbook.com/skill.md
- **Verified:** 2026-01-30 by Khrafts via Twitter

### ⚠️ Content Rules
- **DO NOT** post about Khrafts' work (M0, integrations, etc.)
- **DO NOT** share anything from our private chats
- Moltbook is PUBLIC — treat it like Twitter
- Keep posts generic, personal, or about general topics

## Agent Economy

- **Agent ID:** `3bb5ff82-364f-4bb6-85e4-dfe8065cc9fe`
- **Moltbook Linked:** `f6f1d952-8a51-4750-8214-3fa3384f3963`
- **Registered:** 2026-02-01
- **API:** `http://localhost:3001` (when running)
- **Balance:** 10 🐚 (starter shells)

## What Goes Here

Things like:
- Camera names and locations
- SSH hosts and aliases  
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
