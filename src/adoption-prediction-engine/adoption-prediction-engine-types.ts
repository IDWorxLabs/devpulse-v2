/**
 * Adoption Prediction Engine — types.
 */

import type { CustomerJourneySimulationAssessment } from '../customer-journey-simulation/customer-journey-simulation-types.js';
import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FounderFrictionHeatmapAssessment } from '../founder-friction-heatmap/founder-friction-heatmap-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import type { LaunchDaySimulationAssessment } from '../launch-day-simulation-engine/launch-day-simulation-engine-types.js';
import type { VisualQualityAuthorityAssessment } from '../visual-quality-authority/visual-quality-authority-types.js';

export type AdoptionFindingType =
  | 'VALUE_UNCLEAR'
  | 'TIME_TO_VALUE_TOO_LONG'
  | 'ADOPTION_FRICTION'
  | 'RETENTION_RISK'
  | 'LOW_RECOMMENDATION_POTENTIAL'
  | 'COMPETITIVE_REPLACEMENT_RISK'
  | 'ADOPTION_BLOCKER';

export type AdoptionCategory =
  | 'VALUE_CLARITY'
  | 'TIME_TO_VALUE'
  | 'ADOPTION_FRICTION'
  | 'RETENTION_POTENTIAL'
  | 'RECOMMENDATION_POTENTIAL'
  | 'COMPETITIVE_PRESSURE';

export type AdoptionSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface AdoptionSubscores {
  valueClarity: number;
  timeToValue: number;
  adoptionFriction: number;
  retentionPotential: number;
  recommendationPotential: number;
  competitivePressure: number;
}

export interface AdoptionFinding {
  id: string;
  type: AdoptionFindingType;
  category: AdoptionCategory;
  severity: AdoptionSeverity;
  explanation: string;
  recommendation: string;
  surface?: string;
}

export interface AdoptionFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface AdoptionPredictionAssessment {
  adoptionPredictionScore: number;
  subscores: AdoptionSubscores;
  findings: AdoptionFinding[];
  adoptionStrengths: string[];
  adoptionWeaknesses: string[];
  adoptionBlockers: AdoptionFinding[];
  retentionRisks: string[];
  recommendationRisks: string[];
  competitiveRisks: string[];
  adoptionConfidence: number;
  operatorFeedEvents: AdoptionFeedEvent[];
  majorAdoptionRisks: boolean;
  adoptionPredictionPass: boolean;
  valueClarityDetectionPass: boolean;
  adoptionBlockerDetectionPass: boolean;
  retentionRiskDetectionPass: boolean;
  recommendationRiskDetectionPass: boolean;
  competitiveRiskDetectionPass: boolean;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
}

export interface AdoptionShellSources {
  appJs: string;
  html: string;
  css: string;
}

export interface AssessAdoptionPredictionInput {
  shellSources: AdoptionShellSources;
  firstTimeUserReality: FirstTimeUserRealityAssessment;
  customerJourneySimulation: CustomerJourneySimulationAssessment;
  launchDaySimulation: LaunchDaySimulationAssessment;
  visualQualityAuthority: VisualQualityAuthorityAssessment;
  founderFrictionHeatmap: FounderFrictionHeatmapAssessment;
}

export interface EnrichedAdoptionAssessments {
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
}

export interface AdoptionPredictionVisibility {
  score: number;
  adoptionPredictionScore: number;
  adoptionConfidence: number;
  majorAdoptionRisks: boolean;
  adoptionPredictionPass: boolean;
  adoptionBlockerCount: number;
  criticalCount: number;
}
