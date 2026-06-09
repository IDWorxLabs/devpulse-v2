/**
 * DevPulse V2 Phase 18.5 — Cross Device Runtime Foundation public API.
 */

import { resetCrossDeviceStoreForTests } from './cross-device-store.js';
import { resetCrossDeviceDiagnosticsForTests } from './cross-device-diagnostics.js';
import { resetCrossDeviceReportCounterForTests } from './cross-device-report-builder.js';
import { resetCrossDeviceBootstrapForTests } from './cross-device-registry.js';
import { resetCrossDeviceSessionManagerForTests } from './cross-device-session-manager.js';
import { resetCrossDeviceReadCacheForTests } from './cross-device-read-cache.js';

export {
  CROSS_DEVICE_RUNTIME_FOUNDATION_PASS_TOKEN,
  CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_CROSS_DEVICE_RISK_PREFIX,
  TRACKED_CROSS_DEVICE_CATEGORIES,
  FORBIDDEN_CROSS_DEVICE_DUPLICATES,
  CROSS_DEVICE_COMPANION_DOMAINS,
  CROSS_DEVICE_QUESTION_SIGNALS,
  isCrossDeviceRuntimeFoundationQuestion,
  isDuplicateCrossDeviceExecutorQuestion,
  isValidCrossDeviceStateTransition,
  validateCrossDeviceState,
  type CrossDeviceCategory,
  type CrossDeviceType,
  type CrossDeviceState,
  type CrossDeviceStatus,
  type DeviceVisibility,
  type CrossDeviceLifecycleEventType,
  type CrossDeviceReportType,
  type CrossDeviceOwnership,
  type DeviceRecord,
  type DeviceLink,
  type DeviceHandoff,
  type CrossDeviceContext,
  type CrossDeviceCommandLink,
  type CrossDeviceChatLink,
  type CrossDevicePreviewLink,
  type CrossDeviceApprovalLink,
  type CrossDeviceCloudLink,
  type CrossDeviceWorkspaceLink,
  type CrossDeviceBuildLink,
  type CrossDeviceOperatorFeedLink,
  type CrossDeviceProjectVaultLink,
  type CrossDeviceMetadata,
  type CrossDeviceProvenance,
  type CrossDeviceSession,
  type CrossDeviceTrackedSession,
  type CrossDeviceLifecycleEvent,
  type CrossDeviceHistoryEntry,
  type CrossDeviceStateHistoryEntry,
  type CrossDeviceReport,
  type CrossDeviceDiagnostics,
  type CrossDeviceValidationResult,
  type RegisterCrossDeviceInput,
  type RegisterCrossDeviceResult,
  type PrepareCrossDeviceRuntimeFoundationInput,
  type PrepareCrossDeviceRuntimeFoundationResult,
  type DuplicateCrossDeviceRiskContext,
} from './cross-device-types.js';

