/**
 * DevPulse V2 Phase 17.5 — Cloud Recovery Foundation public API.
 */

import { resetCloudRecoveryStoreForTests } from './cloud-recovery-store.js';
import { resetCloudRecoveryDiagnosticsForTests } from './cloud-recovery-diagnostics.js';
import { resetCloudRecoveryReportCounterForTests } from './cloud-recovery-report-builder.js';
import { resetCloudRecoveryBootstrapForTests } from './cloud-recovery-registry.js';
import { resetCloudRecoverySessionManagerForTests } from './cloud-recovery-session-manager.js';

export {
  CLOUD_RECOVERY_FOUNDATION_PASS_TOKEN,
  CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
  DUPLICATE_CLOUD_RECOVERY_RISK_PREFIX,
  TRACKED_CLOUD_RECOVERY_CATEGORIES,
  FORBIDDEN_CLOUD_RECOVERY_DUPLICATES,
  CLOUD_RECOVERY_QUESTION_SIGNALS,
  isCloudRecoveryFoundationQuestion,
  isDuplicateCloudRecoveryExecutorQuestion,
  isValidCloudRecoveryStateTransition,
  type CloudRecoveryCategory,
  type CloudRecoveryState,
  type CloudRecoveryStatus,
  type CloudRecoveryVisibility,
  type CloudRecoveryLifecycleEventType,
  type CloudRecoveryReportType,
  type CloudRecoveryOwnership,
  type CloudRecoveryProvenance,
  type CloudRecoveryScope,
  type CloudRecoveryContext,
  type CloudRecoveryRuntimeLink,
  type CloudRecoveryWorkspaceLink,
  type CloudRecoveryPersistentBuildLink,
  type CloudRecoveryVerificationLink,
  type CloudRecoveryRelationships,
  type CloudRecoveryMetadata,
  type CloudRecovery,
  type CloudRecoverySession,
  type CloudRecoveryLifecycleEvent,
  type CloudRecoveryHistoryEntry,
  type CloudRecoveryStateHistoryEntry,
  type CloudRecoveryReport,
  type CloudRecoveryDiagnostics,
  type CloudRecoveryValidationResult,
  type RegisterRecoveryInput,
  type RegisterRecoveryResult,
  type PrepareCloudRecoveryFoundationInput,
  type PrepareCloudRecoveryFoundationResult,
  type DuplicateCloudRecoveryRiskContext,
} from './cloud-recovery-types.js';

