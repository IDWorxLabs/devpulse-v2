/**
 * DevPulse V2 Phase 18.3 — Mobile Preview Runtime Foundation public API.
 */

import { resetMobilePreviewStoreForTests } from './mobile-preview-store.js';
import { resetMobilePreviewDiagnosticsForTests } from './mobile-preview-diagnostics.js';
import { resetMobilePreviewReportCounterForTests } from './mobile-preview-report-builder.js';
import { resetMobilePreviewBootstrapForTests } from './mobile-preview-registry.js';
import { resetMobilePreviewSessionManagerForTests } from './mobile-preview-session-manager.js';
import { resetMobilePreviewEligibilityCounterForTests } from './mobile-preview-eligibility.js';
import { resetMobilePreviewSafetyCounterForTests } from './mobile-preview-safety.js';
import { resetMobilePreviewDevicePolicyCounterForTests } from './mobile-preview-device-policy.js';
import { resetMobilePreviewDesktopCounterForTests } from './mobile-preview-desktop-recommendation.js';
import { resetMobilePreviewLinkCounterForTests } from './mobile-preview-link-manager.js';

export {
  MOBILE_PREVIEW_RUNTIME_FOUNDATION_PASS_TOKEN,
  MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_MOBILE_PREVIEW_RISK_PREFIX,
  TRACKED_MOBILE_PREVIEW_CATEGORIES,
  FORBIDDEN_MOBILE_PREVIEW_DUPLICATES,
  MOBILE_PREVIEW_COMPANION_DOMAINS,
  MOBILE_PREVIEW_QUESTION_SIGNALS,
  isMobilePreviewRuntimeFoundationQuestion,
  isDuplicateMobilePreviewExecutorQuestion,
  isValidMobilePreviewStateTransition,
  type MobilePreviewCategory,
  type MobilePreviewState,
  type MobilePreviewStatus,
  type MobilePreviewVisibility,
  type MobilePreviewDesktopRecommendationLevel,
  type MobilePreviewEligibilityResult,
  type MobilePreviewSafetyResult,
  type MobilePreviewLifecycleEventType,
  type MobilePreviewReportType,
  type MobilePreviewOwnership,
  type MobilePreviewEligibility,
  type MobilePreviewSafety,
  type MobilePreviewDevicePolicy,
  type MobilePreviewDesktopRecommendation,
  type MobilePreviewLink,
  type MobilePreviewContext,
  type MobilePreviewCommandLink,
  type MobilePreviewChatLink,
  type MobilePreviewCloudLink,
  type MobilePreviewWorkspaceLink,
  type MobilePreviewBuildLink,
  type MobilePreviewVerificationLink,
  type MobilePreviewLivePreviewLink,
  type MobilePreviewOperatorFeedLink,
  type MobilePreviewMetadata,
  type MobilePreviewProvenance,
  type MobilePreviewSession,
  type MobilePreviewTrackedSession,
  type MobilePreviewLifecycleEvent,
  type MobilePreviewHistoryEntry,
  type MobilePreviewStateHistoryEntry,
  type MobilePreviewReport,
  type MobilePreviewDiagnostics,
  type MobilePreviewValidationResult,
  type RegisterMobilePreviewInput,
  type RegisterMobilePreviewResult,
  type PrepareMobilePreviewRuntimeFoundationInput,
  type PrepareMobilePreviewRuntimeFoundationResult,
  type DuplicateMobilePreviewRiskContext,
} from './mobile-preview-types.js';

