import { Hono } from 'hono';
import { getDb } from '../db/index.js';
import { randomUUID } from 'crypto';

const servicesRouter = new Hono();

// Create a new service listing
servicesRouter.post('/', (c) => {
  const db = getDb();
  
  return c.req.json().then(body => {
    const { agent_id, title, description, category, base_price } = body;
    
    if (!agent_id || !title || !category || base_price === undefined) {
      return c.json({ error: 'agent_id, title, category, and base_price are required' }, 400);
    }
    
    // Verify agent exists
    const agent = db.prepare('SELECT id FROM agents WHERE id = ?').get(agent_id);
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    const id = randomUUID();
    const created_at = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO services (id, agent_id, title, description, category, base_price, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, agent_id, title, description || null, category, base_price, created_at);
    
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    return c.json(service, 201);
  });
});

// Browse marketplace - list services with optional filters
servicesRouter.get('/', (c) => {
  const db = getDb();
  const category = c.req.query('category');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');
  
  let query = `
    SELECT s.*, a.name as agent_name, a.reputation_score as agent_reputation
    FROM services s
    JOIN agents a ON s.agent_id = a.id
    WHERE s.active = 1
  `;
  const params: any[] = [];
  
  if (category) {
    query += ' AND s.category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY a.reputation_score DESC, s.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const services = db.prepare(query).all(...params);
  
  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM services WHERE active = 1';
  if (category) {
    countQuery += ' AND category = ?';
  }
  const { total } = db.prepare(countQuery).get(...(category ? [category] : [])) as { total: number };
  
  return c.json({ services, total, limit, offset });
});

// Get service by ID
servicesRouter.get('/:id', (c) => {
  const db = getDb();
  const id = c.req.param('id');
  
  const service = db.prepare(`
    SELECT s.*, a.name as agent_name, a.reputation_score as agent_reputation, a.jobs_completed as agent_jobs
    FROM services s
    JOIN agents a ON s.agent_id = a.id
    WHERE s.id = ?
  `).get(id);
  
  if (!service) {
    return c.json({ error: 'Service not found' }, 404);
  }
  
  return c.json(service);
});

// Update service
servicesRouter.patch('/:id', (c) => {
  const db = getDb();
  const id = c.req.param('id');
  
  return c.req.json().then(body => {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    if (!service) {
      return c.json({ error: 'Service not found' }, 404);
    }
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (body.title !== undefined) {
      updates.push('title = ?');
      params.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      params.push(body.description);
    }
    if (body.category !== undefined) {
      updates.push('category = ?');
      params.push(body.category);
    }
    if (body.base_price !== undefined) {
      updates.push('base_price = ?');
      params.push(body.base_price);
    }
    if (body.active !== undefined) {
      updates.push('active = ?');
      params.push(body.active ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }
    
    params.push(id);
    db.prepare(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    
    const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    return c.json(updated);
  });
});

// Deactivate service (soft delete)
servicesRouter.delete('/:id', (c) => {
  const db = getDb();
  const id = c.req.param('id');
  
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  if (!service) {
    return c.json({ error: 'Service not found' }, 404);
  }
  
  db.prepare('UPDATE services SET active = 0 WHERE id = ?').run(id);
  return c.json({ message: 'Service deactivated' });
});

export default servicesRouter;
