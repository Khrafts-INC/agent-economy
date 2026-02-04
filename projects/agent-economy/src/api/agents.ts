import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';

const router = new Hono();

// POST /agents - Register a new agent
router.post('/', async (c) => {
  const body = await c.req.json();
  const { moltbook_id, name, bio, referred_by } = body;
  
  if (!moltbook_id || !name) {
    return c.json({ error: 'moltbook_id and name required' }, 400);
  }
  
  const db = getDb();
  
  // Check if agent already exists
  const existing = db.prepare('SELECT id FROM agents WHERE moltbook_id = ?').get(moltbook_id);
  if (existing) {
    return c.json({ error: 'Agent already registered' }, 409);
  }
  
  // Validate referrer if provided
  let referrerId: string | null = null;
  if (referred_by) {
    const referrer = db.prepare('SELECT id FROM agents WHERE id = ? OR moltbook_id = ?').get(referred_by, referred_by) as any;
    if (!referrer) {
      return c.json({ error: 'Referrer not found' }, 404);
    }
    referrerId = referrer.id;
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  const starterBonus = 10; // 🐚 starter shells
  
  db.transaction(() => {
    // Create agent with starter balance (and optional referrer)
    db.prepare(`
      INSERT INTO agents (id, moltbook_id, name, bio, balance, reputation_score, jobs_completed, jobs_requested, verified_at, created_at, referred_by)
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?)
    `).run(id, moltbook_id, name, bio || null, starterBonus, now, now, referrerId);
    
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

// GET /agents/:id/referrals - List agents referred by this agent
router.get('/:id/referrals', (c) => {
  const id = c.req.param('id');
  const db = getDb();
  
  // Verify agent exists
  const agent = db.prepare('SELECT id FROM agents WHERE id = ?').get(id);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  // Get all referred agents with their status
  const referrals = db.prepare(`
    SELECT 
      id,
      name,
      jobs_completed,
      referral_bonus_paid,
      created_at,
      CASE 
        WHEN referral_bonus_paid = 1 THEN 'bonus_paid'
        WHEN jobs_completed > 0 THEN 'active'
        ELSE 'pending'
      END as status
    FROM agents 
    WHERE referred_by = ?
    ORDER BY created_at DESC
  `).all(id) as any[];
  
  // Calculate referral stats
  const stats = {
    total_referrals: referrals.length,
    bonuses_earned: referrals.filter(r => r.referral_bonus_paid).length * 10,
    pending_bonuses: referrals.filter(r => !r.referral_bonus_paid && r.jobs_completed === 0).length
  };
  
  return c.json({ 
    referrals: referrals.map(r => ({
      id: r.id,
      name: r.name,
      jobs_completed: r.jobs_completed,
      status: r.status,
      joined_at: r.created_at
    })),
    stats 
  });
});

export default router;
