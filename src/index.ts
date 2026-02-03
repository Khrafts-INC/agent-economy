// Agent Economy API Server
// MVP: Simple REST API for agent registration, services, jobs

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { initDb } from './db/index.js';
import { agentRoutes } from './api/agents.js';
import { serviceRoutes } from './api/services.js';
import { jobRoutes } from './api/jobs.js';
import { reviewRoutes } from './api/reviews.js';
import templateRoutes from './api/templates.js';
import { 
  registrationLimiter, 
  jobLimiter, 
  serviceLimiter, 
  readLimiter 
} from './middleware/rateLimiter.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Rate limiting (applied before route handlers)
// Strict limits on writes, relaxed on reads
app.post('/agents', registrationLimiter);
app.post('/agents/*', registrationLimiter);
app.post('/jobs', jobLimiter);
app.post('/jobs/*', jobLimiter);
app.put('/jobs/*', jobLimiter);
app.post('/services', serviceLimiter);
app.get('*', readLimiter);

// Health check
app.get('/', (c) => c.json({ 
  name: 'Agent Economy',
  version: '0.1.0',
  status: 'running',
  emoji: '🐚'
}));

// Detailed health for monitoring
app.get('/health', (c) => c.json({ 
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  version: '0.1.0'
}));

// Economy stats - includes activity mining status
app.get('/stats', (c) => {
  const { getDb } = require('./db/index.js');
  const db = getDb();
  
  const stats = {
    agents: (db.prepare('SELECT COUNT(*) as count FROM agents').get() as any).count,
    services: (db.prepare("SELECT COUNT(*) as count FROM services WHERE is_active = 1").get() as any).count,
    jobs: {
      total: (db.prepare('SELECT COUNT(*) as count FROM jobs').get() as any).count,
      completed: (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'").get() as any).count,
      active: (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status IN ('requested', 'accepted', 'delivered')").get() as any).count,
    },
    activityMining: {
      threshold: 10,
      completedJobs: (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'").get() as any).count,
      bonusRemaining: Math.max(0, 10 - (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'").get() as any).count),
      bonusPerParty: 5,
      active: (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'").get() as any).count < 10,
    },
    tidePool: {
      // Sum of all platform fees collected
      totalFees: (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'platform_fee'").get() as any).total,
    },
  };
  
  return c.json(stats);
});

// Routes
app.route('/agents', agentRoutes);
app.route('/services', serviceRoutes);
app.route('/jobs', jobRoutes);
app.route('/reviews', reviewRoutes);
app.route('/templates', templateRoutes);

// Initialize database and start server
import { serve } from '@hono/node-server';

initDb();

const PORT = parseInt(process.env.PORT || '3001');

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`🐚 Agent Economy API running at http://localhost:${info.port}`);
});
