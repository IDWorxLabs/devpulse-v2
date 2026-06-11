/**
 * Controlled Builder Execution Engine — public exports (Phase 24C).
 */

export {
  CONTROLLED_BUILDER_EXECUTION_ENGINE_PASS_TOKEN,
  CONTROLLED_BUILDER_EXECUTION_ENGINE_OWNER_MODULE,
  FUTURE_MOBILE_BUILD_SESSION_TYPES,
  MAX_AUDIT_TRAIL_RECORDS,
  MAX_EXECUTION_SESSIONS,
  PHASE_24C_ALLOWED_ACTION_TYPES,
  PHASE_24C_BLOCKED_ACTION_TYPES,
} from './controlled-builder-execution-engine-bounds.js';

export type {
  BuilderExecutionSession,
  BuilderExecutionSessionState,
} from './builder-execution-session.js';

export {
  createBuilderExecutionSession,
  getBuilderExecutionSession,
  getBuilderExecutionSessionCount,
  listBuilderExecutionSessions,
  resetBuilderExecutionSessionsForTests,
  updateBuilderExecutionSession,
} from './builder-execution-session.js';

export type {
  WorkspaceIsolationResult,
  WorkspaceIsolationVerdict,
} from './workspace-isolation-authority.js';

export { verifyWorkspaceIsolation } from './workspace-isolation-authority.js';

export type {
  ControlledExecutionEvidenceType,
  ControlledExecutionEvidenceRecord,
} from './builder-execution-evidence-collector.js';

export {
  actionCompletionRequiresEvidence,
  collectControlledExecutionEvidence,
  getControlledExecutionEvidenceCount,
  listControlledExecutionEvidence,
  resetControlledExecutionEvidenceForTests,
} from './builder-execution-evidence-collector.js';

export type {
  BuilderExecutionAuditEntry,
  BuilderExecutionAuditEventType,
} from './builder-execution-audit-trail.js';

export {
  getBuilderExecutionAuditCount,
  getBuilderExecutionAuditTrail,
  recordBuilderExecutionAudit,
  resetBuilderExecutionAuditTrailForTests,
} from './builder-execution-audit-trail.js';

export type { ActionExecutionOutcome } from './builder-action-executor.js';

export {
  executeApprovedBuilderAction,
  getVirtualWorkspaceFileCount,
  isPhase24CActionAllowed,
  isPhase24CActionBlocked,
  listVirtualWorkspaceFiles,
  resetVirtualWorkspaceFilesForTests,
} from './builder-action-executor.js';

export type {
  ExecutionSessionRunResult,
  StartExecutionSessionInput,
} from './builder-execution-controller.js';

export {
  cancelBuilderExecutionSession,
  collectSessionEvidence,
  createControlledExecutionSession,
  pauseBuilderExecutionSession,
  resumeBuilderExecutionSession,
  startBuilderExecutionSession,
} from './builder-execution-controller.js';

export type {
  ControlledBuilderExecutionAssessment,
  ControlledExecutionReadiness,
  RunControlledBuilderExecutionInput,
} from './controlled-builder-execution-authority.js';

export {
  assessControlledBuilderExecution,
  isControlledBuilderExecutionConnected,
  resetControlledBuilderExecutionEngineForTests,
  resolveExecutionPlanId,
  runControlledBuilderExecution,
} from './controlled-builder-execution-authority.js';

export type { ControlledBuilderExecutionSummary } from './controlled-builder-execution-proof-integration.js';

export {
  collectControlledBuilderExecutionEvidenceLines,
  getControlledBuilderExecutionSummary,
  integrateControlledBuilderExecutionWithRealityReporting,
} from './controlled-builder-execution-proof-integration.js';
