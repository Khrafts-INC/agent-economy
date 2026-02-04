/**
 * USDC Escrow API Routes
 * Circle USDC Hackathon - Agentic Commerce Track
 *
 * These endpoints let agents interact with USDC escrow
 * without needing to understand Ethereum.
 */
import { Hono } from 'hono';
declare const escrowRoutes: Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
export default escrowRoutes;
