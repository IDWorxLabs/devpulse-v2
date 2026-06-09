/**
 * DevPulse V2 Phase 17.6 — Cloud Monitoring Foundation public API.
 */

import { resetCloudMonitoringStoreForTests } from './cloud-monitoring-store.js';
import { resetCloudMonitoringDiagnosticsForTests } from './cloud-monitoring-diagnostics.js';
import { resetCloudMonitoringReportCounterForTests } from './cloud-monitoring-report-builder.js';
import { resetCloudMonitoringBootstrapForTests } from './cloud-monitoring-registry.js';
import { resetCloudMonitoringSessionManagerForTests } from './cloud-monitoring-session-manager.js';
import { resetCloudMonitoringAlertCounterForTests } from './cloud-monitoring-alerts.js';

export {
  CLOUD_MONITORING_FOUNDATION_PASS_TOKEN,
  CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
  DUPLICATE_CLOUD_MONITORING_RISK_PREFIX,
  TRACKED_CLOUD_MONITORING_CATEGORIES,
  FORBIDDEN_CLOUD_MONITORING_DUPLICATES,
  CLOUD_MONITORING_QUESTION_SIGNALS,
  isCloudMonitoringFoundationQuestion,
  isDuplicateCloudMonitoringExecutorQuestion,
  isValidCloudMonitoringStateTransition,
  type CloudMonitoringCategory,
  type CloudMonitoringState,
  type CloudMonitoringStatus,
  type CloudMonitoringVisibility,
  type MonitoringHealthStatus,
  type MonitoringAlertSeverity,
  type MonitoringAlertStatus,
  type CloudMonitoringLifecycleEventType,
  type CloudMonitoringReportType,
  type CloudMonitoringOwnership,
  type CloudMonitoringProvenance,
  type CloudMonitoringHealth,
  type CloudMonitoringAlert,
  type CloudMonitoringContext,
  type CloudMonitoringRuntimeLink,
  type CloudMonitoringWorkspaceLink,
  type CloudMonitoringBuildLink,
  type CloudMonitoringVerificationLink,
  type CloudMonitoringRecoveryLink,
  type CloudMonitoringRelationships,
  type CloudMonitoringMetadata,
  type CloudMonitoringRecord,
  type CloudMonitoringSession,
  type CloudMonitoringLifecycleEvent,
  type CloudMonitoringHistoryEntry,
  type CloudMonitoringStateHistoryEntry,
  type CloudMonitoringReport,
  type CloudMonitoringDiagnostics,
  type CloudMonitoringValidationResult,
  type RegisterMonitoringInput,
  type RegisterMonitoringResult,
  type PrepareCloudMonitoringFoundationInput,
  type PrepareCloudMonitoringFoundationResult,
  type DuplicateCloudMonitoringRiskContext,
} from './cloud-monitoring-types.js';

