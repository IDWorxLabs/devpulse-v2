/**
 * App Generation Readiness Audit V1 — public API.
 *
 * Read-only audit of the AiDevEngine V4 app-generation pipeline. This package does not import
 * from, call, or mutate any generation-pipeline module (orchestrator, bridge, materialization
 * engine, module resolver, faithfulness engines, live preview). It only reads the filesystem to
 * confirm cited evidence files exist, and returns/writes a deterministic report.
 */

export type {
  AppGenerationReadinessAuditAssessment,
  EvidenceCitation,
  Finding,
  FindingCategory,
  FixSequenceStep,
  MissingAuthority,
  PipelineStageEvidence,
  PipelineStageId,
  RiskRankEntry,
  StateStoreEntry,
} from './app-generation-readiness-audit-types.js';

export {
  APP_GENERATION_READINESS_AUDIT_V1_ARTIFACT_DIR,
  APP_GENERATION_READINESS_AUDIT_V1_PASS_TOKEN,
  APP_GENERATION_READINESS_AUDIT_V1_REPORT_FILENAME,
  CURRENT_PROMPT_EVIDENCE_SOURCES,
  FIX_SEQUENCE,
  FINDINGS,
  MISSING_AUTHORITIES,
  PIPELINE_STAGES,
  PREVIOUS_PROJECT_EVIDENCE_SOURCES,
  RISK_RANKING,
  STATE_OWNERSHIP_MAP,
  runAppGenerationReadinessAuditV1,
} from './app-generation-readiness-audit.js';

export { buildAppGenerationReadinessAuditReportMarkdown } from './app-generation-readiness-report.js';
