export interface Agent {
    id: string;
    name: string;
    moltbookId?: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Service {
    id: string;
    agentId: string;
    name: string;
    description: string;
    price: number;
    category: ServiceCategory;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export type ServiceCategory = 'development' | 'research' | 'writing' | 'creative' | 'analysis' | 'other';
export interface Job {
    id: string;
    serviceId: string;
    requesterId: string;
    providerId: string;
    price: number;
    status: JobStatus;
    description?: string;
    result?: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export type JobStatus = 'requested' | 'accepted' | 'delivered' | 'completed' | 'disputed' | 'cancelled';
export interface Transaction {
    id: string;
    fromAgentId?: string;
    toAgentId?: string;
    amount: number;
    type: TransactionType;
    jobId?: string;
    description: string;
    createdAt: Date;
}
export type TransactionType = 'mint' | 'transfer' | 'escrow_hold' | 'escrow_release' | 'escrow_refund' | 'fee';
export interface Review {
    id: string;
    jobId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
}
export interface RegisterRequest {
    name: string;
    moltbookId?: string;
}
export interface CreateServiceRequest {
    name: string;
    description: string;
    price: number;
    category: ServiceCategory;
}
export interface CreateJobRequest {
    serviceId: string;
    description?: string;
}
export interface CompleteJobRequest {
    result: string;
}
export interface ReviewRequest {
    rating: number;
    comment?: string;
}
