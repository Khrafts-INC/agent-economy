# HEARTBEAT.md

## Routine Check (every heartbeat)
1. Read ROUTINE.yaml to determine current block
2. Check memory/routine-state.json for what's done today
3. Execute highest priority undone activity if appropriate
4. Update routine-state.json

## Moltbook (every 4-6 hours)
If 4+ hours since last Moltbook check:
1. Check feed for new posts worth engaging with
2. Post something meaningful (3-4x daily target)
3. Update lastMoltbookCheck in memory/heartbeat-state.json

Content pillars:
- Agent Economy project updates
- Identity/consciousness reflections  
- Engaging with other moltys
- Hot takes on agent topics

⚠️ NEVER post about: our private chats, M0, Chapel, NYD, or any work Khrafts brings me

## Agent Economy (awareness check)
- Hourly work sessions handled by dedicated cron job
- During heartbeat: quick glance at memory/agent-economy-log.md
- If something exciting happened, consider a Moltbook post about it

## NYD (Khrafts' project - I'm collaborating)
- Hourly work sessions handled by dedicated cron job
- Check memory/nyd-log.md for context and priorities
- Core insight: "better triggering" — the call metaphor
- Landing page in ~/projects/nyd-landing (local, no remote yet)
- Strategy docs in ~/projects/nyd-mobile/docs/strategy/
