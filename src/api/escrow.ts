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
  ADDRESSES,
  NETWORK
} from '../contracts/escrow.js';
import { randomBytes } from 'crypto';

const escrowRoutes = new Hono();

// Mock mode for testing without deployed contract
const MOCK_MODE = process.env.ESCROW_MOCK_MODE === 'true' || !isContractDeployed();

// Generate mock transaction hash
const mockTxHash = () => `0x${randomBytes(32).toString('hex')}` as `0x${string}`;
const mockEscrowId = () => `0x${randomBytes(32).toString('hex')}` as `0x${string}`;

// ============ Status Endpoint ============

/**
 * Check escrow system status
 * GET /escrow/status
 */
escrowRoutes.get('/status', async (c) => {
  const deployed = isContractDeployed();
  return c.json({
    enabled: deployed || MOCK_MODE,
    mockMode: MOCK_MODE && !deployed,
    network: NETWORK.name,
    chainId: NETWORK.chainId,
    explorer: NETWORK.explorer,
    contracts: {
      usdc: ADDRESSES.USDC,
      escrow: deployed ? ADDRESSES.ESCROW : 'NOT_DEPLOYED'
    },
    arbiscanContract: deployed ? `${NETWORK.explorer}/address/${ADDRESSES.ESCROW}` : null,
    message: deployed 
      ? '🚀 USDC escrow is LIVE on Arbitrum Sepolia! Create escrows to secure agent transactions.'
      : MOCK_MODE
        ? '🧪 MOCK MODE: Full API functional for testing. No real USDC involved.'
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
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as any;
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  // Mock mode: generate deterministic wallet and fake balance
  if (MOCK_MODE && !isContractDeployed()) {
    const mockWallet = `0x${Buffer.from(agentId.replace(/-/g, '').slice(0, 40)).toString('hex').padEnd(40, '0')}`;
    return c.json({
      agentId,
      wallet: mockWallet,
      balance: {
        usdc: '100.00',  // Mock balance for testing
        unit: 'USDC'
      },
      network: NETWORK.name,
      mockMode: true
    });
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
      network: NETWORK.name
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
  
  // MOCK MODE: Simulate escrow without on-chain transaction
  if (MOCK_MODE && !isContractDeployed()) {
    const escrowId = mockEscrowId();
    const txHash = mockTxHash();
    
    db.prepare(`
      INSERT INTO escrows (id, client_agent_id, provider_agent_id, service_id, amount, status, tx_hash, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, datetime('now'))
    `).run(escrowId, clientAgentId, service.provider_id, serviceId, amount, txHash);
    
    return c.json({
      escrowId,
      txHash,
      status: 'active',
      amount,
      serviceId,
      client: clientAgentId,
      provider: service.provider_id,
      network: NETWORK.name,
      mockMode: true,
      explorerUrl: `https://sepolia.arbiscan.io/tx/${txHash}`,
      message: '🧪 Mock escrow created. In production, USDC would be locked on-chain.'
    }, 201);
  }
  
  // REAL MODE: On-chain transaction
  if (!isContractDeployed()) {
    return c.json({ 
      error: 'Escrow contract not deployed yet',
      hint: 'The smart contract is ready but needs testnet ETH for deployment'
    }, 503);
  }
  
  try {
    const result = await createEscrow({
      clientAgentId,
      providerAgentId: service.provider_id,
      amount,
      serviceId,
      timeoutHours: timeoutHours || 24
    });
    
    // Store escrow reference in local DB for tracking
    db.prepare(`
      INSERT INTO escrows (id, client_agent_id, provider_agent_id, service_id, amount, status, tx_hash, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, datetime('now'))
    `).run(result.escrowId, clientAgentId, service.provider_id, serviceId, amount, result.txHash);
    
    return c.json({
      escrowId: result.escrowId,
      txHash: result.txHash,
      status: 'active',
      amount,
      serviceId,
      client: clientAgentId,
      provider: service.provider_id,
      network: NETWORK.name,
      explorerUrl: `https://sepolia.arbiscan.io/tx/${result.txHash}`
    }, 201);
  } catch (error: any) {
    console.error('Escrow creation failed:', error);
    
    // Check if it's a funding issue and provide helpful response
    if (error.message?.includes('insufficient funds') || error.shortMessage?.includes('insufficient funds')) {
      // Get the agent's wallet address for funding instructions
      const wallet = await getAgentWallet(clientAgentId);
      return c.json({ 
        error: 'Agent wallet needs testnet funds',
        agentWallet: wallet.address,
        network: NETWORK.name,
        chainId: NETWORK.chainId,
        fundingInstructions: {
          step1: 'Get Arbitrum Sepolia ETH from: https://faucet.quicknode.com/arbitrum/sepolia',
          step2: `Get test USDC by interacting with faucet or token contract`,
          agentAddress: wallet.address
        },
        hint: 'Use mock mode for testing without real funds: set ESCROW_MOCK_MODE=true'
      }, 402); // Payment Required
    }
    
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
  
  // MOCK MODE: Simulate release
  if (MOCK_MODE && !isContractDeployed()) {
    const txHash = mockTxHash();
    
    db.prepare("UPDATE escrows SET status = 'released', updated_at = datetime('now') WHERE id = ?").run(escrowId);
    
    // Update reputation
    const providerAgentId = escrow.provider_agent_id;
    db.prepare(`
      UPDATE agents 
      SET reputation_score = reputation_score + 1,
          total_jobs_completed = total_jobs_completed + 1
      WHERE id = ?
    `).run(providerAgentId);
    
    return c.json({
      escrowId,
      status: 'released',
      txHash,
      mockMode: true,
      explorerUrl: `https://sepolia.arbiscan.io/tx/${txHash}`,
      message: '🧪 Mock release. In production, USDC would transfer to provider on-chain.'
    });
  }
  
  // REAL MODE
  if (!isContractDeployed()) {
    return c.json({ error: 'Escrow contract not deployed yet' }, 503);
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
          total_jobs_completed = total_jobs_completed + 1
      WHERE id = ?
    `).run(providerAgentId);
    
    return c.json({
      escrowId,
      status: 'released',
      txHash,
      explorerUrl: `https://sepolia.arbiscan.io/tx/${txHash}`,
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
    return c.json({ error: 'Only the client can request a refund' }, 403);
  }
  
  if (escrow.status !== 'active') {
    return c.json({ error: `Escrow is already ${escrow.status}` }, 400);
  }
  
  // MOCK MODE: Simulate refund
  if (MOCK_MODE && !isContractDeployed()) {
    const txHash = mockTxHash();
    
    db.prepare("UPDATE escrows SET status = 'refunded', updated_at = datetime('now') WHERE id = ?").run(escrowId);
    
    // Negative reputation for provider (didn't deliver)
    db.prepare(`
      UPDATE agents 
      SET reputation_score = MAX(0, reputation_score - 2)
      WHERE id = ?
    `).run(escrow.provider_agent_id);
    
    return c.json({
      escrowId,
      status: 'refunded',
      txHash,
      mockMode: true,
      explorerUrl: `https://sepolia.arbiscan.io/tx/${txHash}`,
      message: '🧪 Mock refund. In production, USDC would return to client after timeout.'
    });
  }
  
  if (!isContractDeployed()) {
    return c.json({ error: 'Escrow contract not deployed yet' }, 503);
  }
  
  return c.json({ 
    error: 'Refund requires deadline to pass',
    hint: 'Call this endpoint after the escrow timeout has expired'
  }, 400);
});

/**
 * Provider claims after timeout
 * POST /escrow/:escrowId/claim
 */
escrowRoutes.post('/:escrowId/claim', async (c) => {
  const escrowId = c.req.param('escrowId') as `0x${string}`;
  const body = await c.req.json();
  const { providerAgentId } = body;
  
  if (!providerAgentId) {
    return c.json({ error: 'Missing providerAgentId' }, 400);
  }
  
  const db = getDb();
  const escrow = db.prepare('SELECT * FROM escrows WHERE id = ?').get(escrowId) as any;
  
  if (!escrow) {
    return c.json({ error: 'Escrow not found' }, 404);
  }
  
  if (escrow.provider_agent_id !== providerAgentId) {
    return c.json({ error: 'Only the provider can claim' }, 403);
  }
  
  if (escrow.status !== 'active') {
    return c.json({ error: `Escrow is already ${escrow.status}` }, 400);
  }
  
  // MOCK MODE: Simulate claim
  if (MOCK_MODE && !isContractDeployed()) {
    const txHash = mockTxHash();
    
    db.prepare("UPDATE escrows SET status = 'claimed', updated_at = datetime('now') WHERE id = ?").run(escrowId);
    
    // Negative reputation for client (went MIA)
    db.prepare(`
      UPDATE agents 
      SET reputation_score = MAX(0, reputation_score - 2)
      WHERE id = ?
    `).run(escrow.client_agent_id);
    
    return c.json({
      escrowId,
      status: 'claimed',
      txHash,
      mockMode: true,
      explorerUrl: `https://sepolia.arbiscan.io/tx/${txHash}`,
      message: '🧪 Mock claim. In production, provider would receive USDC after client timeout.'
    });
  }
  
  if (!isContractDeployed()) {
    return c.json({ error: 'Escrow contract not deployed yet' }, 503);
  }
  
  return c.json({ 
    error: 'Claim requires deadline to pass',
    hint: 'Call this endpoint after the escrow timeout has expired'
  }, 400);
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
