/**
 * Real File Workspace Execution — public exports (Phase 24D).
 */

export {
  REAL_FILE_WORKSPACE_EXECUTION_PASS_TOKEN,
  REAL_FILE_WORKSPACE_EXECUTION_OWNER_MODULE,
  FUTURE_MOBILE_PROJECT_PATH_PREFIXES,
  FORBIDDEN_REPO_ROOT_TARGETS,
  GENERATED_BUILDER_WORKSPACES_DIR,
  PHASE_24D_ALLOWED_OPERATIONS,
  PHASE_24D_BLOCKED_OPERATIONS,
} from './real-file-workspace-execution-bounds.js';

export type {
  RealFileWorkspacePathResult,
  RealFileWorkspacePathVerdict,
} from './real-file-workspace-path-authority.js';

export {
  isForbiddenRepositoryWriteTarget,
  resolveSafeAbsolutePath,
  resolveSafeWorkspaceRoot,
  validateRelativePathInWorkspace,
} from './real-file-workspace-path-authority.js';

export type {
  RealFileBlockedOperationType,
  RealFileOperation,
  RealFileOperationResult,
  RealFileOperationType,
} from './real-file-operation-model.js';

export {
  attachRealFileOperationResult,
  createRealFileOperation,
  isRealFileOperationAllowed,
  isRealFileOperationBlocked,
  nextRealFileOperationId,
  resetRealFileOperationCounterForTests,
} from './real-file-operation-model.js';

export type {
  RealFileEvidenceType,
  RealFileExecutionEvidenceRecord,
} from './real-file-execution-evidence.js';

export {
  getRealFileExecutionEvidenceCount,
  listRealFileExecutionEvidence,
  recordRealFileExecutionEvidence,
  resetRealFileExecutionEvidenceForTests,
} from './real-file-execution-evidence.js';

export type {
  RealFileWorkspaceExecutionSession,
  RealFileWorkspaceExecutionSessionState,
} from './real-file-workspace-execution-session.js';

export {
  createRealFileWorkspaceExecutionSession,
  getRealFileWorkspaceExecutionSession,
  getRealFileWorkspaceExecutionSessionCount,
  listRealFileWorkspaceExecutionSessions,
  resetRealFileWorkspaceExecutionSessionsForTests,
  updateRealFileWorkspaceExecutionSession,
} from './real-file-workspace-execution-session.js';

export {
  executeRealFileOperation,
  readRealFileInWorkspace,
} from './real-file-operation-executor.js';

export {
  isControlledActionBridgeBlocked,
  listBridgeableControlledActionTypes,
  mapControlledActionToRealFileOperation,
} from './controlled-to-real-file-execution-bridge.js';

export type {
  RealFileWorkspaceExecutionAssessment,
  RunRealFileWorkspaceExecutionInput,
} from './real-file-workspace-execution-authority.js';

export {
  assessRealFileWorkspaceExecution,
  createBlockedOperationProbe,
  isRealFileWorkspaceExecutionActive,
  readBoundedGeneratedWorkspaceListing,
  resetRealFileWorkspaceExecutionForTests,
  runRealFileWorkspaceExecution,
  verifyRealFileExists,
} from './real-file-workspace-execution-authority.js';

export type { RealFileWorkspaceExecutionSummary } from './real-file-workspace-execution-proof-integration.js';

export {
  collectRealFileWorkspaceExecutionEvidenceLines,
  getRealFileWorkspaceExecutionSummary,
  integrateRealFileWorkspaceExecutionWithRealityReporting,
} from './real-file-workspace-execution-proof-integration.js';
