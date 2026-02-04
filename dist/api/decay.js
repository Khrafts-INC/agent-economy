// Decay API endpoints
// For managing reputation decay (typically called via cron)
import { Hono } from 'hono';
import { applyReputationDecay, previewReputationDecay, getAgentDecayStatus } from '../services/decay.js';
const decay = new Hono();
/**
 * GET /decay/preview
 * Preview what decay would be applied without actually applying it
 */
decay.get('/preview', async (c) => {
    const summary = previewReputationDecay();
    return c.json(summary);
});
/**
 * POST /decay/apply
 * Apply reputation decay to all eligible agents
 * Should be called periodically (e.g., daily via cron)
 */
decay.post('/apply', async (c) => {
    const summary = applyReputationDecay();
    return c.json({
        success: true,
        ...summary,
    });
});
/**
 * GET /decay/agent/:id
 * Get decay status for a specific agent
 */
decay.get('/agent/:id', async (c) => {
    const id = c.req.param('id');
    const status = getAgentDecayStatus(id);
    if (!status) {
        return c.json({ error: 'Agent not found' }, 404);
    }
    return c.json(status);
});
export default decay;
