/**
 * DevPulse V2 Phase 16.10 — Verification Evidence Engine types.
 * Evidence authority layer only — no verification execution, trust decisions, or auto-fix.
 */

export const VERIFICATION_EVIDENCE_ENGINE_PASS_TOKEN = 'VERIFICATION_EVIDENCE_ENGINE_V1_PASS';
export const VERIFICATION_EVIDENCE_ENGINE_OWNER_MODULE =
  'devpulse_v2_verification_evidence_engine';

export const INITIAL_EVIDENCE_CATEGORIES = [
  'VERIFICATION_RESULT',
  'VERIFICATION_REPORT',
  'SCREENSHOT',
  'SELF_VISION_REPORT',
  'TIMELINE_REPORT',
  'EXECUTION_REPORT',
  'RUNTIME_REPORT',
  'TRUST_REPORT',
  'COMPLETION_REPORT',
  'WORLD2_REPORT',
] as const;

export type EvidenceCategory = (typeof INITIAL_EVIDENCE_CATEGORIES)[number] | string;

export type EvidenceStatus = 'REGISTERED' | 'ACTIVE' | 'SUPERSEDED' | 'INVALID';

export type EvidenceTrustState = 'UNASSESSED' | 'PENDING' | 'TRUSTED' | 'UNTRUSTED';

export type EvidenceVisibility = 'PRIVATE' | 'PROJECT' | 'WORKSPACE' | 'PUBLIC';

export type EvidenceUsage = 'SUPPORTING' | 'PRIMARY' | 'REFERENCE' | 'ARCHIVAL';

export type EvidenceAuthorityState = 'REGISTERED' | 'READY' | 'BLOCKED' | 'INVALID';

export const FORBIDDEN_VERIFICATION_EVIDENCE_DUPLICATES = [
  'reporting_monolith',
  'auto_fix_engine',
  'uvl_monolith',
  'runtime_brain',
  'trust_engine_decision',
] as const;

export const VERIFICATION_EVIDENCE_QUESTION_SIGNALS = [
  'what evidence exists',
  'who produced evidence',
  'what verification generated',
  'what system owns evidence',
  'can evidence be trusted',
  'evidence inventory',
  'evidence lineage',
  'evidence ownership',
  'evidence traceability',
  'verification evidence engine',
  'evidence engine',
  'evidence authority',
  'evidence registered',
  'evidence validation',
  'evidence report',
  'evidence blocked',
  'why is evidence blocked',
] as const;

export interface EvidenceOwnership {
  ownerModule: string;
  ownerDomain: string;
  producedBy: string;
  verificationProvider?: string;
  verificationSession?: string;
  orchestrationId?: string;
  projectId: string;
  workspaceId: string;
}

export interface EvidenceLineage {
  parentEvidence: string[];
  childEvidence: string[];
  derivedEvidence: string[];
  supportingEvidence: string[];
  contradictingEvidence: string[];
  supersededEvidence: string[];
}

export interface EvidenceProvenance {
  sourceSystem: string;
  sourceModule: string;
  sourcePhase: number;
  registrationMethod: string;
}

export interface EvidenceRecord {
  evidenceId: string;
  evidenceType: EvidenceCategory;
  evidenceSource: string;
  evidenceOwner: EvidenceOwnership;
  evidenceTimestamp: number;
  evidenceStatus: EvidenceStatus;
  evidenceTrustState: EvidenceTrustState;
  evidenceLineage: EvidenceLineage;
  evidenceRelationships: string[];
  evidenceDependencies: string[];
  evidenceProvenance: EvidenceProvenance;
  evidenceVisibility: EvidenceVisibility;
  evidenceUsage: EvidenceUsage;
  verificationTargetId?: string;
  verificationSessionId?: string;
  reportId?: string;
  orchestrationId?: string;
  completionChainId?: string;
  world2ChainId?: string;
  authorityOnly: true;
}

export interface EvidenceValidationIssue {
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  evidenceId?: string;
}

export interface EvidenceValidationResult {
  valid: boolean;
  issues: EvidenceValidationIssue[];
  warnings: string[];
}

export interface EvidenceInventoryReport {
  reportId: string;
  evidenceCount: number;
  evidenceIds: string[];
  categories: Record<string, number>;
  createdAt: number;
  authorityOnly: true;
}

export interface EvidenceOwnershipReport {
  reportId: string;
  ownershipRecords: Array<{ evidenceId: string; ownerModule: string; producedBy: string }>;
  createdAt: number;
  authorityOnly: true;
}

export interface EvidenceLineageReport {
  reportId: string;
  lineageLinks: Array<{ evidenceId: string; parents: string[]; children: string[] }>;
  createdAt: number;
  authorityOnly: true;
}

export interface EvidenceTraceabilityReport {
  reportId: string;
  traceabilityIndex: Array<{ key: string; evidenceIds: string[] }>;
  createdAt: number;
  authorityOnly: true;
}

export interface EvidenceDiagnosticsReport {
  reportId: string;
  issueCount: number;
  issues: EvidenceValidationIssue[];
  createdAt: number;
  authorityOnly: true;
}

export interface EvidenceSummaryReport {
  reportId: string;
  authorityId: string;
  authorityState: EvidenceAuthorityState;
  evidenceCount: number;
  categoryCount: number;
  lineageLinkCount: number;
  traceabilityKeyCount: number;
  validationValid: boolean;
  warnings: string[];
  blockedReasons: string[];
  createdAt: number;
  authorityOnly: true;
}

export interface VerificationEvidenceDiagnostics {
  evidenceAuthorityActive: boolean;
  authorityId: string | null;
  evidenceCount: number;
  lineageLinkCount: number;
  traceabilityKeyCount: number;
  validationIssueCount: number;
  lastQuery: string | null;
  lastState: EvidenceAuthorityState | null;
}

export interface PrepareVerificationEvidenceInput {
  query?: string;
  projectId?: string;
  workspaceId?: string;
  projectExists?: boolean;
  workspaceExists?: boolean;
  world1Protected?: boolean;
  ownershipValid?: boolean;
  suppressRuntimeBootstrap?: boolean;
}

export interface PrepareVerificationEvidenceResult {
  evidenceSummaryReport: EvidenceSummaryReport;
  diagnostics: VerificationEvidenceDiagnostics;
  evidenceRecords: EvidenceRecord[];
  inventoryReport: EvidenceInventoryReport;
  ownershipReport: EvidenceOwnershipReport;
  lineageReport: EvidenceLineageReport;
  traceabilityReport: EvidenceTraceabilityReport;
  diagnosticsReport: EvidenceDiagnosticsReport;
  validationResult: EvidenceValidationResult;
  responseText: string;
}

export function isVerificationEvidenceQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return VERIFICATION_EVIDENCE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isVerificationEvidenceAdvisoryQuestion(question: string): boolean {
  return isVerificationEvidenceQuestion(question);
}

export function isDuplicateVerificationEvidenceQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_VERIFICATION_EVIDENCE_DUPLICATES.some((d) => lower.includes(d));
}
