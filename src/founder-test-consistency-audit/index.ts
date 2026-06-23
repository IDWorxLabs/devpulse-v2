/**
 * Phase 26.70 — Founder Test Consistency Audit public API.
 */

export {
  FOUNDER_TEST_CONSISTENCY_AUDIT_PASS,
  CONSISTENCY_AUDIT_AUTHORITATIVE_EVIDENCE_REPOINT_PASS,
  FOUNDER_TEST_CONSISTENCY_AUDIT_OWNER_MODULE,
  FOUNDER_TEST_CONSISTENCY_AUDIT_PHASE,
  FOUNDER_TEST_CONSISTENCY_AUDIT_REPORT_TITLE,
  FOUNDER_TEST_CONSISTENCY_AUDIT_CORE_QUESTION,
  FOUNDER_TEST_CONSISTENCY_AUDIT_CACHE_KEY_PREFIX,
  MAX_CONSISTENCY_AUDIT_HISTORY,
  CONSISTENCY_AUDIT_SAFETY_GUARANTEES,
  ORCHESTRATION_FLOW,
  AUDITED_CLAIM_DEFINITIONS,
  PROVEN_SCORE_THRESHOLD,
  PARTIAL_SCORE_THRESHOLD,
} from './founder-test-consistency-audit-registry.js';

export type {
  ConsistencyVerdict,
  ConsistencyRootCause,
  ConsistencyFailureKind,
  AuditedClaimId,
  AuthorityVerdictRecord,
  ConsistencyClaimAudit,
  FounderTruthMatrixRow,
  FounderTruthMatrix,
  ConsistencyAuditSections,
  FounderTestConsistencyAuditInputSnapshot,
  FounderTestConsistencyAuditReport,
  FounderTestConsistencyAuditAssessment,
  AssessFounderTestConsistencyAuditInput,
  FounderTestConsistencyAuditHistoryEntry,
} from './founder-test-consistency-audit-types.js';

export {
  resetFounderTestConsistencyAuditHistoryForTests,
  recordFounderTestConsistencyAuditAssessment,
  getFounderTestConsistencyAuditHistorySize,
  getLatestFounderTestConsistencyAuditHistoryEntry,
  getFounderTestConsistencyAuditHistory,
} from './founder-test-consistency-audit-history.js';

export {
  assessFounderTestConsistencyAudit,
  buildFounderTestConsistencyAuditArtifacts,
  resetFounderTestConsistencyAuditCounterForTests,
  resetFounderTestConsistencyAuditModuleForTests,
} from './founder-test-consistency-audit-authority.js';

export { buildFounderTestConsistencyAuditReportMarkdown } from './founder-test-consistency-audit-report-builder.js';

export {
  collectConsistencyAuditEvidence,
  scoreToConsistencyVerdict,
  booleanToConsistencyVerdict,
} from './claim-evidence-collector.js';

export {
  analyzeAllConsistencyClaims,
  buildFounderTruthMatrix,
  buildConsistencyAuditSections,
  buildFounderAnswerSummary,
} from './consistency-analyzers.js';

export type { CollectedConsistencyEvidence } from './claim-evidence-collector.js';

export {
  resolveConsistencyAuthoritativeEvidence,
  authoritativeOverridesStaleVerdict,
  shouldSuppressMisreportTokens,
} from './resolve-consistency-authoritative-evidence.js';
export type { ConsistencyAuthoritativeEvidence } from './resolve-consistency-authoritative-evidence.js';
