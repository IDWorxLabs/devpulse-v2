/**
 * DevPulse V2 Phase 17.4 — Cloud Verification Foundation public API.
 */

import { resetCloudVerificationStoreForTests } from './cloud-verification-store.js';
import { resetCloudVerificationDiagnosticsForTests } from './cloud-verification-diagnostics.js';
import { resetCloudVerificationReportCounterForTests } from './cloud-verification-report-builder.js';
import { resetCloudVerificationBootstrapForTests } from './cloud-verification-registry.js';
import { resetCloudVerificationSessionManagerForTests } from './cloud-verification-session-manager.js';

export {
  CLOUD_VERIFICATION_FOUNDATION_PASS_TOKEN,
  CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
  DUPLICATE_CLOUD_VERIFICATION_RISK_PREFIX,
  TRACKED_CLOUD_VERIFICATION_CATEGORIES,
  FORBIDDEN_CLOUD_VERIFICATION_DUPLICATES,
  CLOUD_VERIFICATION_QUESTION_SIGNALS,
  isCloudVerificationFoundationQuestion,
  isDuplicateCloudVerificationExecutorQuestion,
  isValidCloudVerificationStateTransition,
  type CloudVerificationCategory,
  type CloudVerificationState,
  type CloudVerificationStatus,
  type CloudVerificationVisibility,
  type CloudVerificationLifecycleEventType,
  type CloudVerificationReportType,
  type CloudVerificationOwnership,
  type CloudVerificationProvenance,
  type CloudVerificationScope,
  type CloudVerificationContext,
  type CloudVerificationUnifiedEntryLink,
  type CloudVerificationEvidenceLink,
  type CloudVerificationReportLink,
  type CloudVerificationRuntimeLink,
  type CloudVerificationWorkspaceLink,
  type CloudVerificationPersistentBuildLink,
  type CloudVerificationRelationships,
  type CloudVerificationMetadata,
  type CloudVerification,
  type CloudVerificationSession,
  type CloudVerificationLifecycleEvent,
  type CloudVerificationHistoryEntry,
  type CloudVerificationStateHistoryEntry,
  type CloudVerificationReport,
  type CloudVerificationDiagnostics,
  type CloudVerificationValidationResult,
  type RegisterCloudVerificationInput,
  type RegisterCloudVerificationResult,
  type PrepareCloudVerificationFoundationInput,
  type PrepareCloudVerificationFoundationResult,
  type DuplicateCloudVerificationRiskContext,
} from './cloud-verification-types.js';

