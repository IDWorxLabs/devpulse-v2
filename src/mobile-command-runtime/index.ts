/**
 * DevPulse V2 Phase 18.1 — Mobile Command Runtime Foundation public API.
 */

import { resetMobileCommandStoreForTests } from './mobile-command-store.js';
import { resetMobileCommandDiagnosticsForTests } from './mobile-command-diagnostics.js';
import { resetMobileCommandReportCounterForTests } from './mobile-command-report-builder.js';
import { resetMobileCommandBootstrapForTests } from './mobile-command-registry.js';
import { resetMobileCommandSessionManagerForTests } from './mobile-command-session-manager.js';
import { resetMobileCommandActionGateCounterForTests } from './mobile-command-action-gate.js';

export {
  MOBILE_COMMAND_RUNTIME_FOUNDATION_PASS_TOKEN,
  MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_MOBILE_COMMAND_RISK_PREFIX,
  TRACKED_MOBILE_COMMAND_CATEGORIES,
  FORBIDDEN_MOBILE_COMMAND_DUPLICATES,
  MOBILE_COMMAND_QUESTION_SIGNALS,
  isMobileCommandRuntimeFoundationQuestion,
  isDuplicateMobileCommandExecutorQuestion,
  isValidMobileCommandStateTransition,
  type MobileCommandCategory,
  type MobileCommandState,
  type MobileCommandStatus,
  type MobileCommandVisibility,
  type MobileActionGateResult,
  type MobileCommandLifecycleEventType,
  type MobileCommandReportType,
  type MobileCommandOwnership,
  type MobileCommandProvenance,
  type MobileCommandPermissions,
  type MobileCommandActionGateEntry,
  type MobileCommandContext,
  type MobileCommandCloudLink,
  type MobileCommandWorkspaceLink,
  type MobileCommandBuildLink,
  type MobileCommandVerificationLink,
  type MobileCommandRecoveryLink,
  type MobileCommandMonitoringLink,
  type MobileCommandOperatorFeedLink,
  type MobileCommandProjectVaultLink,
  type MobileCommandRelationships,
  type MobileCommandMetadata,
  type MobileCommandSession,
  type MobileCommandTrackedSession,
  type MobileCommandLifecycleEvent,
  type MobileCommandHistoryEntry,
  type MobileCommandStateHistoryEntry,
  type MobileCommandReport,
  type MobileCommandDiagnostics,
  type MobileCommandValidationResult,
  type RegisterMobileCommandInput,
  type RegisterMobileCommandResult,
  type PrepareMobileCommandRuntimeFoundationInput,
  type PrepareMobileCommandRuntimeFoundationResult,
  type DuplicateMobileCommandRiskContext,
} from './mobile-command-types.js';

