/**
 * Autonomous Builder Execution Foundation — public exports (Phase 24B).
 */

export {
  AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_PASS_TOKEN,
  AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_EXECUTION_TARGET,
  MAX_ACTION_QUEUE_SIZE,
  MAX_EXECUTION_EVIDENCE,
  MAX_EXECUTION_PLANS,
  MAX_EXECUTION_WORKSPACES,
  MAX_QUEUE_AUDIT_ENTRIES,
  WORLD2_ISOLATION_RULE,
} from './autonomous-builder-execution-foundation-bounds.js';

export type {
  BuilderExecutionState,
  BuilderExecutionWorkspace,
} from './builder-execution-workspace.js';

export {
  assertIsolatedExecutionTarget,
  createBuilderExecutionWorkspace,
  getBuilderExecutionWorkspace,
  getBuilderExecutionWorkspaceCount,
  listBuilderExecutionWorkspaces,
  resetBuilderExecutionWorkspacesForTests,
  updateBuilderExecutionWorkspace,
  WORLD2_ISOLATION_NOTE,
} from './builder-execution-workspace.js';

export type {
  BuilderAction,
  BuilderActionExecutionResult,
  BuilderActionStatus,
  BuilderActionType,
} from './builder-action-model.js';

export {
  attachActionEvidence,
  createBuilderAction,
  markActionResult,
  nextBuilderActionId,
  resetBuilderActionCounterForTests,
} from './builder-action-model.js';

export type {
  BuilderEvidenceType,
  BuilderExecutionEvidenceRecord,
  FutureMobileRuntimeEvidenceType,
} from './builder-execution-evidence.js';

export {
  FUTURE_MOBILE_RUNTIME_EVIDENCE_TYPES,
  actionSuccessRequiresEvidence,
  getBuilderExecutionEvidenceCount,
  listBuilderExecutionEvidence,
  recordBuilderExecutionEvidence,
  resetBuilderExecutionEvidenceForTests,
} from './builder-execution-evidence.js';

export type {
  BuildExecutionPlanInput,
  ExecutionPlan,
  ExecutionPlanStep,
} from './builder-execution-plan-authority.js';

export {
  buildExecutionPlan,
  getExecutionPlan,
  getExecutionPlanCount,
  listExecutionPlans,
  resetBuilderExecutionPlansForTests,
} from './builder-execution-plan-authority.js';

export type { BuilderQueueAuditEntry, QueueAuditEventType } from './builder-action-queue.js';

export {
  cancelBuilderAction,
  dequeueBuilderAction,
  enqueueBuilderAction,
  getBuilderActionQueueSize,
  getBuilderQueueAuditCount,
  getBuilderQueueAuditTrail,
  isBuilderActionQueuePaused,
  listQueuedBuilderActions,
  pauseBuilderActionQueue,
  replayBuilderAction,
  resetBuilderActionQueueForTests,
  resumeBuilderActionQueue,
} from './builder-action-queue.js';

export type { BuilderExecutionFoundationSummary } from './builder-execution-proof-integration.js';

export {
  collectBuilderExecutionFoundationEvidenceLines,
  getBuilderExecutionFoundationSummary,
  integrateBuilderExecutionFoundationWithRealityReporting,
} from './builder-execution-proof-integration.js';

export type {
  BuilderExecutionFoundationAssessment,
  PrepareBuilderExecutionFoundationInput,
} from './builder-execution-foundation-authority.js';

export {
  assessBuilderExecutionFoundation,
  prepareBuilderExecutionFoundation,
  resetBuilderExecutionFoundationForTests,
} from './builder-execution-foundation-authority.js';
