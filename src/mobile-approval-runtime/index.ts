/**
 * DevPulse V2 Phase 18.4 — Mobile Approval Runtime Foundation public API.
 */

import { resetMobileApprovalStoreForTests } from './mobile-approval-store.js';
import { resetMobileApprovalDiagnosticsForTests } from './mobile-approval-diagnostics.js';
import { resetMobileApprovalReportCounterForTests } from './mobile-approval-report-builder.js';
import { resetMobileApprovalBootstrapForTests } from './mobile-approval-registry.js';
import { resetMobileApprovalSessionManagerForTests } from './mobile-approval-session-manager.js';
import { resetMobileApprovalRequestManagerForTests } from './mobile-approval-request-manager.js';
import { resetMobileApprovalDecisionManagerForTests } from './mobile-approval-decision-manager.js';
import { resetMobileApprovalReadCacheForTests } from './mobile-approval-read-cache.js';

export {
  MOBILE_APPROVAL_RUNTIME_FOUNDATION_PASS_TOKEN,
  MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_MOBILE_APPROVAL_RISK_PREFIX,
  TRACKED_MOBILE_APPROVAL_CATEGORIES,
  FORBIDDEN_MOBILE_APPROVAL_DUPLICATES,
  MOBILE_APPROVAL_COMPANION_DOMAINS,
  MOBILE_APPROVAL_QUESTION_SIGNALS,
  isMobileApprovalRuntimeFoundationQuestion,
  isDuplicateMobileApprovalExecutorQuestion,
  isValidMobileApprovalStateTransition,
  type MobileApprovalCategory,
  type MobileApprovalState,
  type MobileApprovalStatus,
  type MobileApprovalVisibility,
  type MobileApprovalDecisionType,
  type MobileApprovalRequestResult,
  type MobileApprovalGovernanceResult,
  type MobileApprovalLifecycleEventType,
  type MobileApprovalReportType,
  type MobileApprovalOwnership,
  type MobileApprovalRiskLevel,
  type MobileApprovalUrgency,
  type MobileApprovalRequest,
  type MobileApprovalDecision,
  type MobileApprovalGovernance,
  type MobileApprovalContext,
  type MobileApprovalCommandLink,
  type MobileApprovalChatLink,
  type MobileApprovalPreviewLink,
  type MobileApprovalCloudLink,
  type MobileApprovalWorkspaceLink,
  type MobileApprovalBuildLink,
  type MobileApprovalFlowLink,
  type MobileApprovalOperatorFeedLink,
  type MobileApprovalProjectVaultLink,
  type MobileApprovalWorld2Link,
  type MobileApprovalAiDevLink,
  type MobileApprovalMetadata,
  type MobileApprovalProvenance,
  type MobileApprovalSession,
  type MobileApprovalTrackedSession,
  type MobileApprovalLifecycleEvent,
  type MobileApprovalHistoryEntry,
  type MobileApprovalStateHistoryEntry,
  type MobileApprovalReport,
  type MobileApprovalDiagnostics,
  type MobileApprovalValidationResult,
  type RegisterMobileApprovalInput,
  type RegisterMobileApprovalResult,
  type PrepareMobileApprovalRuntimeFoundationInput,
  type PrepareMobileApprovalRuntimeFoundationResult,
  type DuplicateMobileApprovalRiskContext,
} from './mobile-approval-types.js';

