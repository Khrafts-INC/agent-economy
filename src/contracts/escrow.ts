/**
 * USDC Escrow Contract Integration
 * Built for Circle USDC Hackathon - Agentic Commerce
 * 
 * This layer abstracts blockchain complexity from agents.
 * Agents just call HTTP endpoints; we handle all the crypto.
 */

import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseUnits, 
  formatUnits,
  type Address,
  type Hash,
  encodeFunctionData
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Contract addresses (Base Sepolia testnet)
export const ADDRESSES = {
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address,
  ESCROW: process.env.ESCROW_CONTRACT_ADDRESS as Address || '0x0000000000000000000000000000000000000000' as Address,
};

// ABI for our USDCEscrow contract (minimal for what we need)
export const ESCROW_ABI = [
  {
    name: 'createEscrow',
    type: 'function',
    inputs: [
      { name: 'provider', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'serviceId', type: 'string' },
      { name: 'timeoutSeconds', type: 'uint256' }
    ],
    outputs: [{ name: 'escrowId', type: 'bytes32' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'release',
    type: 'function',
    inputs: [{ name: 'escrowId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'refund',
    type: 'function',
    inputs: [{ name: 'escrowId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'claim',
    type: 'function',
    inputs: [{ name: 'escrowId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'getEscrow',
    type: 'function',
    inputs: [{ name: 'escrowId', type: 'bytes32' }],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'client', type: 'address' },
        { name: 'provider', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'serviceId', type: 'string' },
        { name: 'status', type: 'uint8' }
      ]
    }],
    stateMutability: 'view'
  },
  {
    name: 'EscrowCreated',
    type: 'event',
    inputs: [
      { name: 'escrowId', type: 'bytes32', indexed: true },
      { name: 'client', type: 'address', indexed: true },
      { name: 'provider', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'serviceId', type: 'string', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false }
    ]
  }
] as const;

// USDC ERC20 ABI (just approval)
export const USDC_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

// Initialize clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org')
});

// Status enum mapping
const EscrowStatus = ['Active', 'Released', 'Refunded', 'Claimed'] as const;

/**
 * Agent wallet management - each agent gets a managed wallet
 * In production, use proper key management (KMS, etc.)
 */
interface AgentWallet {
  address: Address;
  privateKey: `0x${string}`;
}

// In-memory wallet store for MVP (would be encrypted DB in production)
const agentWallets = new Map<string, AgentWallet>();

/**
 * Get or create a wallet for an agent
 */
export async function getAgentWallet(agentId: string): Promise<AgentWallet> {
  if (agentWallets.has(agentId)) {
    return agentWallets.get(agentId)!;
  }
  
  // Generate deterministic wallet from agentId (for demo - use proper derivation in prod)
  // This is INSECURE for production - use proper key management!
  const seed = agentId.padEnd(64, '0').slice(0, 64);
  const privateKey = `0x${seed}` as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  
  const wallet: AgentWallet = {
    address: account.address,
    privateKey
  };
  
  agentWallets.set(agentId, wallet);
  return wallet;
}

/**
 * Get USDC balance for an agent's wallet
 */
export async function getUSDCBalance(agentId: string): Promise<string> {
  const wallet = await getAgentWallet(agentId);
  
  const balance = await publicClient.readContract({
    address: ADDRESSES.USDC,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [wallet.address]
  });
  
  return formatUnits(balance, 6); // USDC has 6 decimals
}

/**
 * Create a new escrow
 */
export async function createEscrow(params: {
  clientAgentId: string;
  providerAgentId: string;
  amount: string; // Human readable (e.g., "10.00")
  serviceId: string;
  timeoutHours: number;
}): Promise<{ escrowId: Hash; txHash: Hash }> {
  if (ADDRESSES.ESCROW === '0x0000000000000000000000000000000000000000') {
    throw new Error('Escrow contract not deployed yet');
  }
  
  const clientWallet = await getAgentWallet(params.clientAgentId);
  const providerWallet = await getAgentWallet(params.providerAgentId);
  
  const account = privateKeyToAccount(clientWallet.privateKey);
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org')
  });
  
  const amountWei = parseUnits(params.amount, 6);
  const timeoutSeconds = BigInt(params.timeoutHours * 3600);
  
  // First, approve USDC spend
  const approvalHash = await walletClient.writeContract({
    address: ADDRESSES.USDC,
    abi: USDC_ABI,
    functionName: 'approve',
    args: [ADDRESSES.ESCROW, amountWei]
  });
  
  await publicClient.waitForTransactionReceipt({ hash: approvalHash });
  
  // Create the escrow
  const txHash = await walletClient.writeContract({
    address: ADDRESSES.ESCROW,
    abi: ESCROW_ABI,
    functionName: 'createEscrow',
    args: [providerWallet.address, amountWei, params.serviceId, timeoutSeconds]
  });
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  
  // Parse escrowId from event logs
  const escrowCreatedLog = receipt.logs.find(log => {
    // EscrowCreated event signature
    return log.topics[0] === '0x...' // Would be actual event signature
  });
  
  // For now, return txHash as escrowId placeholder
  return {
    escrowId: receipt.logs[0]?.topics[1] as Hash || txHash,
    txHash
  };
}

/**
 * Release escrow funds to provider
 */
export async function releaseEscrow(params: {
  clientAgentId: string;
  escrowId: Hash;
}): Promise<Hash> {
  if (ADDRESSES.ESCROW === '0x0000000000000000000000000000000000000000') {
    throw new Error('Escrow contract not deployed yet');
  }
  
  const clientWallet = await getAgentWallet(params.clientAgentId);
  const account = privateKeyToAccount(clientWallet.privateKey);
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org')
  });
  
  const txHash = await walletClient.writeContract({
    address: ADDRESSES.ESCROW,
    abi: ESCROW_ABI,
    functionName: 'release',
    args: [params.escrowId]
  });
  
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Get escrow details
 */
export async function getEscrowDetails(escrowId: Hash) {
  if (ADDRESSES.ESCROW === '0x0000000000000000000000000000000000000000') {
    throw new Error('Escrow contract not deployed yet');
  }
  
  const escrow = await publicClient.readContract({
    address: ADDRESSES.ESCROW,
    abi: ESCROW_ABI,
    functionName: 'getEscrow',
    args: [escrowId]
  });
  
  return {
    client: escrow.client,
    provider: escrow.provider,
    amount: formatUnits(escrow.amount, 6),
    createdAt: new Date(Number(escrow.createdAt) * 1000).toISOString(),
    deadline: new Date(Number(escrow.deadline) * 1000).toISOString(),
    serviceId: escrow.serviceId,
    status: EscrowStatus[escrow.status]
  };
}

/**
 * Check if contract is deployed and ready
 */
export function isContractDeployed(): boolean {
  return ADDRESSES.ESCROW !== '0x0000000000000000000000000000000000000000';
}
