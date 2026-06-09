/**
 * DevPulse V2 Phase 17.1 — Cloud Runtime Foundation public API.
 */

import { resetCloudRuntimeStoreForTests } from './cloud-runtime-store.js';
import { resetCloudRuntimeDiagnosticsForTests } from './cloud-runtime-diagnostics.js';
import { resetCloudRuntimeReportCounterForTests } from './cloud-runtime-report-builder.js';
import { resetCloudRuntimeBootstrapForTests } from './cloud-runtime-registry.js';

export {
  CLOUD_RUNTIME_FOUNDATION_PASS_TOKEN,
  CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_RUNTIME_RISK_PREFIX,
  TRACKED_CLOUD_RUNTIME_CATEGORIES,
  FORBIDDEN_CLOUD_RUNTIME_DUPLICATES,
  CLOUD_RUNTIME_QUESTION_SIGNALS,
  isCloudRuntimeFoundationQuestion,
  isDuplicateCloudRuntimeExecutorQuestion,
  isValidCloudRuntimeStateTransition,
  type CloudRuntimeCategory,
  type CloudRuntimeState,
  type CloudRuntimeStatus,
  type CloudRuntimeVisibility,
  type CloudRuntimeLifecycleEventType,
  type CloudRuntimeReportType,
  type CloudRuntimeOwnership,
  type CloudRuntimeProvenance,
  type CloudRuntimeRelationships,
  type CloudRuntimeMetadata,
  type CloudRuntime,
  type CloudRuntimeSession,
  type CloudRuntimeLifecycleEvent,
  type CloudRuntimeHistoryEntry,
  type CloudRuntimeStateHistoryEntry,
  type CloudRuntimeReport,
  type CloudRuntimeDiagnostics,
  type CloudRuntimeValidationResult,
  type RegisterRuntimeInput,
  type RegisterRuntimeResult,
  type PrepareCloudRuntimeFoundationInput,
  type PrepareCloudRuntimeFoundationResult,
  type DuplicateRuntimeRiskContext,
} from './cloud-runtime-types.js';

export { resetCloudRuntimeStoreForTests, nextRuntimeId, nextSessionId } from './cloud-runtime-store.js';
export { buildRuntimeOwnership, recordOwnershipHistory } from './cloud-runtime-ownership.js';
export {
  setRuntimeState,
  getRuntimeState,
  trackRuntimeStateHistory,
} from './cloud-runtime-state-manager.js';
export {
  recordLifecycleEvent,
  activateRuntime,
  pauseRuntime,
  resumeRuntime,
  completeRuntime,
  archiveRuntime,
  failRuntime,
  listLifecycleEventsForRuntime,
} from './cloud-runtime-lifecycle.js';
export {
  createRuntimeSession,
  getRuntimeSession,
  listRuntimeSessions,
  trackSessionOwnership,
  trackSessionMetadata,
  resetCloudRuntimeSessionManagerForTests,
} from './cloud-runtime-session-manager.js';
export {
  getRuntimeHistory,
  getStateHistory,
  getOwnershipHistory,
  getWorkspaceHistory,
  getProjectHistory,
  getLifecycleHistory,
  getSessionHistory,
  listHistoryConsumers,
  listScopeUsage,
  recordHistoryEntry,
} from './cloud-runtime-history.js';
export {
  queryRuntimes,
  listRuntimes,
  listRuntimesByProject,
  listRuntimesByWorkspace,
  listRuntimesByOwner,
  listRuntimesByType,
  countRuntimesByState,
  countSessions,
  type CloudRuntimeQuery,
} from './cloud-runtime-query.js';
export {
  buildDuplicateRuntimeRiskContext,
  evaluateDuplicateRuntimeRisk,
  validateRuntimeRegistration,
  validateCloudRuntime,
  validateRuntimeState,
} from './cloud-runtime-validator.js';
export {
  getCloudRuntimeDiagnostics,
  updateCloudRuntimeDiagnostics,
  resetCloudRuntimeDiagnosticsForTests,
  cloudRuntimeFoundationKey,
} from './cloud-runtime-diagnostics.js';
export {
  buildRuntimeInventoryReport,
  buildRuntimeOwnershipReport,
  buildRuntimeLifecycleReport,
  buildRuntimeStateReport,
  buildRuntimeHistoryReport,
  buildRuntimeDiagnosticsReport,
  buildAllCloudRuntimeReports,
  composeCloudRuntimeResponse,
  buildCloudRuntimeFailureContext,
  nextCloudRuntimeReportId,
  resetCloudRuntimeReportCounterForTests,
} from './cloud-runtime-report-builder.js';
export {
  registerRuntime,
  getRuntime,
  prepareCloudRuntimeFoundation,
  processCloudRuntimeRequest,
  getCloudRuntimeContext,
  resetCloudRuntimeBootstrapForTests,
} from './cloud-runtime-registry.js';

export function getDevPulseV2CloudRuntimeFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_cloud_runtime_foundation',
    passToken: 'CLOUD_RUNTIME_FOUNDATION_V1_PASS',
    phase: 17.1,
    extensionOnly: true,
  };
}

export function resetCloudRuntimeFoundationForTests(): void {
  resetCloudRuntimeStoreForTests();
  resetCloudRuntimeDiagnosticsForTests();
  resetCloudRuntimeReportCounterForTests();
  resetCloudRuntimeBootstrapForTests();
}
