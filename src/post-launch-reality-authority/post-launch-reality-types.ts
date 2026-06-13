/**
 * Post-Launch Reality Authority — read-only post-launch evidence models.
 */

import type { LaunchReadinessProofReport } from '../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js';
import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import type { FounderLaunchDecisionReport } from '../founder-launch-decision-authority/founder-launch-decision-authority-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';
import type { LiveIdeaToLaunchExecutionRunnerReport } from '../live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-types.js';

export type PostLaunchRealityState =
  | 'NOT_LAUNCHED'
  | 'LAUNCHED_NO_ACTIVITY'
  | 'EARLY_ACTIVITY'
  | 'ACTIVE_USAGE'
  | 'GROWING_PRODUCT'
  | 'ESTABLISHED_PRODUCT';

export const POST_LAUNCH_REALITY_STATES: readonly PostLaunchRealityState[] = [
  'NOT_LAUNCHED',
  'LAUNCHED_NO_ACTIVITY',
  'EARLY_ACTIVITY',
  'ACTIVE_USAGE',
  'GROWING_PRODUCT',
  'ESTABLISHED_PRODUCT',
] as const;

export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type TrafficTrend = 'UP' | 'FLAT' | 'DOWN' | 'UNKNOWN';

export interface ObservedEvidenceBase {
  readOnly: true;
  evidenceSource: string;
  evidencePaths: string[];
  observedAt?: string;
}

export interface PostLaunchTrafficEvidence extends ObservedEvidenceBase {
  trafficObserved: boolean;
  sessionsObserved: number | null;
  usersObserved: number | null;
  trend: TrafficTrend;
}

export interface PostLaunchEngagementEvidence extends ObservedEvidenceBase {
  activeUsageObserved: boolean;
  featureUsageObserved: boolean;
  sessionQualityScore: number | null;
  userReturnSignalsObserved: boolean;
}

export interface PostLaunchRetentionEvidence extends ObservedEvidenceBase {
  repeatUsersObserved: boolean;
  repeatUserCount: number | null;
  retentionSignalsObserved: boolean;
  userReturnEvidenceObserved: boolean;
}

export interface PostLaunchErrorEvidence extends ObservedEvidenceBase {
  runtimeErrorsObserved: boolean;
  crashEvidenceObserved: boolean;
  supportTicketsObserved: boolean;
  uptimePercent: number | null;
  operationalStabilityObserved: boolean;
}

export interface PostLaunchBusinessEvidence extends ObservedEvidenceBase {
  customerValueEvidenceObserved: boolean;
  founderGoalProgressObserved: boolean;
  monetizationEvidenceObserved: boolean;
  productImpactEvidenceObserved: boolean;
  businessOutcomeSignals: string[];
}

export interface PostLaunchEvidenceBundle {
  readOnly: true;
  traffic: PostLaunchTrafficEvidence | null;
  engagement: PostLaunchEngagementEvidence | null;
  retention: PostLaunchRetentionEvidence | null;
  errors: PostLaunchErrorEvidence | null;
  business: PostLaunchBusinessEvidence | null;
}

