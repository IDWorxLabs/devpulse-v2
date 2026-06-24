/**
 * Production Readiness Gate V1 — types.
 */

export type ProductionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ProductionReadinessVerdict =
  | 'PRODUCTION_READY'
  | 'PRODUCTION_READY_WITH_WARNINGS'
  | 'NEEDS_PRODUCTION_HARDENING'
  | 'NOT_PRODUCTION_READY';

export type ProductionReadinessDomainId =
  | 'SECURITY'
  | 'RELIABILITY'
  | 'OBSERVABILITY'
  | 'CONFIGURATION'
  | 'DEPLOYMENT'
  | 'RECOVERY'
  | 'SCALABILITY'
  | 'DATA_PROTECTION'
  | 'OPERATIONAL_RISK';

export interface ProductionReadinessDomainScore {
  readOnly: true;
  domain: ProductionReadinessDomainId;
  label: string;
  score: number;
  status: 'MATURE' | 'PARTIAL' | 'MISSING';
  findings: readonly string[];
}

export interface ProductionRiskEntry {
  readOnly: true;
  profile: string;
  productName: string;
  riskLevel: ProductionRiskLevel;
  category: string;
  detail: string;
  recommendation: string;
}

export interface UpstreamEvidenceSnapshot {
  readOnly: true;
  buildProven: boolean;
  previewProven: boolean;
  verificationProven: boolean;
  launchReady: boolean;
  productArchitectReviewed: boolean;
  cqiRequirementConfidence: number | null;
  aflaVerdict: string | null;
  aflaScore: number | null;
  uvlVerificationConfidence: number | null;
  paiProductReadinessScore: number | null;
  evidenceSources: readonly string[];
}

export interface ProductionCategoryResult {
  readOnly: true;
  profile: string;
  productName: string;
  workspacePath: string | null;
  upstreamEvidence: UpstreamEvidenceSnapshot;
  domainScores: readonly ProductionReadinessDomainScore[];
  productionReadinessScore: number;
  verdict: ProductionReadinessVerdict;
  risks: readonly ProductionRiskEntry[];
  missingRequirements: readonly string[];
  hardeningRecommendations: readonly string[];
  operationalRequirementsSatisfied: boolean;
}

export interface ProductionMatrixEntry {
  readOnly: true;
  profile: string;
  productName: string;
  buildProven: boolean;
  previewProven: boolean;
  verificationProven: boolean;
  launchReady: boolean;
  productionReadinessScore: number;
  verdict: ProductionReadinessVerdict;
}

export interface DomainScoresReport {
  readOnly: true;
  generatedAt: string;
  overallScore: number;
  domains: readonly ProductionReadinessDomainScore[];
}

export interface ProductionReadinessGateV1Assessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: string;
  passToken: string;
  version: 'V1';
  generatedAt: string;
  categoriesEvaluated: number;
  categoriesProductionReady: number;
  productionReadinessScore: number;
  productionReadinessVerdict: ProductionReadinessVerdict;
  productionProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  domainScores: DomainScoresReport;
  productionMatrix: readonly ProductionMatrixEntry[];
  riskAnalysis: readonly ProductionRiskEntry[];
  hardeningRecommendations: readonly string[];
  categoryResults: readonly ProductionCategoryResult[];
}
