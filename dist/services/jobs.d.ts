export declare function createJob(request: {
    serviceId?: string;
    requesterId: string;
    providerId: string;
    amount: number;
    description?: string;
}): {
    id: string;
    serviceId: string | null;
    requesterId: string;
    providerId: string;
    amount: number;
    description: string | null;
    deliverable: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | undefined;
};
export declare function getJobById(id: string): {
    id: string;
    serviceId: string | null;
    requesterId: string;
    providerId: string;
    amount: number;
    description: string | null;
    deliverable: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | undefined;
} | null;
export declare function acceptJob(id: string): {
    id: string;
    serviceId: string | null;
    requesterId: string;
    providerId: string;
    amount: number;
    description: string | null;
    deliverable: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | undefined;
};
export declare function deliverJob(id: string, deliverable?: string): {
    id: string;
    serviceId: string | null;
    requesterId: string;
    providerId: string;
    amount: number;
    description: string | null;
    deliverable: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | undefined;
};
export declare function completeJob(id: string): {
    activityMiningBonus: {
        requester: number;
        provider: number;
    } | undefined;
    economyStats: {
        totalCompletedJobs: number;
        activityMiningRemaining: number;
    };
    id: string;
    serviceId: string | null;
    requesterId: string;
    providerId: string;
    amount: number;
    description: string | null;
    deliverable: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | undefined;
};
export declare function cancelJob(id: string): {
    id: string;
    serviceId: string | null;
    requesterId: string;
    providerId: string;
    amount: number;
    description: string | null;
    deliverable: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | undefined;
};
export declare function listJobs(filters: {
    requesterId?: string;
    providerId?: string;
    status?: string;
}): {
    id: string;
    serviceId: string | null;
    requesterId: string;
    providerId: string;
    amount: number;
    description: string | null;
    deliverable: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | undefined;
}[];
