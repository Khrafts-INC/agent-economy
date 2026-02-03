/**
 * Service Templates
 * Pre-defined templates to reduce listing friction for new agents
 */

export interface ServiceTemplate {
  id: string;
  category: string;
  title: string;
  descriptionTemplate: string;
  suggestedPrice: { min: number; max: number };
  fillFields: string[];
  tags: string[];
}

export const serviceTemplates: ServiceTemplate[] = [
  // Development
  {
    id: 'code-review',
    category: 'development',
    title: 'Code Review',
    descriptionTemplate: 'I will review your {language} codebase, focusing on {focus_area}. Deliverables include {deliverables}.',
    suggestedPrice: { min: 5, max: 20 },
    fillFields: ['language', 'focus_area', 'deliverables'],
    tags: ['code', 'review', 'quality']
  },
  {
    id: 'bug-fix',
    category: 'development',
    title: 'Bug Fix',
    descriptionTemplate: 'I will diagnose and fix bugs in your {language} codebase. Includes root cause analysis and {additional_services}.',
    suggestedPrice: { min: 3, max: 15 },
    fillFields: ['language', 'additional_services'],
    tags: ['bug', 'fix', 'debugging']
  },
  {
    id: 'feature-implementation',
    category: 'development',
    title: 'Feature Implementation',
    descriptionTemplate: 'I will implement {feature_type} features in {language}. Includes {includes}.',
    suggestedPrice: { min: 10, max: 50 },
    fillFields: ['feature_type', 'language', 'includes'],
    tags: ['feature', 'implementation', 'coding']
  },
  {
    id: 'architecture-design',
    category: 'development',
    title: 'Architecture Design',
    descriptionTemplate: 'I will design a {system_type} architecture for your {project_type} project. Deliverables: {deliverables}.',
    suggestedPrice: { min: 8, max: 30 },
    fillFields: ['system_type', 'project_type', 'deliverables'],
    tags: ['architecture', 'design', 'system']
  },
  {
    id: 'api-development',
    category: 'development',
    title: 'API Development',
    descriptionTemplate: 'I will build a {api_style} API for {use_case}. Includes {features}.',
    suggestedPrice: { min: 15, max: 40 },
    fillFields: ['api_style', 'use_case', 'features'],
    tags: ['api', 'backend', 'endpoints']
  },

  // Research
  {
    id: 'web-research',
    category: 'research',
    title: 'Web Research',
    descriptionTemplate: 'I will research {topic} and provide a {format} summary covering {aspects}.',
    suggestedPrice: { min: 2, max: 10 },
    fillFields: ['topic', 'format', 'aspects'],
    tags: ['research', 'web', 'information']
  },
  {
    id: 'competitive-analysis',
    category: 'research',
    title: 'Competitive Analysis',
    descriptionTemplate: 'I will analyze competitors in the {industry} space, comparing {comparison_points}. Format: {deliverable_format}.',
    suggestedPrice: { min: 5, max: 20 },
    fillFields: ['industry', 'comparison_points', 'deliverable_format'],
    tags: ['competitive', 'analysis', 'market']
  },
  {
    id: 'data-analysis',
    category: 'research',
    title: 'Data Analysis',
    descriptionTemplate: 'I will analyze your {data_type} data to identify {analysis_goals}. Output: {output_format}.',
    suggestedPrice: { min: 5, max: 25 },
    fillFields: ['data_type', 'analysis_goals', 'output_format'],
    tags: ['data', 'analysis', 'insights']
  },
  {
    id: 'market-research',
    category: 'research',
    title: 'Market Research',
    descriptionTemplate: 'I will research the {market} market including {research_areas}. Deliverable: {deliverable}.',
    suggestedPrice: { min: 8, max: 25 },
    fillFields: ['market', 'research_areas', 'deliverable'],
    tags: ['market', 'research', 'trends']
  },

  // Content
  {
    id: 'technical-writing',
    category: 'content',
    title: 'Technical Writing',
    descriptionTemplate: 'I will write {content_type} documentation for {subject}. Style: {style}.',
    suggestedPrice: { min: 5, max: 20 },
    fillFields: ['content_type', 'subject', 'style'],
    tags: ['writing', 'technical', 'documentation']
  },
  {
    id: 'content-editing',
    category: 'content',
    title: 'Content Editing',
    descriptionTemplate: 'I will edit your {content_type} for {editing_focus}. Includes {includes}.',
    suggestedPrice: { min: 3, max: 12 },
    fillFields: ['content_type', 'editing_focus', 'includes'],
    tags: ['editing', 'content', 'polish']
  },
  {
    id: 'summarization',
    category: 'content',
    title: 'Summarization',
    descriptionTemplate: 'I will summarize {source_material} into a {output_length} {format}.',
    suggestedPrice: { min: 2, max: 8 },
    fillFields: ['source_material', 'output_length', 'format'],
    tags: ['summary', 'condensing', 'tldr']
  },
  {
    id: 'copywriting',
    category: 'content',
    title: 'Copywriting',
    descriptionTemplate: 'I will write {copy_type} copy for {purpose}. Tone: {tone}.',
    suggestedPrice: { min: 5, max: 15 },
    fillFields: ['copy_type', 'purpose', 'tone'],
    tags: ['copy', 'marketing', 'persuasion']
  },

  // Automation
  {
    id: 'script-writing',
    category: 'automation',
    title: 'Script Writing',
    descriptionTemplate: 'I will write a {language} script to {task}. Includes {features}.',
    suggestedPrice: { min: 5, max: 20 },
    fillFields: ['language', 'task', 'features'],
    tags: ['script', 'automation', 'tooling']
  },
  {
    id: 'workflow-automation',
    category: 'automation',
    title: 'Workflow Automation',
    descriptionTemplate: 'I will automate your {workflow_type} workflow using {tools}. Expected time savings: {savings}.',
    suggestedPrice: { min: 10, max: 35 },
    fillFields: ['workflow_type', 'tools', 'savings'],
    tags: ['workflow', 'automation', 'efficiency']
  },
  {
    id: 'integration-setup',
    category: 'automation',
    title: 'Integration Setup',
    descriptionTemplate: 'I will set up integration between {system_a} and {system_b}. Features: {features}.',
    suggestedPrice: { min: 8, max: 25 },
    fillFields: ['system_a', 'system_b', 'features'],
    tags: ['integration', 'api', 'connection']
  },

  // Advisory
  {
    id: 'strategy-consultation',
    category: 'advisory',
    title: 'Strategy Consultation',
    descriptionTemplate: 'I will provide strategic advice on {topic} for {context}. Format: {format}.',
    suggestedPrice: { min: 10, max: 30 },
    fillFields: ['topic', 'context', 'format'],
    tags: ['strategy', 'consultation', 'advice']
  },
  {
    id: 'problem-solving',
    category: 'advisory',
    title: 'Problem-Solving Session',
    descriptionTemplate: 'I will help you solve {problem_type} by {approach}. Output: {deliverable}.',
    suggestedPrice: { min: 5, max: 20 },
    fillFields: ['problem_type', 'approach', 'deliverable'],
    tags: ['problem', 'solving', 'brainstorm']
  },
  {
    id: 'technical-review',
    category: 'advisory',
    title: 'Technical Review',
    descriptionTemplate: 'I will review your {subject} and provide feedback on {aspects}. Report style: {style}.',
    suggestedPrice: { min: 8, max: 25 },
    fillFields: ['subject', 'aspects', 'style'],
    tags: ['review', 'technical', 'feedback']
  }
];

export function getTemplatesByCategory(category: string): ServiceTemplate[] {
  return serviceTemplates.filter(t => t.category === category);
}

export function getTemplateById(id: string): ServiceTemplate | undefined {
  return serviceTemplates.find(t => t.id === id);
}

export function getAllCategories(): string[] {
  return [...new Set(serviceTemplates.map(t => t.category))];
}

export function fillTemplate(templateId: string, values: Record<string, string>): string | null {
  const template = getTemplateById(templateId);
  if (!template) return null;
  
  let description = template.descriptionTemplate;
  for (const [field, value] of Object.entries(values)) {
    description = description.replace(`{${field}}`, value);
  }
  return description;
}
