/**
 * AiDevEngine Capability Audit V2 — public API.
 */

export {
  AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS_TOKEN,
  CAPABILITY_AUDIT_V2_REPORT_TITLE,
  AUDIT_CATEGORIES_V2,
  CAPABILITY_INVENTORY_V2,
  NEW_V2_CAPABILITIES,
  WORLD2_MODULE_CAPABILITIES,
  PRIOR_PASS_TOKENS,
  buildCapabilityAuditV2Assessment,
  HIGH_DUPLICATE_RISK_REMEDIATIONS,
} from './capability-inventory.js';

export { buildDuplicateRiskAnalysis, NEW_OVERLAPS_SINCE_V1 } from './duplicate-risk-analysis.js';

export {
  buildMissingCapabilitiesReport,
  MISSING_CAPABILITIES_V2,
} from './missing-capabilities.js';

export {
  buildRecommendedRoadmap,
  RECOMMENDED_ROADMAP_V2,
} from './recommended-roadmap.js';

export { buildMaturityMatrix, buildMaturitySummary } from './maturity-matrix-builder.js';

export { buildCapabilityAuditV2ReportMarkdown } from './capability-audit-report-builder.js';

export type {
  CapabilityMaturityStatus,
  DuplicateRisk,
  CapabilityRecommendation,
  AuditCategoryId,
  CapabilityEntryV2,
  MaturityMatrixEntry,
  DuplicateRiskEntry,
  DuplicateRiskAnalysis,
  MissingCapabilityEntry,
  MissingCapabilitiesReport,
  RoadmapPriority,
  World2Assessment,
  CapabilityAuditV2Assessment,
} from './capability-audit-types.js';
