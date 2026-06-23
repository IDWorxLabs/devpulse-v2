/**
 * AiDevEngine Capability Audit V1 — public API.
 */

export {
  AIDEVENGINE_CAPABILITY_AUDIT_V1_PASS_TOKEN,
  CAPABILITY_AUDIT_REPORT_TITLE,
  AUDIT_CATEGORIES,
  CAPABILITY_INVENTORY,
  PROPOSED_AUTHORITY_OVERLAPS,
  MISSING_CAPABILITIES,
  ROADMAP_PRIORITIES,
  buildCapabilityAuditAssessment,
} from './capability-inventory.js';

export {
  HIGH_DUPLICATE_RISK_REMEDIATIONS,
  listHighDuplicateRiskRemediations,
} from './high-duplicate-risk-remediations.js';

export { validateHighDuplicateRiskRemediations } from './high-duplicate-risk-remediation-validator.js';

export { buildCapabilityAuditReportMarkdown } from './capability-audit-report-builder.js';

export type {
  CapabilityStatus,
  DuplicateRisk,
  CapabilityRecommendation,
  AuditCategoryId,
  CapabilityEntry,
  ProposedAuthorityOverlap,
  HighDuplicateRiskRemediation,
  CapabilityAuditAssessment,
} from './capability-audit-types.js';

export type { HighDuplicateRiskRemediationValidation } from './high-duplicate-risk-remediation-validator.js';
