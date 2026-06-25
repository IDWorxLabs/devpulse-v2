/**
 * Project Isolation Guard V1 — multi-project data boundary enforcement.
 */

export {
  PROJECT_ISOLATION_GUARD_PASS_TOKEN,
  type ProjectIsolationVerdict,
  type ProjectIsolationDomain,
  type ProjectIsolationScope,
  type ProjectIdentityRecord,
  type ProjectIsolationViolation,
  type ProjectIsolationCheckResult,
  type ProjectScopedRecord,
  type OperatorFeedEventIsolation,
  type ProjectNotificationRecord,
} from './project-isolation-guard-types.js';

export {
  filterRecordsByProjectId,
  detectCrossProjectLeaks,
  assertNoCrossProjectLeaks,
  workspacePathForProject,
  workspacePathBelongsToProject,
  filterChatMessagesByProject,
  filterPlansByProject,
  filterMemoryByProject,
  filterBuildRunsByProject,
  filterWorkspacesByProject,
  filterLivePreviewsByProject,
  filterFounderTestReportsByProject,
  filterValidationReportsByProject,
  filterOperatorEventsByProject,
  filterNotificationsByProject,
  filterInsightsByProject,
  filterRuntimeStateByProject,
  isGlobalScopedRecord,
} from './project-isolation-read-filter.js';

export {
  ProjectIsolationWriteError,
  requireProjectIdForWrite,
  assertRecordProjectId,
  assertWorkspacePathBelongsToProject,
  assertBuildRunProjectMatch,
  assertPreviewProjectMatch,
} from './project-isolation-write-guard.js';

export {
  resolveProjectIdentity,
  listProjectIdentities,
} from './project-isolation-identity.js';

export {
  assessProjectIsolationForViewer,
  isolationBlocksCrossProjectAccess,
  assertProjectIsolation,
} from './project-isolation-guard-assessor.js';

export {
  tagOperatorFeedEventWithProjectId,
  toOperatorFeedEventIsolation,
  createProjectNotification,
  composeProjectIsolationGuardPayload,
} from './project-isolation-guard-response.js';
