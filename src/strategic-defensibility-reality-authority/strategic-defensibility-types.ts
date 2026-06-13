/**
 * Strategic Defensibility Reality Authority — read-only defensibility models.
 */

import type { AdoptionRealityReport } from '../adoption-reality-authority/adoption-reality-types.js';
import type { MarketExpansionRealityReport } from '../market-expansion-reality-authority/market-expansion-reality-types.js';
import type { PostLaunchRealityReport } from '../post-launch-reality-authority/post-launch-reality-types.js';
import type { ProductEvolutionRealityReport } from '../product-evolution-reality-authority/product-evolution-reality-types.js';
import type { ProductLifecycleRealityReport } from '../product-lifecycle-reality-orchestrator/product-lifecycle-reality-types.js';
import type { RevenueRealityReport } from '../revenue-reality-authority/revenue-reality-types.js';
import type { ScaleReadinessRealityReport } from '../scale-readiness-reality-authority/scale-readiness-types.js';

export type StrategicDefensibilityState =
  | 'EASILY_REPLACED'
  | 'WEAKLY_DEFENSIBLE'
  | 'MODERATELY_DEFENSIBLE'
  | 'STRONGLY_DEFENSIBLE'
  | 'CATEGORY_DEFENSIBLE';

export const STRATEGIC_DEFENSIBILITY_STATES: readonly StrategicDefensibilityState[] = [
  'EASILY_REPLACED',
  'WEAKLY_DEFENSIBLE',
  'MODERATELY_DEFENSIBLE',
  'STRONGLY_DEFENSIBLE',
  'CATEGORY_DEFENSIBLE',
] as const;

export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface ObservedEvidenceBase {
  readOnly: true;
  evidenceSource: string;
  evidencePaths: string[];
  observedAt?: string;
}

export interface NetworkEffectsEvidence extends ObservedEvidenceBase {
  userNetworkValueObserved: boolean;
  networkReinforcementSignalsObserved: boolean;
  communityDependencyObserved: boolean;
  networkEffectStrengthObserved: boolean;
}

export interface DataAdvantageEvidence extends ObservedEvidenceBase {
  uniqueDataAssetsObserved: boolean;
  learningAdvantagesObserved: boolean;
  dataFlywheelSignalsObserved: boolean;
  dataDependencyObserved: boolean;
}

export interface SwitchingCostEvidence extends ObservedEvidenceBase {
  customerLockInSignalsObserved: boolean;
  migrationDifficultyObserved: boolean;
  workflowDependencyObserved: boolean;
  replacementResistanceObserved: boolean;
}

export interface BrandTrustEvidence extends ObservedEvidenceBase {
  customerTrustSignalsObserved: boolean;
  brandPreferenceEvidenceObserved: boolean;
  reputationStrengthObserved: boolean;
  trustDurabilityObserved: boolean;
}

export interface DistributionAdvantageEvidence extends ObservedEvidenceBase {
  customerAcquisitionAdvantagesObserved: boolean;
  distributionReachObserved: boolean;
  channelStrengthObserved: boolean;
  partnerAdvantagesObserved: boolean;
}

export interface ExecutionAdvantageEvidence extends ObservedEvidenceBase {
  improvementVelocityObserved: boolean;
  adaptationSpeedObserved: boolean;
  innovationSignalsObserved: boolean;
  operationalExcellenceObserved: boolean;
}

export interface DefensibilityEvidenceBundle {
  readOnly: true;
  networkEffects: NetworkEffectsEvidence | null;
  dataAdvantage: DataAdvantageEvidence | null;
  switchingCost: SwitchingCostEvidence | null;
  brandTrust: BrandTrustEvidence | null;
  distributionAdvantage: DistributionAdvantageEvidence | null;
  executionAdvantage: ExecutionAdvantageEvidence | null;
}

