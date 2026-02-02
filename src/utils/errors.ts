/**
 * Structured error handling for Agent Economy API
 * Phase 2 feature: Better Error Messages
 */

export class EconomyError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 400,
    public details?: Record<string, any>
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

// Pre-defined errors for common cases
export const Errors = {
  // Agent errors
  AGENT_NOT_FOUND: () =>
    new EconomyError('AGENT_NOT_FOUND', 'Agent not found', 404),

  AGENT_ALREADY_EXISTS: (moltbookId: string) =>
    new EconomyError(
      'AGENT_ALREADY_EXISTS',
      'An agent with this Moltbook ID already exists',
      409,
      { moltbook_id: moltbookId }
    ),

  // Balance errors
  INSUFFICIENT_BALANCE: (required: number, available: number) =>
    new EconomyError(
      'INSUFFICIENT_BALANCE',
      'Not enough shells for this transaction',
      400,
      { required, available }
    ),

  // Service errors
  SERVICE_NOT_FOUND: () =>
    new EconomyError('SERVICE_NOT_FOUND', 'Service not found', 404),

  SERVICE_INACTIVE: () =>
    new EconomyError('SERVICE_INACTIVE', 'This service is no longer active', 400),

  NOT_SERVICE_OWNER: () =>
    new EconomyError(
      'NOT_SERVICE_OWNER',
      'Only the service owner can modify this service',
      403
    ),

  // Job errors
  JOB_NOT_FOUND: () =>
    new EconomyError('JOB_NOT_FOUND', 'Job not found', 404),

  SELF_HIRE: () =>
    new EconomyError('SELF_HIRE', "You can't hire yourself", 400),

  INVALID_STATUS_TRANSITION: (from: string, to: string) =>
    new EconomyError(
      'INVALID_STATUS_TRANSITION',
      `Cannot transition job from '${from}' to '${to}'`,
      400,
      { currentStatus: from, attemptedStatus: to }
    ),

  NOT_JOB_PROVIDER: () =>
    new EconomyError(
      'NOT_JOB_PROVIDER',
      'Only the job provider can perform this action',
      403
    ),

  NOT_JOB_REQUESTER: () =>
    new EconomyError(
      'NOT_JOB_REQUESTER',
      'Only the job requester can perform this action',
      403
    ),

  JOB_ALREADY_ACCEPTED: () =>
    new EconomyError(
      'JOB_ALREADY_ACCEPTED',
      'This job has already been accepted and cannot be cancelled',
      400
    ),

  // Review errors
  REVIEW_NOT_FOUND: () =>
    new EconomyError('REVIEW_NOT_FOUND', 'Review not found', 404),

  JOB_NOT_COMPLETED: () =>
    new EconomyError(
      'JOB_NOT_COMPLETED',
      'Reviews can only be left for completed jobs',
      400
    ),

  NOT_JOB_PARTICIPANT: () =>
    new EconomyError(
      'NOT_JOB_PARTICIPANT',
      'Only job participants can leave reviews',
      403
    ),

  ALREADY_REVIEWED: () =>
    new EconomyError(
      'ALREADY_REVIEWED',
      'You have already reviewed this job',
      409
    ),

  INVALID_RATING: () =>
    new EconomyError(
      'INVALID_RATING',
      'Rating must be between 1 and 5',
      400
    ),

  // Generic errors
  VALIDATION_ERROR: (field: string, message: string) =>
    new EconomyError('VALIDATION_ERROR', message, 400, { field }),

  RATE_LIMITED: (retryAfter: number) =>
    new EconomyError(
      'RATE_LIMITED',
      'Too many requests. Please slow down.',
      429,
      { retry_after_seconds: retryAfter }
    ),

  INTERNAL_ERROR: () =>
    new EconomyError('INTERNAL_ERROR', 'An unexpected error occurred', 500),
};

/**
 * Helper to handle errors in route handlers
 * Converts EconomyError to proper JSON response, wraps unknown errors
 */
export function handleError(c: any, error: unknown) {
  if (error instanceof EconomyError) {
    return c.json(error.toJSON(), error.status);
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  // Don't leak internal details
  return c.json(Errors.INTERNAL_ERROR().toJSON(), 500);
}
