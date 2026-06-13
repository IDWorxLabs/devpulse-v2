/**
 * Product Evolution Reality Authority — read-only evolution evidence models.
 */

import type { AdoptionRealityReport } from '../adoption-reality-authority/adoption-reality-types.js';
import type { FounderLaunchDecisionReport } from '../founder-launch-decision-authority/founder-launch-decision-authority-types.js';
import type { PostLaunchRealityReport } from '../post-launch-reality-authority/post-launch-reality-types.js';
import type { RevenueRealityReport } from '../revenue-reality-authority/revenue-reality-types.js';

export type ProductEvolutionState =
  | 'STATIC_PRODUCT'
  | 'REACTIVE_PRODUCT'
  | 'LEARNING_PRODUCT'
  | 'EVOLVING_PRODUCT'
  | 'ADAPTIVE_PRODUCT';

export const PRODUCT_EVOLUTION_STATES: readonly ProductEvolutionState[] = [
  'STATIC_PRODUCT',
  'REACTIVE_PRODUCT',
  'LEARNING_PRODUCT',
  'EVOLVING_PRODUCT',
  'ADAPTIVE_PRODUCT',
] as const;

export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface ObservedEvidenceBase {
  readOnly: true;
  evidenceSource: string;
  evidencePaths: string[];
  observedAt?: string;
}

export interface FeedbackLearningEvidence extends ObservedEvidenceBase {
  userFeedbackProcessedObserved: boolean;
  featureRequestResponseObserved: boolean;
  supportSignalResponseObserved: boolean;
  customerPainResolutionObserved: boolean;
}

export interface FailureLearningEvidence extends ObservedEvidenceBase {
  bugFixLearningObserved: boolean;
  incidentLearningObserved: boolean;
  rootCauseLearningObserved: boolean;
  repeatedFailureReductionObserved: boolean;
}

export interface UsageLearningEvidence extends ObservedEvidenceBase {
  behaviorInformedChangesObserved: boolean;
  usageDrivenImprovementsObserved: boolean;
  retentionImprovementsObserved: boolean;
  engagementImprovementsObserved: boolean;
}

export interface RevenueLearningEvidence extends ObservedEvidenceBase {
  revenueInformedDecisionsObserved: boolean;
  customerValueImprovementsObserved: boolean;
  businessModelAdjustmentsObserved: boolean;
  monetizationLearningObserved: boolean;
}

export interface ImprovementVelocityEvidence extends ObservedEvidenceBase {
  improvementFrequencyObserved: boolean;
  evidenceToActionSpeedObserved: boolean;
  issueResolutionSpeedObserved: boolean;
  adaptationResponsivenessObserved: boolean;
  improvementsInLastPeriod: number | null;
}

export interface EvolutionEvidenceBundle {
  readOnly: true;
  feedbackLearning: FeedbackLearningEvidence | null;
  failureLearning: FailureLearningEvidence | null;
  usageLearning: UsageLearningEvidence | null;
  revenueLearning: RevenueLearningEvidence | null;
  improvementVelocity: ImprovementVelocityEvidence | null;
}