export {
  resetCrossDeviceStoreForTests,
  nextCrossDeviceId,
  nextCrossDeviceTrackedSessionId,
  nextCrossDeviceReportId,
  nextDeviceRecordId,
  nextDeviceLinkId,
  nextDeviceHandoffId,
} from './cross-device-store.js';
export {
  buildCrossDeviceOwnership,
  recordCrossDeviceOwnershipHistory,
  updateCrossDeviceSessionOwnership,
} from './cross-device-ownership.js';
export {
  buildDefaultCrossDeviceContext,
  refreshCrossDeviceContext,
  getCrossDeviceContextById,
  validateCrossDeviceContext,
  detectCrossDeviceContextMismatch,
} from './cross-device-context.js';
export {
  buildDefaultDeviceVisibility,
  getDeviceVisibility,
  setDeviceVisibility,
  validateDeviceVisibility,
} from './cross-device-visibility.js';
export {
  registerDeviceLink,
  getDeviceLink,
  listDeviceLinks,
} from './cross-device-device-link.js';
export {
  registerDeviceHandoff,
  getDeviceHandoff,
  listDeviceHandoffs,
} from './cross-device-handoff.js';
export {
  linkCrossDeviceToCommandSession,
  getCommandSessionForCrossDevice,
  detectCrossDeviceCommandMismatch,
  resolveCommandForCrossDeviceRegistration,
} from './cross-device-command-bridge.js';
export {
  linkCrossDeviceToChatSession,
  getChatSessionForCrossDevice,
  detectCrossDeviceChatMismatch,
  resolveChatForCrossDeviceRegistration,
} from './cross-device-chat-bridge.js';
export {
  linkCrossDeviceToPreviewSession,
  getPreviewSessionForCrossDevice,
  detectCrossDevicePreviewMismatch,
  resolvePreviewForCrossDeviceRegistration,
} from './cross-device-preview-bridge.js';
export {
  linkCrossDeviceToApprovalSession,
  getApprovalSessionForCrossDevice,
  detectCrossDeviceApprovalMismatch,
  resolveApprovalForCrossDeviceRegistration,
} from './cross-device-approval-bridge.js';
export {
  linkCrossDeviceToCloud,
  getCloudForCrossDevice,
  detectCrossDeviceCloudMismatch,
  resolveRuntimeForCrossDeviceRegistration,
} from './cross-device-cloud-bridge.js';
export {
  linkCrossDeviceToWorkspace,
  getWorkspaceForCrossDevice,
  detectCrossDeviceWorkspaceMismatch,
} from './cross-device-workspace-bridge.js';
export {
  linkCrossDeviceToBuild,
  getBuildForCrossDevice,
  detectCrossDeviceBuildMismatch,
} from './cross-device-build-bridge.js';
export {
  linkCrossDeviceToOperatorFeed,
  getOperatorFeedForCrossDevice,
  detectCrossDeviceOperatorFeedMismatch,
} from './cross-device-operator-feed-bridge.js';
export {
  linkCrossDeviceToProjectVault,
  getProjectVaultForCrossDevice,
  detectCrossDeviceProjectVaultMismatch,
} from './cross-device-project-vault-bridge.js';
export { setCrossDeviceState, getCrossDeviceState, trackCrossDeviceStateHistory } from './cross-device-state-manager.js';
export {
  recordCrossDeviceLifecycleEvent,
  initializeCrossDevice,
  markCrossDeviceReady,
  registerDeviceLifecycle,
  linkDeviceLifecycle,
  markHandoffAvailable,
  requestHandoffLifecycle,
  markHandoffReady,
  completeHandoffLifecycle,
  updateVisibilityLifecycle,
  completeCrossDevice,
  archiveCrossDevice,
  failCrossDevice,
  listLifecycleEventsForCrossDevice,
} from './cross-device-lifecycle.js';
export {
  createCrossDeviceSession,
  getCrossDeviceTrackedSession,
  listCrossDeviceTrackedSessions,
  trackSessionOwnership,
  trackSessionMetadata,
  resetCrossDeviceSessionManagerForTests,
} from './cross-device-session-manager.js';
export { getCrossDeviceHistory, listCrossDeviceHistoryConsumers, recordCrossDeviceHistoryEntry } from './cross-device-history.js';
export {
  queryCrossDeviceSessions,
  listCrossDeviceSessionsAll,
  listCrossDevicesByProject,
  listCrossDevicesByDevice,
  listCrossDevicesByCommandSession,
  listCrossDevicesByChatSession,
  listCrossDevicesByPreviewSession,
  listCrossDevicesByApprovalSession,
  listCrossDevicesByRuntime,
  listCrossDevicesByWorkspace,
  listCrossDevicesByPersistentBuild,
  listCrossDevicesByOwner,
  listCrossDevicesByType,
  listDeviceRecords,
  countCrossDevicesByState,
  countCrossDeviceTrackedSessions,
  type CrossDeviceQuery,
} from './cross-device-query.js';
export {
  buildDuplicateCrossDeviceRiskContext,
  evaluateDuplicateCrossDeviceRisk,
  validateCrossDeviceRegistration,
  validateCrossDeviceRecord,
} from './cross-device-validator.js';
export {
  getCrossDeviceDiagnostics,
  updateCrossDeviceDiagnostics,
  resetCrossDeviceDiagnosticsForTests,
  runCrossDeviceDiagnosticsScan,
} from './cross-device-diagnostics.js';
export {
  buildAllCrossDeviceReports,
  composeCrossDeviceResponse,
  buildCrossDeviceFailureContext,
  resetCrossDeviceReportCounterForTests,
  buildCrossDeviceInventoryReport,
  buildCrossDeviceOwnershipReport,
  buildCrossDeviceLifecycleReport,
  buildCrossDeviceStateReport,
  buildCrossDeviceContextReport,
  buildDeviceRegistrationReport,
  buildDeviceLinkReport,
  buildDeviceHandoffReport,
  buildDeviceVisibilityReport,
  buildCrossDeviceCommandLinkReport,
  buildCrossDeviceChatLinkReport,
  buildCrossDevicePreviewLinkReport,
  buildCrossDeviceApprovalLinkReport,
  buildCrossDeviceCloudLinkReport,
  buildCrossDeviceWorkspaceLinkReport,
  buildCrossDeviceBuildLinkReport,
  buildCrossDeviceOperatorFeedReport,
  buildCrossDeviceProjectVaultReport,
  buildCrossDeviceHistoryReport,
  buildCrossDeviceDiagnosticsReport,
} from './cross-device-report-builder.js';
export {
  registerCrossDeviceSession,
  registerDeviceRecord,
  getCrossDeviceSession,
  getDeviceRecord,
  prepareCrossDeviceRuntimeFoundation,
  processCrossDeviceRequest,
  getCrossDeviceContext,
  resetCrossDeviceBootstrapForTests,
} from './cross-device-registry.js';

export function getDevPulseV2CrossDeviceRuntimeFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_cross_device_runtime_foundation',
    passToken: 'CROSS_DEVICE_RUNTIME_FOUNDATION_V1_PASS',
    phase: 18.5,
    extensionOnly: true,
  };
}

export function resetCrossDeviceRuntimeFoundationForTests(): void {
  resetCrossDeviceStoreForTests();
  resetCrossDeviceDiagnosticsForTests();
  resetCrossDeviceReportCounterForTests();
  resetCrossDeviceBootstrapForTests();
  resetCrossDeviceSessionManagerForTests();
  resetCrossDeviceReadCacheForTests();
}
