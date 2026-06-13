/**
 * Adoption Reality Authority — read-only adoption evidence models.
 */

import type { FounderLaunchDecisionReport } from '../founder-launch-decision-authority/founder-launch-decision-authority-types.js';
import type { PostLaunchRealityReport } from '../post-launch-reality-authority/post-launch-reality-types.js';

export type AdoptionRealityState =
  | 'NO_ADOPTION'
  | 'EARLY_ADOPTION'
  | 'EMERGING_ADOPTION'
  | 'ESTABLISHED_ADOPTION'
  | 'CRITICAL_DEPENDENCY';

export const ADOPTION_REALITY_STATES: readonly AdoptionRealityState[] = [
  'NO_ADOPTION',
  'EARLY_ADOPTION',
  'EMERGING_ADOPTION',
  'ESTABLISHED_ADOPTION',
  'CRITICAL_DEPENDENCY',
] as const;

export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface ObservedEvidenceBase {
  readOnly: true;
  evidenceSource: string;
  evidencePaths: string[];
  observedAt?: string;
}

export interface RepeatUsageEvidence extends ObservedEvidenceBase {
  repeatUsersObserved: boolean;
  repeatUserCount: number | null;
  repeatSessionsObserved: boolean;
  repeatSessionCount: number | null;
  returnFrequencyObserved: boolean;
  longTermUsageObserved: boolean;
  usageConsistencyObserved: boolean;
}

export interface BehavioralIntegrationEvidence extends ObservedEvidenceBase {
  workflowIntegrationObserved: boolean;
  habitFormationSignalsObserved: boolean;
  operationalDependenceObserved: boolean;
  routineUsageIndicatorsObserved: boolean;
}

export interface FeatureAdoptionEvidence extends ObservedEvidenceBase {
  coreFeatureUsageObserved: boolean;
  featureStickinessObserved: boolean;
  featureDepthScore: number | null;
  criticalFeaturePenetrationObserved: boolean;
}

export interface UserDependencyEvidence extends ObservedEvidenceBase {
  dependencySignalsObserved: boolean;
  replacementResistanceObserved: boolean;
  switchingCostIndicatorsObserved: boolean;
  operationalImportanceObserved: boolean;
}

export interface AdoptionEvidenceBundle {
  readOnly: true;
  repeatUsage: RepeatUsageEvidence | null;
  behavioralIntegration: BehavioralIntegrationEvidence | null;
  featureAdoption: FeatureAdoptionEvidence | null;
  userDependency: UserDependencyEvidence | null;
}

