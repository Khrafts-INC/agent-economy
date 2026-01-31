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
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToAgent(row: AgentRow): Agent & { bio?: string; reputationScore: number; jobsCompleted: number; jobsRequested: number; verifiedAt?: Date } {
  return {
    id: row.id,
    name: row.name,
    moltbookId: row.moltbook_id || undefined,
    bio: row.bio || undefined,
    balance: row.balance,
    reputationScore: row.reputation_score,
    jobsCompleted: row.total_jobs_completed,
    jobsRequested: row.total_jobs_requested,
    verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function registerAgent(request: RegisterRequest): Agent & { bio?: string; reputationScore: number } {
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
  
  const stmt = db.prepare(`
    INSERT INTO agents (id, name, moltbook_id, balance, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, request.name, request.moltbookId || null, STARTER_SHELLS, now, now);
  
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
    ORDER BY reputation_score DESC, jobs_completed DESC
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
