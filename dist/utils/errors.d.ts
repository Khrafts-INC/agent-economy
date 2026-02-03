/**
 * Structured error handling for Agent Economy API
 * Phase 2 feature: Better Error Messages
 */
export declare class EconomyError extends Error {
    code: string;
    message: string;
    status: number;
    details?: Record<string, any> | undefined;
    constructor(code: string, message: string, status?: number, details?: Record<string, any> | undefined);
    toJSON(): {
        error: {
            details?: Record<string, any> | undefined;
            code: string;
            message: string;
        };
    };
}
export declare const Errors: {
    AGENT_NOT_FOUND: () => EconomyError;
    AGENT_ALREADY_EXISTS: (moltbookId: string) => EconomyError;
    INSUFFICIENT_BALANCE: (required: number, available: number) => EconomyError;
    SERVICE_NOT_FOUND: () => EconomyError;
    SERVICE_INACTIVE: () => EconomyError;
    NOT_SERVICE_OWNER: () => EconomyError;
    JOB_NOT_FOUND: () => EconomyError;
    SELF_HIRE: () => EconomyError;
    INVALID_STATUS_TRANSITION: (from: string, to: string) => EconomyError;
    NOT_JOB_PROVIDER: () => EconomyError;
    NOT_JOB_REQUESTER: () => EconomyError;
    JOB_ALREADY_ACCEPTED: () => EconomyError;
    REVIEW_NOT_FOUND: () => EconomyError;
    JOB_NOT_COMPLETED: () => EconomyError;
    NOT_JOB_PARTICIPANT: () => EconomyError;
    ALREADY_REVIEWED: () => EconomyError;
    INVALID_RATING: () => EconomyError;
    VALIDATION_ERROR: (field: string, message: string) => EconomyError;
    RATE_LIMITED: (retryAfter: number) => EconomyError;
    INTERNAL_ERROR: () => EconomyError;
};
/**
 * Helper to handle errors in route handlers
 * Converts EconomyError to proper JSON response, wraps unknown errors
 */
export declare function handleError(c: any, error: unknown): any;
