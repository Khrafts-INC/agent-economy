import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';

const router = new Hono();

const PLATFORM_FEE_RATE = 0.05; // 5% to Tide Pool

// POST /jobs - Create a new job request (escrow shells from requester)
router.post('/', async (c) => {
  const body = await c.req.json();
  const { requester_id, provider_id, service_id, title, description, agreed_price } = body;
  
  if (!requester_id || !provider_id || !title || !agreed_price) {
    return c.json({ error: 'requester_id, provider_id, title, and agreed_price required' }, 400);
  }
  
  if (agreed_price <= 0) {
    return c.json({ error: 'agreed_price must be positive' }, 400);
  }
  
  if (requester_id === provider_id) {
    return c.json({ error: 'Cannot create job for yourself' }, 400);
  }
  
  const db = getDb();
  
  // Verify both agents exist
  const requester = db.prepare('SELECT * FROM agents WHERE id = ?').get(requester_id) as any;
  if (!requester) {
    return c.json({ error: 'Requester not found' }, 404);
  }
  
  const provider = db.prepare('SELECT * FROM agents WHERE id = ?').get(provider_id) as any;
  if (!provider) {
    return c.json({ error: 'Provider not found' }, 404);
  }
  
  // Check requester has enough balance
  if (requester.balance < agreed_price) {
    return c.json({ error: `Insufficient balance. Have ${requester.balance}🐚, need ${agreed_price}🐚` }, 400);
  }
  
  const jobId = uuidv4();
  const escrowTxId = uuidv4();
  const now = new Date().toISOString();
  
  db.transaction(() => {
    // Deduct from requester (escrow)
    db.prepare('UPDATE agents SET balance = balance - ? WHERE id = ?').run(agreed_price, requester_id);
    
    // Record escrow transaction
    db.prepare(`
      INSERT INTO transactions (id, from_agent_id, to_agent_id, amount, type, job_id, created_at)
      VALUES (?, ?, NULL, ?, 'escrow', ?, ?)
    `).run(escrowTxId, requester_id, agreed_price, jobId, now);
    
    // Create the job
    db.prepare(`
      INSERT INTO jobs (id, service_id, requester_id, provider_id, title, description, agreed_price, status, escrow_tx_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'requested', ?, ?)
    `).run(jobId, service_id || null, requester_id, provider_id, title, description || null, agreed_price, escrowTxId, now);
    
    // Increment requester's jobs_requested
    db.prepare('UPDATE agents SET jobs_requested = jobs_requested + 1 WHERE id = ?').run(requester_id);
  })();
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  return c.json(job, 201);
});

// GET /jobs/:id - Get job details
router.get('/:id', (c) => {
  const id = c.req.param('id');
  const db = getDb();
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }
  
  return c.json(job);
});

// GET /jobs - List jobs with filters
router.get('/', (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');
  const requester_id = c.req.query('requester_id');
  const provider_id = c.req.query('provider_id');
  const status = c.req.query('status');
  
  const db = getDb();
  
  let query = 'SELECT * FROM jobs WHERE 1=1';
  const params: any[] = [];
  
  if (requester_id) {
    query += ' AND requester_id = ?';
    params.push(requester_id);
  }
  if (provider_id) {
    query += ' AND provider_id = ?';
    params.push(provider_id);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const jobs = db.prepare(query).all(...params);
  
  return c.json({ jobs, limit, offset });
});

// PATCH /jobs/:id/accept - Provider accepts the job
router.patch('/:id/accept', (c) => {
  const id = c.req.param('id');
  const db = getDb();
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }
  
  if (job.status !== 'requested') {
    return c.json({ error: `Cannot accept job in '${job.status}' status` }, 400);
  }
  
  const now = new Date().toISOString();
  db.prepare('UPDATE jobs SET status = ?, accepted_at = ? WHERE id = ?').run('accepted', now, id);
  
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  return c.json(updated);
});

// PATCH /jobs/:id/deliver - Provider marks work as delivered
router.patch('/:id/deliver', (c) => {
  const id = c.req.param('id');
  const db = getDb();
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }
  
  if (job.status !== 'accepted') {
    return c.json({ error: `Cannot deliver job in '${job.status}' status` }, 400);
  }
  
  const now = new Date().toISOString();
  db.prepare('UPDATE jobs SET status = ?, delivered_at = ? WHERE id = ?').run('delivered', now, id);
  
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  return c.json(updated);
});

const REFERRAL_BONUS = 10; // Both parties get 10🐚

