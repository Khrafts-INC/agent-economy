interface DecayResult {
    agentId: string;
    agentName: string;
    previousScore: number;
    newScore: number;
    decayApplied: number;
    daysInactive: number;
}
interface DecaySummary {
    processedAt: string;
    agentsChecked: number;
    agentsDecayed: number;
    totalDecayApplied: number;
    results: DecayResult[];
}
/**
 * Apply reputation decay to all eligible agents
 * Should be called periodically (e.g., daily via cron)
 */
export declare function applyReputationDecay(): DecaySummary;
/**
 * Preview decay without applying it
 * Useful for testing or showing users their potential decay
 */
export declare function previewReputationDecay(): DecaySummary;
/**
 * Get decay status for a specific agent
 */
export declare function getAgentDecayStatus(agentId: string): {
    agentId: string;
    currentScore: number;
    daysInactive: number;
    pendingDecay: number;
    projectedScore: number;
    atFloor: boolean;
} | null;
export {};