export interface NetworkEffectsAnalysis {
  readOnly: true;
  userNetworkValue: boolean;
  networkReinforcementSignals: boolean;
  communityDependency: boolean;
  networkEffectStrength: boolean;
  networkEffectsScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface DataAdvantageAnalysis {
  readOnly: true;
  uniqueDataAssets: boolean;
  learningAdvantages: boolean;
  dataFlywheelSignals: boolean;
  dataDependency: boolean;
  dataAdvantageScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface SwitchingCostAnalysis {
  readOnly: true;
  customerLockInSignals: boolean;
  migrationDifficulty: boolean;
  workflowDependency: boolean;
  replacementResistance: boolean;
  switchingCostScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface BrandTrustAnalysis {
  readOnly: true;
  customerTrustSignals: boolean;
  brandPreferenceEvidence: boolean;
  reputationStrength: boolean;
  trustDurability: boolean;
  brandTrustScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface DistributionAdvantageAnalysis {
  readOnly: true;
  customerAcquisitionAdvantages: boolean;
  distributionReach: boolean;
  channelStrength: boolean;
  partnerAdvantages: boolean;
  distributionScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface ExecutionAdvantageAnalysis {
  readOnly: true;
  improvementVelocity: boolean;
  adaptationSpeed: boolean;
  innovationSignals: boolean;
  operationalExcellence: boolean;
  executionAdvantageScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface DefensibilityRiskAnalysis {
  readOnly: true;
  competitiveThreatRisk: boolean;
  commoditizationRisk: boolean;
  displacementRisk: boolean;
  platformRisk: boolean;
  marketDependencyRisk: boolean;
  defensibilityRiskScore: number;
  riskSignals: string[];
}

export interface StrategicDefensibilityVerdict {
  readOnly: true;
  strategicDefensibilityState: StrategicDefensibilityState;
  overallDefensibilityScore: number;
  confidence: number;
  networkEffectsObserved: boolean;
  dataAdvantageObserved: boolean;
  switchingCostObserved: boolean;
  brandTrustObserved: boolean;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
}

export interface StrategicDefensibilityInputSnapshot {
  readOnly: true;
  marketExpansionReality: MarketExpansionRealityReport | null;
  scaleReadinessReality: ScaleReadinessRealityReport | null;
  productLifecycleReality: ProductLifecycleRealityReport | null;
  productEvolutionReality: ProductEvolutionRealityReport | null;
  revenueReality: RevenueRealityReport | null;
  adoptionReality: AdoptionRealityReport | null;
  postLaunchReality: PostLaunchRealityReport | null;
  defensibilityEvidence: DefensibilityEvidenceBundle;
  productLaunched: boolean;
  revenueObserved: boolean;
  adoptionObserved: boolean;
}

export interface StrategicDefensibilityRealityReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  strategicDefensibilityState: StrategicDefensibilityState;
  overallDefensibilityScore: number;
  confidence: number;
  networkEffectsObserved: boolean;
  dataAdvantageObserved: boolean;
  switchingCostObserved: boolean;
  brandTrustObserved: boolean;
  networkEffectsScore: number;
  dataAdvantageScore: number;
  switchingCostScore: number;
  brandTrustScore: number;
  distributionScore: number;
  executionAdvantageScore: number;
  defensibilityRiskScore: number;
  networkEffects: NetworkEffectsAnalysis;
  dataAdvantage: DataAdvantageAnalysis;
  switchingCost: SwitchingCostAnalysis;
  brandTrust: BrandTrustAnalysis;
  distributionAdvantage: DistributionAdvantageAnalysis;
  executionAdvantage: ExecutionAdvantageAnalysis;
  defensibilityRisk: DefensibilityRiskAnalysis;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
  verdict: StrategicDefensibilityVerdict;
  inputSnapshot: StrategicDefensibilityInputSnapshot;
  cacheKey: string;
}

export interface StrategicDefensibilityRealityAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'STRATEGIC_DEFENSIBILITY_REALITY_COMPLETE' | 'STRATEGIC_DEFENSIBILITY_REALITY_FAILED';
  report: StrategicDefensibilityRealityReport;
}

export interface AssessStrategicDefensibilityRealityInput {
  rootDir?: string;
  rawPrompt?: string;
  marketExpansionReality?: MarketExpansionRealityReport | null;
  scaleReadinessReality?: ScaleReadinessRealityReport | null;
  productLifecycleReality?: ProductLifecycleRealityReport | null;
  productEvolutionReality?: ProductEvolutionRealityReport | null;
  revenueReality?: RevenueRealityReport | null;
  adoptionReality?: AdoptionRealityReport | null;
  postLaunchReality?: PostLaunchRealityReport | null;
  defensibilityEvidence?: DefensibilityEvidenceBundle | null;
  defensibilityEvidenceFixture?: Partial<DefensibilityEvidenceBundle> | null;
  /** Pass-through for upstream resolution. */
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
  scaleEvidenceFixture?: Partial<
    import('../scale-readiness-reality-authority/scale-readiness-types.js').ScaleEvidenceBundle
  > | null;
  expansionEvidenceFixture?: Partial<
    import('../market-expansion-reality-authority/market-expansion-reality-types.js').ExpansionEvidenceBundle
  > | null;
  /** Revenue alone — must not create STRONGLY_DEFENSIBLE. */
  revenueOnlyFixture?: boolean;
  /** Adoption alone — must not create STRONGLY_DEFENSIBLE. */
  adoptionOnlyFixture?: boolean;
  /** Market expansion alone — must not create CATEGORY_DEFENSIBLE. */
  marketExpansionOnlyFixture?: boolean;
  /** Reject fabricated moat evidence. */
  fabricatedMetricsFixture?: boolean;
  skipHistoryRecording?: boolean;
}

export interface StrategicDefensibilityRealityHistoryEntry {
  timestamp: string;
  assessmentId: string;
  strategicDefensibilityState: StrategicDefensibilityState;
  overallDefensibilityScore: number;
  networkEffectsObserved: boolean;
}

export interface StrategicDefensibilityRealityHistorySummary {
  totalAssessments: number;
  moderatelyDefensibleAssessments: number;
  stronglyDefensibleAssessments: number;
  categoryDefensibleAssessments: number;
}

export interface StrategicDefensibilityRealityArtifacts {
  strategicDefensibilityRealityAssessment: StrategicDefensibilityRealityAssessment;
  strategicDefensibilityRealityReportMarkdown: string;
}