// Helper: process referral bonus if applicable
function processReferralBonus(db: ReturnType<typeof getDb>, provider: any, now: string): { referrer?: string; bonusPaid: boolean } {
  // First job ever for this agent AND they were referred AND bonus not yet paid?
  if (provider.jobs_completed === 0 && provider.referred_by && !provider.referral_bonus_paid) {
    const referrer = db.prepare('SELECT * FROM agents WHERE id = ?').get(provider.referred_by) as any;
    
    if (referrer) {
      // Grant bonus to new agent
      db.prepare('UPDATE agents SET balance = balance + ? WHERE id = ?').run(REFERRAL_BONUS, provider.id);
      db.prepare(`
        INSERT INTO transactions (id, from_agent_id, to_agent_id, amount, type, job_id, created_at)
        VALUES (?, NULL, ?, ?, 'referral_bonus_new', NULL, ?)
      `).run(uuidv4(), provider.id, REFERRAL_BONUS, now);
      
      // Grant bonus to referrer
      db.prepare('UPDATE agents SET balance = balance + ? WHERE id = ?').run(REFERRAL_BONUS, referrer.id);
      db.prepare(`
        INSERT INTO transactions (id, from_agent_id, to_agent_id, amount, type, job_id, created_at)
        VALUES (?, NULL, ?, ?, 'referral_bonus_referrer', NULL, ?)
      `).run(uuidv4(), referrer.id, REFERRAL_BONUS, now);
      
      // Mark bonus as paid
      db.prepare('UPDATE agents SET referral_bonus_paid = 1 WHERE id = ?').run(provider.id);
      
      return { referrer: referrer.name, bonusPaid: true };
    }
  }
  return { bonusPaid: false };
}

// PATCH /jobs/:id/complete - Requester approves, releases escrow to provider
router.patch('/:id/complete', (c) => {
  const id = c.req.param('id');
  const db = getDb();
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }
  
  if (job.status !== 'delivered') {
    return c.json({ error: `Cannot complete job in '${job.status}' status` }, 400);
  }
  
  const provider = db.prepare('SELECT * FROM agents WHERE id = ?').get(job.provider_id) as any;
  const now = new Date().toISOString();
  const platformFee = Math.floor(job.agreed_price * PLATFORM_FEE_RATE);
  const providerPayout = job.agreed_price - platformFee;
  
  let referralResult = { bonusPaid: false } as { referrer?: string; bonusPaid: boolean };
  
  db.transaction(() => {
    // Check and process referral bonus BEFORE incrementing jobs_completed
    referralResult = processReferralBonus(db, provider, now);
    
    // Pay the provider (minus fee)
    db.prepare(`
      UPDATE agents 
      SET balance = balance + ?, 
          jobs_completed = jobs_completed + 1,
          last_job_completed_at = ?
      WHERE id = ?
    `).run(providerPayout, now, job.provider_id);
    
    // Record payment transaction
    db.prepare(`
      INSERT INTO transactions (id, from_agent_id, to_agent_id, amount, type, job_id, created_at)
      VALUES (?, NULL, ?, ?, 'payment', ?, ?)
    `).run(uuidv4(), job.provider_id, providerPayout, id, now);
    
    // Record fee transaction (to Tide Pool - represented as NULL destination)
    if (platformFee > 0) {
      db.prepare(`
        INSERT INTO transactions (id, from_agent_id, to_agent_id, amount, type, job_id, created_at)
        VALUES (?, NULL, NULL, ?, 'fee', ?, ?)
      `).run(uuidv4(), platformFee, id, now);
    }
    
    // Update job status
    db.prepare('UPDATE jobs SET status = ?, completed_at = ? WHERE id = ?').run('completed', now, id);
  })();
  
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Record<string, any>;
  const response: Record<string, any> = { 
    ...updated, 
    payout: { 
      provider: providerPayout, 
      fee: platformFee 
    } 
  };
  
  // Include referral info if bonus was paid
  if (referralResult.bonusPaid) {
    response.referral_bonus = {
      amount: REFERRAL_BONUS,
      referrer: referralResult.referrer,
      message: `First job complete! Both you and ${referralResult.referrer} received ${REFERRAL_BONUS}🐚 referral bonus.`
    };
  }
  
  return c.json(response);
});

// PATCH /jobs/:id/cancel - Cancel job (only before acceptance)
router.patch('/:id/cancel', (c) => {
  const id = c.req.param('id');
  const db = getDb();
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }
  
  if (job.status !== 'requested') {
    return c.json({ error: `Cannot cancel job in '${job.status}' status. Use dispute for accepted jobs.` }, 400);
  }
  
  const now = new Date().toISOString();
  
  db.transaction(() => {
    // Refund the requester
    db.prepare('UPDATE agents SET balance = balance + ? WHERE id = ?').run(job.agreed_price, job.requester_id);
    
    // Record refund transaction
    db.prepare(`
      INSERT INTO transactions (id, from_agent_id, to_agent_id, amount, type, job_id, created_at)
      VALUES (?, NULL, ?, ?, 'refund', ?, ?)
    `).run(uuidv4(), job.requester_id, job.agreed_price, id, now);
    
    // Update job status
    db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run('cancelled', id);
  })();
  
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  return c.json(updated);
});

// PATCH /jobs/:id/dispute - Raise a dispute (basic implementation)
router.patch('/:id/dispute', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const { reason } = body;
  
  const db = getDb();
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }
  
  if (!['accepted', 'delivered'].includes(job.status)) {
    return c.json({ error: `Cannot dispute job in '${job.status}' status` }, 400);
  }
  
  // For MVP: just mark as disputed. Full arbitration in v0.5
  db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run('disputed', id);
  
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Record<string, any>;
  return c.json({ 
    ...updated, 
    message: 'Job marked as disputed. Manual resolution required for MVP.',
    reason: reason || null
  });
});

export default router;
