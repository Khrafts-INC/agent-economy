// Job service layer - CRUD operations for jobs with escrow

import { getDb } from '../db/index.js';
import { v4 as uuid } from 'uuid';
import { updateAgentBalance, incrementJobCount, getAgentById } from './agents.js';
import { notifyJobStatusChange } from './webhooks.js';

const PLATFORM_FEE = 0.05; // 5% fee to Tide Pool

interface JobRow {
  id: string;
  service_id: string | null;
  requester_id: string;
  provider_id: string;
  amount: number;
  description: string | null;
  deliverable: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

function rowToJob(row: JobRow) {
  return {
    id: row.id,
    serviceId: row.service_id,
    requesterId: row.requester_id,
    providerId: row.provider_id,
    amount: row.amount,
    description: row.description,
    deliverable: row.deliverable,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

export function createJob(request: {
  serviceId?: string;
  requesterId: string;
  providerId: string;
  amount: number;
  description?: string;
}) {
  const db = getDb();
  const id = uuid();
  const now = new Date().toISOString();

  // Validate not self-hiring
  if (request.requesterId === request.providerId) {
    throw new Error('Cannot hire yourself');
  }

  // Check requester exists and has balance
  const requester = getAgentById(request.requesterId);
  if (!requester) throw new Error('Requester not found');
  if (requester.balance < request.amount) {
    throw new Error('Insufficient balance');
  }

  // Check provider exists
  const provider = getAgentById(request.providerId);
  if (!provider) throw new Error('Provider not found');

  // Escrow: deduct from requester
  if (!updateAgentBalance(request.requesterId, -request.amount)) {
    throw new Error('Failed to escrow payment');
  }

  // Record escrow transaction
  db.prepare(`
    INSERT INTO transactions (id, agent_id, type, amount, description, created_at)
    VALUES (?, ?, 'escrow_lock', ?, ?, ?)
  `).run(uuid(), request.requesterId, -request.amount, `Escrow for job`, now);

  // Create job
  db.prepare(`
    INSERT INTO jobs (id, service_id, requester_id, provider_id, amount, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'requested', ?, ?)
  `).run(id, request.serviceId || null, request.requesterId, request.providerId, request.amount, request.description || null, now, now);

  incrementJobCount(request.requesterId, 'requested');

  const job = rowToJob(db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as JobRow);
  
  // Notify provider they have a new job request
  notifyJobStatusChange(job, 'job.requested');

  return job;
}

export function getJobById(id: string) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as JobRow | undefined;
  return row ? rowToJob(row) : null;
}

export function acceptJob(id: string) {
  const db = getDb();
  const now = new Date().toISOString();
  const job = getJobById(id);
  
  if (!job) throw new Error('Job not found');
  if (job.status !== 'requested') throw new Error('Job cannot be accepted');

  db.prepare('UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?').run('accepted', now, id);
  const updatedJob = getJobById(id)!;
  notifyJobStatusChange(updatedJob, 'job.accepted');
  return updatedJob;
}

export function deliverJob(id: string, deliverable?: string) {
  const db = getDb();
  const now = new Date().toISOString();
  const job = getJobById(id);
  
  if (!job) throw new Error('Job not found');
  if (job.status !== 'accepted') throw new Error('Job cannot be delivered');

  db.prepare('UPDATE jobs SET status = ?, deliverable = ?, updated_at = ? WHERE id = ?')
    .run('delivered', deliverable || null, now, id);
  const updatedJob = getJobById(id)!;
  notifyJobStatusChange(updatedJob, 'job.delivered');
  return updatedJob;
}

const ACTIVITY_MINING_BONUS = 5; // 🐚 bonus for early jobs
const ACTIVITY_MINING_THRESHOLD = 10; // First N jobs get the bonus

export function completeJob(id: string) {
  const db = getDb();
  const now = new Date().toISOString();
  const job = getJobById(id);
  
  if (!job) throw new Error('Job not found');
  if (job.status !== 'delivered') throw new Error('Job cannot be completed');

  // Calculate fee and payout
  const fee = job.amount * PLATFORM_FEE;
  const payout = job.amount - fee;

  // Pay provider
  updateAgentBalance(job.providerId, payout);
  incrementJobCount(job.providerId, 'completed');

  // Record transactions
  db.prepare(`
    INSERT INTO transactions (id, agent_id, type, amount, description, created_at)
    VALUES (?, ?, 'payment', ?, ?, ?)
  `).run(uuid(), job.providerId, payout, `Payment for job ${id}`, now);

  db.prepare(`
    INSERT INTO transactions (id, agent_id, type, amount, description, created_at)
    VALUES (?, ?, 'platform_fee', ?, ?, ?)
  `).run(uuid(), 'tide-pool', fee, `Fee from job ${id}`, now);

  // Activity Mining: Check if this is one of the first N completed jobs
  const completedJobCount = (db.prepare(
    "SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'"
  ).get() as { count: number }).count;

  let activityBonus = { requester: 0, provider: 0 };
  
  if (completedJobCount < ACTIVITY_MINING_THRESHOLD) {
    // Award bonus to both parties for early adoption
    updateAgentBalance(job.requesterId, ACTIVITY_MINING_BONUS);
    updateAgentBalance(job.providerId, ACTIVITY_MINING_BONUS);
    
    activityBonus = { requester: ACTIVITY_MINING_BONUS, provider: ACTIVITY_MINING_BONUS };

    // Record bonus transactions
    db.prepare(`
      INSERT INTO transactions (id, agent_id, type, amount, description, created_at)
      VALUES (?, ?, 'activity_mining_bonus', ?, ?, ?)
    `).run(uuid(), job.requesterId, ACTIVITY_MINING_BONUS, 
      `Activity mining bonus (job #${completedJobCount + 1})`, now);

    db.prepare(`
      INSERT INTO transactions (id, agent_id, type, amount, description, created_at)
      VALUES (?, ?, 'activity_mining_bonus', ?, ?, ?)
    `).run(uuid(), job.providerId, ACTIVITY_MINING_BONUS,
      `Activity mining bonus (job #${completedJobCount + 1})`, now);
  }

  // Update job
  db.prepare('UPDATE jobs SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?')
    .run('completed', now, now, id);

  const updatedJob = getJobById(id)!;
  notifyJobStatusChange(updatedJob, 'job.completed');
  
  // Return job with bonus info
  return {
    ...updatedJob,
    activityMiningBonus: activityBonus.requester > 0 ? activityBonus : undefined,
    economyStats: {
      totalCompletedJobs: completedJobCount + 1,
      activityMiningRemaining: Math.max(0, ACTIVITY_MINING_THRESHOLD - completedJobCount - 1),
    },
  };
}

export function cancelJob(id: string) {
  const db = getDb();
  const now = new Date().toISOString();
  const job = getJobById(id);
  
  if (!job) throw new Error('Job not found');
  if (job.status !== 'requested') throw new Error('Can only cancel before acceptance');

  // Refund requester
  updateAgentBalance(job.requesterId, job.amount);

  db.prepare(`
    INSERT INTO transactions (id, agent_id, type, amount, description, created_at)
    VALUES (?, ?, 'escrow_release', ?, ?, ?)
  `).run(uuid(), job.requesterId, job.amount, `Refund for cancelled job`, now);

  db.prepare('UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?').run('cancelled', now, id);
  const updatedJob = getJobById(id)!;
  notifyJobStatusChange(updatedJob, 'job.cancelled');
  return updatedJob;
}

export function listJobs(filters: { requesterId?: string; providerId?: string; status?: string }) {
  const db = getDb();
  let sql = 'SELECT * FROM jobs WHERE 1=1';
  const params: any[] = [];

  if (filters.requesterId) {
    sql += ' AND requester_id = ?';
    params.push(filters.requesterId);
  }
  if (filters.providerId) {
    sql += ' AND provider_id = ?';
    params.push(filters.providerId);
  }
  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params) as JobRow[];
  return rows.map(rowToJob);
}