export { resetCloudVerificationStoreForTests, nextVerificationId, nextCloudVerificationSessionId } from './cloud-verification-store.js';
export { buildCloudVerificationOwnership, recordVerificationOwnershipHistory } from './cloud-verification-ownership.js';
export {
  buildDefaultCloudVerificationScope,
  updateCloudVerificationScope,
  getCloudVerificationScope,
  validateCloudVerificationScope,
  detectScopeMismatch,
} from './cloud-verification-scope.js';
export {
  buildDefaultCloudVerificationContext,
  refreshCloudVerificationContext,
  getVerificationContextById,
  validateCloudVerificationContext,
  detectContextMismatch,
} from './cloud-verification-context.js';
export {
  requestCloudVerificationThroughUnifiedEntry,
  getUnifiedVerificationForCloudVerification,
  listCloudVerificationsByUnifiedSession,
  detectUnifiedVerificationMismatch,
} from './cloud-verification-unified-entry-bridge.js';
export {
  linkCloudVerificationEvidence,
  getEvidenceForCloudVerification,
  listCloudVerificationsByEvidence,
  detectEvidenceMismatch,
} from './cloud-verification-evidence-bridge.js';
export {
  linkCloudVerificationReport,
  getReportsForCloudVerification,
  listCloudVerificationsByReport,
  detectReportMismatch,
  listAvailableReportIdsForBridge,
} from './cloud-verification-report-bridge.js';
export {
  linkCloudVerificationToRuntime,
  getRuntimeForCloudVerification,
  detectCloudVerificationRuntimeMismatch,
} from './cloud-verification-runtime-bridge.js';
export {
  linkCloudVerificationToWorkspace,
  getWorkspaceForCloudVerification,
  detectCloudVerificationWorkspaceMismatch,
} from './cloud-verification-workspace-bridge.js';
export {
  linkCloudVerificationToPersistentBuild,
  getPersistentBuildForCloudVerification,
  detectCloudVerificationBuildMismatch,
} from './cloud-verification-build-bridge.js';
export {
  setCloudVerificationState,
  getCloudVerificationState,
  trackCloudVerificationStateHistory,
} from './cloud-verification-state-manager.js';
export {
  recordCloudVerificationLifecycleEvent,
  initializeCloudVerification,
  requestCloudVerification,
  completeCloudVerification,
  archiveCloudVerification,
  failCloudVerification,
  listLifecycleEventsForVerification,
} from './cloud-verification-lifecycle.js';
export {
  createCloudVerificationSession,
  getCloudVerificationSession,
  listCloudVerificationSessions,
  trackSessionOwnership,
  trackSessionMetadata,
  resetCloudVerificationSessionManagerForTests,
} from './cloud-verification-session-manager.js';
export {
  getCloudVerificationHistory,
  getEvidenceLinkHistory,
  getReportLinkHistory,
  getUnifiedEntryHistory,
  getRuntimeLinkHistory,
  getWorkspaceLinkHistory,
  getPersistentBuildLinkHistory,
  getProjectVerificationHistory,
  getScopeHistory,
  getContextHistory,
  getLifecycleHistory,
  listCloudVerificationHistoryConsumers,
  recordCloudVerificationHistoryEntry,
} from './cloud-verification-history.js';
export {
  queryCloudVerifications,
  listCloudVerifications,
  listCloudVerificationsByProject,
  listCloudVerificationsByRuntime,
  listCloudVerificationsByWorkspace,
  listCloudVerificationsByPersistentBuild,
  listCloudVerificationsByOwner,
  listCloudVerificationsByType,
  countVerificationsByState,
  countVerificationSessions,
  type CloudVerificationQuery,
} from './cloud-verification-query.js';
export {
  buildDuplicateCloudVerificationRiskContext,
  evaluateDuplicateCloudVerificationRisk,
  validateCloudVerificationRegistration,
  validateCloudVerificationRecord,
  validateCloudVerificationState,
} from './cloud-verification-validator.js';
export {
  getCloudVerificationDiagnostics,
  updateCloudVerificationDiagnostics,
  resetCloudVerificationDiagnosticsForTests,
  cloudVerificationFoundationKey,
} from './cloud-verification-diagnostics.js';
export {
  buildCloudVerificationInventoryReport,
  buildCloudVerificationOwnershipReport,
  buildCloudVerificationLifecycleReport,
  buildCloudVerificationStateReport,
  buildCloudVerificationScopeReport,
  buildCloudVerificationContextReport,
  buildCloudVerificationEvidenceLinkReport,
  buildCloudVerificationReportLinkReport,
  buildCloudVerificationRuntimeLinkReport,
  buildCloudVerificationWorkspaceLinkReport,
  buildCloudVerificationPersistentBuildLinkReport,
  buildCloudVerificationHistoryReport,
  buildCloudVerificationDiagnosticsReport,
  buildAllCloudVerificationReports,
  composeCloudVerificationResponse,
  buildCloudVerificationFailureContext,
  nextCloudVerificationReportId,
  resetCloudVerificationReportCounterForTests,
} from './cloud-verification-report-builder.js';
export {
  registerCloudVerification,
  getCloudVerification,
  prepareCloudVerificationFoundation,
  processCloudVerificationRequest,
  getCloudVerificationContext,
  resetCloudVerificationBootstrapForTests,
} from './cloud-verification-registry.js';

export function getDevPulseV2CloudVerificationFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_cloud_verification_foundation',
    passToken: 'CLOUD_VERIFICATION_FOUNDATION_V1_PASS',
    phase: 17.4,
    extensionOnly: true,
  };
}

export function resetCloudVerificationFoundationForTests(): void {
  resetCloudVerificationStoreForTests();
  resetCloudVerificationDiagnosticsForTests();
  resetCloudVerificationReportCounterForTests();
  resetCloudVerificationBootstrapForTests();
  resetCloudVerificationSessionManagerForTests();
}
