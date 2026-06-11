/**
 * Founder Sensemaking / Product Coherence Engine — types.
 */

export const FOUNDER_SENSEMAKING_ENGINE_PASS_TOKEN = 'FOUNDER_SENSEMAKING_ENGINE_PASS';
export const FOUNDER_SENSEMAKING_ENGINE_OWNER_MODULE = 'aidevengine_founder_sensemaking_engine';

export type SensemakingFindingType =
  | 'CONFUSION'
  | 'CONTRADICTION'
  | 'DEAD_END'
  | 'REDUNDANCY'
  | 'PROMISE_CONFLICT'
  | 'TRUST_RISK'
  | 'COHERENCE_GAP'
  | 'ADOPTION_RISK';

export type SensemakingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SensemakingFinding {
  id: string;
  type: SensemakingFindingType;
  severity: SensemakingSeverity;
  area: string;
  whatDoesNotMakeSense: string;
  whyItMatters: string;
  recommendedUpgrade: string;
  expectedImpact: string;
  evidence: string;
}

export interface SensemakingUpgrade {
  priority: SensemakingSeverity;
  title: string;
  detail: string;
  expectedImpact: string;
  relatedFindingIds: string[];
}

export interface SensemakingFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
  evidence?: string;
}

export interface FounderSensemakingAssessment {
  founderSensemakingScore: number;
  productCoherenceScore: number;
  findings: SensemakingFinding[];
  topConfusionRisks: SensemakingFinding[];
  topContradictions: SensemakingFinding[];
  topTrustRisks: SensemakingFinding[];
  recommendedUpgrades: SensemakingUpgrade[];
  operatorFeedEvents: SensemakingFeedEvent[];
  findingsGenerated: boolean;
  contradictionsDetected: boolean;
  confusionRisksDetected: boolean;
  deadEndsDetected: boolean;
  trustRisksDetected: boolean;
  upgradesGenerated: boolean;
  scoresExplained: boolean;
  noFalseContradictions: boolean;
  noArchitectureLeakage: boolean;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
  realityConfidence?: number;
  topUnprovenClaims?: string[];
  highestRiskAssumptions?: string[];
  visualQualitySummary?: string;
  topVisualRisks?: string[];
  launchAppearanceConfidence?: number;
  highestSeverityVisualFindings?: string[];
  launchConfidence?: number;
  topLaunchDayRisks?: string[];
  launchDayBlockers?: string[];
  adoptionConfidence?: number;
  topAdoptionPredictionRisks?: string[];
  adoptionPredictionBlockers?: string[];
  adoptionRetentionRisks?: string[];
  productEconomicsSummary?: string;
  highestRoiOpportunities?: string[];
  economicRisks?: string[];
  strategicInvestmentCandidates?: string[];
  recommendedNextInvestments?: string[];
  evolutionQuickWins?: string[];
  evolutionStrategicInvestments?: string[];
  evolutionDeferredOpportunities?: string[];
  evolutionDoNotBuildList?: string[];
  productEvolutionSummary?: string;
}
