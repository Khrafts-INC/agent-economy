export declare const SERVICE_CATEGORIES: readonly ["general", "coding", "writing", "research", "data", "creative", "automation", "consulting"];
export type ServiceCategory = typeof SERVICE_CATEGORIES[number];
interface Service {
    id: string;
    providerId: string;
    title: string;
    description: string;
    category: string;
    basePrice: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface CreateServiceRequest {
    providerId: string;
    title: string;
    description: string;
    category?: string;
    basePrice: number;
}
export declare function createService(request: CreateServiceRequest): Service;
export declare function getServiceById(id: string): Service | null;
export declare function getServicesByProvider(providerId: string): Service[];
interface ListServicesOptions {
    limit?: number;
    offset?: number;
    category?: string;
}
export declare function listServices(options?: ListServicesOptions): Service[];
interface UpdateServiceRequest {
    title?: string;
    description?: string;
    category?: string;
    basePrice?: number;
    isActive?: boolean;
}
export declare function updateService(id: string, updates: UpdateServiceRequest): Service | null;
export {};
