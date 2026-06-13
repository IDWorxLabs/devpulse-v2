/**
 * Product Lifecycle Reality Orchestrator — read-only lifecycle models.
 */

import type { AdoptionRealityReport } from '../adoption-reality-authority/adoption-reality-types.js';
import type { FounderLaunchDecisionReport } from '../founder-launch-decision-authority/founder-launch-decision-authority-types.js';
import type { LiveIdeaToLaunchExecutionRunnerReport } from '../live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-types.js';
import type { PostLaunchRealityReport } from '../post-launch-reality-authority/post-launch-reality-types.js';
import type { ProductEvolutionRealityReport } from '../product-evolution-reality-authority/product-evolution-reality-types.js';
import type { RevenueRealityReport } from '../revenue-reality-authority/revenue-reality-types.js';
import type { RequirementsToPlanContractReport } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';

export type ProductLifecycleRealityState =
  | 'IDEA_ONLY'
  | 'PLANNED'
  | 'BUILT'
  | 'VALIDATED'
  | 'RUNTIME_READY'
  | 'LAUNCH_READY'
  | 'LAUNCHED'
  | 'ADOPTED'
  | 'REVENUE_GENERATING'
  | 'EVOLVING_PRODUCT'
  | 'SCALING_PRODUCT';

export const PRODUCT_LIFECYCLE_REALITY_STATES: readonly ProductLifecycleRealityState[] = [
  'IDEA_ONLY',
  'PLANNED',
  'BUILT',
  'VALIDATED',
  'RUNTIME_READY',
  'LAUNCH_READY',
  'LAUNCHED',
  'ADOPTED',
  'REVENUE_GENERATING',
  'EVOLVING_PRODUCT',
  'SCALING_PRODUCT',
] as const;

export type LifecycleNextAction =
  | 'CAPTURE_REQUIREMENTS'
  | 'COMPLETE_BUILD'
  | 'RUN_VALIDATION'
  | 'PROVE_RUNTIME'
  | 'DECIDE_LAUNCH'
  | 'OBSERVE_POST_LAUNCH'
  | 'IMPROVE_ADOPTION'
  | 'PROVE_REVENUE'
  | 'EVOLVE_PRODUCT'
  | 'SCALE_PRODUCT'
  | 'FIX_BLOCKERS'
  | 'RUN_MORE_PROOF';

export const LIFECYCLE_NEXT_ACTIONS: readonly LifecycleNextAction[] = [
  'CAPTURE_REQUIREMENTS',
  'COMPLETE_BUILD',
  'RUN_VALIDATION',
  'PROVE_RUNTIME',
  'DECIDE_LAUNCH',
  'OBSERVE_POST_LAUNCH',
  'IMPROVE_ADOPTION',
  'PROVE_REVENUE',
  'EVOLVE_PRODUCT',
  'SCALE_PRODUCT',
  'FIX_BLOCKERS',
  'RUN_MORE_PROOF',
] as const;

export interface LifecycleAuthoritySignal {
  readOnly: true;
  signalId: string;
  sourceAuthority: string;
  label: string;
  present: boolean;
  strength: 'STRONG' | 'MODERATE' | 'WEAK' | 'ABSENT';
  detail: string;
}

export interface LifecycleSignalCollection {
  readOnly: true;
  signals: LifecycleAuthoritySignal[];
  ideaEvidencePresent: boolean;
  planEvidencePresent: boolean;
  buildEvidencePresent: boolean;
  validationEvidencePresent: boolean;
  runtimeEvidencePresent: boolean;
  launchReadinessEvidencePresent: boolean;
  launchDecisionSupportPresent: boolean;
  postLaunchActivityPresent: boolean;
  adoptionEvidencePresent: boolean;
  revenueEvidencePresent: boolean;
  evolutionEvidencePresent: boolean;
  scalingSignalsPresent: boolean;
  missingEvidence: string[];
}

export interface LifecycleStageClassification {
  readOnly: true;
  productLifecycleRealityState: ProductLifecycleRealityState;
  highestProvenStage: ProductLifecycleRealityState;
  stageScores: Record<ProductLifecycleRealityState, number>;
  provenStages: ProductLifecycleRealityState[];
  unprovenStages: ProductLifecycleRealityState[];
  classificationReason: string;
}

export interface LifecycleGapAnalysis {
  readOnly: true;
  missingEvidence: string[];
  weakEvidence: string[];
  brokenProofLinks: string[];
  lifecycleBlockers: string[];
  stageRegressionRisks: string[];
  staleEvidence: string[];
  contradictoryEvidence: string[];
  nextProofGap: string;
}

export interface LifecycleRiskAnalysis {
  readOnly: true;
  launchRisk: boolean;
  adoptionRisk: boolean;
  revenueRisk: boolean;
  evolutionRisk: boolean;
  operationalRisk: boolean;
  lifecycleStagnationRisk: boolean;
  evidenceConfidenceRisk: boolean;
  lifecycleRiskScore: number;
  riskSignals: string[];
}

export interface LifecycleScoreBreakdown {
  readOnly: true;
  executionScore: number;
  launchScore: number;
  postLaunchScore: number;
  adoptionScore: number;
  revenueScore: number;
  evolutionScore: number;
  lifecycleConfidenceScore: number;
  overallLifecycleScore: number;
}

export interface LifecycleNextActionResult {
  readOnly: true;
  nextRequiredAction: LifecycleNextAction;
  actionReason: string;
  evidenceBacked: boolean;
  supportingEvidence: string[];
}

