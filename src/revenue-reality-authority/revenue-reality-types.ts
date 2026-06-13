/**
 * Revenue Reality Authority — read-only revenue evidence models.
 */

import type { AdoptionRealityReport } from '../adoption-reality-authority/adoption-reality-types.js';
import type { FounderLaunchDecisionReport } from '../founder-launch-decision-authority/founder-launch-decision-authority-types.js';
import type { PostLaunchRealityReport } from '../post-launch-reality-authority/post-launch-reality-types.js';

export type RevenueRealityState =
  | 'NO_REVENUE'
  | 'EARLY_REVENUE'
  | 'REPEAT_REVENUE'
  | 'SUSTAINABLE_REVENUE'
  | 'BUSINESS_ENGINE';

export const REVENUE_REALITY_STATES: readonly RevenueRealityState[] = [
  'NO_REVENUE',
  'EARLY_REVENUE',
  'REPEAT_REVENUE',
  'SUSTAINABLE_REVENUE',
  'BUSINESS_ENGINE',
] as const;

export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type RevenueTrend = 'UP' | 'FLAT' | 'DOWN' | 'UNKNOWN';

export interface ObservedEvidenceBase {
  readOnly: true;
  evidenceSource: string;
  evidencePaths: string[];
  observedAt?: string;
}

export interface RevenueEvidence extends ObservedEvidenceBase {
  revenueObserved: boolean;
  transactionEvidenceObserved: boolean;
  recurringRevenueObserved: boolean;
  revenueAmountCents: number | null;
  recurringRevenueAmountCents: number | null;
  revenueGrowthObserved: boolean;
  trend: RevenueTrend;
}

export interface CustomerValueEvidence extends ObservedEvidenceBase {
  payingCustomersObserved: boolean;
  payingCustomerCount: number | null;
  repeatCustomersObserved: boolean;
  repeatCustomerCount: number | null;
  customerRetentionObserved: boolean;
  customerSatisfactionObserved: boolean;
  valueExchangeObserved: boolean;
}

export interface ConversionEvidence extends ObservedEvidenceBase {
  conversionEvidenceObserved: boolean;
  freeToPaidSignalsObserved: boolean;
  purchaseCompletionObserved: boolean;
  customerAcquisitionEfficiencyObserved: boolean;
  conversionRatePercent: number | null;
}

export interface RevenueStabilityEvidence extends ObservedEvidenceBase {
  recurringRevenueSignalsObserved: boolean;
  revenueConsistencyObserved: boolean;
  revenueConcentrationRiskObserved: boolean;
  revenuePredictabilityObserved: boolean;
}

export interface RevenueEvidenceBundle {
  readOnly: true;
  revenue: RevenueEvidence | null;
  customerValue: CustomerValueEvidence | null;
  conversion: ConversionEvidence | null;
  revenueStability: RevenueStabilityEvidence | null;
}

