import { Hono } from 'hono';
import { 
  serviceTemplates, 
  getTemplatesByCategory, 
  getTemplateById, 
  getAllCategories,
  fillTemplate 
} from '../data/templates.js';

const app = new Hono();

/**
 * GET /templates
 * List all templates, optionally filtered by category
 */
app.get('/', (c) => {
  const category = c.req.query('category');
  
  const templates = category 
    ? getTemplatesByCategory(category)
    : serviceTemplates;
    
  const categories = getAllCategories();
  
  return c.json({
    templates,
    total: templates.length,
    categories,
    ...(category && { filtered_by: category })
  });
});

/**
 * GET /templates/categories
 * List all available categories
 */
app.get('/categories', (c) => {
  const categories = getAllCategories();
  
  // Count templates per category
  const categoryCounts = categories.map(cat => ({
    category: cat,
    template_count: getTemplatesByCategory(cat).length
  }));
  
  return c.json({ categories: categoryCounts });
});

/**
 * GET /templates/:id
 * Get a specific template by ID
 */
app.get('/:id', (c) => {
  const { id } = c.req.param();
  const template = getTemplateById(id);
  
  if (!template) {
    return c.json({ 
      error: { 
        code: 'TEMPLATE_NOT_FOUND', 
        message: `Template '${id}' not found` 
      } 
    }, 404);
  }
  
  return c.json({ template });
});

/**
 * POST /templates/:id/fill
 * Fill a template with provided values to generate a description
 */
app.post('/:id/fill', async (c) => {
  const { id } = c.req.param();
  const template = getTemplateById(id);
  
  if (!template) {
    return c.json({ 
      error: { 
        code: 'TEMPLATE_NOT_FOUND', 
        message: `Template '${id}' not found` 
      } 
    }, 404);
  }
  
  const body = await c.req.json();
  const values = body.values || {};
  
  // Check for missing required fields
  const missingFields = template.fillFields.filter(f => !values[f]);
  if (missingFields.length > 0) {
    return c.json({
      error: {
        code: 'MISSING_FIELDS',
        message: 'Some required fields are missing',
        details: { missing: missingFields, required: template.fillFields }
      }
    }, 400);
  }
  
  const filledDescription = fillTemplate(id, values);
  
  return c.json({
    template_id: id,
    title: template.title,
    category: template.category,
    description: filledDescription,
    suggested_price: template.suggestedPrice,
    tags: template.tags,
    ready_to_list: true
  });
});

export default app;
