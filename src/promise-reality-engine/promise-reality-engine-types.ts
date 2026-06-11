/**
 * Promise Reality Engine — types.
 */

import type { CustomerJourneySimulationAssessment } from '../customer-journey-simulation/customer-journey-simulation-types.js';
import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FounderFrictionHeatmapAssessment } from '../founder-friction-heatmap/founder-friction-heatmap-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import type { VerificationTrustEvidenceAssessment } from '../verification-trust-evidence/verification-trust-evidence-types.js';
import type { VerificationResultsVisibilityAssessment } from '../verification-results-visibility/verification-results-visibility-types.js';
import type { VisualQualityAuthorityAssessment } from '../visual-quality-authority/visual-quality-authority-types.js';
import type { LaunchDaySimulationAssessment } from '../launch-day-simulation-engine/launch-day-simulation-engine-types.js';
import type { AdoptionPredictionAssessment } from '../adoption-prediction-engine/adoption-prediction-engine-types.js';
import type {
  CreationJourneyStageResult,
  IdeaToAppResult,
  PromiseRealityEntry,
  RealityGap,
} from '../founder-testing-mode/founder-testing-v4-types.js';
import type { ProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';

export type PromiseCategory = 'PRODUCT' | 'FEATURE' | 'WORKFLOW' | 'UX';

export type EvidenceLevel = 'PROVEN' | 'PARTIALLY_PROVEN' | 'UNPROVEN' | 'CONTRADICTED';

export type PromiseSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface PromiseClaimRecord {
  id: string;
  category: PromiseCategory;
  claim: string;
  status: EvidenceLevel;
  evidence: string;
  confidence: number;
  missingEvidence?: string;
  requiredValidation?: string;
  whyUnproven?: string;
  recommendedVerification?: string;
  contradictingEvidence?: string;
  severity?: PromiseSeverity;
}

export interface PromiseRealityFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface PromiseRealityScenarioResult {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
  status: EvidenceLevel;
}

export interface PromiseRealityEngineAssessment {
  promiseRealityScore: number;
  executionGapScore: number;
  realityConfidence: number;
  provenClaims: PromiseClaimRecord[];
  partiallyProvenClaims: PromiseClaimRecord[];
  unprovenClaims: PromiseClaimRecord[];
  contradictedClaims: PromiseClaimRecord[];
  topUnprovenClaims: PromiseClaimRecord[];
  topContradictions: PromiseClaimRecord[];
  highestRiskAssumptions: PromiseClaimRecord[];
  founderPromiseScenarios: PromiseRealityScenarioResult[];
  operatorFeedEvents: PromiseRealityFeedEvent[];
  promiseMatrix: PromiseRealityEntry[];
  realityGaps: RealityGap[];
  majorClaimsUnsupported: boolean;
  unsupportedClaimDetectionPass: boolean;
  contradictionDetectionPass: boolean;
  missingEvidenceDetectionPass: boolean;
  executionGapDetectionPass: boolean;
  promiseRealityPass: boolean;
  claimsEvaluated: number;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
}

export interface PromiseRealityShellSources {
  appJs: string;
  html: string;
  css?: string;
}

export interface AssessPromiseRealityEngineInput {
  workspace: ProductWorkspaceSnapshot;
  shellSources: PromiseRealityShellSources;
  ideaToAppResults: IdeaToAppResult[];
  creationJourney: CreationJourneyStageResult[];
  promiseMatrix?: PromiseRealityEntry[];
  realityGaps?: RealityGap[];
  firstTimeUserReality?: FirstTimeUserRealityAssessment;
  verificationTrustEvidence?: VerificationTrustEvidenceAssessment;
  customerJourneySimulation?: CustomerJourneySimulationAssessment;
  founderSensemaking?: FounderSensemakingAssessment;
  founderFrictionHeatmap?: FounderFrictionHeatmapAssessment;
  verificationResults?: VerificationResultsVisibilityAssessment;
  visualQualityAuthority?: VisualQualityAuthorityAssessment;
  launchDaySimulation?: LaunchDaySimulationAssessment;
  adoptionPrediction?: AdoptionPredictionAssessment;
}

export interface EnrichedPromiseRealityAssessments {
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
  firstTimeUserReality?: FirstTimeUserRealityAssessment;
}

export interface PromiseRealityVisibility {
  score: number;
  promiseRealityScore: number;
  executionGapScore: number;
  realityConfidence: number;
  provenCount: number;
  partialCount: number;
  unprovenCount: number;
  contradictedCount: number;
  majorClaimsUnsupported: boolean;
  promiseRealityPass: boolean;
}