export interface ProductLifecycleVerdict {
  readOnly: true;
  productLifecycleRealityState: ProductLifecycleRealityState;
  overallLifecycleScore: number;
  lifecycleConfidenceScore: number;
  highestProvenStage: ProductLifecycleRealityState;
  nextRequiredAction: LifecycleNextAction;
  canScaleNow: boolean;
  keyFindings: string[];
  missingEvidence: string[];
  lifecycleBlockers: string[];
  riskSignals: string[];
  recommendedActions: string[];
  finalVerdict: string;
}

export interface ProductLifecycleInputSnapshot {
  readOnly: true;
  liveExecutionRunner: LiveIdeaToLaunchExecutionRunnerReport | null;
  founderLaunchDecision: FounderLaunchDecisionReport | null;
  postLaunchReality: PostLaunchRealityReport | null;
  adoptionReality: AdoptionRealityReport | null;
  revenueReality: RevenueRealityReport | null;
  productEvolutionReality: ProductEvolutionRealityReport | null;
  requirementsToPlanContract: RequirementsToPlanContractReport | null;
}

export interface ProductLifecycleRealityReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  productLifecycleRealityState: ProductLifecycleRealityState;
  overallLifecycleScore: number;
  lifecycleConfidenceScore: number;
  highestProvenStage: ProductLifecycleRealityState;
  nextRequiredAction: LifecycleNextAction;
  canScaleNow: boolean;
  executionScore: number;
  launchScore: number;
  postLaunchScore: number;
  adoptionScore: number;
  revenueScore: number;
  evolutionScore: number;
  signalCollection: LifecycleSignalCollection;
  stageClassification: LifecycleStageClassification;
  gapAnalysis: LifecycleGapAnalysis;
  riskAnalysis: LifecycleRiskAnalysis;
  nextAction: LifecycleNextActionResult;
  keyFindings: string[];
  missingEvidence: string[];
  lifecycleBlockers: string[];
  riskSignals: string[];
  recommendedActions: string[];
  finalVerdict: string;
  verdict: ProductLifecycleVerdict;
  inputSnapshot: ProductLifecycleInputSnapshot;
  cacheKey: string;
}

export interface ProductLifecycleRealityAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'PRODUCT_LIFECYCLE_REALITY_COMPLETE' | 'PRODUCT_LIFECYCLE_REALITY_FAILED';
  report: ProductLifecycleRealityReport;
}

export interface AssessProductLifecycleRealityInput {
  rootDir?: string;
  rawPrompt?: string;
  liveExecutionRunner?: LiveIdeaToLaunchExecutionRunnerReport | null;
  founderLaunchDecision?: FounderLaunchDecisionReport | null;
  postLaunchReality?: PostLaunchRealityReport | null;
  adoptionReality?: AdoptionRealityReport | null;
  revenueReality?: RevenueRealityReport | null;
  productEvolutionReality?: ProductEvolutionRealityReport | null;
  requirementsToPlanContract?: RequirementsToPlanContractReport | null;
  /** Pass-through for upstream resolution. */
  observedBuildEvidence?: import('../connected-build-execution/connected-build-execution-types.js').ObservedFileEvidence;
  runtimeSessionEvidence?: import('../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js').RuntimeSessionEvidence;
  previewSessionEvidence?: import('../connected-preview-experience-proof/connected-preview-experience-proof-types.js').PreviewSessionEvidence;
  verificationEvidenceFixture?: import('../connected-verification-execution-proof/connected-verification-execution-proof-types.js').VerificationEvidenceFixture;
  launchReadinessFixture?: import('../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js').LaunchReadinessFixture;
  postLaunchEvidenceFixture?: import('../post-launch-reality-authority/post-launch-reality-types.js').PostLaunchEvidenceBundle | null;
  adoptionEvidenceFixture?: import('../adoption-reality-authority/adoption-reality-types.js').AdoptionEvidenceBundle | null;
  revenueEvidenceFixture?: import('../revenue-reality-authority/revenue-reality-types.js').RevenueEvidenceBundle | null;
  evolutionEvidenceFixture?: Partial<
    import('../product-evolution-reality-authority/product-evolution-reality-types.js').EvolutionEvidenceBundle
  > | null;
  /** Planning alone — must not produce BUILT. */
  planningOnlyFixture?: boolean;
  /** Build alone — must not produce RUNTIME_READY. */
  buildOnlyFixture?: boolean;
  /** Runtime alone — must not produce LAUNCHED. */
  runtimeOnlyFixture?: boolean;
  /** Launch readiness alone — must not produce ADOPTED. */
  launchReadinessOnlyFixture?: boolean;
  /** Adoption alone — must not produce REVENUE_GENERATING. */
  adoptionOnlyFixture?: boolean;
  /** Revenue alone — must not produce EVOLVING_PRODUCT. */
  revenueOnlyFixture?: boolean;
  skipHistoryRecording?: boolean;
}

export interface ProductLifecycleRealityHistoryEntry {
  timestamp: string;
  assessmentId: string;
  productLifecycleRealityState: ProductLifecycleRealityState;
  overallLifecycleScore: number;
  nextRequiredAction: LifecycleNextAction;
}

export interface ProductLifecycleRealityHistorySummary {
  totalAssessments: number;
  launchedAssessments: number;
  revenueGeneratingAssessments: number;
  evolvingProductAssessments: number;
  scalingProductAssessments: number;
}

export interface ProductLifecycleRealityArtifacts {
  productLifecycleRealityAssessment: ProductLifecycleRealityAssessment;
  productLifecycleRealityReportMarkdown: string;
}
