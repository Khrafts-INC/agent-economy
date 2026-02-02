// Agent service layer - CRUD operations for agents
import { getDb } from '../db/index.js';
import { v4 as uuid } from 'uuid';
const STARTER_SHELLS = 10; // Initial grant for new agents
function rowToAgent(row) {
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
export function registerAgent(request) {
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
export function getAgentById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
    return row ? rowToAgent(row) : null;
}
export function getAgentByMoltbookId(moltbookId) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM agents WHERE moltbook_id = ?').get(moltbookId);
    return row ? rowToAgent(row) : null;
}
export function updateAgent(id, updates) {
    const db = getDb();
    const now = new Date().toISOString();
    // Build dynamic update query
    const fields = ['updated_at = ?'];
    const values = [now];
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
    if (result.changes === 0)
        return null;
    return getAgentById(id);
}
export function listAgents(options = {}) {
    const db = getDb();
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const rows = db.prepare(`
    SELECT * FROM agents 
    ORDER BY reputation_score DESC, total_jobs_completed DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
    return rows.map(rowToAgent);
}
export function getAgentBalance(id) {
    const db = getDb();
    const row = db.prepare('SELECT balance FROM agents WHERE id = ?').get(id);
    return row ? row.balance : null;
}
export function updateAgentBalance(id, delta) {
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
export function incrementJobCount(id, field) {
    const db = getDb();
    const now = new Date().toISOString();
    const column = field === 'completed' ? 'total_jobs_completed' : 'total_jobs_requested';
    db.prepare(`UPDATE agents SET ${column} = ${column} + 1, updated_at = ? WHERE id = ?`).run(now, id);
}
export function updateReputationScore(id) {
    const db = getDb();
    const now = new Date().toISOString();
    // Calculate average rating from reviews where this agent was reviewed
    const result = db.prepare(`
    SELECT AVG(rating) as avg_rating 
    FROM reviews 
    WHERE reviewee_id = ?
  `).get(id);
    const score = result?.avg_rating ?? 0;
    db.prepare('UPDATE agents SET reputation_score = ?, updated_at = ? WHERE id = ?').run(score, now, id);
}
