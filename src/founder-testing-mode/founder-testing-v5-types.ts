/**
 * Founder Testing Mode V5 — unified founder validation report types.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { ChangeIntelligenceVisibilityAssessment } from '../change-intelligence-visibility/change-intelligence-visibility-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import type { VerificationResultsVisibilityAssessment } from '../verification-results-visibility/verification-results-visibility-types.js';
import type { FounderTestV4Report } from './founder-testing-v4-types.js';
import type { FounderTestPhaseEvent } from './founder-testing-v5-phases.js';

export type FounderLaunchRecommendation =
  | 'NOT_READY'
  | 'NOT_READY_FOR_CUSTOMERS'
  | 'NOT_READY_FOR_PROMISE_REALITY'
  | 'NOT_READY_FOR_VISUAL_QUALITY'
  | 'NOT_READY_FOR_LAUNCH_DAY'
  | 'NOT_READY_FOR_ADOPTION'
  | 'INTERNAL_TESTING'
  | 'PRIVATE_ALPHA'
  | 'PUBLIC_BETA'
  | 'LAUNCH_READY';

export interface FounderTestV5UnifiedSummary {
  overallFounderScore: number;
  launchRecommendation: FounderLaunchRecommendation;
  whatWorks: string[];
  whatIsBroken: string[];
  whatDoesntMakeSense: string[];
  whatHurtsTrust: string[];
  whatChanged: string[];
  recommendedActions: string[];
  highestImpactUpgrade: string | null;
  launchBlockers: string[];
  finalRecommendation: string;
}

export interface FounderTestV5Report {
  reportId: string;
  generatedAt: number;
  durationMs: number;
  readOnly: true;
  mode: 'founder-testing-v5';
  overallFounderScore: number;
  launchRecommendation: FounderLaunchRecommendation;
  unifiedSummary: FounderTestV5UnifiedSummary;
  phaseFeedEvents: FounderTestPhaseEvent[];
  v4: FounderTestV4Report;
  verificationResults: VerificationResultsVisibilityAssessment;
  changeIntelligence: ChangeIntelligenceVisibilityAssessment;
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
  founderInteractionSimulation: import('../founder-interaction-simulation/founder-interaction-simulation-types.js').FounderInteractionSimulationAssessment;
  firstTimeUserReality: import('../first-time-user-reality/first-time-user-reality-types.js').FirstTimeUserRealityAssessment;
  verificationTrustEvidence: import('../verification-trust-evidence/verification-trust-evidence-types.js').VerificationTrustEvidenceAssessment;
  founderFrictionHeatmap: import('../founder-friction-heatmap/founder-friction-heatmap-types.js').FounderFrictionHeatmapAssessment;
  customerJourneySimulation: import('../customer-journey-simulation/customer-journey-simulation-types.js').CustomerJourneySimulationAssessment;
  promiseRealityEngine: import('../promise-reality-engine/promise-reality-engine-types.js').PromiseRealityEngineAssessment;
  visualQualityAuthority: import('../visual-quality-authority/visual-quality-authority-types.js').VisualQualityAuthorityAssessment;
  launchDaySimulation: import('../launch-day-simulation-engine/launch-day-simulation-engine-types.js').LaunchDaySimulationAssessment;
  adoptionPrediction: import('../adoption-prediction-engine/adoption-prediction-engine-types.js').AdoptionPredictionAssessment;
  productEconomics: import('../product-economics-engine/product-economics-engine-types.js').ProductEconomicsAssessment;
  productEvolution: import('../product-evolution-engine/product-evolution-engine-types.js').ProductEvolutionAssessment;
  verdict: string;
  reportMarkdown: string;
}

export interface RunFounderTestingModeV5Input {
  rootDir?: string;
  validatorScripts?: string[];
  liveResults?: import('./founder-testing-types.js').LiveScreenResultInput[];
  liveSection?: string;
}
