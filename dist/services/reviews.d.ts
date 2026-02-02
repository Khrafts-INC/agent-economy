export interface Review {
    id: string;
    jobId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
}
export interface CreateReviewInput {
    jobId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    comment?: string;
}
export declare function createReview(input: CreateReviewInput): Review;
export declare function getReviewById(id: string): Review | null;
export declare function listReviews(options?: {
    revieweeId?: string;
    reviewerId?: string;
    jobId?: string;
    limit?: number;
    offset?: number;
}): {
    reviews: Review[];
    averageRating?: number;
};
export declare function getAgentReputation(agentId: string): {
    averageRating: number;
    totalReviews: number;
};
