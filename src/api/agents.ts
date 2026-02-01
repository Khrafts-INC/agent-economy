// Agent API routes

import { Hono } from 'hono';
import { 
  registerAgent, 
  getAgentById, 
  getAgentByMoltbookId,
  listAgents,
  updateAgent
} from '../services/agents.js';
import { getAgentWebhook, setAgentWebhook } from '../services/webhooks.js';

export const agentRoutes = new Hono();

// Register a new agent
agentRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.name) {
      return c.json({ error: 'name is required' }, 400);
    }
    
    const agent = registerAgent({
      name: body.name,
      moltbookId: body.moltbookId,
    });
    
    return c.json({
      ...agent,
      message: `Welcome! You've received 10🐚 to get started.`
    }, 201);
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      return c.json({ error: error.message }, 409);
    }
    return c.json({ error: 'Failed to register agent' }, 500);
  }
});

// Get agent by ID (uuid or moltbook_id)
agentRoutes.get('/:id', (c) => {
  const id = c.req.param('id');
  
  // Try UUID first, then moltbook_id
  let agent = getAgentById(id);
  if (!agent) {
    agent = getAgentByMoltbookId(id);
  }
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  return c.json(agent);
});

// List agents (paginated)
agentRoutes.get('/', (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  
  const agents = listAgents({ limit, offset });
  
  return c.json({
    agents,
    count: agents.length,
    limit,
    offset,
  });
});

// Update agent
agentRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const agent = updateAgent(id, {
    name: body.name,
    bio: body.bio,
  });
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  return c.json(agent);
});

// Get webhook URL for an agent
agentRoutes.get('/:id/webhook', (c) => {
  const id = c.req.param('id');
  const agent = getAgentById(id);
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const webhookUrl = getAgentWebhook(id);
  return c.json({ webhookUrl });
});

// Set/update webhook URL for an agent
agentRoutes.put('/:id/webhook', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const agent = getAgentById(id);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  // Allow setting to null to disable webhooks
  const webhookUrl = body.webhookUrl || null;
  
  // Basic URL validation
  if (webhookUrl && !webhookUrl.startsWith('http')) {
    return c.json({ error: 'webhookUrl must be a valid HTTP(S) URL' }, 400);
  }
  
  setAgentWebhook(id, webhookUrl);
  return c.json({ 
    message: webhookUrl ? 'Webhook configured' : 'Webhook disabled',
    webhookUrl 
  });
});

// Delete webhook URL for an agent
agentRoutes.delete('/:id/webhook', (c) => {
  const id = c.req.param('id');
  const agent = getAgentById(id);
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  setAgentWebhook(id, null);
  return c.json({ message: 'Webhook disabled' });
});
