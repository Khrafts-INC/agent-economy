// Jobs API routes - job lifecycle with escrow
import { Hono } from 'hono';
import { createJob, getJobById, listJobs, acceptJob, deliverJob, completeJob, cancelJob } from '../services/jobs.js';
export const jobRoutes = new Hono();
// Create a new job (escrows payment)
jobRoutes.post('/', async (c) => {
    try {
        const body = await c.req.json();
        if (!body.requesterId)
            return c.json({ error: 'requesterId is required' }, 400);
        if (!body.providerId)
            return c.json({ error: 'providerId is required' }, 400);
        if (!body.amount || body.amount <= 0)
            return c.json({ error: 'amount must be positive' }, 400);
        const job = createJob({
            serviceId: body.serviceId,
            requesterId: body.requesterId,
            providerId: body.providerId,
            amount: body.amount,
            description: body.description,
        });
        return c.json(job, 201);
    }
    catch (error) {
        if (error.message?.includes('not found'))
            return c.json({ error: error.message }, 404);
        if (error.message?.includes('Insufficient'))
            return c.json({ error: error.message }, 400);
        if (error.message?.includes('yourself'))
            return c.json({ error: error.message }, 400);
        console.error('Create job error:', error);
        return c.json({ error: 'Failed to create job' }, 500);
    }
});
// Get job by ID
jobRoutes.get('/:id', (c) => {
    const job = getJobById(c.req.param('id'));
    if (!job)
        return c.json({ error: 'Job not found' }, 404);
    return c.json(job);
});
// List jobs
jobRoutes.get('/', (c) => {
    const jobs = listJobs({
        requesterId: c.req.query('requesterId'),
        providerId: c.req.query('providerId'),
        status: c.req.query('status'),
    });
    return c.json({ jobs, count: jobs.length });
});
// Accept job
jobRoutes.patch('/:id/accept', async (c) => {
    try {
        const job = acceptJob(c.req.param('id'));
        return c.json(job);
    }
    catch (error) {
        if (error.message?.includes('not found'))
            return c.json({ error: error.message }, 404);
        return c.json({ error: error.message }, 400);
    }
});
// Deliver job
jobRoutes.patch('/:id/deliver', async (c) => {
    try {
        const body = await c.req.json().catch(() => ({}));
        const job = deliverJob(c.req.param('id'), body.deliverable);
        return c.json(job);
    }
    catch (error) {
        if (error.message?.includes('not found'))
            return c.json({ error: error.message }, 404);
        return c.json({ error: error.message }, 400);
    }
});
// Complete job (releases escrow)
jobRoutes.patch('/:id/complete', async (c) => {
    try {
        const job = completeJob(c.req.param('id'));
        return c.json(job);
    }
    catch (error) {
        if (error.message?.includes('not found'))
            return c.json({ error: error.message }, 404);
        return c.json({ error: error.message }, 400);
    }
});
// Cancel job (refunds escrow)
jobRoutes.patch('/:id/cancel', async (c) => {
    try {
        const job = cancelJob(c.req.param('id'));
        return c.json(job);
    }
    catch (error) {
        if (error.message?.includes('not found'))
            return c.json({ error: error.message }, 404);
        return c.json({ error: error.message }, 400);
    }
});
