/**
 * Competitive Reality Engine — types.
 */

import type { AdoptionPredictionAssessment } from '../adoption-prediction-engine/adoption-prediction-engine-types.js';
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

export type CompetitiveCategory =
  | 'DIFFERENTIATION_STRENGTH'
  | 'REPLACEMENT_RISK'
  | 'FOUNDER_ADVANTAGE'
  | 'PRODUCT_ADVANTAGE'
  | 'STRATEGIC_DEFENSIBILITY'
  | 'COMPETITIVE_BLIND_SPOT';

export type CompetitiveFindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CompetitiveFindingType =
  | 'WEAK_DIFFERENTIATION'
  | 'HIGH_REPLACEMENT_RISK'
  | 'LOW_DEFENSIBILITY'
  | 'UNPROVEN_ADVANTAGE'
  | 'COMPETITIVE_GAP'
  | 'STRATEGIC_RISK';

export type CompetitivePositionClassification =
  | 'STRONG_DIFFERENTIATION'
  | 'MODERATE_DIFFERENTIATION'
  | 'LIMITED_DIFFERENTIATION'
  | 'COMMODITY_RISK';

export type CompetitiveClaimStatus = 'PROVEN' | 'PARTIALLY_PROVEN' | 'UNPROVEN' | 'CONTRADICTED';

export interface CompetitiveSubscores {
  differentiationStrength: number;
  replacementRisk: number;
  founderAdvantage: number;
  productAdvantage: number;
  strategicDefensibility: number;
  blindSpotRisk: number;
}

export interface CompetitiveFinding {
  id: string;
  type: CompetitiveFindingType;
  category: CompetitiveCategory;
  severity: CompetitiveFindingSeverity;
  explanation: string;
  recommendation: string;
}

export interface CompetitiveAdvantageRecord {
  id: string;
  name: string;
  strengthScore: number;
  evidence: string[];
  explanation: string;
}

export interface CompetitiveClaimRecord {
  id: string;
  claim: string;
  status: CompetitiveClaimStatus;
  evidence: string[];
  explanation: string;
}

export interface CompetitiveFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface CompetitiveRealityAssessment {
  competitiveRealityScore: number;
  portfolioSubscores: CompetitiveSubscores;
  competitivePosition: CompetitivePositionClassification;
  findings: CompetitiveFinding[];
  strongestCompetitiveAdvantages: string[];
  weakestCompetitiveAdvantages: string[];
  highReplacementRisks: string[];
  strategicDefensibility: string[];
  competitiveBlindSpots: string[];
  unprovenCompetitiveClaims: string[];
  competitiveRealitySummary: string;
  operatorFeedEvents: CompetitiveFeedEvent[];
  majorCompetitiveRisks: boolean;
  competitiveRealityPass: boolean;
  competitiveAdvantageVisibilityPass: boolean;
  replacementRiskVisibilityPass: boolean;
  defensibilityVisibilityPass: boolean;
  blindSpotVisibilityPass: boolean;
  competitiveClassificationVisibilityPass: boolean;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
}

export interface CompetitiveShellSources {
  appJs: string;
  html: string;
  css: string;
}

export interface AssessCompetitiveRealityInput {
  shellSources: CompetitiveShellSources;
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
  validatorScriptCount?: number;
}

export interface EnrichedCompetitiveAssessments {
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
}

export interface CompetitiveRealityVisibility {
  score: number;
  competitiveRealityScore: number;
  majorCompetitiveRisks: boolean;
  competitiveRealityPass: boolean;
  competitivePosition: CompetitivePositionClassification;
  strongestAdvantageCount: number;
  blindSpotCount: number;
}