export { resetMobileCommandStoreForTests, nextMobileCommandId, nextMobileCommandTrackedSessionId } from './mobile-command-store.js';
export { buildMobileCommandOwnership, recordMobileCommandOwnershipHistory, updateMobileCommandSessionOwnership } from './mobile-command-ownership.js';
export {
  buildDefaultMobileCommandPermissions,
  updateMobileCommandPermissions,
  getMobileCommandPermissions,
  validateMobileCommandPermissions,
} from './mobile-command-permissions.js';
export {
  evaluateMobileCommandAction,
  registerMobileActionGateResult,
  listMobileActionGateResults,
  resetMobileCommandActionGateCounterForTests,
} from './mobile-command-action-gate.js';
export {
  buildDefaultMobileCommandContext,
  refreshMobileCommandContext,
  getMobileCommandContextById,
  validateMobileCommandContext,
  detectMobileCommandContextMismatch,
} from './mobile-command-context.js';
export {
  linkMobileCommandToCloud,
  getCloudForMobileCommand,
  detectMobileCommandCloudMismatch,
} from './mobile-command-cloud-bridge.js';
export {
  linkMobileCommandToWorkspace,
  getWorkspaceForMobileCommand,
  detectMobileCommandWorkspaceMismatch,
} from './mobile-command-workspace-bridge.js';
export {
  linkMobileCommandToBuild,
  getBuildForMobileCommand,
  detectMobileCommandBuildMismatch,
} from './mobile-command-build-bridge.js';
export {
  linkMobileCommandToVerification,
  getVerificationForMobileCommand,
  detectMobileCommandVerificationMismatch,
} from './mobile-command-verification-bridge.js';
export {
  linkMobileCommandToRecovery,
  getRecoveryForMobileCommand,
  detectMobileCommandRecoveryMismatch,
} from './mobile-command-recovery-bridge.js';
export {
  linkMobileCommandToMonitoring,
  getMonitoringForMobileCommand,
  detectMobileCommandMonitoringMismatch,
} from './mobile-command-monitoring-bridge.js';
export {
  linkMobileCommandToOperatorFeed,
  getOperatorFeedForMobileCommand,
  detectMobileCommandOperatorFeedMismatch,
} from './mobile-command-operator-feed-bridge.js';
export {
  linkMobileCommandToProjectVault,
  getProjectVaultForMobileCommand,
  detectMobileCommandProjectVaultMismatch,
} from './mobile-command-project-vault-bridge.js';
export {
  setMobileCommandState,
  getMobileCommandState,
  trackMobileCommandStateHistory,
} from './mobile-command-state-manager.js';
export {
  recordMobileCommandLifecycleEvent,
  initializeMobileCommand,
  completeMobileCommand,
  archiveMobileCommand,
  failMobileCommand,
  listLifecycleEventsForMobileCommand,
} from './mobile-command-lifecycle.js';
export {
  createMobileCommandSession,
  getMobileCommandTrackedSession,
  listMobileCommandTrackedSessions,
  trackSessionOwnership,
  trackSessionMetadata,
  resetMobileCommandSessionManagerForTests,
} from './mobile-command-session-manager.js';
export {
  getMobileCommandHistory,
  listMobileCommandHistoryConsumers,
  recordMobileCommandHistoryEntry,
} from './mobile-command-history.js';
export {
  queryMobileCommandSessions,
  listMobileCommandSessionsAll,
  listMobileCommandsByProject,
  listMobileCommandsByRuntime,
  listMobileCommandsByWorkspace,
  listMobileCommandsByBuild,
  listMobileCommandsByVerification,
  listMobileCommandsByRecovery,
  listMobileCommandsByMonitoring,
  listMobileCommandsByOwner,
  listMobileCommandsByType,
  countMobileCommandsByState,
  countMobileCommandTrackedSessions,
  type MobileCommandQuery,
} from './mobile-command-query.js';
export {
  buildDuplicateMobileCommandRiskContext,
  evaluateDuplicateMobileCommandRisk,
  validateMobileCommandRegistration,
  validateMobileCommandRecord,
  validateMobileCommandState,
} from './mobile-command-validator.js';
export {
  getMobileCommandDiagnostics,
  updateMobileCommandDiagnostics,
  resetMobileCommandDiagnosticsForTests,
  mobileCommandRuntimeFoundationKey,
  runMobileCommandDiagnosticsScan,
} from './mobile-command-diagnostics.js';
export {
  buildMobileCommandInventoryReport,
  buildMobileCommandOwnershipReport,
  buildMobileCommandLifecycleReport,
  buildMobileCommandStateReport,
  buildMobileCommandContextReport,
  buildMobileCommandPermissionsReport,
  buildMobileCommandActionGateReport,
  buildMobileCommandCloudLinkReport,
  buildMobileCommandWorkspaceLinkReport,
  buildMobileCommandBuildLinkReport,
  buildMobileCommandVerificationLinkReport,
  buildMobileCommandRecoveryLinkReport,
  buildMobileCommandMonitoringLinkReport,
  buildMobileCommandOperatorFeedReport,
  buildMobileCommandProjectVaultReport,
  buildMobileCommandHistoryReport,
  buildMobileCommandDiagnosticsReport,
  buildAllMobileCommandReports,
  composeMobileCommandResponse,
  buildMobileCommandFailureContext,
  resetMobileCommandReportCounterForTests,
} from './mobile-command-report-builder.js';
export {
  registerMobileCommandSession,
  getMobileCommandSession,
  prepareMobileCommandRuntimeFoundation,
  processMobileCommandRequest,
  getMobileCommandContext,
  resetMobileCommandBootstrapForTests,
} from './mobile-command-registry.js';

export function getDevPulseV2MobileCommandRuntimeFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_mobile_command_runtime_foundation',
    passToken: 'MOBILE_COMMAND_RUNTIME_FOUNDATION_V1_PASS',
    phase: 18.1,
    extensionOnly: true,
  };
}

export function resetMobileCommandRuntimeFoundationForTests(): void {
  resetMobileCommandStoreForTests();
  resetMobileCommandDiagnosticsForTests();
  resetMobileCommandReportCounterForTests();
  resetMobileCommandBootstrapForTests();
  resetMobileCommandSessionManagerForTests();
  resetMobileCommandActionGateCounterForTests();
}
