/**
 * Market Expansion Reality Authority — read-only expansion readiness models.
 */

import type { AdoptionRealityReport } from '../adoption-reality-authority/adoption-reality-types.js';
import type { PostLaunchRealityReport } from '../post-launch-reality-authority/post-launch-reality-types.js';
import type { ProductEvolutionRealityReport } from '../product-evolution-reality-authority/product-evolution-reality-types.js';
import type { ProductLifecycleRealityReport } from '../product-lifecycle-reality-orchestrator/product-lifecycle-reality-types.js';
import type { RevenueRealityReport } from '../revenue-reality-authority/revenue-reality-types.js';
import type { ScaleReadinessRealityReport } from '../scale-readiness-reality-authority/scale-readiness-types.js';

export type MarketExpansionState =
  | 'NOT_READY'
  | 'LOCAL_SUCCESS'
  | 'SEGMENT_READY'
  | 'MULTI_MARKET_READY'
  | 'EXPANSION_RESILIENT';

export const MARKET_EXPANSION_STATES: readonly MarketExpansionState[] = [
  'NOT_READY',
  'LOCAL_SUCCESS',
  'SEGMENT_READY',
  'MULTI_MARKET_READY',
  'EXPANSION_RESILIENT',
] as const;

export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface ObservedEvidenceBase {
  readOnly: true;
  evidenceSource: string;
  evidencePaths: string[];
  observedAt?: string;
}

export interface CustomerSegmentExpansionEvidence extends ObservedEvidenceBase {
  crossSegmentAdoptionObserved: boolean;
  customerDiversityObserved: boolean;
  segmentConcentrationRiskAssessed: boolean;
  expansionConfidenceObserved: boolean;
}

export interface IndustryExpansionEvidence extends ObservedEvidenceBase {
  industryFitSignalsObserved: boolean;
  useCaseDiversityObserved: boolean;
  industryDependencyRiskAssessed: boolean;
  industryExpansionConfidenceObserved: boolean;
}

export interface RegionalExpansionEvidence extends ObservedEvidenceBase {
  regionalAdoptionSignalsObserved: boolean;
  localizationReadinessObserved: boolean;
  regionalDependencyRiskAssessed: boolean;
  geographicExpansionConfidenceObserved: boolean;
}

export interface ChannelExpansionEvidence extends ObservedEvidenceBase {
  acquisitionChannelDiversityObserved: boolean;
  channelDependencyRiskAssessed: boolean;
  expansionChannelReadinessObserved: boolean;
}

export interface ProductMarketFitResilienceEvidence extends ObservedEvidenceBase {
  fitStabilityObserved: boolean;
  expansionStressRiskAssessed: boolean;
  marketDependencyRiskAssessed: boolean;
  productFlexibilityObserved: boolean;
}

export interface ExpansionEvidenceBundle {
  readOnly: true;
  customerSegment: CustomerSegmentExpansionEvidence | null;
  industry: IndustryExpansionEvidence | null;
  regional: RegionalExpansionEvidence | null;
  channel: ChannelExpansionEvidence | null;
  productMarketFit: ProductMarketFitResilienceEvidence | null;
}

