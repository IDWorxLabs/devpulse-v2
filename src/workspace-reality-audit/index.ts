/**
 * Workspace Reality Audit V1 — public API.
 */

export {
  WORKSPACE_REALITY_AUDIT_V1_PASS_TOKEN,
  WORKSPACE_REALITY_AUDIT_FILENAME,
  WORKSPACE_REALITY_AUDIT_REPORT_MD,
  WORKSPACE_REALITY_AUDIT_WORKSPACE_FILENAME,
  type WorkspaceRealityAuditStatus,
  type WorkspaceRealityDimensionId,
  type WorkspaceRealityDimensionResult,
  type WorkspaceRealityAuditResult,
  type WorkspaceRealityAuditEvidence,
  type WorkspaceRealityAuditRecordingResult,
} from './workspace-reality-audit-types.js';

export { resolveAuditSourceRoot, auditSourceTreeReality } from './workspace-reality-source-scanner.js';
export { auditImportGraphReality } from './workspace-import-graph-checker.js';
export { auditRouteGraphReality, parseFeatureRegistry, type RegistryEntry } from './workspace-route-graph-checker.js';
export { auditRegistryConsistency } from './workspace-registry-consistency-checker.js';
export { auditContractUsage } from './workspace-contract-usage-checker.js';
export { auditAssetReality } from './workspace-asset-checker.js';
export { auditMetadataConsistency } from './workspace-metadata-consistency-checker.js';
export { auditOrphanAndLeakage } from './workspace-orphan-file-detector.js';
export { auditExportSafety } from './workspace-export-safety-checker.js';
export {
  buildWorkspaceRealityAuditReport,
  buildWorkspaceRealityAuditChatSummary,
  buildWorkspaceRealityAuditMarkdown,
} from './workspace-reality-audit-report.js';
export { recordWorkspaceRealityAudit } from './workspace-reality-audit-recorder.js';
export { applyWorkspaceRealityAuditToManifest } from './workspace-reality-audit-manifest.js';
export {
  buildWorkspaceRealityAuditTraceEvents,
  workspaceRealityAuditTraceTitles,
} from './workspace-reality-audit-trace-events.js';
