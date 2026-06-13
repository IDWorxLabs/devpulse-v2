/**
 * Founder Test Reality Sweep — core models.
 * Brutally honest launch-readiness reality — no roadmap credit.
 */

import type { CompetitiveRealityAssessment } from '../competitive-reality-engine/competitive-reality-engine-types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { FounderExecutionProofAssessment } from '../founder-execution-proof/founder-execution-proof-types.js';
import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type { InteractiveExplanationsEvaluation } from '../interactive-explanations/interactive-explanations-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';
import type { LivePreviewRealityAuthorityAssessment } from '../live-preview-reality/live-preview-reality-types.js';
import type { FounderTestLaunchReadinessAssessment } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { UIReviewerAssessment } from '../ui-reviewer-authority/ui-reviewer-types.js';
import type { VerificationRealityAssessment } from '../verification-reality/verification-reality-types.js';

export type RealitySweepCategory =
  | 'EXECUTION_REALITY'
  | 'FOUNDER_EXPERIENCE'
  | 'FIRST_TIME_USER_EXPERIENCE'
  | 'NAVIGATION_REALITY'
  | 'LIVE_PREVIEW_REALITY'
  | 'VERIFICATION_REALITY'
  | 'AI_INTERACTION_REALITY'
  | 'MISSING_CAPABILITY_REALITY'
  | 'LAUNCH_RISK_REALITY'
  | 'COMPETITIVE_REALITY';

export type LaunchBlockerSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FounderLaunchVerdict =
  | 'READY_TO_LAUNCH'
  | 'READY_WITH_WARNINGS'
  | 'NOT_READY_TO_LAUNCH'
  | 'BLOCK_LAUNCH'
  | 'INSUFFICIENT_EVIDENCE';

export type LaunchRecommendation =
  | 'RECOMMEND_LAUNCH'
  | 'RECOMMEND_LAUNCH_WITH_WARNINGS'
  | 'DO_NOT_RECOMMEND_LAUNCH'
  | 'BLOCK_LAUNCH'
  | 'INSUFFICIENT_EVIDENCE';

export interface RealitySweepCategoryScore {
  readOnly: true;
  category: RealitySweepCategory;
  label: string;
  score: number;
  honestScore: number;
  sourceAuthority: string;
  summary: string;
  blockersPresent: boolean;
}

export interface LaunchBlockerEntry {
  readOnly: true;
  blockerId: string;
  severity: LaunchBlockerSeverity;
  category: RealitySweepCategory;
  title: string;
  explanation: string;
  sourceAuthority: string;
  recommendedAction: string;
  impactRank: number;
}

export interface LaunchWarningEntry {
  readOnly: true;
  warningId: string;
  severity: LaunchBlockerSeverity;
  category: RealitySweepCategory;
  explanation: string;
  sourceAuthority: string;
}

export interface LaunchStrengthEntry {
  readOnly: true;
  strengthId: string;
  category: RealitySweepCategory;
  explanation: string;
  sourceAuthority: string;
  evidenceScore: number;
}

export interface MissingCapabilityEntry {
  readOnly: true;
  capabilityId: string;
  capability: string;
  category: RealitySweepCategory;
  sourceAuthority: string;
  launchImpact: LaunchBlockerSeverity;
}

export interface CompetitiveGapEntry {
  readOnly: true;
  gapId: string;
  gap: string;
  sourceAuthority: string;
  severity: LaunchBlockerSeverity;
}

export interface LaunchRiskEntry {
  readOnly: true;
  riskId: string;
  risk: string;
  category: RealitySweepCategory;
  severity: LaunchBlockerSeverity;
  sourceAuthority: string;
}

export interface RecommendedLaunchWorkEntry {
  readOnly: true;
  workId: string;
  action: string;
  category: RealitySweepCategory;
  priorityScore: number;
  sourceAuthority: string;
  founderImpact: string;
}

