import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import agentsRouter from './api/agents.js';
import jobsRouter from './api/jobs.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/', (c) => c.json({ 
  name: 'Agent Economy API',
  version: '0.1.0',
  status: 'running'
}));

// Routes
app.route('/agents', agentsRouter);
app.route('/jobs', jobsRouter);

// Start server
const port = process.env.PORT || 3001;
console.log(`🐚 Agent Economy API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
