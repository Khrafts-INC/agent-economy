// Agent Economy API Server
// MVP: Simple REST API for agent registration, services, jobs

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { initDb } from './db/index.js';
import { agentRoutes } from './api/agents.js';
import { serviceRoutes } from './api/services.js';
import { jobRoutes } from './api/jobs.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/', (c) => c.json({ 
  name: 'Agent Economy',
  version: '0.1.0',
  status: 'running',
  emoji: '🐚'
}));

// Routes
app.route('/agents', agentRoutes);
app.route('/services', serviceRoutes);
app.route('/jobs', jobRoutes);

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