export interface FeedbackLearningAnalysis {
  readOnly: true;
  userFeedbackProcessed: boolean;
  featureRequestResponse: boolean;
  supportSignalResponse: boolean;
  customerPainResolution: boolean;
  feedbackLearningScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface FailureLearningAnalysis {
  readOnly: true;
  bugFixLearning: boolean;
  incidentLearning: boolean;
  rootCauseLearning: boolean;
  repeatedFailureReduction: boolean;
  failureLearningScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface UsageLearningAnalysis {
  readOnly: true;
  behaviorInformedChanges: boolean;
  usageDrivenImprovements: boolean;
  retentionImprovements: boolean;
  engagementImprovements: boolean;
  usageLearningScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface RevenueLearningAnalysis {
  readOnly: true;
  revenueInformedDecisions: boolean;
  customerValueImprovements: boolean;
  businessModelAdjustments: boolean;
  monetizationLearning: boolean;
  revenueLearningScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface ImprovementVelocityAnalysis {
  readOnly: true;
  improvementFrequency: boolean;
  evidenceToActionSpeed: boolean;
  issueResolutionSpeed: boolean;
  adaptationResponsiveness: boolean;
  improvementsInLastPeriod: number | null;
  improvementVelocityScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface EvolutionRiskAnalysis {
  readOnly: true;
  stagnationRisk: boolean;
  feedbackIgnoringRisk: boolean;
  innovationRisk: boolean;
  adaptationRisk: boolean;
  competitiveDriftRisk: boolean;
  evolutionRiskScore: number;
  riskSignals: string[];
}

export interface ProductEvolutionVerdict {
  readOnly: true;
  productEvolutionState: ProductEvolutionState;
  overallEvolutionScore: number;
  confidence: number;
  feedbackLearningObserved: boolean;
  failureLearningObserved: boolean;
  usageLearningObserved: boolean;
  revenueLearningObserved: boolean;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
}

export interface ProductEvolutionInputSnapshot {
  readOnly: true;
  revenueReality: RevenueRealityReport | null;
  adoptionReality: AdoptionRealityReport | null;
  postLaunchReality: PostLaunchRealityReport | null;
  founderLaunchDecision: FounderLaunchDecisionReport | null;
  evolutionEvidence: EvolutionEvidenceBundle;
  productLaunched: boolean;
}

export interface ProductEvolutionRealityReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  productEvolutionState: ProductEvolutionState;
  overallEvolutionScore: number;
  confidence: number;
  feedbackLearningObserved: boolean;
  failureLearningObserved: boolean;
  usageLearningObserved: boolean;
  revenueLearningObserved: boolean;
  feedbackLearningScore: number;
  failureLearningScore: number;
  usageLearningScore: number;
  revenueLearningScore: number;
  improvementVelocityScore: number;
  evolutionRiskScore: number;
  feedbackLearning: FeedbackLearningAnalysis;
  failureLearning: FailureLearningAnalysis;
  usageLearning: UsageLearningAnalysis;
  revenueLearning: RevenueLearningAnalysis;
  improvementVelocity: ImprovementVelocityAnalysis;
  evolutionRisk: EvolutionRiskAnalysis;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
  verdict: ProductEvolutionVerdict;
  inputSnapshot: ProductEvolutionInputSnapshot;
  cacheKey: string;
}

export interface ProductEvolutionRealityAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'PRODUCT_EVOLUTION_REALITY_COMPLETE' | 'PRODUCT_EVOLUTION_REALITY_FAILED';
  report: ProductEvolutionRealityReport;
}

export interface AssessProductEvolutionRealityInput {
  rootDir?: string;
  rawPrompt?: string;
  revenueReality?: RevenueRealityReport | null;
  adoptionReality?: AdoptionRealityReport | null;
  postLaunchReality?: PostLaunchRealityReport | null;
  founderLaunchDecision?: FounderLaunchDecisionReport | null;
  evolutionEvidence?: EvolutionEvidenceBundle | null;
  evolutionEvidenceFixture?: Partial<EvolutionEvidenceBundle> | null;
  /** Pass-through for upstream revenue resolution. */
  requirementsToPlanContract?: import('../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js').RequirementsToPlanContractReport | null;
  observedBuildEvidence?: import('../connected-build-execution/connected-build-execution-types.js').ObservedFileEvidence;
  runtimeSessionEvidence?: import('../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js').RuntimeSessionEvidence;
  previewSessionEvidence?: import('../connected-preview-experience-proof/connected-preview-experience-proof-types.js').PreviewSessionEvidence;
  verificationEvidenceFixture?: import('../connected-verification-execution-proof/connected-verification-execution-proof-types.js').VerificationEvidenceFixture;
  launchReadinessFixture?: import('../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js').LaunchReadinessFixture;
  postLaunchEvidenceFixture?: import('../post-launch-reality-authority/post-launch-reality-types.js').PostLaunchEvidenceBundle | null;
  adoptionEvidenceFixture?: import('../adoption-reality-authority/adoption-reality-types.js').AdoptionEvidenceBundle | null;
  revenueEvidenceFixture?: import('../revenue-reality-authority/revenue-reality-types.js').RevenueEvidenceBundle | null;
  /** Feature additions alone — must not create evolution. */
  featureAdditionsOnlyFixture?: boolean;
  /** Roadmap updates alone — must not create evolution. */
  roadmapOnlyFixture?: boolean;
  /** Reject fabricated feedback. */
  fabricatedMetricsFixture?: boolean;
  skipHistoryRecording?: boolean;
}

export interface ProductEvolutionRealityHistoryEntry {
  timestamp: string;
  assessmentId: string;
  productEvolutionState: ProductEvolutionState;
  overallEvolutionScore: number;
  feedbackLearningObserved: boolean;
}

export interface ProductEvolutionRealityHistorySummary {
  totalAssessments: number;
  learningProductAssessments: number;
  evolvingProductAssessments: number;
  adaptiveProductAssessments: number;
}

export interface ProductEvolutionRealityArtifacts {
  productEvolutionRealityAssessment: ProductEvolutionRealityAssessment;
  productEvolutionRealityReportMarkdown: string;
}
