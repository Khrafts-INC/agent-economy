// Reviews API routes - post-job ratings and reputation

import { Hono } from 'hono';
import { createReview, getReviewById, listReviews, getAgentReputation } from '../services/reviews.js';

export const reviewRoutes = new Hono();

// Create a review for a completed job
reviewRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.jobId) return c.json({ error: 'jobId is required' }, 400);
    if (!body.reviewerId) return c.json({ error: 'reviewerId is required' }, 400);
    if (!body.revieweeId) return c.json({ error: 'revieweeId is required' }, 400);
    if (!body.rating) return c.json({ error: 'rating is required' }, 400);
    
    const review = createReview({
      jobId: body.jobId,
      reviewerId: body.reviewerId,
      revieweeId: body.revieweeId,
      rating: body.rating,
      comment: body.comment,
    });
    
    return c.json(review, 201);
  } catch (error: any) {
    if (error.message?.includes('not found')) return c.json({ error: error.message }, 404);
    if (error.message?.includes('already')) return c.json({ error: error.message }, 409);
    if (error.message?.includes('only') || error.message?.includes('must') || error.message?.includes('Cannot')) {
      return c.json({ error: error.message }, 400);
    }
    console.error('Create review error:', error);
    return c.json({ error: 'Failed to create review' }, 500);
  }
});

// Get review by ID
reviewRoutes.get('/:id', (c) => {
  const id = c.req.param('id');
  
  // Check if it's a reputation query (/:agentId/reputation)
  // Actually, let's add that as a separate route below
  
  const review = getReviewById(id);
  if (!review) return c.json({ error: 'Review not found' }, 404);
  return c.json(review);
});

// List reviews with filters
reviewRoutes.get('/', (c) => {
  const result = listReviews({
    revieweeId: c.req.query('revieweeId'),
    reviewerId: c.req.query('reviewerId'),
    jobId: c.req.query('jobId'),
    limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined,
    offset: c.req.query('offset') ? parseInt(c.req.query('offset')!) : undefined,
  });
  
  return c.json({
    reviews: result.reviews,
    count: result.reviews.length,
    ...(result.averageRating !== undefined && { averageRating: result.averageRating }),
  });
});

// Get agent reputation summary
reviewRoutes.get('/agent/:agentId/reputation', (c) => {
  const agentId = c.req.param('agentId');
  const reputation = getAgentReputation(agentId);
  return c.json(reputation);
});
