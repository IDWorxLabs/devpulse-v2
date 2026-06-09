/**
 * DevPulse V2 Phase 13.3 — Reasoning Visibility Engine public API.
 */

export {
  REASONING_VISIBILITY_ENGINE_PASS_TOKEN,
  REASONING_VISIBILITY_ENGINE_OWNER_MODULE,
  REASONING_VISIBILITY_QUESTION_SIGNALS,
  FORBIDDEN_REASONING_VISIBILITY_DUPLICATES,
  isReasoningVisibilityQuestion,
  type ReasoningConfidence,
  type ReasoningEvidence,
  type ReasoningSource,
  type ReasoningRisk,
  type ReasoningBlocker,
  type ReasoningVisibilityRecord,
  type ReasoningVisibilityResult,
  type ReasoningVisibilityDiagnostics,
} from './reasoning-visibility-types.js';

export { buildReasoningEvidence, resetReasoningEvidenceCounterForTests } from './reasoning-evidence-builder.js';
export {
  analyzeReasoningSources,
  systemsConsulted,
  resetReasoningSourceCounterForTests,
} from './reasoning-source-analyzer.js';
export { analyzeReasoningRisks, resetReasoningRiskCounterForTests } from './reasoning-risk-analyzer.js';
export { analyzeReasoningBlockers, resetReasoningBlockerCounterForTests } from './reasoning-blocker-analyzer.js';
export { calculateReasoningConfidence } from './reasoning-confidence-builder.js';

export {
  getReasoningVisibilityDiagnostics,
  updateReasoningVisibilityDiagnostics,
  resetReasoningVisibilityDiagnostics,
  reasoningVisibilityKey,
} from './reasoning-visibility-diagnostics.js';

export {
  buildReasoningVisibilityRecord,
  analyzeReasoningVisibility,
  processReasoningVisibilityRequest,
  getReasoningVisibilityContext,
  resetReasoningVisibilityCounterForTests,
} from './reasoning-visibility-engine.js';

export function getDevPulseV2ReasoningVisibilityEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_reasoning_visibility_engine',
    passToken: 'DEVPULSE_V2_REASONING_VISIBILITY_ENGINE_FOUNDATION_V1_PASS',
    phase: 13.3,
  };
}