export interface RepeatUsageAnalysis {
  readOnly: true;
  repeatUsers: boolean;
  repeatUserCount: number | null;
  repeatSessions: boolean;
  repeatSessionCount: number | null;
  returnFrequency: boolean;
  longTermUsage: boolean;
  usageConsistency: boolean;
  repeatUsageScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface BehavioralIntegrationAnalysis {
  readOnly: true;
  workflowIntegration: boolean;
  habitFormationSignals: boolean;
  operationalDependence: boolean;
  routineUsageIndicators: boolean;
  behavioralIntegrationScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface FeatureAdoptionAnalysis {
  readOnly: true;
  coreFeatureUsage: boolean;
  featureStickiness: boolean;
  featureDepth: number | null;
  criticalFeaturePenetration: boolean;
  featureAdoptionScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface UserDependencyAnalysis {
  readOnly: true;
  dependencySignals: boolean;
  replacementResistance: boolean;
  switchingCostIndicators: boolean;
  operationalImportance: boolean;
  dependencyScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface AdoptionRiskAnalysis {
  readOnly: true;
  dropOffRisk: boolean;
  retentionRisk: boolean;
  churnIndicators: boolean;
  weakAdoptionSignals: boolean;
  adoptionFragility: boolean;
  adoptionRiskScore: number;
  riskSignals: string[];
}

export interface AdoptionVerdict {
  readOnly: true;
  adoptionRealityState: AdoptionRealityState;
  overallAdoptionScore: number;
  confidence: number;
  repeatUsageObserved: boolean;
  behavioralIntegrationObserved: boolean;
  featureAdoptionObserved: boolean;
  dependencyObserved: boolean;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
}

export interface AdoptionInputSnapshot {
  readOnly: true;
  postLaunchReality: PostLaunchRealityReport | null;
  founderLaunchDecision: FounderLaunchDecisionReport | null;
  adoptionEvidence: AdoptionEvidenceBundle;
  postLaunchActivityObserved: boolean;
}

export interface AdoptionRealityReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  adoptionRealityState: AdoptionRealityState;
  overallAdoptionScore: number;
  confidence: number;
  repeatUsageObserved: boolean;
  behavioralIntegrationObserved: boolean;
  featureAdoptionObserved: boolean;
  dependencyObserved: boolean;
  repeatUsageScore: number;
  behavioralIntegrationScore: number;
  featureAdoptionScore: number;
  dependencyScore: number;
  adoptionRiskScore: number;
  repeatUsage: RepeatUsageAnalysis;
  behavioralIntegration: BehavioralIntegrationAnalysis;
  featureAdoption: FeatureAdoptionAnalysis;
  userDependency: UserDependencyAnalysis;
  adoptionRisk: AdoptionRiskAnalysis;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
  verdict: AdoptionVerdict;
  inputSnapshot: AdoptionInputSnapshot;
  cacheKey: string;
}

export interface AdoptionRealityAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'ADOPTION_REALITY_COMPLETE' | 'ADOPTION_REALITY_FAILED';
  report: AdoptionRealityReport;
}

export interface AssessAdoptionRealityInput {
  rootDir?: string;
  rawPrompt?: string;
  postLaunchReality?: PostLaunchRealityReport | null;
  founderLaunchDecision?: FounderLaunchDecisionReport | null;
  adoptionEvidence?: AdoptionEvidenceBundle | null;
  adoptionEvidenceFixture?: Partial<AdoptionEvidenceBundle> | null;
  /** Pass-through for upstream post-launch resolution. */
  requirementsToPlanContract?: import('../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js').RequirementsToPlanContractReport | null;
  observedBuildEvidence?: import('../connected-build-execution/connected-build-execution-types.js').ObservedFileEvidence;
  runtimeSessionEvidence?: import('../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js').RuntimeSessionEvidence;
  previewSessionEvidence?: import('../connected-preview-experience-proof/connected-preview-experience-proof-types.js').PreviewSessionEvidence;
  verificationEvidenceFixture?: import('../connected-verification-execution-proof/connected-verification-execution-proof-types.js').VerificationEvidenceFixture;
  launchReadinessFixture?: import('../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js').LaunchReadinessFixture;
  postLaunchEvidenceFixture?: import('../post-launch-reality-authority/post-launch-reality-types.js').PostLaunchEvidenceBundle | null;
  /** Traffic alone — must not create adoption. */
  trafficOnlyFixture?: boolean;
  /** Signups alone — must not create adoption. */
  signupsOnlyFixture?: boolean;
  /** One-time usage — must not create adoption. */
  oneTimeUsageFixture?: boolean;
  /** Reject fabricated metrics. */
  fabricatedMetricsFixture?: boolean;
  skipHistoryRecording?: boolean;
}

export interface AdoptionRealityHistoryEntry {
  timestamp: string;
  assessmentId: string;
  adoptionRealityState: AdoptionRealityState;
  overallAdoptionScore: number;
  repeatUsageObserved: boolean;
}

export interface AdoptionRealityHistorySummary {
  totalAssessments: number;
  adoptionObservedAssessments: number;
  establishedAdoptionAssessments: number;
  criticalDependencyAssessments: number;
}

export interface AdoptionRealityArtifacts {
  adoptionRealityAssessment: AdoptionRealityAssessment;
  adoptionRealityReportMarkdown: string;
}
