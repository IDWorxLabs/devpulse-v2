/**
 * AiDevEngine Capability Audit V3 — public API.
 */

export {
  AIDEVENGINE_CAPABILITY_AUDIT_V3_PASS_TOKEN,
  AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS_TOKEN,
  CAPABILITY_AUDIT_V3_REPORT_TITLE,
  AUDIT_CATEGORIES_V3,
  CAPABILITY_INVENTORY_V3,
  NEW_V3_CAPABILITIES,
  PRODUCTION_READINESS_CAPABILITIES,
  REQUIRED_INVENTORY_V3,
  PRIOR_PASS_TOKENS,
  buildCapabilityAuditV3Assessment,
  buildCategoryAssessments,
  HIGH_DUPLICATE_RISK_REMEDIATIONS,
} from './capability-inventory.js';

export { buildDuplicateRiskAnalysis, NEW_OVERLAPS_SINCE_V2 } from './duplicate-risk-analysis.js';

export {
  buildMissingCapabilitiesReport,
  MISSING_CAPABILITIES_V3,
} from './missing-capabilities.js';

export {
  buildRecommendedRoadmap,
  RECOMMENDED_ROADMAP_V3,
} from './recommended-roadmap.js';

export { buildMaturityMatrix, buildMaturitySummary } from './maturity-matrix-builder.js';

export { buildOperationalMaturityReport } from './operational-maturity.js';

export {
  loadUvlEvidenceSnapshot,
  loadAuditEvidenceSnapshot,
  buildUvlEvidenceRefreshArtifact,
  buildUvlEvidenceRefreshFromSnapshot,
  buildCoverageEvidenceFromSnapshot,
} from './uvl-evidence-loader.js';

export { buildProductionReadinessAssessment } from './production-readiness-assessment.js';

export { buildCodeGenerationAssessment } from './code-generation-assessment.js';

export { buildCapabilityAuditV3ReportMarkdown } from './capability-audit-report-builder.js';

export type {
  CapabilityMaturityStatus,
  DuplicateRisk,
  CapabilityRecommendation,
  AuditCategoryId,
  CapabilityEntryV3,
  CategoryAssessment,
  MaturityMatrixEntry,
  DuplicateRiskEntry,
  DuplicateRiskAnalysis,
  MissingCapabilityEntry,
  MissingCapabilitiesReport,
  RoadmapPriority,
  CoverageMetric,
  CoverageEvidence,
  UvlEvidenceRefresh,
  PipelineStageAssessment,
  OperationalMaturityReport,
  ProductionReadinessDimension,
  ProductionReadinessAssessment,
  CodeGenerationAssessment,
  World2Assessment,
  CapabilityAuditV3Assessment,
} from './capability-audit-types.js';
