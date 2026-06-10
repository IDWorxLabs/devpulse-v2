/**
 * Founder Trust Validation — types and models.
 * Read-only founder trust validation. No UI, execution, or state mutation.
 */

export const FOUNDER_TRUST_VALIDATION_PASS_TOKEN = 'FOUNDER_TRUST_VALIDATION_V1_PASS';
export const FOUNDER_TRUST_VALIDATION_PASS = 'FOUNDER_TRUST_VALIDATION_PASS';
export const FOUNDER_TRUST_OWNER_MODULE = 'devpulse_v2_founder_trust_validation';
export const DEFAULT_MAX_FOUNDER_TRUST_HISTORY_SIZE = 128;
export const MAX_TRUST_GAPS = 64;

export const TRUST_CONTEXT_PASS = 'TRUST_CONTEXT_PASS';
export const TRUTHFULNESS_TRUST_PASS = 'TRUTHFULNESS_TRUST_PASS';
export const TRANSPARENCY_TRUST_PASS = 'TRANSPARENCY_TRUST_PASS';
export const VERIFICATION_TRUST_PASS = 'VERIFICATION_TRUST_PASS';
export const GOVERNANCE_TRUST_PASS = 'GOVERNANCE_TRUST_PASS';
export const EXECUTION_TRUST_PASS = 'EXECUTION_TRUST_PASS';
export const EVIDENCE_TRUST_PASS = 'EVIDENCE_TRUST_PASS';
export const ROLLBACK_TRUST_PASS = 'ROLLBACK_TRUST_PASS';
export const SAFETY_TRUST_PASS = 'SAFETY_TRUST_PASS';
export const TRUST_GAP_ANALYSIS_PASS = 'TRUST_GAP_ANALYSIS_PASS';
export const TRUST_ROADMAP_PASS = 'ROADMAP_PASS';
export const FOUNDER_TRUST_REPORTING_PASS = 'REPORTING_PASS';

export type FounderTrustResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
export type TrustGapSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';

export type TrustContextId =
  | 'TRUTHFULNESS_TRUST'
  | 'TRANSPARENCY_TRUST'
  | 'VERIFICATION_TRUST'
  | 'GOVERNANCE_TRUST'
  | 'EXECUTION_TRUST'
  | 'EVIDENCE_TRUST'
  | 'ROLLBACK_TRUST'
  | 'SAFETY_TRUST';

export interface TrustContext {
  contextId: TrustContextId;
  contextName: string;
  trustIntent: string;
  expectedFounderSignal: string;
  requiredEvidence: string[];
  passToken: typeof TRUST_CONTEXT_PASS;
}

export interface TrustGap {
  gapId: string;
  title: string;
  description: string;
  severity: TrustGapSeverity;
  detectionCode: string;
  sourceValidator: string;
  trustContext?: TrustContextId;
}

export interface TrustValidatorResult {
  validatorType: string;
  score: number;
  detectionCodes: string[];
  gaps: TrustGap[];
  passToken: string;
}

export interface TruthfulnessValidation extends TrustValidatorResult {
  passToken: typeof TRUTHFULNESS_TRUST_PASS;
}

export interface TransparencyValidation extends TrustValidatorResult {
  passToken: typeof TRANSPARENCY_TRUST_PASS;
}

export interface VerificationIntegrityValidation extends TrustValidatorResult {
  passToken: typeof VERIFICATION_TRUST_PASS;
}

export interface GovernanceComplianceValidation extends TrustValidatorResult {
  passToken: typeof GOVERNANCE_TRUST_PASS;
}

export interface ExecutionPredictabilityValidation extends TrustValidatorResult {
  passToken: typeof EXECUTION_TRUST_PASS;
}

export interface EvidenceVisibilityValidation extends TrustValidatorResult {
  passToken: typeof EVIDENCE_TRUST_PASS;
}

export interface RollbackConfidenceValidation extends TrustValidatorResult {
  passToken: typeof ROLLBACK_TRUST_PASS;
}

export interface SafetyBoundaryValidation extends TrustValidatorResult {
  passToken: typeof SAFETY_TRUST_PASS;
}

export interface TrustGapAnalysis {
  gaps: TrustGap[];
  criticalTrustGaps: TrustGap[];
  majorTrustGaps: TrustGap[];
  minorTrustGaps: TrustGap[];
  passToken: typeof TRUST_GAP_ANALYSIS_PASS;
}

