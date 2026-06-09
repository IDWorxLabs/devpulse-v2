/**
 * DevPulse V2 Phase 16.6 — Visual Verification Engine public API.
 */

export {
  VISUAL_VERIFICATION_ENGINE_PASS_TOKEN,
  VISUAL_VERIFICATION_ENGINE_OWNER_MODULE,
  VISUAL_VERIFICATION_QUESTION_SIGNALS,
  FORBIDDEN_VISUAL_VERIFICATION_DUPLICATES,
  ALL_VERIFICATION_TARGET_TYPES,
  ALL_VERIFICATION_STATUSES,
  isVisualVerificationQuestion,
  isVisualVerificationAdvisoryQuestion,
  isDuplicateVisualVerificationQuestion,
  type VerificationStatus,
  type VerificationTargetType,
  type VerificationEvidenceType,
  type VerificationRiskLevel,
  type VerificationProgressState,
  type VerificationTarget,
  type VerificationResult,
  type VerificationEvidence,
  type VerificationRisk,
  type VisualVerificationReport,
  type VisualVerificationDiagnostics,
  type VerifyVisualOutcomeInput,
  type VerifyVisualOutcomeResult,
} from './types.js';

export {
  parseVisualVerificationQuery,
  resetVisualVerificationRequestCounterForTests,
  type ParsedVisualVerificationQuery,
} from './visual-verification-request-parser.js';

export {
  classifyVerificationTargets,
  resetVerificationTargetCounterForTests,
} from './verification-target-classifier.js';

export {
  verifyLayoutTargets,
  resetLayoutVerificationCounterForTests,
} from './layout-verification-engine.js';

export {
  verifyNavigationTargets,
  resetNavigationVerificationCounterForTests,
} from './navigation-verification-engine.js';

export {
  verifyLoadingTargets,
  resetLoadingVerificationCounterForTests,
} from './loading-verification-engine.js';

export {
  verifyResponsiveTargets,
  resetResponsiveVerificationCounterForTests,
} from './responsive-verification-engine.js';

export {
  verifyInteractionOutcomes,
  resetInteractionOutcomeVerifierCounterForTests,
} from './interaction-outcome-verifier.js';

export {
  buildVerificationEvidence,
  resetVerificationEvidenceCounterForTests,
} from './verification-evidence-builder.js';

export {
  classifyVerificationRisks,
  resetVerificationRiskCounterForTests,
} from './verification-risk-engine.js';

export {
  evaluateVisualVerificationGates,
  validateVisualVerification,
  deriveVerificationStatus,
  type VisualVerificationGateReport,
  type VisualVerificationValidationResult,
} from './visual-verification-validator.js';

export {
  buildVisualVerificationReport,
  composeVisualVerificationResponse,
  buildVisualVerificationFailureContext,
  nextVerificationId,
  resetVisualVerificationReportCounterForTests,
  type VisualVerificationFailureContext,
} from './visual-verification-report.js';

export {
  getVisualVerificationDiagnostics,
  updateVisualVerificationDiagnostics,
  resetVisualVerificationDiagnostics,
  visualVerificationKey,
} from './visual-verification-diagnostics.js';

export {
  verifyVisualOutcome,
  processVisualVerificationRequest,
  getVisualVerificationContext,
} from './visual-verification-engine.js';

export function getDevPulseV2VisualVerificationEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_visual_verification_engine',
    passToken: 'VISUAL_VERIFICATION_ENGINE_V1_PASS',
    phase: 16.6,
    extensionOnly: true,
  };
}
