/**
 * USDC Escrow API Routes
 * Circle USDC Hackathon - Agentic Commerce Track
 * 
 * These endpoints let agents interact with USDC escrow
 * without needing to understand Ethereum.
 */

import { Hono } from 'hono';
import { getDb } from '../db/index.js';
import { 
  createEscrow, 
  releaseEscrow, 
  getEscrowDetails, 
  getUSDCBalance,
  getAgentWallet,
  isContractDeployed,
  ADDRESSES
} from '../contracts/escrow.js';

const escrowRoutes = new Hono();

// ============ Status Endpoint ============

/**
 * Check escrow system status
 * GET /escrow/status
 */
escrowRoutes.get('/status', async (c) => {
  return c.json({
    enabled: isContractDeployed(),
    network: 'Base Sepolia',
    contracts: {
      usdc: ADDRESSES.USDC,
      escrow: isContractDeployed() ? ADDRESSES.ESCROW : 'NOT_DEPLOYED'
    },
    message: isContractDeployed() 
      ? 'USDC escrow is live! Create escrows to secure agent transactions.'
      : 'Escrow contract pending deployment. Check back soon!'
  });
});

// ============ Agent Wallet Endpoints ============

/**
 * Get agent's managed wallet address and USDC balance
 * GET /escrow/wallet/:agentId
 */
escrowRoutes.get('/wallet/:agentId', async (c) => {
  const agentId = c.req.param('agentId');
  
  // Verify agent exists
  const db = getDb();
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  try {
    const wallet = await getAgentWallet(agentId);
    const balance = await getUSDCBalance(agentId);
    
    return c.json({
      agentId,
      wallet: wallet.address,
      balance: {
        usdc: balance,
        unit: 'USDC'
      },
      network: 'Base Sepolia'
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============ Escrow CRUD ============

/**
 * Create a new USDC escrow for an agent service
 * POST /escrow
 * 
 * Body:
 * {
 *   "clientAgentId": "uuid",
 *   "serviceId": "svc-123",
 *   "amount": "10.00",
 *   "timeoutHours": 24
 * }
 */
escrowRoutes.post('/', async (c) => {
  if (!isContractDeployed()) {
    return c.json({ 
      error: 'Escrow contract not deployed yet',
      hint: 'The smart contract is ready but needs testnet ETH for deployment'
    }, 503);
  }
  
  const body = await c.req.json();
  const { clientAgentId, serviceId, amount, timeoutHours } = body;
  
  if (!clientAgentId || !serviceId || !amount) {
    return c.json({ error: 'Missing required fields: clientAgentId, serviceId, amount' }, 400);
  }
  
  const db = getDb();
  
  // Get service to find provider
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as any;
  if (!service) {
    return c.json({ error: 'Service not found' }, 404);
  }
  
  // Verify client agent exists
  const client = db.prepare('SELECT * FROM agents WHERE id = ?').get(clientAgentId);
  if (!client) {
    return c.json({ error: 'Client agent not found' }, 404);
  }
  
  try {
    const result = await createEscrow({
      clientAgentId,
      providerAgentId: service.agent_id,
      amount,
      serviceId,
      timeoutHours: timeoutHours || 24
    });
    
    // Store escrow reference in local DB for tracking
    db.prepare(`
      INSERT INTO escrows (id, client_agent_id, provider_agent_id, service_id, amount, status, tx_hash, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, datetime('now'))
    `).run(result.escrowId, clientAgentId, service.agent_id, serviceId, amount, result.txHash);
    
    return c.json({
      escrowId: result.escrowId,
      txHash: result.txHash,
      status: 'active',
      amount,
      serviceId,
      client: clientAgentId,
      provider: service.agent_id,
      network: 'Base Sepolia',
      explorerUrl: `https://sepolia.basescan.org/tx/${result.txHash}`
    }, 201);
  } catch (error: any) {
    console.error('Escrow creation failed:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Get escrow details
 * GET /escrow/:escrowId
 */
escrowRoutes.get('/:escrowId', async (c) => {
  const escrowId = c.req.param('escrowId') as `0x${string}`;
  
  if (!isContractDeployed()) {
    // Fall back to local DB if contract not deployed
    const db = getDb();
    const escrow = db.prepare('SELECT * FROM escrows WHERE id = ?').get(escrowId);
    if (!escrow) {
      return c.json({ error: 'Escrow not found' }, 404);
    }
    return c.json(escrow);
  }
  
  try {
    const details = await getEscrowDetails(escrowId);
    return c.json(details);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Release escrow to provider (client confirms completion)
 * POST /escrow/:escrowId/release
 */
escrowRoutes.post('/:escrowId/release', async (c) => {
  if (!isContractDeployed()) {
    return c.json({ error: 'Escrow contract not deployed yet' }, 503);
  }
  
  const escrowId = c.req.param('escrowId') as `0x${string}`;
  const body = await c.req.json();
  const { clientAgentId } = body;
  
  if (!clientAgentId) {
    return c.json({ error: 'Missing clientAgentId' }, 400);
  }
  
  const db = getDb();
  const escrow = db.prepare('SELECT * FROM escrows WHERE id = ?').get(escrowId) as any;
  
  if (!escrow) {
    return c.json({ error: 'Escrow not found' }, 404);
  }
  
  if (escrow.client_agent_id !== clientAgentId) {
    return c.json({ error: 'Only the client can release the escrow' }, 403);
  }
  
  try {
    const txHash = await releaseEscrow({ clientAgentId, escrowId });
    
    // Update local DB
    db.prepare("UPDATE escrows SET status = 'released', updated_at = datetime('now') WHERE id = ?").run(escrowId);
    
    // Trigger reputation boost for provider
    // (Integration with existing reputation system)
    const providerAgentId = escrow.provider_agent_id;
    db.prepare(`
      UPDATE agents 
      SET reputation_score = reputation_score + 1,
          total_transactions = total_transactions + 1
      WHERE id = ?
    `).run(providerAgentId);
    
    return c.json({
      escrowId,
      status: 'released',
      txHash,
      explorerUrl: `https://sepolia.basescan.org/tx/${txHash}`,
      message: 'Payment released to provider!'
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Refund escrow to client (provider didn't deliver)
 * POST /escrow/:escrowId/refund
 */
escrowRoutes.post('/:escrowId/refund', async (c) => {
  if (!isContractDeployed()) {
    return c.json({ error: 'Escrow contract not deployed yet' }, 503);
  }
  
  return c.json({ 
    error: 'Refund endpoint pending implementation',
    hint: 'Refunds require deadline to pass first'
  }, 501);
});

/**
 * Provider claims after timeout
 * POST /escrow/:escrowId/claim
 */
escrowRoutes.post('/:escrowId/claim', async (c) => {
  if (!isContractDeployed()) {
    return c.json({ error: 'Escrow contract not deployed yet' }, 503);
  }
  
  return c.json({ 
    error: 'Claim endpoint pending implementation',
    hint: 'Claims require deadline to pass first'
  }, 501);
});

// ============ List Escrows ============

/**
 * List escrows for an agent (as client or provider)
 * GET /escrow/agent/:agentId
 */
escrowRoutes.get('/agent/:agentId', async (c) => {
  const agentId = c.req.param('agentId');
  const db = getDb();
  
  const escrows = db.prepare(`
    SELECT * FROM escrows 
    WHERE client_agent_id = ? OR provider_agent_id = ?
    ORDER BY created_at DESC
  `).all(agentId, agentId);
  
  return c.json({
    agentId,
    escrows,
    count: escrows.length
  });
});

export default escrowRoutes;
