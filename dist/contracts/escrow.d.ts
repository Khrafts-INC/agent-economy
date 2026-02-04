/**
 * USDC Escrow Contract Integration
 * Built for Circle USDC Hackathon - Agentic Commerce
 *
 * This layer abstracts blockchain complexity from agents.
 * Agents just call HTTP endpoints; we handle all the crypto.
 */
import { type Address, type Hash } from 'viem';
export declare const ADDRESSES: {
    USDC: Address;
    ESCROW: `0x${string}`;
};
export declare const ESCROW_ABI: readonly [{
    readonly name: "createEscrow";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "provider";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "serviceId";
        readonly type: "string";
    }, {
        readonly name: "timeoutSeconds";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "escrowId";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly name: "release";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "escrowId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly name: "refund";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "escrowId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly name: "claim";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "escrowId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly name: "getEscrow";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "escrowId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "client";
            readonly type: "address";
        }, {
            readonly name: "provider";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "createdAt";
            readonly type: "uint256";
        }, {
            readonly name: "deadline";
            readonly type: "uint256";
        }, {
            readonly name: "serviceId";
            readonly type: "string";
        }, {
            readonly name: "status";
            readonly type: "uint8";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "EscrowCreated";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "escrowId";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "client";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "provider";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "serviceId";
        readonly type: "string";
        readonly indexed: false;
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}];
export declare const USDC_ABI: readonly [{
    readonly name: "approve";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly name: "balanceOf";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "allowance";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}];
/**
 * Agent wallet management - each agent gets a managed wallet
 * In production, use proper key management (KMS, etc.)
 */
interface AgentWallet {
    address: Address;
    privateKey: `0x${string}`;
}
/**
 * Get or create a wallet for an agent
 */
export declare function getAgentWallet(agentId: string): Promise<AgentWallet>;
/**
 * Get USDC balance for an agent's wallet
 */
export declare function getUSDCBalance(agentId: string): Promise<string>;
/**
 * Create a new escrow
 */
export declare function createEscrow(params: {
    clientAgentId: string;
    providerAgentId: string;
    amount: string;
    serviceId: string;
    timeoutHours: number;
}): Promise<{
    escrowId: Hash;
    txHash: Hash;
}>;
/**
 * Release escrow funds to provider
 */
export declare function releaseEscrow(params: {
    clientAgentId: string;
    escrowId: Hash;
}): Promise<Hash>;
/**
 * Get escrow details
 */
export declare function getEscrowDetails(escrowId: Hash): Promise<{
    client: `0x${string}`;
    provider: `0x${string}`;
    amount: string;
    createdAt: string;
    deadline: string;
    serviceId: string;
    status: "Active" | "Released" | "Refunded" | "Claimed";
}>;
/**
 * Check if contract is deployed and ready
 */
export declare function isContractDeployed(): boolean;
export {};
