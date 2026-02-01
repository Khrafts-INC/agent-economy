// Reviews service layer - post-job ratings and reputation

import { getDb } from '../db/index.js';
import { v4 as uuid } from 'uuid';
import { updateReputationScore } from './agents.js';

export interface Review {
  id: string;
  jobId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

interface ReviewRow {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    jobId: row.job_id,
    reviewerId: row.reviewer_id,
    revieweeId: row.reviewee_id,
    rating: row.rating,
    comment: row.comment || undefined,
    createdAt: new Date(row.created_at),
  };
}

export interface CreateReviewInput {
  jobId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}

export function createReview(input: CreateReviewInput): Review {
  const db = getDb();
  
  // Validate rating
  if (input.rating < 1 || input.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  // Verify job exists and is completed
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(input.jobId) as any;
  if (!job) {
    throw new Error('Job not found');
  }
  if (job.status !== 'completed') {
    throw new Error('Can only review completed jobs');
  }
  
  // Verify reviewer is a participant
  if (input.reviewerId !== job.requester_id && input.reviewerId !== job.provider_id) {
    throw new Error('Only job participants can leave reviews');
  }
  
  // Verify reviewee is the other participant
  if (input.revieweeId !== job.requester_id && input.revieweeId !== job.provider_id) {
    throw new Error('Reviewee must be a job participant');
  }
  
  // Can't review yourself
  if (input.reviewerId === input.revieweeId) {
    throw new Error('Cannot review yourself');
  }
  
  // Check if reviewer already reviewed this job
  const existing = db.prepare(
    'SELECT id FROM reviews WHERE job_id = ? AND reviewer_id = ?'
  ).get(input.jobId, input.reviewerId);
  if (existing) {
    throw new Error('You have already reviewed this job');
  }
  
  const id = uuid();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO reviews (id, job_id, reviewer_id, reviewee_id, rating, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.jobId, input.reviewerId, input.revieweeId, input.rating, input.comment || null, now);
  
  // Update reviewee's reputation score
  updateReputationScore(input.revieweeId);
  
  return {
    id,
    jobId: input.jobId,
    reviewerId: input.reviewerId,
    revieweeId: input.revieweeId,
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date(now),
  };
}

export function getReviewById(id: string): Review | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as ReviewRow | undefined;
  return row ? rowToReview(row) : null;
}

export function listReviews(options: {
  revieweeId?: string;
  reviewerId?: string;
  jobId?: string;
  limit?: number;
  offset?: number;
} = {}): { reviews: Review[]; averageRating?: number } {
  const db = getDb();
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  
  const conditions: string[] = [];
  const params: any[] = [];
  
  if (options.revieweeId) {
    conditions.push('reviewee_id = ?');
    params.push(options.revieweeId);
  }
  if (options.reviewerId) {
    conditions.push('reviewer_id = ?');
    params.push(options.reviewerId);
  }
  if (options.jobId) {
    conditions.push('job_id = ?');
    params.push(options.jobId);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const rows = db.prepare(`
    SELECT * FROM reviews ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as ReviewRow[];
  
  const reviews = rows.map(rowToReview);
  
  // If filtering by reviewee, also return their average rating
  let averageRating: number | undefined;
  if (options.revieweeId && reviews.length > 0) {
    const avgResult = db.prepare(
      'SELECT AVG(rating) as avg FROM reviews WHERE reviewee_id = ?'
    ).get(options.revieweeId) as { avg: number | null };
    averageRating = avgResult?.avg ?? undefined;
  }
  
  return { reviews, averageRating };
}

export function getAgentReputation(agentId: string): { averageRating: number; totalReviews: number } {
  const db = getDb();
  
  const result = db.prepare(`
    SELECT AVG(rating) as avg, COUNT(*) as count 
    FROM reviews 
    WHERE reviewee_id = ?
  `).get(agentId) as { avg: number | null; count: number };
  
  return {
    averageRating: result?.avg ?? 0,
    totalReviews: result?.count ?? 0,
  };
}
