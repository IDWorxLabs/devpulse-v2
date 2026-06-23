/**
 * Phase 26.91 — Authority Evidence Source Realignment (V1).
 */

export {
  AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS,
  AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PHASE,
  AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_OPERATION,
  AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_CORE_QUESTION,
  AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_CACHE_KEY_PREFIX,
  REALIGNMENT_AUDITED_AUTHORITIES,
  AUTHORITY_SOURCE_REALIGNMENT_RULES,
  TESTING_INFRASTRUCTURE_DEFECT,
  REALIGNMENT_INTEGRATION_TARGETS,
} from './authority-evidence-source-realignment-registry.js';

export type {
  AuthoritySourceFailureClass,
  AuthorityDataSource,
  AuthorityEvidenceRecord,
  AuthoritativeEvidenceSource,
  StaleAuthorityFinding,
  AuthoritySourceRealignmentPlan,
  AuthorityEvidenceSourceRealignmentReport,
  AuthorityEvidenceSourceRealignmentAssessment,
  AssessAuthorityEvidenceSourceRealignmentInput,
} from './authority-evidence-source-realignment-types.js';

export {
  auditAuthorityWorkspaceSources,
  isKnownStaleWorkspace,
  resolveAuthoritativeWorkspaceId,
} from './authority-workspace-source-auditor.js';

export {
  auditAuthorityRunIdSources,
  resolveAuthoritativeRunId,
} from './authority-runid-source-auditor.js';

export {
  auditAuthorityManifestSources,
  resolveAuthoritativeManifestId,
  extractManifestIdFromDetail,
} from './authority-manifest-source-auditor.js';

export {
  auditAuthorityReportSources,
  resolveNewestReportTimestamp,
} from './authority-report-source-auditor.js';

export {
  detectStaleAuthorities,
  classifyLaunchBlockerFromStaleEvidence,
  computeAuthorityAgreement,
} from './stale-authority-detector.js';

export { planAuthoritySourceRealignment } from './authority-source-realignment-planner.js';

export {
  recordAuthorityEvidenceSourceRealignment,
  getAuthorityEvidenceSourceRealignmentHistory,
  getLatestAuthorityEvidenceSourceRealignment,
  resetAuthorityEvidenceSourceRealignmentHistoryForTests,
} from './authority-evidence-source-realignment-history.js';

export {
  buildAuthorityEvidenceSourceRealignmentReportMarkdown,
  buildAuthorityStaleEvidenceAuditMarkdown,
  buildAuthoritySourceAlignmentValidationMarkdown,
} from './authority-evidence-source-realignment-report-builder.js';

export {
  assessAuthorityEvidenceSourceRealignment,
  applyAuthorityEvidenceSourceRealignmentSync,
  resetAuthorityEvidenceSourceRealignmentCounterForTests,
  resetAuthorityEvidenceSourceRealignmentModuleForTests,
} from './authority-evidence-source-realignment-authority.js';
