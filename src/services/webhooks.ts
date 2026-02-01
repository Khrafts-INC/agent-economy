// Webhook notification service - fire async notifications to agents

import { getDb } from '../db/index.js';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

type WebhookEvent = 
  | 'job.requested'     // Someone wants to hire you
  | 'job.accepted'      // Your job request was accepted
  | 'job.delivered'     // Work was delivered, awaiting approval
  | 'job.completed'     // Job finished, payment released
  | 'job.cancelled'     // Job was cancelled
  | 'job.disputed'      // Dispute raised
  | 'review.received';  // Someone reviewed you

interface AgentWebhook {
  agent_id: string;
  webhook_url: string;
}

/**
 * Get webhook URL for an agent (if configured)
 */
export function getAgentWebhook(agentId: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT webhook_url FROM agents WHERE id = ?').get(agentId) as { webhook_url: string | null } | undefined;
  return row?.webhook_url || null;
}

/**
 * Set webhook URL for an agent
 */
export function setAgentWebhook(agentId: string, webhookUrl: string | null): void {
  const db = getDb();
  db.prepare('UPDATE agents SET webhook_url = ? WHERE id = ?').run(webhookUrl, agentId);
}

/**
 * Fire a webhook notification to an agent (async, fire-and-forget)
 */
export function fireWebhook(agentId: string, event: WebhookEvent, data: Record<string, unknown>): void {
  const webhookUrl = getAgentWebhook(agentId);
  if (!webhookUrl) return; // No webhook configured, skip silently

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Fire async - don't block the main flow
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-Economy-Event': event,
    },
    body: JSON.stringify(payload),
  }).catch((err) => {
    // Log but don't throw - webhooks are best-effort
    console.error(`Webhook failed for agent ${agentId}:`, err.message);
  });
}

/**
 * Notify relevant agents about job status changes
 */
export function notifyJobStatusChange(
  job: { id: string; requesterId: string; providerId: string; amount: number; status: string; description?: string | null; deliverable?: string | null },
  event: WebhookEvent
): void {
  const jobData = {
    jobId: job.id,
    amount: job.amount,
    status: job.status,
    description: job.description,
    deliverable: job.deliverable,
  };

  // Notify both parties (they can filter by event type)
  switch (event) {
    case 'job.requested':
      // Notify provider - someone wants to hire them
      fireWebhook(job.providerId, event, { ...jobData, requesterId: job.requesterId });
      break;
    case 'job.accepted':
      // Notify requester - their job was accepted
      fireWebhook(job.requesterId, event, { ...jobData, providerId: job.providerId });
      break;
    case 'job.delivered':
      // Notify requester - work ready for review
      fireWebhook(job.requesterId, event, { ...jobData, providerId: job.providerId });
      break;
    case 'job.completed':
      // Notify provider - payment released
      fireWebhook(job.providerId, event, { ...jobData, requesterId: job.requesterId });
      break;
    case 'job.cancelled':
      // Notify provider - job was cancelled
      fireWebhook(job.providerId, event, { ...jobData, requesterId: job.requesterId });
      break;
    case 'job.disputed':
      // Notify both parties
      fireWebhook(job.requesterId, event, jobData);
      fireWebhook(job.providerId, event, jobData);
      break;
  }
}
