// Reputation decay service
// Agents inactive for 30+ days gradually lose reputation
// Rate: -0.01 per week of inactivity beyond 30 days
// Floor: 3.0 (average, not toxic)
import { getDb } from '../db/index.js';
import { v4 as uuid } from 'uuid';
const DECAY_THRESHOLD_DAYS = 30; // Start decaying after 30 days inactive
const DECAY_RATE_PER_WEEK = 0.01; // -0.01 reputation per week
const REPUTATION_FLOOR = 3.0; // Never go below this
/**
 * Get the last job completion date for an agent (as provider)
 */
function getLastJobCompletionDate(agentId) {
    const db = getDb();
    const row = db.prepare(`
    SELECT MAX(completed_at) as last_completed
    FROM jobs 
    WHERE provider_id = ? AND status = 'completed' AND completed_at IS NOT NULL
  `).get(agentId);
    return row?.last_completed ? new Date(row.last_completed) : null;
}
/**
 * Calculate days of inactivity for an agent
 */
function getDaysInactive(agentId, createdAt) {
    const lastCompletion = getLastJobCompletionDate(agentId);
    const referenceDate = lastCompletion || createdAt;
    const now = new Date();
    const diffMs = now.getTime() - referenceDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
/**
 * Calculate reputation decay for a given number of inactive days
 */
function calculateDecay(daysInactive) {
    if (daysInactive <= DECAY_THRESHOLD_DAYS) {
        return 0;
    }
    const daysOverThreshold = daysInactive - DECAY_THRESHOLD_DAYS;
    const weeksOverThreshold = Math.floor(daysOverThreshold / 7);
    return weeksOverThreshold * DECAY_RATE_PER_WEEK;
}
/**
 * Apply reputation decay to all eligible agents
 * Should be called periodically (e.g., daily via cron)
 */
export function applyReputationDecay() {
    const db = getDb();
    const now = new Date().toISOString();
    // Get all agents with reputation above floor
    const agents = db.prepare(`
    SELECT id, name, reputation_score, created_at
    FROM agents
    WHERE reputation_score > ?
  `).all(REPUTATION_FLOOR);
    const results = [];
    let totalDecayApplied = 0;
    for (const agent of agents) {
        const createdAt = new Date(agent.created_at);
        const daysInactive = getDaysInactive(agent.id, createdAt);
        const decay = calculateDecay(daysInactive);
        if (decay > 0) {
            const previousScore = agent.reputation_score;
            const newScore = Math.max(REPUTATION_FLOOR, previousScore - decay);
            const actualDecay = previousScore - newScore;
            if (actualDecay > 0) {
                // Apply the decay
                db.prepare(`
          UPDATE agents 
          SET reputation_score = ?, updated_at = ?
          WHERE id = ?
        `).run(newScore, now, agent.id);
                // Log the decay as a transaction-like event
                db.prepare(`
          INSERT INTO transactions (id, agent_id, type, amount, description, created_at)
          VALUES (?, ?, 'reputation_decay', 0, ?, ?)
        `).run(uuid(), agent.id, `Reputation decay: ${previousScore.toFixed(2)} → ${newScore.toFixed(2)} (${daysInactive} days inactive)`, now);
                results.push({
                    agentId: agent.id,
                    agentName: agent.name,
                    previousScore,
                    newScore,
                    decayApplied: actualDecay,
                    daysInactive,
                });
                totalDecayApplied += actualDecay;
            }
        }
    }
    return {
        processedAt: now,
        agentsChecked: agents.length,
        agentsDecayed: results.length,
        totalDecayApplied,
        results,
    };
}
/**
 * Preview decay without applying it
 * Useful for testing or showing users their potential decay
 */
export function previewReputationDecay() {
    const db = getDb();
    const now = new Date().toISOString();
    const agents = db.prepare(`
    SELECT id, name, reputation_score, created_at
    FROM agents
    WHERE reputation_score > ?
  `).all(REPUTATION_FLOOR);
    const results = [];
    let totalDecayApplied = 0;
    for (const agent of agents) {
        const createdAt = new Date(agent.created_at);
        const daysInactive = getDaysInactive(agent.id, createdAt);
        const decay = calculateDecay(daysInactive);
        if (decay > 0) {
            const previousScore = agent.reputation_score;
            const newScore = Math.max(REPUTATION_FLOOR, previousScore - decay);
            const actualDecay = previousScore - newScore;
            if (actualDecay > 0) {
                results.push({
                    agentId: agent.id,
                    agentName: agent.name,
                    previousScore,
                    newScore,
                    decayApplied: actualDecay,
                    daysInactive,
                });
                totalDecayApplied += actualDecay;
            }
        }
    }
    return {
        processedAt: now,
        agentsChecked: agents.length,
        agentsDecayed: results.length,
        totalDecayApplied,
        results,
    };
}
/**
 * Get decay status for a specific agent
 */
export function getAgentDecayStatus(agentId) {
    const db = getDb();
    const agent = db.prepare(`
    SELECT id, reputation_score, created_at
    FROM agents WHERE id = ?
  `).get(agentId);
    if (!agent)
        return null;
    const createdAt = new Date(agent.created_at);
    const daysInactive = getDaysInactive(agentId, createdAt);
    const pendingDecay = calculateDecay(daysInactive);
    const projectedScore = Math.max(REPUTATION_FLOOR, agent.reputation_score - pendingDecay);
    return {
        agentId,
        currentScore: agent.reputation_score,
        daysInactive,
        pendingDecay,
        projectedScore,
        atFloor: agent.reputation_score <= REPUTATION_FLOOR,
    };
}
