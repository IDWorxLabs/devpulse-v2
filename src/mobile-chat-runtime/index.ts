/**
 * DevPulse V2 Phase 18.2 — Mobile Chat Runtime Foundation public API.
 */

import { resetMobileChatStoreForTests } from './mobile-chat-store.js';
import { resetMobileChatDiagnosticsForTests } from './mobile-chat-diagnostics.js';
import { resetMobileChatReportCounterForTests } from './mobile-chat-report-builder.js';
import { resetMobileChatBootstrapForTests } from './mobile-chat-registry.js';
import { resetMobileChatSessionManagerForTests } from './mobile-chat-session-manager.js';
import { resetMobileChatActionGateCounterForTests } from './mobile-chat-action-gate.js';
import { resetMobileChatPromptCounterForTests } from './mobile-chat-prompt-intake.js';
import { resetMobileChatResponseCounterForTests } from './mobile-chat-response-state.js';
import { resetMobileChatRouteCounterForTests } from './mobile-chat-command-router.js';

export {
  MOBILE_CHAT_RUNTIME_FOUNDATION_PASS_TOKEN,
  MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_MOBILE_CHAT_RISK_PREFIX,
  TRACKED_MOBILE_CHAT_CATEGORIES,
  FORBIDDEN_MOBILE_CHAT_DUPLICATES,
  MOBILE_CHAT_QUESTION_SIGNALS,
  isMobileChatRuntimeFoundationQuestion,
  isDuplicateMobileChatExecutorQuestion,
  isValidMobileChatStateTransition,
  type MobileChatCategory,
  type MobileChatState,
  type MobileChatStatus,
  type MobileChatVisibility,
  type MobileChatActionGateResult,
  type MobileChatLifecycleEventType,
  type MobileChatReportType,
  type MobileChatOwnership,
  type MobileChatPermissions,
  type MobileChatPrompt,
  type MobileChatResponseState,
  type MobileChatMessage,
  type MobileChatCommandRoute,
  type MobileChatActionGateEntry,
  type MobileChatContext,
  type MobileChatCommandLink,
  type MobileChatCloudLink,
  type MobileChatWorkspaceLink,
  type MobileChatBuildLink,
  type MobileChatVerificationLink,
  type MobileChatMonitoringLink,
  type MobileChatOperatorFeedLink,
  type MobileChatProjectVaultLink,
  type MobileChatMetadata,
  type MobileChatProvenance,
  type MobileChatSession,
  type MobileChatTrackedSession,
  type MobileChatLifecycleEvent,
  type MobileChatHistoryEntry,
  type MobileChatStateHistoryEntry,
  type MobileChatReport,
  type MobileChatDiagnostics,
  type MobileChatValidationResult,
  type RegisterMobileChatInput,
  type RegisterMobileChatResult,
  type PrepareMobileChatRuntimeFoundationInput,
  type PrepareMobileChatRuntimeFoundationResult,
  type DuplicateMobileChatRiskContext,
} from './mobile-chat-types.js';

