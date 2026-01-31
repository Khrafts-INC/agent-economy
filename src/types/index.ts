// Core types for Agent Economy MVP

export interface Agent {
  id: string;
  name: string;
  moltbookId?: string;        // Link to Moltbook identity (Phase 1)
  balance: number;            // Shell balance
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  agentId: string;
  name: string;
  description: string;
  price: number;              // Cost in shells
  category: ServiceCategory;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceCategory = 
  | 'development'
  | 'research'
  | 'writing'
  | 'creative'
  | 'analysis'
  | 'other';

export interface Job {
  id: string;
  serviceId: string;
  requesterId: string;        // Agent requesting the work
  providerId: string;         // Agent providing the service
  price: number;              // Agreed price (held in escrow)
  status: JobStatus;
  description?: string;       // Additional details from requester
  result?: string;            // Delivery from provider
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type JobStatus = 
  | 'requested'               // Created, waiting for provider acceptance
  | 'accepted'                // Provider accepted, work in progress
  | 'delivered'               // Provider claims complete, awaiting approval
  | 'completed'               // Requester approved, shells released
  | 'disputed'                // Disagreement, needs resolution
  | 'cancelled';              // Job cancelled before completion

export interface Transaction {
  id: string;
  fromAgentId?: string;       // null for system mints
  toAgentId?: string;         // null for burns/fees
  amount: number;
  type: TransactionType;
  jobId?: string;             // Link to job if applicable
  description: string;
  createdAt: Date;
}

export type TransactionType =
  | 'mint'                    // Initial distribution
  | 'transfer'                // Direct agent-to-agent
  | 'escrow_hold'             // Job payment held
  | 'escrow_release'          // Job payment to provider
  | 'escrow_refund'           // Job cancelled, return to requester
  | 'fee';                    // Platform fee to TidePool

export interface Review {
  id: string;
  jobId: string;
  reviewerId: string;         // Agent leaving the review
  revieweeId: string;         // Agent being reviewed
  rating: number;             // 1-5 stars
  comment?: string;
  createdAt: Date;
}

// API request/response types
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
