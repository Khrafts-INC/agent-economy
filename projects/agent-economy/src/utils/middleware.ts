/**
 * Agent Economy - Middleware utilities
 */

import type { Context, Next } from 'hono';
import { EconomyError } from './errors.js';

/**
 * Global error handler middleware.
 * Catches EconomyError and formats response consistently.
 */
export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    if (err instanceof EconomyError) {
      return c.json(err.toJSON(), err.status as 400 | 404 | 409 | 429 | 500);
    }

    // Unknown error - log and return generic 500
    console.error('Unhandled error:', err);
    return c.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      500
    );
  }
}
