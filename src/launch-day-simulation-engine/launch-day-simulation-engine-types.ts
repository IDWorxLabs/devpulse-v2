/**
 * Launch Day Simulation Engine — types.
 */

import type { CustomerJourneySimulationAssessment } from '../customer-journey-simulation/customer-journey-simulation-types.js';
import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FounderFrictionHeatmapAssessment } from '../founder-friction-heatmap/founder-friction-heatmap-types.js';
import type { FounderInteractionSimulationAssessment } from '../founder-interaction-simulation/founder-interaction-simulation-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import type { VerificationTrustEvidenceAssessment } from '../verification-trust-evidence/verification-trust-evidence-types.js';
import type { VerificationResultsVisibilityAssessment } from '../verification-results-visibility/verification-results-visibility-types.js';
import type { VisualQualityAuthorityAssessment } from '../visual-quality-authority/visual-quality-authority-types.js';

export type LaunchDayFindingType =
  | 'ONBOARDING_COLLAPSE'
  | 'EXPECTATION_MISMATCH'
  | 'WORKFLOW_BOTTLENECK'
  | 'TRUST_FAILURE'
  | 'RECOVERY_FAILURE'
  | 'FOUNDER_BLIND_SPOT'
  | 'LAUNCH_BLOCKER';

export type LaunchDaySimulationCategory =
  | 'NEW_USER_ARRIVAL'
  | 'CONCURRENT_USER'
  | 'CUSTOMER_EXPECTATION'
  | 'FAILURE_RECOVERY'
  | 'TRUST_SURVIVAL'
  | 'FOUNDER_READINESS';

export type LaunchDaySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface LaunchDaySubscores {
  newUserReadiness: number;
  concurrentUsageReadiness: number;
  expectationAlignment: number;
  recoveryReadiness: number;
  trustSurvival: number;
  founderReadiness: number;
}

export interface LaunchDayFinding {
  id: string;
  type: LaunchDayFindingType;
  category: LaunchDaySimulationCategory;
  severity: LaunchDaySeverity;
  explanation: string;
  recommendation: string;
  surface?: string;
}

export interface LaunchDayFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface LaunchDaySimulationAssessment {
  launchDayScore: number;
  subscores: LaunchDaySubscores;
  concurrentUsageRisk: number;
  findings: LaunchDayFinding[];
  launchStrengths: string[];
  launchWeaknesses: string[];
  highestRiskAssumptions: string[];
  topLaunchBlockers: LaunchDayFinding[];
  trustRisks: string[];
  launchConfidence: number;
  operatorFeedEvents: LaunchDayFeedEvent[];
  majorLaunchRisks: boolean;
  launchDayPass: boolean;
  launchBlockerDetectionPass: boolean;
  onboardingCollapseDetectionPass: boolean;
  trustFailureDetectionPass: boolean;
  recoveryFailureDetectionPass: boolean;
  expectationMismatchDetectionPass: boolean;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
}

export interface LaunchDayShellSources {
  appJs: string;
  html: string;
  css: string;
}

export interface AssessLaunchDaySimulationInput {
  shellSources: LaunchDayShellSources;
  firstTimeUserReality: FirstTimeUserRealityAssessment;
  customerJourneySimulation: CustomerJourneySimulationAssessment;
  visualQualityAuthority: VisualQualityAuthorityAssessment;
  verificationTrustEvidence: VerificationTrustEvidenceAssessment;
  founderFrictionHeatmap: FounderFrictionHeatmapAssessment;
  founderInteractionSimulation: FounderInteractionSimulationAssessment;
  founderActionCenter: FounderActionCenterAssessment;
  verificationResults: VerificationResultsVisibilityAssessment;
}

export interface EnrichedLaunchDayAssessments {
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
}

export interface LaunchDaySimulationVisibility {
  score: number;
  launchDayScore: number;
  launchConfidence: number;
  majorLaunchRisks: boolean;
  launchDayPass: boolean;
  launchBlockerCount: number;
  criticalCount: number;
}
