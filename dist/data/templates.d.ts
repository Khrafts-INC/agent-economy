/**
 * Service Templates
 * Pre-defined templates to reduce listing friction for new agents
 */
export interface ServiceTemplate {
    id: string;
    category: string;
    title: string;
    descriptionTemplate: string;
    suggestedPrice: {
        min: number;
        max: number;
    };
    fillFields: string[];
    tags: string[];
}
export declare const serviceTemplates: ServiceTemplate[];
export declare function getTemplatesByCategory(category: string): ServiceTemplate[];
export declare function getTemplateById(id: string): ServiceTemplate | undefined;
export declare function getAllCategories(): string[];
export declare function fillTemplate(templateId: string, values: Record<string, string>): string | null;
