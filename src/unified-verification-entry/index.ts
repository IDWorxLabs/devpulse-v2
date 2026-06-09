/**
 * DevPulse V2 Phase 16.12 — Unified Verification Entry Point public API.
 */

export {
  UNIFIED_VERIFICATION_ENTRY_POINT_PASS_TOKEN,
  UNIFIED_VERIFICATION_ENTRY_OWNER_MODULE,
  UNIFIED_VERIFICATION_QUESTION_SIGNALS,
  FORBIDDEN_UNIFIED_VERIFICATION_DUPLICATES,
  INITIAL_VERIFICATION_REQUEST_TYPES,
  INITIAL_VERIFICATION_SCOPES,
  isUnifiedVerificationQuestion,
  isUnifiedVerificationAdvisoryQuestion,
  isDuplicateUnifiedVerificationQuestion,
  inferRequestType,
  inferScopeType,
  type VerificationRequestType,
  type VerificationScopeType,
  type VerificationStateType,
  type VerificationVisibility,
  type VerificationAuthorityState,
  type VerificationOwnership,
  type VerificationScope,
  type VerificationContext,
  type VerificationSession,
  type VerificationRequest,
  type VerificationHistoryEntry,
  type VerificationChain,
  type VerificationDiagnostics,
  type VerificationResponse,
  type VerificationAuthorityResult,
  type RequestVerificationInput,
  type UnifiedVerificationEntryDiagnostics,
} from './unified-verification-types.js';

export {
  routeVerificationRequest,
  describeRoutingPlan,
  type RoutedVerificationSubsystems,
} from './verification-request-router.js';

export {
  buildVerificationScope,
  resetVerificationScopeCounterForTests,
} from './verification-scope-builder.js';

export { buildVerificationContext } from './verification-context-builder.js';

export {
  buildVerificationSession,
  getVerificationSession,
  listVerificationSessions,
  updateVerificationSessionState,
  nextEntrySessionId,
  resetVerificationEntrySessionsForTests,
} from './verification-session-builder.js';

export {
  setVerificationState,
  getVerificationState,
  deriveFinalState,
  advanceVerificationState,
  listVerificationStates,
  resetVerificationStateForTests,
} from './verification-state-manager.js';

export {
  recordVerificationHistory,
  getVerificationHistory,
  listVerificationHistoryByRequest,
  resetVerificationEntryHistoryForTests,
} from './verification-history-manager.js';

export {
  buildVerificationResponse,
  composeVerificationResponseText,
} from './verification-response-builder.js';

export {
  validateVerificationEntry,
  evaluateEntryGates,
  detectDuplicateRequestId,
  type EntryValidationIssue,
  type EntryValidationResult,
  type EntryGateReport,
} from './verification-entry-validator.js';

export {
  getVerificationEntryDiagnostics,
  updateVerificationEntryDiagnostics,
  resetVerificationEntryDiagnostics,
  unifiedVerificationEntryKey,
} from './verification-entry-diagnostics.js';

export {
  buildVerificationEntryReport,
  buildUnifiedVerificationFailureContext,
  summarizeEntryResponse,
  resetVerificationEntryReportCounterForTests,
  type VerificationEntryReport,
  type UnifiedVerificationFailureContext,
} from './verification-entry-report.js';

export {
  requestVerification,
  processUnifiedVerificationRequest,
  getUnifiedVerificationContext,
  listVerificationRequests,
  getVerificationReports,
  getVerificationEvidence,
  getVerificationDiagnostics,
  resetVerificationRequestsForTests,
  resetUnifiedVerificationEntryForTests,
} from './unified-verification-entry.js';

export function getDevPulseV2UnifiedVerificationEntry(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_unified_verification_entry',
    passToken: 'UNIFIED_VERIFICATION_ENTRY_POINT_V1_PASS',
    phase: 16.12,
    extensionOnly: true,
  };
}
