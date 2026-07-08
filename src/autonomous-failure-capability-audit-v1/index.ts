/**
 * Autonomous Failure Diagnosis + Capability Detection Audit V1 — public barrel.
 *
 * AUDIT ONLY. This module inspects real files and reports on existing systems. It does not
 * implement any repair and does not modify generation behavior.
 */

export * from './autonomous-failure-capability-audit-types.js';
export {
  computeProductionReachability,
  auditCandidateSystem,
  auditFailureClassCoverage,
  PRODUCTION_BUILD_ENTRYPOINT,
} from './autonomous-failure-capability-audit.js';
export {
  CANDIDATE_SYSTEMS,
  buildAutonomousFailureCapabilityAuditReport,
  renderAutonomousFailureCapabilityAuditReportMarkdown,
} from './autonomous-failure-capability-report.js';
