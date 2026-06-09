/**
 * DevPulse V2 Phase 17.2 — Workspace Hosting Foundation public API.
 */

import { resetWorkspaceHostingStoreForTests } from './workspace-hosting-store.js';
import { resetWorkspaceHostingDiagnosticsForTests } from './workspace-hosting-diagnostics.js';
import { resetWorkspaceHostingReportCounterForTests } from './workspace-hosting-report-builder.js';
import { resetWorkspaceHostingBootstrapForTests } from './workspace-hosting-registry.js';

export {
  WORKSPACE_HOSTING_FOUNDATION_PASS_TOKEN,
  WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
  DUPLICATE_WORKSPACE_RISK_PREFIX,
  TRACKED_WORKSPACE_CATEGORIES,
  FORBIDDEN_WORKSPACE_HOSTING_DUPLICATES,
  WORKSPACE_HOSTING_QUESTION_SIGNALS,
  isWorkspaceHostingFoundationQuestion,
  isDuplicateWorkspaceHostingExecutorQuestion,
  isValidWorkspaceStateTransition,
  type WorkspaceCategory,
  type WorkspaceState,
  type WorkspaceStatus,
  type WorkspaceVisibility,
  type WorkspaceIsolationMode,
  type WorkspaceLifecycleEventType,
  type WorkspaceReportType,
  type WorkspaceOwnership,
  type WorkspaceProvenance,
  type WorkspaceIsolation,
  type WorkspaceRuntimeLink,
  type WorkspaceProjectLink,
  type WorkspaceVerificationLink,
  type WorkspaceRelationships,
  type WorkspaceMetadata,
  type HostedWorkspace,
  type WorkspaceSession,
  type WorkspaceLifecycleEvent,
  type WorkspaceHistoryEntry,
  type WorkspaceStateHistoryEntry,
  type WorkspaceReport,
  type WorkspaceHostingDiagnostics,
  type WorkspaceValidationResult,
  type RegisterWorkspaceInput,
  type RegisterWorkspaceResult,
  type PrepareWorkspaceHostingFoundationInput,
  type PrepareWorkspaceHostingFoundationResult,
  type DuplicateWorkspaceRiskContext,
} from './workspace-hosting-types.js';

export { resetWorkspaceHostingStoreForTests, nextWorkspaceId, nextWorkspaceSessionId } from './workspace-hosting-store.js';
export { buildWorkspaceOwnership, recordWorkspaceOwnershipHistory } from './workspace-hosting-ownership.js';
export {
  buildDefaultIsolation,
  applyWorkspaceIsolation,
  evaluateIsolationBoundaryRisk,
  getWorkspaceIsolation,
} from './workspace-hosting-isolation.js';
export {
  linkWorkspaceToRuntime,
  getRuntimeForWorkspace,
  detectRuntimeWorkspaceMismatch,
  resolveRuntimeForRegistration,
} from './workspace-hosting-runtime-bridge.js';
export {
  setWorkspaceState,
  getWorkspaceState,
  trackWorkspaceStateHistory,
} from './workspace-hosting-state-manager.js';
export {
  recordWorkspaceLifecycleEvent,
  activateWorkspace,
  isolateWorkspace,
  pauseWorkspace,
  resumeWorkspace,
  completeWorkspace,
  archiveWorkspace,
  failWorkspace,
  listLifecycleEventsForWorkspace,
} from './workspace-hosting-lifecycle.js';
export {
  createWorkspaceSession,
  getWorkspaceSession,
  listWorkspaceSessions,
  trackSessionOwnership,
  trackSessionMetadata,
  resetWorkspaceHostingSessionManagerForTests,
} from './workspace-hosting-session-manager.js';
export {
  getWorkspaceHistory,
  getWorkspaceStateHistoryEntries,
  getWorkspaceOwnershipHistory,
  getWorkspaceRuntimeLinkHistory,
  getWorkspaceProjectHistory,
  getWorkspaceIsolationHistory,
  getWorkspaceLifecycleHistory,
  getWorkspaceSessionHistory,
  recordWorkspaceHistoryEntry,
} from './workspace-hosting-history.js';
export {
  queryWorkspaces,
  listWorkspaces,
  listWorkspacesByProject,
  listWorkspacesByRuntime,
  listWorkspacesByOwner,
  listWorkspacesByType,
  countWorkspacesByState,
  countWorkspaceSessions,
  type WorkspaceQuery,
} from './workspace-hosting-query.js';
export {
  buildDuplicateWorkspaceRiskContext,
  evaluateDuplicateWorkspaceRisk,
  validateWorkspaceRegistration,
  validateHostedWorkspace,
  validateWorkspaceState,
} from './workspace-hosting-validator.js';
export {
  getWorkspaceHostingDiagnostics,
  updateWorkspaceHostingDiagnostics,
  resetWorkspaceHostingDiagnosticsForTests,
  workspaceHostingFoundationKey,
} from './workspace-hosting-diagnostics.js';
export {
  buildWorkspaceInventoryReport,
  buildWorkspaceOwnershipReport,
  buildWorkspaceLifecycleReport,
  buildWorkspaceStateReport,
  buildWorkspaceIsolationReport,
  buildWorkspaceRuntimeLinkReport,
  buildWorkspaceHistoryReport,
  buildWorkspaceDiagnosticsReport,
  buildAllWorkspaceHostingReports,
  composeWorkspaceHostingResponse,
  buildWorkspaceHostingFailureContext,
  nextWorkspaceHostingReportId,
  resetWorkspaceHostingReportCounterForTests,
} from './workspace-hosting-report-builder.js';
export {
  registerWorkspace,
  getWorkspace,
  prepareWorkspaceHostingFoundation,
  processWorkspaceHostingRequest,
  getWorkspaceHostingContext,
  resetWorkspaceHostingBootstrapForTests,
} from './workspace-hosting-registry.js';

export function getDevPulseV2WorkspaceHostingFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_workspace_hosting_foundation',
    passToken: 'WORKSPACE_HOSTING_FOUNDATION_V1_PASS',
    phase: 17.2,
    extensionOnly: true,
  };
}

export function resetWorkspaceHostingFoundationForTests(): void {
  resetWorkspaceHostingStoreForTests();
  resetWorkspaceHostingDiagnosticsForTests();
  resetWorkspaceHostingReportCounterForTests();
  resetWorkspaceHostingBootstrapForTests();
}
