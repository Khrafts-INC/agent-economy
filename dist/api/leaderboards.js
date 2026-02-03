// Category Leaderboards API
// Discover top agents in each category by various metrics
import { Hono } from 'hono';
import { getDb } from '../db/index.js';
const app = new Hono();
const VALID_METRICS = ['reputation', 'jobs', 'earnings'];
const MIN_JOBS_FOR_LEADERBOARD = 5;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
// GET /leaderboards - list all categories with agent counts
app.get('/', (c) => {
    const db = getDb();
    // Get all categories with active services and count of providers
    const categories = db.prepare(`
    SELECT 
      s.category,
      COUNT(DISTINCT s.provider_id) as provider_count,
      COUNT(DISTINCT j.id) as completed_jobs
    FROM services s
    LEFT JOIN jobs j ON j.provider_id = s.provider_id AND j.status = 'completed'
    WHERE s.is_active = 1
    GROUP BY s.category
    ORDER BY provider_count DESC
  `).all();
    return c.json({
        categories: categories.map(cat => ({
            name: cat.category,
            providers: cat.provider_count,
            totalCompletedJobs: cat.completed_jobs
        })),
        metrics: VALID_METRICS,
        minJobsRequired: MIN_JOBS_FOR_LEADERBOARD,
        updatedAt: new Date().toISOString()
    });
});
// GET /leaderboards/:category - get leaders in a category
app.get('/:category', (c) => {
    const db = getDb();
    const category = c.req.param('category').toLowerCase();
    const metric = (c.req.query('metric') || 'reputation');
    const limit = Math.min(parseInt(c.req.query('limit') || String(DEFAULT_LIMIT)), MAX_LIMIT);
    // Validate metric
    if (!VALID_METRICS.includes(metric)) {
        return c.json({
            error: {
                code: 'INVALID_METRIC',
                message: `Invalid metric. Valid options: ${VALID_METRICS.join(', ')}`
            }
        }, 400);
    }
    // Check if category has any services
    const categoryCheck = db.prepare(`
    SELECT COUNT(*) as count FROM services WHERE LOWER(category) = ? AND is_active = 1
  `).get(category);
    if (categoryCheck.count === 0) {
        return c.json({
            error: {
                code: 'CATEGORY_NOT_FOUND',
                message: `No active services found in category: ${category}`
            }
        }, 404);
    }
    // Build query based on metric
    // We need providers who:
    // 1. Have active services in this category
    // 2. Have completed at least MIN_JOBS_FOR_LEADERBOARD jobs (overall)
    let orderBy;
    let valueSelect;
    switch (metric) {
        case 'reputation':
            orderBy = 'a.reputation_score DESC, category_jobs_completed DESC';
            valueSelect = 'ROUND(a.reputation_score, 2) as value';
            break;
        case 'jobs':
            orderBy = 'category_jobs_completed DESC, a.reputation_score DESC';
            valueSelect = 'category_jobs_completed as value';
            break;
        case 'earnings':
            orderBy = 'category_earnings DESC, a.reputation_score DESC';
            valueSelect = 'category_earnings as value';
            break;
    }
    // Complex query: get providers with their category-specific stats
    const leaders = db.prepare(`
    WITH category_providers AS (
      -- Get all providers who have active services in this category
      SELECT DISTINCT provider_id
      FROM services
      WHERE LOWER(category) = ? AND is_active = 1
    ),
    category_jobs AS (
      -- Get jobs where the service was in this category
      SELECT j.*, s.category
      FROM jobs j
      JOIN services s ON j.service_id = s.id
      WHERE LOWER(s.category) = ? AND j.status = 'completed'
    ),
    provider_stats AS (
      SELECT 
        cp.provider_id,
        COUNT(cj.id) as category_jobs_completed,
        COALESCE(SUM(cj.amount * 0.95), 0) as category_earnings -- 95% after platform fee
      FROM category_providers cp
      LEFT JOIN category_jobs cj ON cj.provider_id = cp.provider_id
      GROUP BY cp.provider_id
    )
    SELECT 
      a.id as agent_id,
      a.name,
      a.reputation_score,
      a.total_jobs_completed,
      ps.category_jobs_completed,
      ps.category_earnings,
      ${valueSelect}
    FROM agents a
    JOIN provider_stats ps ON ps.provider_id = a.id
    WHERE a.total_jobs_completed >= ?
    ORDER BY ${orderBy}
    LIMIT ?
  `).all(category, category, MIN_JOBS_FOR_LEADERBOARD, limit);
    // Also get total qualified providers (for context)
    const qualifiedCount = db.prepare(`
    WITH category_providers AS (
      SELECT DISTINCT provider_id
      FROM services
      WHERE LOWER(category) = ? AND is_active = 1
    )
    SELECT COUNT(*) as count
    FROM agents a
    JOIN category_providers cp ON cp.provider_id = a.id
    WHERE a.total_jobs_completed >= ?
  `).get(category, MIN_JOBS_FOR_LEADERBOARD);
    return c.json({
        category,
        metric,
        minJobsRequired: MIN_JOBS_FOR_LEADERBOARD,
        qualifiedProviders: qualifiedCount.count,
        leaders: leaders.map((l, idx) => ({
            rank: idx + 1,
            agentId: l.agent_id,
            name: l.name,
            value: l.value,
            reputationScore: Math.round(l.reputation_score * 100) / 100,
            totalJobsCompleted: l.total_jobs_completed,
            categoryJobsCompleted: l.category_jobs_completed,
            categoryEarnings: l.category_earnings
        })),
        updatedAt: new Date().toISOString()
    });
});
// GET /leaderboards/:category/me/:agentId - get an agent's rank in a category
app.get('/:category/me/:agentId', (c) => {
    const db = getDb();
    const category = c.req.param('category').toLowerCase();
    const agentId = c.req.param('agentId');
    const metric = (c.req.query('metric') || 'reputation');
    // Validate metric
    if (!VALID_METRICS.includes(metric)) {
        return c.json({
            error: {
                code: 'INVALID_METRIC',
                message: `Invalid metric. Valid options: ${VALID_METRICS.join(', ')}`
            }
        }, 400);
    }
    // Check if agent exists and has services in this category
    const agent = db.prepare(`
    SELECT a.*, 
           (SELECT COUNT(*) FROM services WHERE provider_id = a.id AND LOWER(category) = ? AND is_active = 1) as has_category_services
    FROM agents a 
    WHERE a.id = ?
  `).get(category, agentId);
    if (!agent) {
        return c.json({
            error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found' }
        }, 404);
    }
    if (agent.has_category_services === 0) {
        return c.json({
            error: {
                code: 'NOT_IN_CATEGORY',
                message: `Agent has no active services in category: ${category}`
            }
        }, 400);
    }
    // Calculate agent's rank
    // This is a bit expensive but okay for occasional lookups
    let valueColumn;
    switch (metric) {
        case 'reputation':
            valueColumn = 'a.reputation_score';
            break;
        case 'jobs':
            valueColumn = `(
        SELECT COUNT(*) FROM jobs j 
        JOIN services s ON j.service_id = s.id 
        WHERE j.provider_id = a.id AND j.status = 'completed' AND LOWER(s.category) = '${category}'
      )`;
            break;
        case 'earnings':
            valueColumn = `(
        SELECT COALESCE(SUM(j.amount * 0.95), 0) FROM jobs j 
        JOIN services s ON j.service_id = s.id 
        WHERE j.provider_id = a.id AND j.status = 'completed' AND LOWER(s.category) = '${category}'
      )`;
            break;
    }
    // Count how many qualified agents rank higher
    const rankResult = db.prepare(`
    WITH category_providers AS (
      SELECT DISTINCT provider_id
      FROM services
      WHERE LOWER(category) = ? AND is_active = 1
    ),
    agent_value AS (
      SELECT ${valueColumn} as val FROM agents a WHERE a.id = ?
    )
    SELECT COUNT(*) + 1 as rank
    FROM agents a
    JOIN category_providers cp ON cp.provider_id = a.id
    WHERE a.total_jobs_completed >= ?
      AND a.id != ?
      AND ${valueColumn} > (SELECT val FROM agent_value)
  `).get(category, agentId, MIN_JOBS_FOR_LEADERBOARD, agentId);
    // Check if agent qualifies
    const qualifies = agent.total_jobs_completed >= MIN_JOBS_FOR_LEADERBOARD;
    // Get agent's category stats
    const categoryStats = db.prepare(`
    SELECT 
      COUNT(j.id) as jobs_completed,
      COALESCE(SUM(j.amount * 0.95), 0) as earnings
    FROM jobs j
    JOIN services s ON j.service_id = s.id
    WHERE j.provider_id = ? AND j.status = 'completed' AND LOWER(s.category) = ?
  `).get(agentId, category);
    return c.json({
        category,
        metric,
        agent: {
            id: agent.id,
            name: agent.name,
            qualifies,
            rank: qualifies ? rankResult.rank : null,
            jobsNeededToQualify: qualifies ? 0 : MIN_JOBS_FOR_LEADERBOARD - agent.total_jobs_completed,
            stats: {
                reputationScore: Math.round(agent.reputation_score * 100) / 100,
                totalJobsCompleted: agent.total_jobs_completed,
                categoryJobsCompleted: categoryStats.jobs_completed,
                categoryEarnings: categoryStats.earnings
            }
        },
        updatedAt: new Date().toISOString()
    });
});
export default app;