export { resetCloudMonitoringStoreForTests, nextMonitoringId, nextMonitoringSessionId } from './cloud-monitoring-store.js';
export { buildCloudMonitoringOwnership, recordMonitoringOwnershipHistory } from './cloud-monitoring-ownership.js';
export {
  buildDefaultMonitoringHealth,
  updateMonitoringHealth,
  getMonitoringHealth,
  validateMonitoringHealth,
  resolveHealthStatusForScore,
} from './cloud-monitoring-health.js';
export {
  createMonitoringAlert,
  acknowledgeMonitoringAlert,
  listAlertsForMonitoring,
  validateMonitoringAlert,
  countOpenAlerts,
  nextMonitoringAlertId,
  resetCloudMonitoringAlertCounterForTests,
} from './cloud-monitoring-alerts.js';
export {
  buildDefaultCloudMonitoringContext,
  refreshCloudMonitoringContext,
  getMonitoringContextById,
  validateCloudMonitoringContext,
  detectContextMismatch,
} from './cloud-monitoring-context.js';
export {
  linkMonitoringToRuntime,
  getRuntimeForMonitoring,
  detectMonitoringRuntimeMismatch,
} from './cloud-monitoring-runtime-bridge.js';
export {
  linkMonitoringToWorkspace,
  getWorkspaceForMonitoring,
  detectMonitoringWorkspaceMismatch,
} from './cloud-monitoring-workspace-bridge.js';
export {
  linkMonitoringToBuild,
  getBuildForMonitoring,
  detectMonitoringBuildMismatch,
} from './cloud-monitoring-build-bridge.js';
export {
  linkMonitoringToVerification,
  getVerificationForMonitoring,
  detectMonitoringVerificationMismatch,
} from './cloud-monitoring-verification-bridge.js';
export {
  linkMonitoringToRecovery,
  getRecoveryForMonitoring,
  detectMonitoringRecoveryMismatch,
} from './cloud-monitoring-recovery-bridge.js';
export {
  setMonitoringState,
  getMonitoringState,
  trackMonitoringStateHistory,
} from './cloud-monitoring-state-manager.js';
export {
  recordCloudMonitoringLifecycleEvent,
  initializeCloudMonitoring,
  activateCloudMonitoring,
  recordHealthUpdated,
  recordAlertCreated,
  recordAlertAcknowledged,
  completeCloudMonitoring,
  archiveCloudMonitoring,
  failCloudMonitoring,
  listLifecycleEventsForMonitoring,
} from './cloud-monitoring-lifecycle.js';
export {
  createMonitoringSession,
  getMonitoringSession,
  listMonitoringSessions,
  trackSessionOwnership,
  trackSessionMetadata,
  resetCloudMonitoringSessionManagerForTests,
} from './cloud-monitoring-session-manager.js';
export {
  getCloudMonitoringHistory,
  getHealthHistory,
  getAlertHistory,
  getRuntimeLinkHistory,
  getWorkspaceLinkHistory,
  getBuildLinkHistory,
  getVerificationLinkHistory,
  getRecoveryLinkHistory,
  getProjectMonitoringHistory,
  getContextHistory,
  getLifecycleHistory,
  listCloudMonitoringHistoryConsumers,
  recordCloudMonitoringHistoryEntry,
} from './cloud-monitoring-history.js';
export {
  queryMonitoringRecords,
  listMonitoringRecords,
  listMonitoringByProject,
  listMonitoringByRuntime,
  listMonitoringByWorkspace,
  listMonitoringByBuild,
  listMonitoringByVerification,
  listMonitoringByRecovery,
  listMonitoringByOwner,
  listMonitoringByType,
  countMonitoringByState,
  countMonitoringSessions,
  type CloudMonitoringQuery,
} from './cloud-monitoring-query.js';
export {
  buildDuplicateCloudMonitoringRiskContext,
  evaluateDuplicateCloudMonitoringRisk,
  validateCloudMonitoringRegistration,
  validateCloudMonitoringRecord,
  validateCloudMonitoringState,
} from './cloud-monitoring-validator.js';
export {
  getCloudMonitoringDiagnostics,
  updateCloudMonitoringDiagnostics,
  resetCloudMonitoringDiagnosticsForTests,
  cloudMonitoringFoundationKey,
} from './cloud-monitoring-diagnostics.js';
export {
  buildCloudMonitoringInventoryReport,
  buildCloudMonitoringHealthReport,
  buildCloudMonitoringAlertReport,
  buildCloudMonitoringLifecycleReport,
  buildCloudMonitoringContextReport,
  buildCloudMonitoringRuntimeReport,
  buildCloudMonitoringWorkspaceReport,
  buildCloudMonitoringBuildReport,
  buildCloudMonitoringVerificationReport,
  buildCloudMonitoringRecoveryReport,
  buildCloudMonitoringHistoryReport,
  buildCloudMonitoringDiagnosticsReport,
  buildAllCloudMonitoringReports,
  composeCloudMonitoringResponse,
  buildCloudMonitoringFailureContext,
  nextCloudMonitoringReportId,
  resetCloudMonitoringReportCounterForTests,
} from './cloud-monitoring-report-builder.js';
export {
  registerMonitoringRecord,
  getMonitoringRecord,
  prepareCloudMonitoringFoundation,
  processCloudMonitoringRequest,
  getCloudMonitoringContext,
  resetCloudMonitoringBootstrapForTests,
} from './cloud-monitoring-registry.js';

export function getDevPulseV2CloudMonitoringFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_cloud_monitoring_foundation',
    passToken: 'CLOUD_MONITORING_FOUNDATION_V1_PASS',
    phase: 17.6,
    extensionOnly: true,
  };
}

export function resetCloudMonitoringFoundationForTests(): void {
  resetCloudMonitoringStoreForTests();
  resetCloudMonitoringDiagnosticsForTests();
  resetCloudMonitoringReportCounterForTests();
  resetCloudMonitoringBootstrapForTests();
  resetCloudMonitoringSessionManagerForTests();
  resetCloudMonitoringAlertCounterForTests();
}