export { resetCloudRecoveryStoreForTests, nextRecoveryId, nextRecoverySessionId } from './cloud-recovery-store.js';
export { buildCloudRecoveryOwnership, recordRecoveryOwnershipHistory } from './cloud-recovery-ownership.js';
export {
  buildDefaultCloudRecoveryScope,
  updateCloudRecoveryScope,
  getCloudRecoveryScope,
  validateCloudRecoveryScope,
  detectScopeMismatch,
} from './cloud-recovery-scope.js';
export {
  buildDefaultCloudRecoveryContext,
  refreshCloudRecoveryContext,
  getRecoveryContextById,
  validateCloudRecoveryContext,
  detectContextMismatch,
} from './cloud-recovery-context.js';
export {
  linkRecoveryToRuntime,
  getRuntimeForRecovery,
  detectRecoveryRuntimeMismatch,
} from './cloud-recovery-runtime-bridge.js';
export {
  linkRecoveryToWorkspace,
  getWorkspaceForRecovery,
  detectRecoveryWorkspaceMismatch,
} from './cloud-recovery-workspace-bridge.js';
export {
  linkRecoveryToPersistentBuild,
  getPersistentBuildForRecovery,
  detectRecoveryBuildMismatch,
} from './cloud-recovery-build-bridge.js';
export {
  linkRecoveryToVerification,
  getVerificationForRecovery,
  detectRecoveryVerificationMismatch,
} from './cloud-recovery-verification-bridge.js';
export {
  setRecoveryState,
  getRecoveryState,
  trackRecoveryStateHistory,
} from './cloud-recovery-state-manager.js';
export {
  recordCloudRecoveryLifecycleEvent,
  initializeCloudRecovery,
  registerFailure,
  registerRecoveryCandidate,
  registerRecoveryPlan,
  markRecoveryReady,
  completeCloudRecovery,
  archiveCloudRecovery,
  failCloudRecovery,
  listLifecycleEventsForRecovery,
} from './cloud-recovery-lifecycle.js';
export {
  createRecoverySession,
  getRecoverySession,
  listRecoverySessions,
  trackSessionOwnership,
  trackSessionMetadata,
  resetCloudRecoverySessionManagerForTests,
} from './cloud-recovery-session-manager.js';
export {
  getCloudRecoveryHistory,
  getFailureHistory,
  getCandidateHistory,
  getRuntimeLinkHistory,
  getWorkspaceLinkHistory,
  getPersistentBuildLinkHistory,
  getVerificationLinkHistory,
  getProjectRecoveryHistory,
  getScopeHistory,
  getContextHistory,
  getLifecycleHistory,
  listCloudRecoveryHistoryConsumers,
  recordCloudRecoveryHistoryEntry,
} from './cloud-recovery-history.js';
export {
  queryRecoveries,
  listRecoveries,
  listRecoveriesByProject,
  listRecoveriesByRuntime,
  listRecoveriesByWorkspace,
  listRecoveriesByPersistentBuild,
  listRecoveriesByVerification,
  listRecoveriesByOwner,
  listRecoveriesByType,
  countRecoveriesByState,
  countRecoverySessions,
  type CloudRecoveryQuery,
} from './cloud-recovery-query.js';
export {
  buildDuplicateCloudRecoveryRiskContext,
  evaluateDuplicateCloudRecoveryRisk,
  validateCloudRecoveryRegistration,
  validateCloudRecoveryRecord,
  validateCloudRecoveryState,
} from './cloud-recovery-validator.js';
export {
  getCloudRecoveryDiagnostics,
  updateCloudRecoveryDiagnostics,
  resetCloudRecoveryDiagnosticsForTests,
  cloudRecoveryFoundationKey,
} from './cloud-recovery-diagnostics.js';
export {
  buildCloudRecoveryInventoryReport,
  buildCloudRecoveryOwnershipReport,
  buildCloudRecoveryLifecycleReport,
  buildCloudRecoveryStateReport,
  buildCloudRecoveryScopeReport,
  buildCloudRecoveryContextReport,
  buildCloudRecoveryRuntimeLinkReport,
  buildCloudRecoveryWorkspaceLinkReport,
  buildCloudRecoveryBuildLinkReport,
  buildCloudRecoveryVerificationLinkReport,
  buildCloudRecoveryHistoryReport,
  buildCloudRecoveryDiagnosticsReport,
  buildAllCloudRecoveryReports,
  composeCloudRecoveryResponse,
  buildCloudRecoveryFailureContext,
  nextCloudRecoveryReportId,
  resetCloudRecoveryReportCounterForTests,
} from './cloud-recovery-report-builder.js';
export {
  registerRecovery,
  getRecovery,
  prepareCloudRecoveryFoundation,
  processCloudRecoveryRequest,
  getCloudRecoveryContext,
  resetCloudRecoveryBootstrapForTests,
} from './cloud-recovery-registry.js';

export function getDevPulseV2CloudRecoveryFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_cloud_recovery_foundation',
    passToken: 'CLOUD_RECOVERY_FOUNDATION_V1_PASS',
    phase: 17.5,
    extensionOnly: true,
  };
}

export function resetCloudRecoveryFoundationForTests(): void {
  resetCloudRecoveryStoreForTests();
  resetCloudRecoveryDiagnosticsForTests();
  resetCloudRecoveryReportCounterForTests();
  resetCloudRecoveryBootstrapForTests();
  resetCloudRecoverySessionManagerForTests();
}
