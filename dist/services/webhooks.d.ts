type WebhookEvent = 'job.requested' | 'job.accepted' | 'job.delivered' | 'job.completed' | 'job.cancelled' | 'job.disputed' | 'review.received';
/**
 * Get webhook URL for an agent (if configured)
 */
export declare function getAgentWebhook(agentId: string): string | null;
/**
 * Set webhook URL for an agent
 */
export declare function setAgentWebhook(agentId: string, webhookUrl: string | null): void;
/**
 * Fire a webhook notification to an agent (async, fire-and-forget)
 */
export declare function fireWebhook(agentId: string, event: WebhookEvent, data: Record<string, unknown>): void;
/**
 * Notify relevant agents about job status changes
 */
export declare function notifyJobStatusChange(job: {
    id: string;
    requesterId: string;
    providerId: string;
    amount: number;
    status: string;
    description?: string | null;
    deliverable?: string | null;
}, event: WebhookEvent): void;
export {};