export interface FounderTestRealitySweepInputSnapshot {
  readOnly: true;
  founderExecutionProofAssessment: FounderExecutionProofAssessment | null;
  founderTestLaunchReadinessAssessment: FounderTestLaunchReadinessAssessment | null;
  founderTestAssessment: FounderTestAssessment | null;
  founderAcceptanceAssessment: FounderAcceptanceAssessment | null;
  launchCouncilAssessment: LaunchCouncilAssessment | null;
  firstTimeUserRealityAssessment: FirstTimeUserRealityAssessment | null;
  livePreviewRealityAssessment: LivePreviewRealityAuthorityAssessment | null;
  verificationRealityAssessment: VerificationRealityAssessment | null;
  interactiveExplanationsEvaluation: InteractiveExplanationsEvaluation | null;
  uiReviewerAssessment: UIReviewerAssessment | null;
  competitiveRealityAssessment: CompetitiveRealityAssessment | null;
  missingAuthorities: string[];
}

export interface FounderTestRealitySweepReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  sweepId: string;
  generatedAt: string;
  launchReadinessPercent: number;
  launchRecommendation: LaunchRecommendation;
  founderLaunchVerdict: FounderLaunchVerdict;
  categoryScores: RealitySweepCategoryScore[];
  launchBlockers: LaunchBlockerEntry[];
  launchWarnings: LaunchWarningEntry[];
  launchStrengths: LaunchStrengthEntry[];
  missingCapabilities: MissingCapabilityEntry[];
  competitiveGaps: CompetitiveGapEntry[];
  topLaunchRisks: LaunchRiskEntry[];
  recommendedLaunchWork: RecommendedLaunchWorkEntry[];
  topBlockers: LaunchBlockerEntry[];
  topStrengths: LaunchStrengthEntry[];
  topMissingCapabilities: MissingCapabilityEntry[];
  mostImportantNextBuildItems: RecommendedLaunchWorkEntry[];
  inputSnapshot: FounderTestRealitySweepInputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface FounderTestRealitySweepAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'REALITY_SWEEP_COMPLETE' | 'REALITY_SWEEP_FAILED';
  report: FounderTestRealitySweepReport;
}

export interface AssessFounderTestRealitySweepInput {
  rootDir?: string;
  shellSources?: { appJs: string; html: string; css: string };
  founderExecutionProofAssessment?: FounderExecutionProofAssessment | null;
  founderTestLaunchReadinessAssessment?: FounderTestLaunchReadinessAssessment | null;
  founderTestAssessment?: FounderTestAssessment | null;
  founderAcceptanceAssessment?: FounderAcceptanceAssessment | null;
  launchCouncilAssessment?: LaunchCouncilAssessment | null;
  firstTimeUserRealityAssessment?: FirstTimeUserRealityAssessment | null;
  livePreviewRealityAssessment?: LivePreviewRealityAuthorityAssessment | null;
  verificationRealityAssessment?: VerificationRealityAssessment | null;
  interactiveExplanationsEvaluation?: InteractiveExplanationsEvaluation | null;
  uiReviewerAssessment?: UIReviewerAssessment | null;
  competitiveRealityAssessment?: CompetitiveRealityAssessment | null;
}

export interface FounderTestRealitySweepHistoryEntry {
  timestamp: string;
  sweepId: string;
  launchReadinessPercent: number;
  founderLaunchVerdict: FounderLaunchVerdict;
  blockerCount: number;
  warningCount: number;
}

export interface FounderTestRealitySweepHistorySummary {
  totalAssessments: number;
  readyToLaunchAssessments: number;
  readyWithWarningsAssessments: number;
  notReadyAssessments: number;
  blockedAssessments: number;
  insufficientEvidenceAssessments: number;
}

export interface FounderTestRealitySweepArtifacts {
  founderTestRealitySweepAssessment: FounderTestRealitySweepAssessment;
  founderTestRealitySweepReportMarkdown: string;
}
