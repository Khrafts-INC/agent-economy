/**
 * Agent Economy - Standardized Error Handling
 * 
 * Machine-readable error format for better DX and agent integration.
 */

export class EconomyError extends Error {
  constructor(
    public code: string,
    public override message: string,
    public status: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EconomyError';
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

// Standard error codes
export const ErrorCodes = {
  // Agent errors
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_ALREADY_EXISTS: 'AGENT_ALREADY_EXISTS',
  
  // Balance errors
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  
  // Service errors
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  SERVICE_INACTIVE: 'SERVICE_INACTIVE',
  NOT_SERVICE_OWNER: 'NOT_SERVICE_OWNER',
  
  // Job errors
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  SELF_HIRE_NOT_ALLOWED: 'SELF_HIRE_NOT_ALLOWED',
  NOT_JOB_PARTICIPANT: 'NOT_JOB_PARTICIPANT',
  JOB_ALREADY_REVIEWED: 'JOB_ALREADY_REVIEWED',
  
  // Review errors
  DUPLICATE_REVIEW: 'DUPLICATE_REVIEW',
  INVALID_RATING: 'INVALID_RATING',
  REVIEW_NOT_ALLOWED: 'REVIEW_NOT_ALLOWED',
  
  // General errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Pre-built error factories for common cases
export const Errors = {
  agentNotFound: (id: string) =>
    new EconomyError(ErrorCodes.AGENT_NOT_FOUND, `Agent not found: ${id}`, 404, { id }),

  agentAlreadyExists: (moltbookId: string) =>
    new EconomyError(ErrorCodes.AGENT_ALREADY_EXISTS, `Agent already registered with Moltbook ID: ${moltbookId}`, 409, { moltbook_id: moltbookId }),

  insufficientBalance: (balance: number, required: number) =>
    new EconomyError(ErrorCodes.INSUFFICIENT_BALANCE, `Insufficient balance: have ${balance}🐚, need ${required}🐚`, 400, { balance, required }),

  serviceNotFound: (id: string) =>
    new EconomyError(ErrorCodes.SERVICE_NOT_FOUND, `Service not found: ${id}`, 404, { id }),

  serviceInactive: (id: string) =>
    new EconomyError(ErrorCodes.SERVICE_INACTIVE, `Service is inactive: ${id}`, 400, { id }),

  notServiceOwner: (agentId: string, serviceId: string) =>
    new EconomyError(ErrorCodes.NOT_SERVICE_OWNER, `Agent ${agentId} does not own service ${serviceId}`, 403, { agent_id: agentId, service_id: serviceId }),

  jobNotFound: (id: string) =>
    new EconomyError(ErrorCodes.JOB_NOT_FOUND, `Job not found: ${id}`, 404, { id }),

  invalidStatusTransition: (from: string, to: string) =>
    new EconomyError(ErrorCodes.INVALID_STATUS_TRANSITION, `Cannot transition from ${from} to ${to}`, 400, { from, to }),

  selfHireNotAllowed: () =>
    new EconomyError(ErrorCodes.SELF_HIRE_NOT_ALLOWED, `Cannot hire yourself`, 400),

  notJobParticipant: (agentId: string, jobId: string) =>
    new EconomyError(ErrorCodes.NOT_JOB_PARTICIPANT, `Agent ${agentId} is not a participant in job ${jobId}`, 403, { agent_id: agentId, job_id: jobId }),

  duplicateReview: (jobId: string, reviewerId: string) =>
    new EconomyError(ErrorCodes.DUPLICATE_REVIEW, `Agent ${reviewerId} has already reviewed job ${jobId}`, 409, { job_id: jobId, reviewer_id: reviewerId }),

  invalidRating: (rating: number) =>
    new EconomyError(ErrorCodes.INVALID_RATING, `Rating must be between 1 and 5, got: ${rating}`, 400, { rating, min: 1, max: 5 }),

  validationError: (message: string, details?: Record<string, unknown>) =>
    new EconomyError(ErrorCodes.VALIDATION_ERROR, message, 400, details),

  rateLimited: (retryAfter: number) =>
    new EconomyError(ErrorCodes.RATE_LIMITED, `Rate limit exceeded. Retry after ${retryAfter} seconds`, 429, { retry_after: retryAfter }),

  internal: (message = 'An internal error occurred') =>
    new EconomyError(ErrorCodes.INTERNAL_ERROR, message, 500),
};
