/**
 * Phase 27.00 — Authority Reality Convergence (V1).
 */

export {
  AUTHORITY_REALITY_CONVERGENCE_PASS,
  AUTHORITY_REALITY_CONVERGENCE_PHASE,
  AUTHORITY_REALITY_CONVERGENCE_CORE_QUESTION,
  CONVERGENCE_RULES,
  LAUNCH_CRITICAL_AUTHORITY_TARGETS,
  LAUNCH_CRITICAL_DISPLAY_NAMES,
  AUTHORITY_DISAGREEMENT_PATTERNS,
  STALE_CONSUMER_REPORT_PATTERNS,
  CONVERGENCE_INTEGRATION_TARGETS,
} from './authority-reality-convergence-registry.js';

export type {
  RealityConsumerKind,
  RealityDivergenceLaunchImpact,
  AuthoritativeRealitySource,
  RealityAuditFinding,
  LaunchCriticalAuthorityTrace,
  AuthorityRealityDivergence,
  AuthorityRealityConvergenceReconciliation,
  AuthorityRealityConvergenceReport,
  AuthorityRealityConvergenceAssessment,
  AssessAuthorityRealityConvergenceInput,
} from './authority-reality-convergence-types.js';

export {
  assessAuthorityRealityConvergence,
  applyAuthorityRealityConvergenceSync,
  resetAuthorityRealityConvergenceModuleForTests,
  resetAuthorityRealityConvergenceCounterForTests,
} from './authority-reality-convergence-authority.js';

export { auditAuthoritativeWorkspace } from './authoritative-workspace-auditor.js';
export { auditAuthoritativeRunId } from './authoritative-runid-auditor.js';
export { auditAuthoritativeManifest } from './authoritative-manifest-auditor.js';
export { auditProofTimestamps } from './proof-timestamp-auditor.js';
export { auditVerdictDivergence } from './verdict-divergence-auditor.js';
export {
  traceLaunchCriticalAuthorities,
  computeLaunchCriticalAlignment,
} from './launch-critical-authority-tracer.js';
export {
  detectStaleConsumers,
  detectCachedVerdictConsumers,
  detectStaleReportConsumers,
  detectStaleProofConsumers,
  isStaleConsumerReportSource,
} from './stale-consumer-detector.js';
export { reconcileAuthorityReality } from './authority-reality-convergence-reconciliation.js';

export {
  buildAuthorityRealityConvergenceReportMarkdown,
  buildAuthorityRealityConvergenceAuditMarkdown,
  buildAuthorityRealityConvergenceValidationMarkdown,
} from './convergence-report-builder.js';

export {
  recordAuthorityRealityConvergenceReport,
  resetAuthorityRealityConvergenceHistoryForTests,
  getAuthorityRealityConvergenceHistorySize,
  getAuthorityRealityConvergenceHistory,
} from './authority-reality-convergence-history.js';