export interface CustomerSegmentExpansionAnalysis {
  readOnly: true;
  crossSegmentAdoption: boolean;
  customerDiversity: boolean;
  segmentConcentrationRisk: boolean;
  expansionConfidence: boolean;
  customerSegmentScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface IndustryExpansionAnalysis {
  readOnly: true;
  industryFitSignals: boolean;
  useCaseDiversity: boolean;
  industryDependencyRisk: boolean;
  industryExpansionConfidence: boolean;
  industryScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface RegionalExpansionAnalysis {
  readOnly: true;
  regionalAdoptionSignals: boolean;
  localizationReadiness: boolean;
  regionalDependencyRisk: boolean;
  geographicExpansionConfidence: boolean;
  regionalScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface ChannelExpansionAnalysis {
  readOnly: true;
  acquisitionChannelDiversity: boolean;
  channelDependencyRisk: boolean;
  expansionChannelReadiness: boolean;
  channelScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface ProductMarketFitResilienceAnalysis {
  readOnly: true;
  fitStability: boolean;
  expansionStressRisk: boolean;
  marketDependencyRisk: boolean;
  productFlexibility: boolean;
  productMarketFitScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface ExpansionRiskAnalysis {
  readOnly: true;
  marketRisk: boolean;
  segmentRisk: boolean;
  industryRisk: boolean;
  regionalRisk: boolean;
  executionRisk: boolean;
  focusDilutionRisk: boolean;
  expansionRiskScore: number;
  riskSignals: string[];
}

export interface MarketExpansionVerdict {
  readOnly: true;
  marketExpansionState: MarketExpansionState;
  overallExpansionScore: number;
  confidence: number;
  segmentExpansionReady: boolean;
  industryExpansionReady: boolean;
  regionalExpansionReady: boolean;
  channelExpansionReady: boolean;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
}

export interface MarketExpansionInputSnapshot {
  readOnly: true;
  scaleReadinessReality: ScaleReadinessRealityReport | null;
  productLifecycleReality: ProductLifecycleRealityReport | null;
  productEvolutionReality: ProductEvolutionRealityReport | null;
  revenueReality: RevenueRealityReport | null;
  adoptionReality: AdoptionRealityReport | null;
  postLaunchReality: PostLaunchRealityReport | null;
  expansionEvidence: ExpansionEvidenceBundle;
  productLaunched: boolean;
  revenueObserved: boolean;
  adoptionObserved: boolean;
  scaleReady: boolean;
}

export interface MarketExpansionRealityReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  marketExpansionState: MarketExpansionState;
  overallExpansionScore: number;
  confidence: number;
  segmentExpansionReady: boolean;
  industryExpansionReady: boolean;
  regionalExpansionReady: boolean;
  channelExpansionReady: boolean;
  customerSegmentScore: number;
  industryScore: number;
  regionalScore: number;
  channelScore: number;
  productMarketFitScore: number;
  expansionRiskScore: number;
  customerSegment: CustomerSegmentExpansionAnalysis;
  industry: IndustryExpansionAnalysis;
  regional: RegionalExpansionAnalysis;
  channel: ChannelExpansionAnalysis;
  productMarketFit: ProductMarketFitResilienceAnalysis;
  expansionRisk: ExpansionRiskAnalysis;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
  verdict: MarketExpansionVerdict;
  inputSnapshot: MarketExpansionInputSnapshot;
  cacheKey: string;
}

export interface MarketExpansionRealityAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'MARKET_EXPANSION_REALITY_COMPLETE' | 'MARKET_EXPANSION_REALITY_FAILED';
  report: MarketExpansionRealityReport;
}

export interface AssessMarketExpansionRealityInput {
  rootDir?: string;
  rawPrompt?: string;
  scaleReadinessReality?: ScaleReadinessRealityReport | null;
  productLifecycleReality?: ProductLifecycleRealityReport | null;
  productEvolutionReality?: ProductEvolutionRealityReport | null;
  revenueReality?: RevenueRealityReport | null;
  adoptionReality?: AdoptionRealityReport | null;
  postLaunchReality?: PostLaunchRealityReport | null;
  expansionEvidence?: ExpansionEvidenceBundle | null;
  expansionEvidenceFixture?: Partial<ExpansionEvidenceBundle> | null;
  /** Pass-through for upstream scale readiness resolution. */
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
  /** Revenue alone — must not create MULTI_MARKET_READY. */
  revenueOnlyFixture?: boolean;
  /** Adoption alone — must not create MULTI_MARKET_READY. */
  adoptionOnlyFixture?: boolean;
  /** Scale readiness alone — must not create EXPANSION_RESILIENT. */
  scaleReadinessOnlyFixture?: boolean;
  /** Reject fabricated market evidence. */
  fabricatedMetricsFixture?: boolean;
  skipHistoryRecording?: boolean;
}

export interface MarketExpansionRealityHistoryEntry {
  timestamp: string;
  assessmentId: string;
  marketExpansionState: MarketExpansionState;
  overallExpansionScore: number;
  segmentExpansionReady: boolean;
}

export interface MarketExpansionRealityHistorySummary {
  totalAssessments: number;
  segmentReadyAssessments: number;
  multiMarketReadyAssessments: number;
  expansionResilientAssessments: number;
}

export interface MarketExpansionRealityArtifacts {
  marketExpansionRealityAssessment: MarketExpansionRealityAssessment;
  marketExpansionRealityReportMarkdown: string;
}
