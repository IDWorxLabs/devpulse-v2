/**
 * Scale Readiness Reality Authority — read-only scale readiness models.
 */

import type { AdoptionRealityReport } from '../adoption-reality-authority/adoption-reality-types.js';
import type { FounderLaunchDecisionReport } from '../founder-launch-decision-authority/founder-launch-decision-authority-types.js';
import type { PostLaunchRealityReport } from '../post-launch-reality-authority/post-launch-reality-types.js';
import type { ProductEvolutionRealityReport } from '../product-evolution-reality-authority/product-evolution-reality-types.js';
import type { ProductLifecycleRealityReport } from '../product-lifecycle-reality-orchestrator/product-lifecycle-reality-types.js';
import type { RevenueRealityReport } from '../revenue-reality-authority/revenue-reality-types.js';

export type ScaleReadinessState =
  | 'NOT_READY'
  | 'FRAGILE'
  | 'PARTIALLY_READY'
  | 'SCALE_READY'
  | 'SCALE_RESILIENT';

export const SCALE_READINESS_STATES: readonly ScaleReadinessState[] = [
  'NOT_READY',
  'FRAGILE',
  'PARTIALLY_READY',
  'SCALE_READY',
  'SCALE_RESILIENT',
] as const;

export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface ObservedEvidenceBase {
  readOnly: true;
  evidenceSource: string;
  evidencePaths: string[];
  observedAt?: string;
}

export interface ArchitectureScalabilityEvidence extends ObservedEvidenceBase {
  systemScalabilityObserved: boolean;
  bottleneckRisksIdentified: boolean;
  infrastructureReadinessObserved: boolean;
  capacitySignalsObserved: boolean;
  scalabilityConfidenceObserved: boolean;
}

export interface OperationalScalabilityEvidence extends ObservedEvidenceBase {
  operationalMaturityObserved: boolean;
  monitoringCoverageObserved: boolean;
  incidentResponseCapabilityObserved: boolean;
  recoveryCapabilityObserved: boolean;
  operationalReadinessObserved: boolean;
}

export interface TeamScalabilityEvidence extends ObservedEvidenceBase {
  knowledgeDistributionObserved: boolean;
  busFactorRiskAssessed: boolean;
  teamDependencyRiskAssessed: boolean;
  operationalOwnershipObserved: boolean;
}

export interface FinancialScalabilityEvidence extends ObservedEvidenceBase {
  revenueSustainabilityObserved: boolean;
  growthCostSignalsObserved: boolean;
  scalingCostRisksAssessed: boolean;
  financialStabilityObserved: boolean;
}

export interface CustomerSupportScalabilityEvidence extends ObservedEvidenceBase {
  supportCapacityObserved: boolean;
  supportResponseSignalsObserved: boolean;
  customerSuccessReadinessObserved: boolean;
  supportBottlenecksAssessed: boolean;
}

export interface ReliabilityScalabilityEvidence extends ObservedEvidenceBase {
  reliabilityHistoryObserved: boolean;
  availabilitySignalsObserved: boolean;
  incidentTrendsAssessed: boolean;
  failureRecoveryCapabilityObserved: boolean;
}

export interface ScaleEvidenceBundle {
  readOnly: true;
  architecture: ArchitectureScalabilityEvidence | null;
  operational: OperationalScalabilityEvidence | null;
  team: TeamScalabilityEvidence | null;
  financial: FinancialScalabilityEvidence | null;
  customerSupport: CustomerSupportScalabilityEvidence | null;
  reliability: ReliabilityScalabilityEvidence | null;
}

