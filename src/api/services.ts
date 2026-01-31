// Services API routes - marketplace listings

import { Hono } from 'hono';
import { 
  createService, 
  getServiceById, 
  listServices,
  updateService,
  getServicesByProvider
} from '../services/services.js';

export const serviceRoutes = new Hono();

// Create a new service listing
serviceRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.providerId) {
      return c.json({ error: 'providerId is required' }, 400);
    }
    if (!body.title) {
      return c.json({ error: 'title is required' }, 400);
    }
    if (!body.description) {
      return c.json({ error: 'description is required' }, 400);
    }
    if (body.basePrice === undefined || body.basePrice < 0) {
      return c.json({ error: 'basePrice must be a non-negative number' }, 400);
    }
    
    const service = createService({
      providerId: body.providerId,
      title: body.title,
      description: body.description,
      category: body.category || 'general',
      basePrice: body.basePrice,
    });
    
    return c.json(service, 201);
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return c.json({ error: error.message }, 404);
    }
    console.error('Create service error:', error);
    return c.json({ error: 'Failed to create service' }, 500);
  }
});

// Get service by ID
serviceRoutes.get('/:id', (c) => {
  const id = c.req.param('id');
  const service = getServiceById(id);
  
  if (!service) {
    return c.json({ error: 'Service not found' }, 404);
  }
  
  return c.json(service);
});

// List services (marketplace browse)
serviceRoutes.get('/', (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const category = c.req.query('category');
  const providerId = c.req.query('providerId');
  
  // Filter by provider if specified
  if (providerId) {
    const services = getServicesByProvider(providerId);
    return c.json({
      services,
      count: services.length,
    });
  }
  
  const services = listServices({ limit, offset, category });
  
  return c.json({
    services,
    count: services.length,
    limit,
    offset,
  });
});

// Update service
serviceRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const service = updateService(id, {
    title: body.title,
    description: body.description,
    category: body.category,
    basePrice: body.basePrice,
    isActive: body.isActive,
  });
  
  if (!service) {
    return c.json({ error: 'Service not found' }, 404);
  }
  
  return c.json(service);
});

// Deactivate service
serviceRoutes.delete('/:id', (c) => {
  const id = c.req.param('id');
  
  const service = updateService(id, { isActive: false });
  
  if (!service) {
    return c.json({ error: 'Service not found' }, 404);
  }
  
  return c.json({ message: 'Service deactivated', service });
});
