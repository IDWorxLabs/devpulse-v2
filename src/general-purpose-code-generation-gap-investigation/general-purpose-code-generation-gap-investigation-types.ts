/**
 * General-Purpose Code Generation Gap Investigation — types.
 */

export type GapVerdict =
  | 'ROADMAP_INCONSISTENCY'
  | 'REAL_CAPABILITY_GAP'
  | 'STALE_EVIDENCE'
  | 'AUDIT_DISAGREEMENT'
  | 'INSUFFICIENT_V1_COVERAGE';

export type RoadmapActionRecommendation =
  | 'MARK_V1_COMPLETE'
  | 'KEEP_EXTEND'
  | 'CREATE_V2_ROADMAP_ITEM'
  | 'NO_CHANGE';

export interface EvidenceAnalysisEntry {
  readOnly: true;
  source: string;
  generalPurposeV1Proven: boolean;
  reportsGap: boolean;
  highestPriority: string;
  codeGenerationScore: number | null;
  detail: string;
}

export interface RemainingCodegenGap {
  readOnly: true;
  gapId: string;
  category: 'ASPIRATIONAL' | 'REAL' | 'RESOLVED';
  capability: string;
  severity: 'BLOCKING' | 'HIGH' | 'MEDIUM' | 'LOW';
  detail: string;
  unsupportedApplicationClasses: readonly string[];
}

export interface RoadmapConsistencyFinding {
  readOnly: true;
  auditSource: string;
  phase: string;
  action: string;
  consistentWithV1Pass: boolean;
  issue: string | null;
}

export interface GeneralPurposeCodeGenerationGapInvestigationAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'General-Purpose Code Generation Gap Investigation';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  investigationProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  verdict: GapVerdict;
  verdictSummary: string;
  generalPurposeV1Proven: boolean;
  realCapabilityGapExists: boolean;
  staleEvidenceDetected: boolean;
  auditDisagreementDetected: boolean;
  v1CoverageInsufficient: boolean;
  roadmapInconsistencyDetected: boolean;
  gapProducingAuditSource: string;
  capabilityAuditAgreesWithV1Pass: boolean;
  strategicAuditAgreesWithV1Pass: boolean;
  shouldV1RemainComplete: boolean;
  shouldV2RoadmapItemExist: boolean;
  roadmapActionRecommendation: RoadmapActionRecommendation;
  unsupportedCategoryCount: number;
  aspirationalCategoryGapCount: number;
  evidenceAnalysis: readonly EvidenceAnalysisEntry[];
  roadmapConsistency: readonly RoadmapConsistencyFinding[];
  remainingCodegenGaps: readonly RemainingCodegenGap[];
}
