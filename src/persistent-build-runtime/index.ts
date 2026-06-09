/**
 * DevPulse V2 Phase 17.3 — Persistent Build Runtime Foundation public API.
 */

import { resetPersistentBuildStoreForTests } from './persistent-build-store.js';
import { resetPersistentBuildDiagnosticsForTests } from './persistent-build-diagnostics.js';
import { resetPersistentBuildReportCounterForTests } from './persistent-build-report-builder.js';
import { resetPersistentBuildBootstrapForTests } from './persistent-build-registry.js';
import { resetPersistentBuildSessionManagerForTests } from './persistent-build-session-manager.js';

export {
  PERSISTENT_BUILD_RUNTIME_FOUNDATION_PASS_TOKEN,
  PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_PERSISTENT_BUILD_RISK_PREFIX,
  TRACKED_PERSISTENT_BUILD_CATEGORIES,
  FORBIDDEN_PERSISTENT_BUILD_DUPLICATES,
  PERSISTENT_BUILD_QUESTION_SIGNALS,
  isPersistentBuildRuntimeFoundationQuestion,
  isDuplicatePersistentBuildExecutorQuestion,
  isValidPersistentBuildStateTransition,
  type PersistentBuildCategory,
  type PersistentBuildState,
  type PersistentBuildStatus,
  type PersistentBuildVisibility,
  type PersistentBuildLifecycleEventType,
  type PersistentBuildReportType,
  type PersistentBuildOwnership,
  type PersistentBuildProvenance,
  type PersistentBuildContext,
  type PersistentBuildProgress,
  type PersistentBuildResumeState,
  type PersistentBuildCloudRuntimeLink,
  type PersistentBuildWorkspaceLink,
  type PersistentBuildProjectLink,
  type PersistentBuildVerificationLink,
  type PersistentBuildRelationships,
  type PersistentBuildMetadata,
  type PersistentBuild,
  type PersistentBuildSession,
  type PersistentBuildLifecycleEvent,
  type PersistentBuildHistoryEntry,
  type PersistentBuildStateHistoryEntry,
  type PersistentBuildReport,
  type PersistentBuildDiagnostics,
  type PersistentBuildValidationResult,
  type RegisterPersistentBuildInput,
  type RegisterPersistentBuildResult,
  type PreparePersistentBuildFoundationInput,
  type PreparePersistentBuildFoundationResult,
  type DuplicatePersistentBuildRiskContext,
} from './persistent-build-types.js';

export { resetPersistentBuildStoreForTests, nextBuildId, nextBuildSessionId } from './persistent-build-store.js';
export { buildPersistentBuildOwnership, recordBuildOwnershipHistory } from './persistent-build-ownership.js';
export {
  buildDefaultBuildContext,
  updateBuildContext,
  validateBuildContext,
  getBuildContext,
} from './persistent-build-context.js';
export {
  buildInitialBuildProgress,
  updateBuildProgress,
  validateProgressPercent,
  getBuildProgress,
} from './persistent-build-progress.js';
export {
  buildInitialResumeState,
  markResumeCheckpoint,
  validateResumeMetadata,
  getBuildResumeState,
} from './persistent-build-resume.js';
export {
  linkBuildToRuntime,
  getRuntimeForBuild,
  listBuildsByRuntime,
  detectBuildRuntimeMismatch,
} from './persistent-build-cloud-bridge.js';
export {
  linkBuildToWorkspace,
  getWorkspaceForBuild,
  listBuildsByWorkspace,
  detectBuildWorkspaceMismatch,
} from './persistent-build-workspace-bridge.js';
export {
  setPersistentBuildState,
  getPersistentBuildState,
  trackPersistentBuildStateHistory,
} from './persistent-build-state-manager.js';
export {
  recordPersistentBuildLifecycleEvent,
  activatePersistentBuild,
  pausePersistentBuild,
  resumePersistentBuild,
  waitForApproval,
  waitForVerification,
  waitForRecovery,
  completePersistentBuild,
  archivePersistentBuild,
  failPersistentBuild,
  listLifecycleEventsForBuild,
} from './persistent-build-lifecycle.js';
export {
  createPersistentBuildSession,
  getPersistentBuildSession,
  listPersistentBuildSessions,
  trackSessionOwnership,
  trackSessionMetadata,
  resetPersistentBuildSessionManagerForTests,
} from './persistent-build-session-manager.js';
export {
  getPersistentBuildHistory,
  getBuildRuntimeLinkHistory,
  getBuildWorkspaceLinkHistory,
  getBuildProjectHistory,
  getBuildProgressHistory,
  getBuildContextHistory,
  getBuildResumeHistory,
  getBuildLifecycleHistory,
  listBuildHistoryConsumers,
  recordPersistentBuildHistoryEntry,
} from './persistent-build-history.js';
export {
  queryPersistentBuilds,
  listPersistentBuilds,
  listPersistentBuildsByProject,
  listPersistentBuildsByWorkspace,
  listPersistentBuildsByRuntime,
  listPersistentBuildsByOwner,
  listPersistentBuildsByType,
  countBuildsByState,
  countBuildSessions,
  type PersistentBuildQuery,
} from './persistent-build-query.js';
export {
  buildDuplicatePersistentBuildRiskContext,
  evaluateDuplicatePersistentBuildRisk,
  validatePersistentBuildRegistration,
  validatePersistentBuildRecord,
  validatePersistentBuildState,
} from './persistent-build-validator.js';
export {
  getPersistentBuildDiagnostics,
  updatePersistentBuildDiagnostics,
  resetPersistentBuildDiagnosticsForTests,
  persistentBuildRuntimeFoundationKey,
} from './persistent-build-diagnostics.js';
export {
  buildPersistentBuildInventoryReport,
  buildPersistentBuildOwnershipReport,
  buildPersistentBuildLifecycleReport,
  buildPersistentBuildStateReport,
  buildPersistentBuildProgressReport,
  buildPersistentBuildContextReport,
  buildPersistentBuildResumeReport,
  buildPersistentBuildCloudLinkReport,
  buildPersistentBuildWorkspaceLinkReport,
  buildPersistentBuildHistoryReport,
  buildPersistentBuildDiagnosticsReport,
  buildAllPersistentBuildReports,
  composePersistentBuildResponse,
  buildPersistentBuildFailureContext,
  nextPersistentBuildReportId,
  resetPersistentBuildReportCounterForTests,
} from './persistent-build-report-builder.js';
export {
  registerPersistentBuild,
  getPersistentBuild,
  preparePersistentBuildFoundation,
  processPersistentBuildRequest,
  getPersistentBuildContext,
  resetPersistentBuildBootstrapForTests,
} from './persistent-build-registry.js';

export function getDevPulseV2PersistentBuildRuntimeFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_persistent_build_runtime_foundation',
    passToken: 'PERSISTENT_BUILD_RUNTIME_FOUNDATION_V1_PASS',
    phase: 17.3,
    extensionOnly: true,
  };
}

export function resetPersistentBuildFoundationForTests(): void {
  resetPersistentBuildStoreForTests();
  resetPersistentBuildDiagnosticsForTests();
  resetPersistentBuildReportCounterForTests();
  resetPersistentBuildBootstrapForTests();
  resetPersistentBuildSessionManagerForTests();
}
