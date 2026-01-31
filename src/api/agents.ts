// Agent API routes

import { Hono } from 'hono';
import { 
  registerAgent, 
  getAgentById, 
  getAgentByMoltbookId,
  listAgents,
  updateAgent
} from '../services/agents.js';

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
