/**
 * Connected Workspace Creation — public API.
 */

export {
  CONNECTED_WORKSPACE_CREATION_PASS_TOKEN,
  CONNECTED_WORKSPACE_CREATION_OWNER_MODULE,
  CONNECTED_WORKSPACE_CREATION_PHASE,
  CONNECTED_WORKSPACE_CREATION_REPORT_TITLE,
  CONNECTED_WORKSPACE_CREATION_CACHE_KEY_PREFIX,
  CONNECTED_WORKSPACE_CREATION_CORE_QUESTION,
  MAX_CONNECTED_WORKSPACE_CREATION_HISTORY,
  MAX_CREATION_WARNINGS,
  MAX_CREATION_BLOCKERS,
  MAX_RECOMMENDED_ACTIONS,
  WORKSPACE_CREATION_STATES,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  WORKSPACE_CREATION_SAFETY_GUARANTEES,
  WORLD2_DISPOSABLE_LOGICAL_ROOT_PREFIX,
  VALIDATION_WORKSPACE_ID_PREFIX,
  isWorkspaceCreationState,
  resolveLogicalDisposableRoot,
} from './connected-workspace-creation-registry.js';

export type {
  WorkspaceCreationState,
  WorkspaceCreationMode,
  WorkspaceCreationArtifact,
  WorkspaceCreationEvidenceEntry,
  WorkspaceCreationFilesystemEvidence,
  WorkspaceCreationContract,
  WorkspaceCreationQuestionAnswers,
  ConnectedWorkspaceCreationInputSnapshot,
  ConnectedWorkspaceCreationReport,
  ConnectedWorkspaceCreationAssessment,
  AssessConnectedWorkspaceCreationInput,
  ConnectedWorkspaceCreationHistoryEntry,
  ConnectedWorkspaceCreationHistorySummary,
  ConnectedWorkspaceCreationArtifacts,
  ExecuteWorkspaceCreationInput,
  ExecuteWorkspaceCreationResult,
} from './connected-workspace-creation-types.js';

export {
  resetConnectedWorkspaceCreationHistoryForTests,
  recordConnectedWorkspaceCreationAssessment,
  getConnectedWorkspaceCreationHistorySize,
  getLatestConnectedWorkspaceCreationHistoryEntry,
  getLatestConnectedWorkspaceCreationAssessment,
  getConnectedWorkspaceCreationHistory,
  countWorkspaceCreationState,
  buildConnectedWorkspaceCreationHistorySummary,
} from './connected-workspace-creation-history.js';

export {
  assessConnectedWorkspaceCreation,
  buildConnectedWorkspaceCreationArtifacts,
  deriveWorkspaceCreationQuestionAnswers,
  deriveWorkspaceCreationScore,
  deriveWorkspaceCreationState,
  resetConnectedWorkspaceCreationCounterForTests,
  resetConnectedWorkspaceCreationModuleForTests,
} from './connected-workspace-creation-authority.js';

export {
  executeWorkspaceCreation,
  inspectWorkspaceFilesystem,
  cleanupDisposableWorkspace,
  mapLogicalPathToRelative,
  resetWorkspaceCreationExecutorForTests,
} from './workspace-creation-executor.js';

export { buildConnectedWorkspaceCreationReportMarkdown } from './connected-workspace-creation-report-builder.js';
