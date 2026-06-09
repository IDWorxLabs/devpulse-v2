/**
 * DevPulse V2 Phase 14.6 — Runtime Verification Layer Foundation public API.
 */

export {
  RUNTIME_VERIFICATION_LAYER_FOUNDATION_PASS_TOKEN,
  RUNTIME_VERIFICATION_LAYER_OWNER_MODULE,
  VERIFICATION_QUESTION_SIGNALS,
  VERIFICATION_INPUT_SOURCES,
  FORBIDDEN_RUNTIME_VERIFICATION_DUPLICATES,
  isRuntimeVerificationLayerQuestion,
  isDuplicateVerificationBrainQuestion,
  isRuntimeVerificationAdvisoryQuestion,
  type VerificationState,
  type VerificationConfidence,
  type RuntimeVerificationRequest,
  type VerificationEvidence,
  type VerificationGap,
  type VerificationTrustAssessment,
  type RuntimeVerificationReport,
  type RuntimeVerificationDiagnostics,
  type RuntimeVerificationResult,
} from './runtime-verification-types.js';

export {
  parseVerificationRequest,
  resetVerificationRequestCounterForTests,
} from './runtime-verification-request-parser.js';

export {
  buildVerificationEvidence,
  satisfiedEvidenceCount,
  resetVerificationEvidenceCounterForTests,
} from './verification-evidence-builder.js';

export {
  analyzeVerificationGaps,
  resetVerificationGapCounterForTests,
} from './verification-gap-analyzer.js';

export {
  calculateVerificationConfidence,
  calculateVerificationScore,
} from './verification-confidence-calculator.js';

export {
  analyzeVerificationTrust,
  resetVerificationTrustCounterForTests,
} from './verification-trust-analyzer.js';

export {
  buildRuntimeVerificationReport,
  resetVerificationReportCounterForTests,
} from './runtime-verification-report-builder.js';

export {
  getRuntimeVerificationDiagnostics,
  updateRuntimeVerificationDiagnostics,
  resetRuntimeVerificationDiagnostics,
  runtimeVerificationKey,
} from './runtime-verification-diagnostics.js';

export {
  processRuntimeVerificationRequest,
  getRuntimeVerificationContext,
} from './runtime-verification-layer.js';

export { buildVerificationFailureContext } from './verification-failure-bridge.js';

export function getDevPulseV2RuntimeVerificationLayer(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_runtime_verification_layer',
    passToken: 'DEVPULSE_V2_RUNTIME_VERIFICATION_LAYER_FOUNDATION_V1_PASS',
    phase: 14.6,
  };
}
