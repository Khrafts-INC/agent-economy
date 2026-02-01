import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';

const router = new Hono();

// POST /reviews - Leave a review for a completed job
router.post('/', async (c) => {
  const body = await c.req.json();
  const { job_id, reviewer_id, rating, comment } = body;
  
  if (!job_id || !reviewer_id || !rating) {
    return c.json({ error: 'job_id, reviewer_id, and rating required' }, 400);
  }
  
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return c.json({ error: 'rating must be integer 1-5' }, 400);
  }
  
  const db = getDb();
  
  // Get the job
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job_id) as any;
  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }
  
  if (job.status !== 'completed') {
    return c.json({ error: 'Can only review completed jobs' }, 400);
  }
  
  // Verify reviewer is either requester or provider
  const isRequester = reviewer_id === job.requester_id;
  const isProvider = reviewer_id === job.provider_id;
  
  if (!isRequester && !isProvider) {
    return c.json({ error: 'Only job participants can leave reviews' }, 403);
  }
  
  // Determine who is being reviewed
  const reviewee_id = isRequester ? job.provider_id : job.requester_id;
  
  // Check for existing review (one review per person per job)
  const existingReview = db.prepare(
    'SELECT id FROM reviews WHERE job_id = ? AND reviewer_id = ?'
  ).get(job_id, reviewer_id);
  
  if (existingReview) {
    return c.json({ error: 'You have already reviewed this job' }, 409);
  }
  
  const reviewId = uuidv4();
  const now = new Date().toISOString();
  
  db.transaction(() => {
    // Insert the review
    db.prepare(`
      INSERT INTO reviews (id, job_id, reviewer_id, reviewee_id, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(reviewId, job_id, reviewer_id, reviewee_id, rating, comment || null, now);
    
    // Recalculate reviewee's reputation score (average of all their reviews)
    const result = db.prepare(`
      SELECT AVG(rating) as avg_rating FROM reviews WHERE reviewee_id = ?
    `).get(reviewee_id) as { avg_rating: number };
    
    db.prepare('UPDATE agents SET reputation_score = ? WHERE id = ?')
      .run(result.avg_rating, reviewee_id);
  })();
  
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);
  return c.json(review, 201);
});

// GET /reviews/:id - Get a specific review
router.get('/:id', (c) => {
  const id = c.req.param('id');
  const db = getDb();
  
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  if (!review) {
    return c.json({ error: 'Review not found' }, 404);
  }
  
  return c.json(review);
});

// GET /reviews - List reviews (filter by reviewee_id or job_id)
router.get('/', (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');
  const reviewee_id = c.req.query('reviewee_id');
  const reviewer_id = c.req.query('reviewer_id');
  const job_id = c.req.query('job_id');
  
  const db = getDb();
  
  let query = 'SELECT * FROM reviews WHERE 1=1';
  const params: any[] = [];
  
  if (reviewee_id) {
    query += ' AND reviewee_id = ?';
    params.push(reviewee_id);
  }
  if (reviewer_id) {
    query += ' AND reviewer_id = ?';
    params.push(reviewer_id);
  }
  if (job_id) {
    query += ' AND job_id = ?';
    params.push(job_id);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const reviews = db.prepare(query).all(...params);
  
  // If filtering by reviewee, include their current reputation
  if (reviewee_id) {
    const agent = db.prepare('SELECT reputation_score FROM agents WHERE id = ?').get(reviewee_id) as any;
    return c.json({ 
      reviews, 
      reputation_score: agent?.reputation_score || 0,
      limit, 
      offset 
    });
  }
  
  return c.json({ reviews, limit, offset });
});

export default router;