export interface ArchitectureScalabilityAnalysis {
  readOnly: true;
  systemScalability: boolean;
  bottleneckRisks: boolean;
  infrastructureReadiness: boolean;
  capacitySignals: boolean;
  scalabilityConfidence: boolean;
  architectureScalabilityScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface OperationalScalabilityAnalysis {
  readOnly: true;
  operationalMaturity: boolean;
  monitoringCoverage: boolean;
  incidentResponseCapability: boolean;
  recoveryCapability: boolean;
  operationalReadiness: boolean;
  operationalScalabilityScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface TeamScalabilityAnalysis {
  readOnly: true;
  knowledgeDistribution: boolean;
  busFactorRisk: boolean;
  teamDependencyRisk: boolean;
  operationalOwnership: boolean;
  teamScalabilityScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface FinancialScalabilityAnalysis {
  readOnly: true;
  revenueSustainability: boolean;
  growthCostSignals: boolean;
  scalingCostRisks: boolean;
  financialStability: boolean;
  financialScalabilityScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface CustomerSupportScalabilityAnalysis {
  readOnly: true;
  supportCapacity: boolean;
  supportResponseSignals: boolean;
  customerSuccessReadiness: boolean;
  supportBottlenecks: boolean;
  supportScalabilityScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface ReliabilityScalabilityAnalysis {
  readOnly: true;
  reliabilityHistory: boolean;
  availabilitySignals: boolean;
  incidentTrends: boolean;
  failureRecoveryCapability: boolean;
  reliabilityScalabilityScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface ScaleRiskAnalysis {
  readOnly: true;
  growthRisk: boolean;
  infrastructureRisk: boolean;
  operationalRisk: boolean;
  teamRisk: boolean;
  financialRisk: boolean;
  customerExperienceRisk: boolean;
  scaleRiskScore: number;
  riskSignals: string[];
}

export interface ScaleReadinessVerdict {
  readOnly: true;
  scaleReadinessState: ScaleReadinessState;
  overallScaleReadinessScore: number;
  confidence: number;
  architectureReady: boolean;
  operationsReady: boolean;
  teamReady: boolean;
  financiallyReady: boolean;
  supportReady: boolean;
  reliabilityReady: boolean;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
}

export interface ScaleReadinessInputSnapshot {
  readOnly: true;
  productLifecycleReality: ProductLifecycleRealityReport | null;
  productEvolutionReality: ProductEvolutionRealityReport | null;
  revenueReality: RevenueRealityReport | null;
  adoptionReality: AdoptionRealityReport | null;
  postLaunchReality: PostLaunchRealityReport | null;
  founderLaunchDecision: FounderLaunchDecisionReport | null;
  scaleEvidence: ScaleEvidenceBundle;
  productLaunched: boolean;
  revenueObserved: boolean;
  adoptionObserved: boolean;
}

export interface ScaleReadinessRealityReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  scaleReadinessState: ScaleReadinessState;
  overallScaleReadinessScore: number;
  confidence: number;
  architectureReady: boolean;
  operationsReady: boolean;
  teamReady: boolean;
  financiallyReady: boolean;
  supportReady: boolean;
  reliabilityReady: boolean;
  architectureScalabilityScore: number;
  operationalScalabilityScore: number;
  teamScalabilityScore: number;
  financialScalabilityScore: number;
  supportScalabilityScore: number;
  reliabilityScalabilityScore: number;
  scaleRiskScore: number;
  architecture: ArchitectureScalabilityAnalysis;
  operational: OperationalScalabilityAnalysis;
  team: TeamScalabilityAnalysis;
  financial: FinancialScalabilityAnalysis;
  customerSupport: CustomerSupportScalabilityAnalysis;
  reliability: ReliabilityScalabilityAnalysis;
  scaleRisk: ScaleRiskAnalysis;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
  verdict: ScaleReadinessVerdict;
  inputSnapshot: ScaleReadinessInputSnapshot;
  cacheKey: string;
}

export interface ScaleReadinessRealityAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'SCALE_READINESS_REALITY_COMPLETE' | 'SCALE_READINESS_REALITY_FAILED';
  report: ScaleReadinessRealityReport;
}

export interface AssessScaleReadinessRealityInput {
  rootDir?: string;
  rawPrompt?: string;
  productLifecycleReality?: ProductLifecycleRealityReport | null;
  productEvolutionReality?: ProductEvolutionRealityReport | null;
  revenueReality?: RevenueRealityReport | null;
  adoptionReality?: AdoptionRealityReport | null;
  postLaunchReality?: PostLaunchRealityReport | null;
  founderLaunchDecision?: FounderLaunchDecisionReport | null;
  scaleEvidence?: ScaleEvidenceBundle | null;
  scaleEvidenceFixture?: Partial<ScaleEvidenceBundle> | null;
  /** Pass-through for upstream lifecycle resolution. */
  requirementsToPlanContract?: import('../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js').RequirementsToPlanContractReport | null;
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
  /** Revenue alone — must not create SCALE_READY. */
  revenueOnlyFixture?: boolean;
  /** Adoption alone — must not create SCALE_READY. */
  adoptionOnlyFixture?: boolean;
  /** Infrastructure alone — must not create SCALE_READY. */
  infrastructureOnlyFixture?: boolean;
  /** Reject fabricated scalability evidence. */
  fabricatedMetricsFixture?: boolean;
  skipHistoryRecording?: boolean;
}

export interface ScaleReadinessRealityHistoryEntry {
  timestamp: string;
  assessmentId: string;
  scaleReadinessState: ScaleReadinessState;
  overallScaleReadinessScore: number;
  architectureReady: boolean;
}

export interface ScaleReadinessRealityHistorySummary {
  totalAssessments: number;
  partiallyReadyAssessments: number;
  scaleReadyAssessments: number;
  scaleResilientAssessments: number;
}

export interface ScaleReadinessRealityArtifacts {
  scaleReadinessRealityAssessment: ScaleReadinessRealityAssessment;
  scaleReadinessRealityReportMarkdown: string;
}
