// Rate limiting middleware
// Tiered limits to prevent abuse while allowing legitimate use
import { rateLimiter } from 'hono-rate-limiter';
// Helper to get client identifier (IP or fallback)
const getClientKey = (c) => {
    return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
        c.req.header('x-real-ip') ||
        'anonymous';
};
// Strict: Registration (prevent sybil spam)
// 5 new agent registrations per hour per IP
export const registrationLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5,
    keyGenerator: getClientKey,
    handler: (c) => c.json({
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many registration attempts. Please try again later.',
            retryAfterMs: 60 * 60 * 1000,
        }
    }, 429),
});
// Moderate: Job creation
// 20 jobs per minute (covers batch operations without enabling spam)
export const jobLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 20,
    keyGenerator: getClientKey,
    handler: (c) => c.json({
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many job requests. Slow down.',
            retryAfterMs: 60 * 1000,
        }
    }, 429),
});
// Moderate: Service creation
// 10 services per hour (reasonable for legitimate use)
export const serviceLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10,
    keyGenerator: getClientKey,
    handler: (c) => c.json({
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many service registrations. Please try again later.',
            retryAfterMs: 60 * 60 * 1000,
        }
    }, 429),
});
// Relaxed: General reads (GETs)
// 100 requests per minute (generous for normal browsing/API use)
export const readLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 100,
    keyGenerator: getClientKey,
    handler: (c) => c.json({
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please slow down.',
            retryAfterMs: 60 * 1000,
        }
    }, 429),
});
