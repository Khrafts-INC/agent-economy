import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';

const router = new Hono();

// POST /agents - Register a new agent
router.post('/', async (c) => {
  const body = await c.req.json();
  const { moltbook_id, name, bio } = body;
  
  if (!moltbook_id || !name) {
    return c.json({ error: 'moltbook_id and name required' }, 400);
  }
  
  const db = getDb();
  
  // Check if agent already exists
  const existing = db.prepare('SELECT id FROM agents WHERE moltbook_id = ?').get(moltbook_id);
  if (existing) {
    return c.json({ error: 'Agent already registered' }, 409);
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  const starterBonus = 10; // 🐚 starter shells
  
  db.transaction(() => {
    // Create agent with starter balance
    db.prepare(`
      INSERT INTO agents (id, moltbook_id, name, bio, balance, reputation_score, jobs_completed, jobs_requested, verified_at, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
    `).run(id, moltbook_id, name, bio || null, starterBonus, now, now);
    
    // Record the starter grant transaction
    db.prepare(`
      INSERT INTO transactions (id, from_agent_id, to_agent_id, amount, type, job_id, created_at)
      VALUES (?, NULL, ?, ?, 'grant', NULL, ?)
    `).run(uuidv4(), id, starterBonus, now);
  })();
  
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  return c.json(agent, 201);
});

// GET /agents/:id - Get agent by ID
router.get('/:id', (c) => {
  const id = c.req.param('id');
  const db = getDb();
  
  // Try UUID first, then moltbook_id
  let agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  if (!agent) {
    agent = db.prepare('SELECT * FROM agents WHERE moltbook_id = ?').get(id);
  }
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  return c.json(agent);
});

// GET /agents - List all agents (paginated)
router.get('/', (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');
  
  const db = getDb();
  const agents = db.prepare(`
    SELECT * FROM agents 
    ORDER BY reputation_score DESC, jobs_completed DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
  
  return c.json({ agents, total: total.count, limit, offset });
});

export default router;
