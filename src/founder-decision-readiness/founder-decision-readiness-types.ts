/**
 * Founder Decision Readiness — types.
 */

import type { AdoptionPredictionAssessment } from '../adoption-prediction-engine/adoption-prediction-engine-types.js';
import type { CompetitiveRealityAssessment } from '../competitive-reality-engine/competitive-reality-engine-types.js';
import type { CustomerJourneySimulationAssessment } from '../customer-journey-simulation/customer-journey-simulation-types.js';
import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FounderFrictionHeatmapAssessment } from '../founder-friction-heatmap/founder-friction-heatmap-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import type { LaunchDaySimulationAssessment } from '../launch-day-simulation-engine/launch-day-simulation-engine-types.js';
import type { ProductEconomicsAssessment } from '../product-economics-engine/product-economics-engine-types.js';
import type { ProductEvolutionAssessment } from '../product-evolution-engine/product-evolution-engine-types.js';
import type { PromiseRealityEngineAssessment } from '../promise-reality-engine/promise-reality-engine-types.js';
import type { VerificationTrustEvidenceAssessment } from '../verification-trust-evidence/verification-trust-evidence-types.js';
import type { VisualQualityAuthorityAssessment } from '../visual-quality-authority/visual-quality-authority-types.js';

export type DecisionCategory =
  | 'LAUNCH_READINESS'
  | 'ADOPTION_READINESS'
  | 'TRUST_READINESS'
  | 'PRODUCT_READINESS'
  | 'STRATEGIC_READINESS'
  | 'FOUNDER_READINESS';

export type FounderDecisionOutcome =
  | 'READY_TO_LAUNCH'
  | 'LAUNCH_WITH_WARNINGS'
  | 'NOT_READY_FOR_LAUNCH'
  | 'FIX_CRITICAL_ISSUES_FIRST'
  | 'IMPROVE_ADOPTION_FIRST'
  | 'VALIDATE_ASSUMPTIONS_FIRST'
  | 'IMPROVE_COMPETITIVE_POSITION_FIRST'
  | 'FOCUS_ON_EVOLUTION_FIRST';

export type DecisionConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DecisionReadinessSubscores {
  launchReadiness: number;
  adoptionReadiness: number;
  trustReadiness: number;
  productReadiness: number;
  strategicReadiness: number;
  founderReadiness: number;
}

export interface DecisionFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface FounderDecisionReadinessAssessment {
  decisionReadinessScore: number;
  portfolioSubscores: DecisionReadinessSubscores;
  primaryRecommendation: FounderDecisionOutcome;
  decisionConfidence: DecisionConfidence;
  whyThisRecommendation: string;
  supportingEvidence: string[];
  blockingEvidence: string[];
  recommendedNextActions: string[];
  decisionReadinessSummary: string;
  operatorFeedEvents: DecisionFeedEvent[];
  majorDecisionRisks: boolean;
  founderDecisionReadinessPass: boolean;
  decisionVisibilityPass: boolean;
  confidenceVisibilityPass: boolean;
  justificationVisibilityPass: boolean;
  blockerVisibilityPass: boolean;
  nextActionVisibilityPass: boolean;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
}

export interface DecisionShellSources {
  appJs: string;
  html: string;
  css: string;
}

export interface AssessFounderDecisionReadinessInput {
  shellSources: DecisionShellSources;
  firstTimeUserReality: FirstTimeUserRealityAssessment;
  verificationTrustEvidence: VerificationTrustEvidenceAssessment;
  founderFrictionHeatmap: FounderFrictionHeatmapAssessment;
  customerJourneySimulation: CustomerJourneySimulationAssessment;
  promiseRealityEngine: PromiseRealityEngineAssessment;
  visualQualityAuthority: VisualQualityAuthorityAssessment;
  launchDaySimulation: LaunchDaySimulationAssessment;
  adoptionPrediction: AdoptionPredictionAssessment;
  productEconomics: ProductEconomicsAssessment;
  productEvolution: ProductEvolutionAssessment;
  competitiveReality: CompetitiveRealityAssessment;
}

export interface EnrichedDecisionReadinessAssessments {
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
}

export interface FounderDecisionReadinessVisibility {
  score: number;
  decisionReadinessScore: number;
  majorDecisionRisks: boolean;
  founderDecisionReadinessPass: boolean;
  primaryRecommendation: FounderDecisionOutcome;
  decisionConfidence: DecisionConfidence;
}