export interface TrafficEvidenceAnalysis {
  readOnly: true;
  trafficObserved: boolean;
  sessionsObserved: number | null;
  usersObserved: number | null;
  trend: TrafficTrend;
  trafficConfidence: EvidenceConfidence;
  trafficScore: number;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface EngagementEvidenceAnalysis {
  readOnly: true;
  activeUsage: boolean;
  featureUsage: boolean;
  sessionQuality: number | null;
  userReturnSignals: boolean;
  engagementConfidence: EvidenceConfidence;
  engagementScore: number;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface RetentionEvidenceAnalysis {
  readOnly: true;
  repeatUsers: boolean;
  repeatUserCount: number | null;
  retentionSignals: boolean;
  userReturnEvidence: boolean;
  retentionConfidence: EvidenceConfidence;
  retentionScore: number;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface ErrorRealityAnalysis {
  readOnly: true;
  runtimeErrors: boolean;
  crashEvidence: boolean;
  supportEvidence: boolean;
  operationalStability: boolean;
  uptimePercent: number | null;
  reliabilityScore: number;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface BusinessOutcomeAnalysis {
  readOnly: true;
  customerValueEvidence: boolean;
  founderGoalProgress: boolean;
  monetizationEvidence: boolean;
  productImpactEvidence: boolean;
  businessOutcomeSignals: string[];
  businessOutcomeScore: number;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface PostLaunchVerdict {
  readOnly: true;
  postLaunchRealityState: PostLaunchRealityState;
  overallPostLaunchScore: number;
  confidence: number;
  activityObserved: boolean;
  retentionObserved: boolean;
  businessValueObserved: boolean;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
}

export interface PostLaunchInputSnapshot {
  readOnly: true;
  founderLaunchDecision: FounderLaunchDecisionReport | null;
  liveExecutionRunner: LiveIdeaToLaunchExecutionRunnerReport | null;
  runtimeActivationProof: RuntimeActivationProofReport | null;
  launchReadinessProof: LaunchReadinessProofReport | null;
  launchCouncil: LaunchCouncilAssessment | null;
  postLaunchEvidence: PostLaunchEvidenceBundle;
  launchObserved: boolean;
}

export interface PostLaunchRealityReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  postLaunchRealityState: PostLaunchRealityState;
  overallPostLaunchScore: number;
  confidence: number;
  activityObserved: boolean;
  retentionObserved: boolean;
  businessValueObserved: boolean;
  trafficScore: number;
  engagementScore: number;
  retentionScore: number;
  reliabilityScore: number;
  businessOutcomeScore: number;
  traffic: TrafficEvidenceAnalysis;
  engagement: EngagementEvidenceAnalysis;
  retention: RetentionEvidenceAnalysis;
  reliability: ErrorRealityAnalysis;
  businessOutcome: BusinessOutcomeAnalysis;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
  verdict: PostLaunchVerdict;
  inputSnapshot: PostLaunchInputSnapshot;
  cacheKey: string;
}

export interface PostLaunchRealityAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'POST_LAUNCH_REALITY_COMPLETE' | 'POST_LAUNCH_REALITY_FAILED';
  report: PostLaunchRealityReport;
}

export interface AssessPostLaunchRealityInput {
  rootDir?: string;
  rawPrompt?: string;
  founderLaunchDecision?: FounderLaunchDecisionReport | null;
  liveExecutionRunner?: LiveIdeaToLaunchExecutionRunnerReport | null;
  runtimeActivationProof?: RuntimeActivationProofReport | null;
  launchReadinessProof?: LaunchReadinessProofReport | null;
  launchCouncil?: LaunchCouncilAssessment | null;
  postLaunchEvidence?: PostLaunchEvidenceBundle | null;
  /** Pass-through for upstream founder launch decision resolution. */
  requirementsToPlanContract?: import('../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js').RequirementsToPlanContractReport | null;
  observedBuildEvidence?: import('../connected-build-execution/connected-build-execution-types.js').ObservedFileEvidence;
  runtimeSessionEvidence?: import('../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js').RuntimeSessionEvidence;
  previewSessionEvidence?: import('../connected-preview-experience-proof/connected-preview-experience-proof-types.js').PreviewSessionEvidence;
  verificationEvidenceFixture?: import('../connected-verification-execution-proof/connected-verification-execution-proof-types.js').VerificationEvidenceFixture;
  launchReadinessFixture?: import('../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js').LaunchReadinessFixture;
  /** Injected observed post-launch metrics for bounded validation. */
  postLaunchEvidenceFixture?: Partial<PostLaunchEvidenceBundle> | null;
  /** Reject metrics without evidence paths — validator enforcement. */
  fabricatedMetricsFixture?: boolean;
  /** Launch readiness only — must not imply activity. */
  launchReadinessOnlyFixture?: boolean;
  /** Runtime proof only — must not imply users. */
  runtimeProofOnlyFixture?: boolean;
  skipHistoryRecording?: boolean;
}

export interface PostLaunchRealityHistoryEntry {
  timestamp: string;
  assessmentId: string;
  postLaunchRealityState: PostLaunchRealityState;
  overallPostLaunchScore: number;
  activityObserved: boolean;
}

export interface PostLaunchRealityHistorySummary {
  totalAssessments: number;
  launchedAssessments: number;
  activityObservedAssessments: number;
  establishedProductAssessments: number;
}

export interface PostLaunchRealityArtifacts {
  postLaunchRealityAssessment: PostLaunchRealityAssessment;
  postLaunchRealityReportMarkdown: string;
}
