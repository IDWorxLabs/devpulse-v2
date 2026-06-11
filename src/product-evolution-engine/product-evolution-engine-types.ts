/**
 * Product Evolution Engine — types.
 */

import type { AdoptionPredictionAssessment } from '../adoption-prediction-engine/adoption-prediction-engine-types.js';
import type { CustomerJourneySimulationAssessment } from '../customer-journey-simulation/customer-journey-simulation-types.js';
import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FounderFrictionHeatmapAssessment } from '../founder-friction-heatmap/founder-friction-heatmap-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import type { LaunchDaySimulationAssessment } from '../launch-day-simulation-engine/launch-day-simulation-engine-types.js';
import type { ProductEconomicsAssessment } from '../product-economics-engine/product-economics-engine-types.js';
import type { PromiseRealityEngineAssessment } from '../promise-reality-engine/promise-reality-engine-types.js';
import type { VerificationTrustEvidenceAssessment } from '../verification-trust-evidence/verification-trust-evidence-types.js';
import type { VisualQualityAuthorityAssessment } from '../visual-quality-authority/visual-quality-authority-types.js';

export type EvolutionCategory =
  | 'ADOPTION_GROWTH'
  | 'FRICTION_REDUCTION'
  | 'TRUST_IMPROVEMENT'
  | 'QUALITY_IMPROVEMENT'
  | 'STRATEGIC_LEVERAGE'
  | 'EXECUTION_EFFICIENCY';

export type RecommendationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type EvolutionRankingBucket =
  | 'HIGHEST_PRIORITY'
  | 'QUICK_WIN'
  | 'STRATEGIC_INVESTMENT'
  | 'DEFERRED'
  | 'DO_NOT_BUILD';

export interface EvolutionSubscores {
  adoptionGrowth: number;
  frictionReduction: number;
  trustImprovement: number;
  qualityImprovement: number;
  strategicLeverage: number;
  executionEfficiency: number;
}

export interface EvolutionCandidate {
  id: string;
  name: string;
  categoryScores: EvolutionSubscores;
  priorityScore: number;
  confidence: RecommendationConfidence;
  evidence: string[];
  rankingBucket: EvolutionRankingBucket;
  explanation: string;
  recommendation: string;
}

export interface EvolutionFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface ProductEvolutionAssessment {
  productEvolutionScore: number;
  portfolioSubscores: EvolutionSubscores;
  candidates: EvolutionCandidate[];
  highestPriorityOpportunities: string[];
  quickWins: string[];
  strategicInvestments: string[];
  deferredOpportunities: string[];
  doNotBuild: string[];
  recommendedNextInvestments: string[];
  productEvolutionSummary: string;
  recommendationConfidenceSummary: string;
  operatorFeedEvents: EvolutionFeedEvent[];
  majorEvolutionRisks: boolean;
  productEvolutionPass: boolean;
  recommendationRankingVisibilityPass: boolean;
  recommendationConfidenceVisibilityPass: boolean;
  evidenceTraceabilityPass: boolean;
  quickWinVisibilityPass: boolean;
  strategicInvestmentVisibilityPass: boolean;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
}

export interface EvolutionShellSources {
  appJs: string;
  html: string;
  css: string;
}

export interface AssessProductEvolutionInput {
  shellSources: EvolutionShellSources;
  firstTimeUserReality: FirstTimeUserRealityAssessment;
  verificationTrustEvidence: VerificationTrustEvidenceAssessment;
  founderFrictionHeatmap: FounderFrictionHeatmapAssessment;
  customerJourneySimulation: CustomerJourneySimulationAssessment;
  promiseRealityEngine: PromiseRealityEngineAssessment;
  visualQualityAuthority: VisualQualityAuthorityAssessment;
  launchDaySimulation: LaunchDaySimulationAssessment;
  adoptionPrediction: AdoptionPredictionAssessment;
  productEconomics: ProductEconomicsAssessment;
}

export interface EnrichedEvolutionAssessments {
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
}

export interface ProductEvolutionVisibility {
  score: number;
  productEvolutionScore: number;
  majorEvolutionRisks: boolean;
  productEvolutionPass: boolean;
  highestPriorityCount: number;
  quickWinCount: number;
}
