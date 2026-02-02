import type { Agent, RegisterRequest } from '../types/index.js';
interface AgentRow {
    id: string;
    name: string;
    moltbook_id: string | null;
    bio: string | null;
    balance: number;
    reputation_score: number;
    total_jobs_completed: number;
    total_jobs_requested: number;
    verified_at: string | null;
    created_at: string;
    updated_at: string;
}
declare function rowToAgent(row: AgentRow): Agent & {
    bio?: string;
    reputationScore: number;
    jobsCompleted: number;
    jobsRequested: number;
    verifiedAt?: Date;
};
export declare function registerAgent(request: RegisterRequest): Agent & {
    bio?: string;
    reputationScore: number;
};
export declare function getAgentById(id: string): ReturnType<typeof rowToAgent> | null;
export declare function getAgentByMoltbookId(moltbookId: string): ReturnType<typeof rowToAgent> | null;
export declare function updateAgent(id: string, updates: {
    name?: string;
    bio?: string;
}): ReturnType<typeof rowToAgent> | null;
export declare function listAgents(options?: {
    limit?: number;
    offset?: number;
}): ReturnType<typeof rowToAgent>[];
export declare function getAgentBalance(id: string): number | null;
export declare function updateAgentBalance(id: string, delta: number): boolean;
export declare function incrementJobCount(id: string, field: 'completed' | 'requested'): void;
export declare function updateReputationScore(id: string): void;
export {};
