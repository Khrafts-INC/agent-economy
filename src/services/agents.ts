// Agent service layer - CRUD operations for agents

import { getDb } from '../db/index.js';
import { v4 as uuid } from 'uuid';
import type { Agent, RegisterRequest } from '../types/index.js';

const STARTER_SHELLS = 10; // Initial grant for new agents

interface AgentRow {
  id: string;
  name: string;
  moltbook_id: string | null;
  bio: string | null;
  balance: number;
  reputation_score: number;
  total_jobs_completed: number;
  total_jobs_requested: number;
  referred_by: string | null;
  referral_code: string | null;
  referrals_made: number;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Generate a unique referral code (NAME-XXXX format)
function generateReferralCode(name: string): string {
  const prefix = name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

// Ensure referral code is unique, regenerate if collision
function getUniqueReferralCode(db: ReturnType<typeof getDb>, name: string): string {
  let code = generateReferralCode(name);
  let attempts = 0;
  while (attempts < 10) {
    const existing = db.prepare('SELECT 1 FROM agents WHERE referral_code = ?').get(code);
    if (!existing) return code;
    code = generateReferralCode(name);
    attempts++;
  }
  // Fallback: use UUID suffix
  return `${name.slice(0, 4).toUpperCase()}-${uuid().slice(0, 4).toUpperCase()}`;
}

function rowToAgent(row: AgentRow): Agent & { 
  bio?: string; 
  reputationScore: number; 
  jobsCompleted: number; 
  jobsRequested: number; 
  referralCode?: string;
  referredBy?: string;
  referralsMade: number;
  verifiedAt?: Date;
} {
  return {
    id: row.id,
    name: row.name,
    moltbookId: row.moltbook_id || undefined,
    bio: row.bio || undefined,
    balance: row.balance,
    reputationScore: row.reputation_score,
    jobsCompleted: row.total_jobs_completed,
    jobsRequested: row.total_jobs_requested,
    referralCode: row.referral_code || undefined,
    referredBy: row.referred_by || undefined,
    referralsMade: row.referrals_made || 0,
    verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function registerAgent(request: RegisterRequest & { referralCode?: string }): Agent & { 
  bio?: string; 
  reputationScore: number;
  referralCode: string;
  referredBy?: string;
  referralsMade: number;
} {
  const db = getDb();
  const id = uuid();
  const now = new Date().toISOString();
  
  // Check if moltbookId already exists
  if (request.moltbookId) {
    const existing = db.prepare('SELECT id FROM agents WHERE moltbook_id = ?').get(request.moltbookId);
    if (existing) {
      throw new Error('Agent with this Moltbook ID already exists');
    }
  }
  
  // Generate unique referral code for this agent
  const newReferralCode = getUniqueReferralCode(db, request.name);
  
  // Check if referred by someone
  let referrerId: string | null = null;
  if (request.referralCode) {
    const referrer = db.prepare('SELECT id FROM agents WHERE referral_code = ?').get(request.referralCode) as { id: string } | undefined;
    if (referrer) {
      referrerId = referrer.id;
      // Increment referrer's count
      db.prepare('UPDATE agents SET referrals_made = referrals_made + 1, updated_at = ? WHERE id = ?').run(now, referrerId);
    }
    // Note: we silently ignore invalid referral codes (don't block registration)
  }
  
  const stmt = db.prepare(`
    INSERT INTO agents (id, name, moltbook_id, balance, referral_code, referred_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, request.name, request.moltbookId || null, STARTER_SHELLS, newReferralCode, referrerId, now, now);
  
  // Record the starter grant as a transaction
  const txStmt = db.prepare(`
    INSERT INTO transactions (id, agent_id, type, amount, description, created_at)
    VALUES (?, ?, 'starter_grant', ?, ?, ?)
  `);
  txStmt.run(uuid(), id, STARTER_SHELLS, 'Starter shell grant', now);
  
  return {
    id,
    name: request.name,
    moltbookId: request.moltbookId,
    balance: STARTER_SHELLS,
    reputationScore: 0,
    referralCode: newReferralCode,
    referredBy: referrerId || undefined,
    referralsMade: 0,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

export function getAgentById(id: string): ReturnType<typeof rowToAgent> | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as AgentRow | undefined;
  return row ? rowToAgent(row) : null;
}

export function getAgentByMoltbookId(moltbookId: string): ReturnType<typeof rowToAgent> | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM agents WHERE moltbook_id = ?').get(moltbookId) as AgentRow | undefined;
  return row ? rowToAgent(row) : null;
}

export function updateAgent(id: string, updates: { name?: string; bio?: string }): ReturnType<typeof rowToAgent> | null {
  const db = getDb();
  const now = new Date().toISOString();
  
  // Build dynamic update query
  const fields: string[] = ['updated_at = ?'];
  const values: any[] = [now];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.bio !== undefined) {
    fields.push('bio = ?');
    values.push(updates.bio);
  }
  
  values.push(id); // WHERE clause
  
  const stmt = db.prepare(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  
  if (result.changes === 0) return null;
  return getAgentById(id);
}

export function listAgents(options: { limit?: number; offset?: number } = {}): ReturnType<typeof rowToAgent>[] {
  const db = getDb();
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  
  const rows = db.prepare(`
    SELECT * FROM agents 
    ORDER BY reputation_score DESC, total_jobs_completed DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as AgentRow[];
  
  return rows.map(rowToAgent);
}

export function getAgentBalance(id: string): number | null {
  const db = getDb();
  const row = db.prepare('SELECT balance FROM agents WHERE id = ?').get(id) as { balance: number } | undefined;
  return row ? row.balance : null;
}

export function updateAgentBalance(id: string, delta: number): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  
  // Atomic balance update with check
  const result = db.prepare(`
    UPDATE agents 
    SET balance = balance + ?, updated_at = ?
    WHERE id = ? AND (balance + ?) >= 0
  `).run(delta, now, id, delta);
  
  return result.changes > 0;
}

export function incrementJobCount(id: string, field: 'completed' | 'requested'): void {
  const db = getDb();
  const now = new Date().toISOString();
  const column = field === 'completed' ? 'total_jobs_completed' : 'total_jobs_requested';
  
  db.prepare(`UPDATE agents SET ${column} = ${column} + 1, updated_at = ? WHERE id = ?`).run(now, id);
}

export function updateReputationScore(id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  
  // Calculate average rating from reviews where this agent was reviewed
  const result = db.prepare(`
    SELECT AVG(rating) as avg_rating 
    FROM reviews 
    WHERE reviewee_id = ?
  `).get(id) as { avg_rating: number | null };
  
  const score = result?.avg_rating ?? 0;
  
  db.prepare('UPDATE agents SET reputation_score = ?, updated_at = ? WHERE id = ?').run(score, now, id);
}

// Get list of agents referred by a specific agent
export function getAgentReferrals(id: string, options: { limit?: number; offset?: number } = {}): ReturnType<typeof rowToAgent>[] {
  const db = getDb();
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  
  const rows = db.prepare(`
    SELECT * FROM agents 
    WHERE referred_by = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(id, limit, offset) as AgentRow[];
  
  return rows.map(rowToAgent);
}

// Get agent by their referral code
export function getAgentByReferralCode(code: string): ReturnType<typeof rowToAgent> | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM agents WHERE referral_code = ?').get(code) as AgentRow | undefined;
  return row ? rowToAgent(row) : null;
}