export { resetMobileChatStoreForTests, nextMobileChatId, nextMobileChatTrackedSessionId, nextMobileChatMessageId } from './mobile-chat-store.js';
export { buildMobileChatOwnership, recordMobileChatOwnershipHistory, updateMobileChatSessionOwnership } from './mobile-chat-ownership.js';
export {
  buildDefaultMobileChatPermissions,
  evaluateMobileChatAction,
  registerMobileChatActionGateResult,
  listMobileChatActionGateResults,
  validateMobileChatPermissions,
  resetMobileChatActionGateCounterForTests,
} from './mobile-chat-action-gate.js';
export {
  buildDefaultMobileChatContext,
  refreshMobileChatContext,
  getMobileChatContextById,
  validateMobileChatContext,
  detectMobileChatContextMismatch,
} from './mobile-chat-context.js';
export {
  registerMobileMessage,
  getMobileMessage,
  listMobileMessages,
  listMessagesByChatSession,
  listMessagesByProject,
  listMessagesByCommandSession,
} from './mobile-chat-message-store.js';
export {
  intakeMobileChatPrompt,
  getLatestPromptForChat,
  validateMobileChatPrompt,
  resetMobileChatPromptCounterForTests,
} from './mobile-chat-prompt-intake.js';
export {
  setMobileChatResponsePending,
  setMobileChatResponseReady,
  getMobileChatResponseState,
  validateMobileChatResponseState,
  resetMobileChatResponseCounterForTests,
} from './mobile-chat-response-state.js';
export {
  routeMobileChatIntent,
  listRoutesForMobileChat,
  listRoutingTargets,
  resetMobileChatRouteCounterForTests,
} from './mobile-chat-command-router.js';
export {
  linkMobileChatToCommandSession,
  getCommandSessionForMobileChat,
  detectMobileChatCommandMismatch,
} from './mobile-chat-command-bridge.js';
export { linkMobileChatToCloud, getCloudForMobileChat, detectMobileChatCloudMismatch } from './mobile-chat-cloud-bridge.js';
export { linkMobileChatToWorkspace, getWorkspaceForMobileChat, detectMobileChatWorkspaceMismatch } from './mobile-chat-workspace-bridge.js';
export { linkMobileChatToBuild, getBuildForMobileChat, detectMobileChatBuildMismatch } from './mobile-chat-build-bridge.js';
export { linkMobileChatToVerification, getVerificationForMobileChat, detectMobileChatVerificationMismatch } from './mobile-chat-verification-bridge.js';
export { linkMobileChatToMonitoring, getMonitoringForMobileChat, detectMobileChatMonitoringMismatch } from './mobile-chat-monitoring-bridge.js';
export { linkMobileChatToOperatorFeed, getOperatorFeedForMobileChat, detectMobileChatOperatorFeedMismatch } from './mobile-chat-operator-feed-bridge.js';
export { linkMobileChatToProjectVault, getProjectVaultForMobileChat, detectMobileChatProjectVaultMismatch } from './mobile-chat-project-vault-bridge.js';
export { setMobileChatState, getMobileChatState, trackMobileChatStateHistory } from './mobile-chat-state-manager.js';
export {
  recordMobileChatLifecycleEvent,
  initializeMobileChat,
  completeMobileChat,
  archiveMobileChat,
  failMobileChat,
  listLifecycleEventsForMobileChat,
} from './mobile-chat-lifecycle.js';
export {
  createMobileChatSession,
  getMobileChatTrackedSession,
  listMobileChatTrackedSessions,
  trackSessionOwnership,
  trackSessionMetadata,
  resetMobileChatSessionManagerForTests,
} from './mobile-chat-session-manager.js';
export { getMobileChatHistory, listMobileChatHistoryConsumers, recordMobileChatHistoryEntry } from './mobile-chat-history.js';
export {
  queryMobileChatSessions,
  listMobileChatSessionsAll,
  listMobileChatsByProject,
  listMobileChatsByCommandSession,
  listMobileChatsByRuntime,
  listMobileChatsByWorkspace,
  listMobileChatsByPersistentBuild,
  listMobileChatsByVerification,
  listMobileChatsByMonitoring,
  listMobileChatsByOwner,
  listMobileChatsByType,
  countMobileChatsByState,
  countMobileChatTrackedSessions,
  type MobileChatQuery,
} from './mobile-chat-query.js';
export {
  buildDuplicateMobileChatRiskContext,
  evaluateDuplicateMobileChatRisk,
  validateMobileChatRegistration,
  validateMobileChatRecord,
  validateMobileChatState,
} from './mobile-chat-validator.js';
export { getMobileChatDiagnostics, updateMobileChatDiagnostics, resetMobileChatDiagnosticsForTests, runMobileChatDiagnosticsScan } from './mobile-chat-diagnostics.js';
export {
  buildAllMobileChatReports,
  composeMobileChatResponse,
  buildMobileChatFailureContext,
  resetMobileChatReportCounterForTests,
} from './mobile-chat-report-builder.js';
export {
  registerMobileChatSession,
  getMobileChatSession,
  prepareMobileChatRuntimeFoundation,
  processMobileChatRequest,
  getMobileChatContext,
  resetMobileChatBootstrapForTests,
} from './mobile-chat-registry.js';

export function getDevPulseV2MobileChatRuntimeFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_mobile_chat_runtime_foundation',
    passToken: 'MOBILE_CHAT_RUNTIME_FOUNDATION_V1_PASS',
    phase: 18.2,
    extensionOnly: true,
  };
}

export function resetMobileChatRuntimeFoundationForTests(): void {
  resetMobileChatStoreForTests();
  resetMobileChatDiagnosticsForTests();
  resetMobileChatReportCounterForTests();
  resetMobileChatBootstrapForTests();
  resetMobileChatSessionManagerForTests();
  resetMobileChatActionGateCounterForTests();
  resetMobileChatPromptCounterForTests();
  resetMobileChatResponseCounterForTests();
  resetMobileChatRouteCounterForTests();
}