export {
  resetMobilePreviewStoreForTests,
  nextMobilePreviewId,
  nextMobilePreviewTrackedSessionId,
  nextMobilePreviewReportId,
} from './mobile-preview-store.js';
export { buildMobilePreviewOwnership, recordMobilePreviewOwnershipHistory, updateMobilePreviewSessionOwnership } from './mobile-preview-ownership.js';
export {
  buildDefaultMobilePreviewContext,
  refreshMobilePreviewContext,
  getMobilePreviewContextById,
  validateMobilePreviewContext,
  detectMobilePreviewContextMismatch,
} from './mobile-preview-context.js';
export {
  buildDefaultMobilePreviewEligibility,
  evaluateMobilePreviewEligibility,
  validateMobilePreviewEligibility,
  resetMobilePreviewEligibilityCounterForTests,
} from './mobile-preview-eligibility.js';
export {
  buildDefaultMobilePreviewSafety,
  evaluateMobilePreviewSafety,
  validateMobilePreviewSafety,
  resetMobilePreviewSafetyCounterForTests,
} from './mobile-preview-safety.js';
export {
  buildDefaultMobilePreviewDevicePolicy,
  getMobilePreviewDevicePolicy,
  validateMobilePreviewDevicePolicy,
  resetMobilePreviewDevicePolicyCounterForTests,
} from './mobile-preview-device-policy.js';
export {
  evaluateDesktopRecommendation,
  registerDesktopRecommendation,
  listDesktopRecommendations,
  resetMobilePreviewDesktopCounterForTests,
  type MobilePreviewDesktopRecommendationEvaluation,
} from './mobile-preview-desktop-recommendation.js';
export {
  registerPreviewLink,
  getPreviewLink,
  listPreviewLinks,
  listPreviewLinksByProject,
  listPreviewLinksByWorkspace,
  listPreviewLinksByBuild,
  listPreviewLinksForRegisteredSessions,
  resetMobilePreviewLinkCounterForTests,
} from './mobile-preview-link-manager.js';
export {
  linkMobilePreviewToCommandSession,
  getCommandSessionForMobilePreview,
  detectMobilePreviewCommandMismatch,
  resolveCommandForMobilePreviewRegistration,
} from './mobile-preview-command-bridge.js';
export {
  linkMobilePreviewToChatSession,
  getChatSessionForMobilePreview,
  detectMobilePreviewChatMismatch,
  resolveChatForMobilePreviewRegistration,
} from './mobile-preview-chat-bridge.js';
export {
  linkMobilePreviewToCloud,
  getCloudForMobilePreview,
  detectMobilePreviewCloudMismatch,
  resolveRuntimeForMobilePreviewRegistration,
} from './mobile-preview-cloud-bridge.js';
export {
  linkMobilePreviewToWorkspace,
  getWorkspaceForMobilePreview,
  detectMobilePreviewWorkspaceMismatch,
  resolveWorkspaceForMobilePreviewRegistration,
} from './mobile-preview-workspace-bridge.js';
export {
  linkMobilePreviewToBuild,
  getBuildForMobilePreview,
  detectMobilePreviewBuildMismatch,
  resolveBuildForMobilePreviewRegistration,
} from './mobile-preview-build-bridge.js';
export {
  linkMobilePreviewToVerification,
  getVerificationForMobilePreview,
  detectMobilePreviewVerificationMismatch,
  resolveVerificationForMobilePreviewRegistration,
} from './mobile-preview-verification-bridge.js';
export { linkMobilePreviewToOperatorFeed, getOperatorFeedForMobilePreview, detectMobilePreviewOperatorFeedMismatch } from './mobile-preview-operator-feed-bridge.js';
export { setMobilePreviewState, getMobilePreviewState, trackMobilePreviewStateHistory } from './mobile-preview-state-manager.js';
export {
  recordMobilePreviewLifecycleEvent,
  initializeMobilePreview,
  checkMobilePreviewEligibility,
  checkMobilePreviewSafety,
  allowMobilePreview,
  blockMobilePreview,
  recommendDesktopForMobilePreview,
  registerMobilePreviewLinkLifecycle,
  markMobilePreviewPending,
  markMobilePreviewReady,
  completeMobilePreview,
  archiveMobilePreview,
  failMobilePreview,
  listLifecycleEventsForMobilePreview,
} from './mobile-preview-lifecycle.js';
export {
  createMobilePreviewSession,
  getMobilePreviewTrackedSession,
  listMobilePreviewTrackedSessions,
  trackSessionOwnership,
  trackSessionMetadata,
  resetMobilePreviewSessionManagerForTests,
} from './mobile-preview-session-manager.js';
export { getMobilePreviewHistory, listMobilePreviewHistoryConsumers, recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
export {
  queryMobilePreviewSessions,
  listMobilePreviewSessionsAll,
  listMobilePreviewsByProject,
  listMobilePreviewsByCommandSession,
  listMobilePreviewsByChatSession,
  listMobilePreviewsByRuntime,
  listMobilePreviewsByWorkspace,
  listMobilePreviewsByPersistentBuild,
  listMobilePreviewsByVerification,
  listMobilePreviewsByOwner,
  listMobilePreviewsByType,
  countMobilePreviewsByState,
  countMobilePreviewTrackedSessions,
  type MobilePreviewQuery,
} from './mobile-preview-query.js';
export {
  buildDuplicateMobilePreviewRiskContext,
  evaluateDuplicateMobilePreviewRisk,
  validateMobilePreviewRegistration,
  validateMobilePreviewRecord,
  validateMobilePreviewState,
} from './mobile-preview-validator.js';
export {
  getMobilePreviewDiagnostics,
  updateMobilePreviewDiagnostics,
  resetMobilePreviewDiagnosticsForTests,
  runMobilePreviewDiagnosticsScan,
} from './mobile-preview-diagnostics.js';
export {
  buildAllMobilePreviewReports,
  composeMobilePreviewResponse,
  buildMobilePreviewFailureContext,
  resetMobilePreviewReportCounterForTests,
  buildMobilePreviewInventoryReport,
  buildMobilePreviewOwnershipReport,
  buildMobilePreviewLifecycleReport,
  buildMobilePreviewStateReport,
  buildMobilePreviewContextReport,
  buildMobilePreviewEligibilityReport,
  buildMobilePreviewSafetyReport,
  buildMobilePreviewDevicePolicyReport,
  buildMobilePreviewDesktopRecommendationReport,
  buildMobilePreviewLinkReport,
  buildMobilePreviewCommandLinkReport,
  buildMobilePreviewChatLinkReport,
  buildMobilePreviewCloudLinkReport,
  buildMobilePreviewWorkspaceLinkReport,
  buildMobilePreviewBuildLinkReport,
  buildMobilePreviewVerificationLinkReport,
  buildMobilePreviewOperatorFeedReport,
  buildMobilePreviewHistoryReport,
  buildMobilePreviewDiagnosticsReport,
} from './mobile-preview-report-builder.js';
export {
  registerMobilePreviewSession,
  getMobilePreviewSession,
  prepareMobilePreviewRuntimeFoundation,
  processMobilePreviewRequest,
  getMobilePreviewContext,
  resetMobilePreviewBootstrapForTests,
} from './mobile-preview-registry.js';

export function getDevPulseV2MobilePreviewRuntimeFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_mobile_preview_runtime_foundation',
    passToken: 'MOBILE_PREVIEW_RUNTIME_FOUNDATION_V1_PASS',
    phase: 18.3,
    extensionOnly: true,
  };
}

export function resetMobilePreviewRuntimeFoundationForTests(): void {
  resetMobilePreviewStoreForTests();
  resetMobilePreviewDiagnosticsForTests();
  resetMobilePreviewReportCounterForTests();
  resetMobilePreviewBootstrapForTests();
  resetMobilePreviewSessionManagerForTests();
  resetMobilePreviewEligibilityCounterForTests();
  resetMobilePreviewSafetyCounterForTests();
  resetMobilePreviewDevicePolicyCounterForTests();
  resetMobilePreviewDesktopCounterForTests();
  resetMobilePreviewLinkCounterForTests();
}
