/**
 * Connected Verification Foundation — public API.
 */

export {
  CONNECTED_VERIFICATION_FOUNDATION_PASS_TOKEN,
  CONNECTED_VERIFICATION_OWNER_MODULE,
  CONNECTED_VERIFICATION_PHASE,
  CONNECTED_VERIFICATION_REPORT_TITLE,
  CONNECTED_VERIFICATION_CACHE_KEY_PREFIX,
  CONNECTED_VERIFICATION_CORE_QUESTION,
  MAX_CONNECTED_VERIFICATION_HISTORY,
  MAX_VERIFICATION_ENTRIES,
  MAX_RECOMMENDED_ACTIONS,
  MAX_MISSING_COMPONENTS,
  VERIFICATION_STATES,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  VERIFICATION_READINESS_SAFETY_GUARANTEES,
  isVerificationState,
} from './connected-verification-registry.js';

export type {
  VerificationState,
  VerificationReadinessEntry,
  VerificationReadinessArtifactEntry,
  VerificationCandidate,
  VerificationReadinessContract,
  VerificationReadinessQuestionAnswers,
  ConnectedVerificationInputSnapshot,
  ConnectedVerificationReport,
  ConnectedVerificationAssessment,
  AssessConnectedVerificationInput,
  ConnectedVerificationHistoryEntry,
  ConnectedVerificationHistorySummary,
  ConnectedVerificationArtifacts,
} from './connected-verification-types.js';

export {
  resetConnectedVerificationHistoryForTests,
  recordConnectedVerificationAssessment,
  getConnectedVerificationHistorySize,
  getLatestConnectedVerificationHistoryEntry,
  getConnectedVerificationHistory,
  countVerificationState,
  buildConnectedVerificationHistorySummary,
} from './connected-verification-history.js';

export {
  assessConnectedVerification,
  buildConnectedVerificationArtifacts,
  buildVerificationCandidate,
  buildVerificationReadinessContract,
  deriveVerificationReadinessQuestionAnswers,
  deriveVerificationReadinessScore,
  deriveVerificationState,
  deriveVerificationCompleteness,
  deriveCoverageCompleteness,
  deriveVerificationProofCompleteness,
  resetConnectedVerificationCounterForTests,
  resetConnectedVerificationModuleForTests,
} from './connected-verification-authority.js';

export { buildConnectedVerificationReportMarkdown } from './connected-verification-report-builder.js';