export interface FounderTrustRoadmap {
  criticalTrustFixes: TrustGap[];
  highPriorityTrustImprovements: TrustGap[];
  mediumImprovements: TrustGap[];
  futureTrustOptimization: TrustGap[];
  passToken: typeof TRUST_ROADMAP_PASS;
}

export interface FounderTrustAuthority {
  authorityId: string;
  contexts: TrustContext[];
  truthfulness: TruthfulnessValidation;
  transparency: TransparencyValidation;
  verificationIntegrity: VerificationIntegrityValidation;
  governanceCompliance: GovernanceComplianceValidation;
  executionPredictability: ExecutionPredictabilityValidation;
  evidenceVisibility: EvidenceVisibilityValidation;
  rollbackConfidence: RollbackConfidenceValidation;
  safetyBoundaries: SafetyBoundaryValidation;
  gapAnalysis: TrustGapAnalysis;
  roadmap: FounderTrustRoadmap;
  founderTrustScore: number;
  founderTrustResult: FounderTrustResult;
  confidence: number;
  createdAt: number;
}

export interface FounderTrustScore {
  overallScore: number;
  truthfulnessScore: number;
  transparencyScore: number;
  verificationIntegrityScore: number;
  governanceComplianceScore: number;
  executionPredictabilityScore: number;
  evidenceVisibilityScore: number;
  rollbackConfidenceScore: number;
  safetyBoundariesScore: number;
}

export interface FounderTrustRecord {
  founderTrustId: string;
  projectId: string;
  workspaceId: string;
  overallScore: number;
  founderTrustResult: FounderTrustResult;
  totalGaps: number;
  criticalGaps: number;
  confidence: number;
  generatedAt: number;
}

export interface FounderTrustEvaluation {
  overallScore: number;
  founderTrustResult: FounderTrustResult;
  confidence: number;
  trustVerdict: string;
  scores: FounderTrustScore;
  totalGaps: number;
  criticalGaps: number;
}

export interface FounderTrustReport {
  founderTrustScore: number;
  founderTrustResult: FounderTrustResult;
  truthfulnessScore: number;
  transparencyScore: number;
  verificationIntegrityScore: number;
  governanceComplianceScore: number;
  executionPredictabilityScore: number;
  evidenceVisibilityScore: number;
  rollbackConfidenceScore: number;
  safetyBoundariesScore: number;
  detectedTrustGaps: TrustGap[];
  criticalTrustGaps: TrustGap[];
  majorTrustGaps: TrustGap[];
  minorTrustGaps: TrustGap[];
  founderTrustRoadmap: FounderTrustRoadmap;
  recommendedPriorityFixes: string[];
  evaluation: FounderTrustEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof FOUNDER_TRUST_REPORTING_PASS;
}

export interface FounderTrustValidationInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  truthfulnessWeak?: boolean;
  transparencyWeak?: boolean;
  verificationIntegrityWeak?: boolean;
  governanceViolation?: boolean;
  executionUnpredictable?: boolean;
  evidenceHidden?: boolean;
  rollbackUnclear?: boolean;
  safetyBoundaryWeak?: boolean;
  unsupportedPassClaims?: boolean;
  missingEvidence?: boolean;
  hiddenExecution?: boolean;
  governanceBlocked?: boolean;
}

export interface FounderTrustResultBundle {
  record: FounderTrustRecord;
  report: FounderTrustReport;
  authority: FounderTrustAuthority;
  result: FounderTrustResult;
  score: FounderTrustScore;
}

export interface FounderTrustRuntimeReport {
  contextBuildCount: number;
  truthfulnessValidateCount: number;
  transparencyValidateCount: number;
  verificationValidateCount: number;
  governanceValidateCount: number;
  executionValidateCount: number;
  evidenceValidateCount: number;
  rollbackValidateCount: number;
  safetyValidateCount: number;
  gapAnalysisCount: number;
  roadmapBuildCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  reportCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
  sourceTextCacheHits: number;
}

export const FOUNDER_TRUST_QUESTION_SIGNALS = [
  'founder trust',
  'trust validation',
  'truthfulness trust',
  'transparency trust',
  'verification integrity',
  'governance trust',
] as const;

export function isFounderTrustQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return FOUNDER_TRUST_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveFounderTrustResult(
  overallScore: number,
  criticalGaps: number,
  warningCount: number,
  blocked?: boolean,
): FounderTrustResult {
  if (blocked === true) return 'FAIL';
  if (criticalGaps > 0 || overallScore < 55) return 'FAIL';
  if (warningCount > 0 || overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