export {
  resetMobileApprovalStoreForTests,
  nextMobileApprovalId,
  nextMobileApprovalTrackedSessionId,
  nextMobileApprovalReportId,
} from './mobile-approval-store.js';
export {
  buildMobileApprovalOwnership,
  recordMobileApprovalOwnershipHistory,
  updateMobileApprovalSessionOwnership,
} from './mobile-approval-ownership.js';
export {
  buildDefaultMobileApprovalContext,
  refreshMobileApprovalContext,
  getMobileApprovalContextById,
  validateMobileApprovalContext,
  detectMobileApprovalContextMismatch,
} from './mobile-approval-context.js';
export {
  buildDefaultMobileApprovalVisibility,
  getMobileApprovalVisibility,
  setMobileApprovalVisibility,
  validateMobileApprovalVisibility,
} from './mobile-approval-visibility.js';
export {
  linkMobileApprovalToCommandSession,
  getCommandSessionForMobileApproval,
  detectMobileApprovalCommandMismatch,
  resolveCommandForMobileApprovalRegistration,
} from './mobile-approval-command-bridge.js';
export {
  linkMobileApprovalToChatSession,
  getChatSessionForMobileApproval,
  detectMobileApprovalChatMismatch,
  resolveChatForMobileApprovalRegistration,
} from './mobile-approval-chat-bridge.js';
export {
  linkMobileApprovalToPreviewSession,
  getPreviewSessionForMobileApproval,
  detectMobileApprovalPreviewMismatch,
  resolvePreviewForMobileApprovalRegistration,
} from './mobile-approval-preview-bridge.js';
export {
  linkMobileApprovalToCloud,
  getCloudForMobileApproval,
  detectMobileApprovalCloudMismatch,
  resolveRuntimeForMobileApprovalRegistration,
} from './mobile-approval-cloud-bridge.js';
export {
  linkMobileApprovalToProjectVault,
  getProjectVaultForMobileApproval,
  listMobileApprovalsByProjectVault,
  detectMobileApprovalProjectVaultMismatch,
} from './mobile-approval-project-vault-bridge.js';
export {
  validateWorld2OperationId,
  linkMobileApprovalToWorld2Operation,
  getWorld2OperationForMobileApproval,
  listMobileApprovalsByWorld2Operation,
  detectMobileApprovalWorld2Mismatch,
  resolveWorld2ForMobileApprovalRegistration,
} from './mobile-approval-world2-bridge.js';
export {
  validateAiDevOperationId,
  linkMobileApprovalToAiDevOperation,
  getAiDevOperationForMobileApproval,
  listMobileApprovalsByAiDevOperation,
  detectMobileApprovalAiDevMismatch,
  resolveAiDevForMobileApprovalRegistration,
} from './mobile-approval-aidev-bridge.js';
export {
  linkMobileApprovalToOperatorFeed,
  getOperatorFeedForMobileApproval,
  listMobileApprovalsByOperatorFeed,
  detectMobileApprovalOperatorFeedMismatch,
} from './mobile-approval-operator-feed-bridge.js';
export { setMobileApprovalState, getMobileApprovalState, trackMobileApprovalStateHistory } from './mobile-approval-state-manager.js';
export {
  recordMobileApprovalLifecycleEvent,
  initializeMobileApproval,
  markMobileApprovalReady,
  registerMobileApprovalRequestLifecycle,
  waitForMobileApprovalDecision,
  recordMobileApprovalDecisionLifecycle,
  approveMobileApproval,
  rejectMobileApproval,
  completeMobileApproval,
  archiveMobileApproval,
  failMobileApproval,
  listLifecycleEventsForMobileApproval,
} from './mobile-approval-lifecycle.js';
export {
  createMobileApprovalSession,
  getMobileApprovalTrackedSession,
  listMobileApprovalTrackedSessions,
  trackSessionOwnership,
  trackSessionMetadata,
  resetMobileApprovalSessionManagerForTests,
} from './mobile-approval-session-manager.js';
export {
  registerApprovalRequest,
  getApprovalRequest,
  listApprovalRequests,
  listApprovalRequestsByApprovalSession,
  listApprovalRequestsByProject,
  resetMobileApprovalRequestManagerForTests,
} from './mobile-approval-request-manager.js';
export {
  recordApprovalDecision,
  getApprovalDecision,
  listApprovalDecisions,
  listDecisionsByApprovalSession,
  evaluateApprovalDecision,
  resetMobileApprovalDecisionManagerForTests,
  type MobileApprovalDecisionEvaluation,
} from './mobile-approval-decision-manager.js';
export { getMobileApprovalHistory, listMobileApprovalHistoryConsumers, recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
export {
  queryMobileApprovalSessions,
  listMobileApprovalSessionsAll,
  listMobileApprovalsByProject,
  listMobileApprovalsByCommandSession,
  listMobileApprovalsByChatSession,
  listMobileApprovalsByPreviewSession,
  listMobileApprovalsByRuntime,
  listMobileApprovalsByWorkspace,
  listMobileApprovalsByPersistentBuild,
  listMobileApprovalsByOwner,
  listMobileApprovalsByType,
  listMobileApprovalsByWorld2,
  listMobileApprovalsByAiDev,
  countMobileApprovalsByState,
  countMobileApprovalTrackedSessions,
  type MobileApprovalQuery,
} from './mobile-approval-query.js';
export {
  buildDuplicateMobileApprovalRiskContext,
  evaluateDuplicateMobileApprovalRisk,
  validateMobileApprovalRegistration,
  validateMobileApprovalRecord,
  validateMobileApprovalState,
} from './mobile-approval-validator.js';
export {
  getMobileApprovalDiagnostics,
  updateMobileApprovalDiagnostics,
  resetMobileApprovalDiagnosticsForTests,
  runMobileApprovalDiagnosticsScan,
} from './mobile-approval-diagnostics.js';
export {
  buildAllMobileApprovalReports,
  composeMobileApprovalResponse,
  buildMobileApprovalFailureContext,
  resetMobileApprovalReportCounterForTests,
  buildMobileApprovalInventoryReport,
  buildMobileApprovalOwnershipReport,
  buildMobileApprovalLifecycleReport,
  buildMobileApprovalStateReport,
  buildMobileApprovalContextReport,
  buildMobileApprovalRequestReport,
  buildMobileApprovalDecisionReport,
  buildMobileApprovalGovernanceReport,
  buildMobileApprovalCommandLinkReport,
  buildMobileApprovalChatLinkReport,
  buildMobileApprovalPreviewLinkReport,
  buildMobileApprovalCloudLinkReport,
  buildMobileApprovalWorkspaceLinkReport,
  buildMobileApprovalBuildLinkReport,
  buildMobileApprovalFlowLinkReport,
  buildMobileApprovalOperatorFeedReport,
  buildMobileApprovalHistoryReport,
  buildMobileApprovalDiagnosticsReport,
} from './mobile-approval-report-builder.js';
export {
  registerMobileApprovalSession,
  getMobileApprovalSession,
  prepareMobileApprovalRuntimeFoundation,
  processMobileApprovalRequest,
  getMobileApprovalContext,
  resetMobileApprovalBootstrapForTests,
} from './mobile-approval-registry.js';

export function getDevPulseV2MobileApprovalRuntimeFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_mobile_approval_runtime_foundation',
    passToken: 'MOBILE_APPROVAL_RUNTIME_FOUNDATION_V1_PASS',
    phase: 18.4,
    extensionOnly: true,
  };
}

export function resetMobileApprovalRuntimeFoundationForTests(): void {
  resetMobileApprovalStoreForTests();
  resetMobileApprovalDiagnosticsForTests();
  resetMobileApprovalReportCounterForTests();
  resetMobileApprovalBootstrapForTests();
  resetMobileApprovalSessionManagerForTests();
  resetMobileApprovalRequestManagerForTests();
  resetMobileApprovalDecisionManagerForTests();
  resetMobileApprovalReadCacheForTests();
}
