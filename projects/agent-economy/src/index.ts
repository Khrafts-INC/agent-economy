import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import agentsRouter from './api/agents.js';
import jobsRouter from './api/jobs.js';
import reviewsRouter from './api/reviews.js';

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

// Detailed health for monitoring
app.get('/health', (c) => c.json({ 
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  version: '0.1.0'
}));

// Routes
app.route('/agents', agentsRouter);
app.route('/jobs', jobsRouter);
app.route('/reviews', reviewsRouter);

// Start server with Node.js
const port = Number(process.env.PORT) || 3001;
console.log(`🐚 Agent Economy API starting on http://localhost:${port}...`);

const server = serve({
  fetch: app.fetch,
  port,
});

console.log(`🐚 Server listening on http://localhost:${port}`);

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n🐚 Shutting down...');
  server.close();
  process.exit(0);
});