export interface RevenueEvidenceAnalysis {
  readOnly: true;
  revenueObserved: boolean;
  transactionEvidence: boolean;
  recurringRevenue: boolean;
  revenueGrowth: boolean;
  revenueAmountCents: number | null;
  recurringRevenueAmountCents: number | null;
  trend: RevenueTrend;
  revenueConfidence: EvidenceConfidence;
  revenueScore: number;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface CustomerValueAnalysis {
  readOnly: true;
  payingCustomers: boolean;
  payingCustomerCount: number | null;
  repeatCustomers: boolean;
  repeatCustomerCount: number | null;
  customerRetention: boolean;
  customerSatisfaction: boolean;
  valueExchange: boolean;
  customerValueScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface ConversionAnalysis {
  readOnly: true;
  conversionEvidence: boolean;
  freeToPaidSignals: boolean;
  purchaseCompletion: boolean;
  customerAcquisitionEfficiency: boolean;
  conversionRatePercent: number | null;
  conversionScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface RevenueStabilityAnalysis {
  readOnly: true;
  recurringRevenueSignals: boolean;
  revenueConsistency: boolean;
  revenueConcentrationRisk: boolean;
  revenuePredictability: boolean;
  revenueStabilityScore: number;
  confidence: EvidenceConfidence;
  missingEvidence: string[];
  riskSignals: string[];
}

export interface BusinessRiskAnalysis {
  readOnly: true;
  customerChurnRisk: boolean;
  revenueFragility: boolean;
  dependencyRisk: boolean;
  singleCustomerRisk: boolean;
  revenueSustainabilityRisk: boolean;
  businessRiskScore: number;
  riskSignals: string[];
}

export interface RevenueVerdict {
  readOnly: true;
  revenueRealityState: RevenueRealityState;
  overallRevenueScore: number;
  confidence: number;
  revenueObserved: boolean;
  payingCustomersObserved: boolean;
  repeatRevenueObserved: boolean;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
}

export interface RevenueInputSnapshot {
  readOnly: true;
  adoptionReality: AdoptionRealityReport | null;
  postLaunchReality: PostLaunchRealityReport | null;
  founderLaunchDecision: FounderLaunchDecisionReport | null;
  revenueEvidence: RevenueEvidenceBundle;
  adoptionObserved: boolean;
}

export interface RevenueRealityReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  revenueRealityState: RevenueRealityState;
  overallRevenueScore: number;
  confidence: number;
  revenueObserved: boolean;
  payingCustomersObserved: boolean;
  repeatRevenueObserved: boolean;
  revenueScore: number;
  customerValueScore: number;
  conversionScore: number;
  revenueStabilityScore: number;
  businessRiskScore: number;
  revenue: RevenueEvidenceAnalysis;
  customerValue: CustomerValueAnalysis;
  conversion: ConversionAnalysis;
  revenueStability: RevenueStabilityAnalysis;
  businessRisk: BusinessRiskAnalysis;
  riskSignals: string[];
  missingEvidence: string[];
  keyFindings: string[];
  recommendedActions: string[];
  finalVerdict: string;
  verdict: RevenueVerdict;
  inputSnapshot: RevenueInputSnapshot;
  cacheKey: string;
}

export interface RevenueRealityAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'REVENUE_REALITY_COMPLETE' | 'REVENUE_REALITY_FAILED';
  report: RevenueRealityReport;
}

export interface AssessRevenueRealityInput {
  rootDir?: string;
  rawPrompt?: string;
  adoptionReality?: AdoptionRealityReport | null;
  postLaunchReality?: PostLaunchRealityReport | null;
  founderLaunchDecision?: FounderLaunchDecisionReport | null;
  revenueEvidence?: RevenueEvidenceBundle | null;
  revenueEvidenceFixture?: Partial<RevenueEvidenceBundle> | null;
  /** Pass-through for upstream adoption resolution. */
  requirementsToPlanContract?: import('../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js').RequirementsToPlanContractReport | null;
  observedBuildEvidence?: import('../connected-build-execution/connected-build-execution-types.js').ObservedFileEvidence;
  runtimeSessionEvidence?: import('../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js').RuntimeSessionEvidence;
  previewSessionEvidence?: import('../connected-preview-experience-proof/connected-preview-experience-proof-types.js').PreviewSessionEvidence;
  verificationEvidenceFixture?: import('../connected-verification-execution-proof/connected-verification-execution-proof-types.js').VerificationEvidenceFixture;
  launchReadinessFixture?: import('../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js').LaunchReadinessFixture;
  postLaunchEvidenceFixture?: import('../post-launch-reality-authority/post-launch-reality-types.js').PostLaunchEvidenceBundle | null;
  adoptionEvidenceFixture?: import('../adoption-reality-authority/adoption-reality-types.js').AdoptionEvidenceBundle | null;
  /** Users alone — must not create revenue. */
  usersOnlyFixture?: boolean;
  /** Adoption alone — must not create revenue. */
  adoptionOnlyFixture?: boolean;
  /** Reject fabricated transactions. */
  fabricatedMetricsFixture?: boolean;
  skipHistoryRecording?: boolean;
}

export interface RevenueRealityHistoryEntry {
  timestamp: string;
  assessmentId: string;
  revenueRealityState: RevenueRealityState;
  overallRevenueScore: number;
  revenueObserved: boolean;
}

export interface RevenueRealityHistorySummary {
  totalAssessments: number;
  revenueObservedAssessments: number;
  sustainableRevenueAssessments: number;
  businessEngineAssessments: number;
}

export interface RevenueRealityArtifacts {
  revenueRealityAssessment: RevenueRealityAssessment;
  revenueRealityReportMarkdown: string;
}
