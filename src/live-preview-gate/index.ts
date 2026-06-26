/**
 * Live Preview Gate — public exports.
 */

import { resetLivePreviewGateHistoryForTests } from './live-preview-history.js';
import { resetLivePreviewTransitionLogForTests } from './live-preview-transition-log.js';
import { resetLivePreviewUnlockAuthorityForTests } from './live-preview-unlock-authority.js';

export {
  LIVE_PREVIEW_GATE_V1_PASS_TOKEN,
  LIVE_PREVIEW_GATE_OWNER_MODULE,
  DEFAULT_MAX_LIVE_PREVIEW_GATE_HISTORY,
} from './live-preview-gate-types.js';

export type {
  LivePreviewLockState,
  LivePreviewUnlockVerdict,
  LivePreviewEvidenceSourceId,
  LivePreviewGatePassStatus,
  LivePreviewEvidenceItem,
  LivePreviewEvidenceCollectionResult,
  LivePreviewUnlockDecision,
  LivePreviewBlockerExplanation,
  LivePreviewStatusCard,
  LivePreviewTransitionRecord,
  LivePreviewGateInput,
  LivePreviewGateResult,
} from './live-preview-gate-types.js';

export {
  getDevPulseV2LivePreviewGate,
  registerLivePreviewGateWithLaunchAuthority,
  registerLivePreviewGateWithFounderTest,
  registerLivePreviewGateWithUvl,
  registerLivePreviewGateWithOrchestrator,
} from './live-preview-gate-registry.js';

export {
  collectLivePreviewEvidence,
  buildLaunchReadinessInputFromGateInput,
  resolveLaunchReadinessForGate,
} from './live-preview-evidence-collector.js';
export { evaluateLivePreviewGates, isLaunchAuthorityReady } from './live-preview-gate-evaluator.js';
export { resolveLivePreviewLockState, mapUnlockVerdict, gateLabel } from './live-preview-lock-state.js';
export {
  evaluateLivePreviewGate,
  isLivePreviewGateUnlocked,
  getLivePreviewGatePassToken,
  resetLivePreviewUnlockAuthorityForTests,
} from './live-preview-unlock-authority.js';
export { explainLivePreviewBlocker } from './live-preview-blocker-explainer.js';
export { buildLivePreviewStatusCard } from './live-preview-status-card.js';
export {
  recordLivePreviewTransition,
  getLivePreviewTransitionLog,
  getLatestLivePreviewTransition,
  buildTransitionLogForEvaluation,
  resetLivePreviewTransitionLogForTests,
} from './live-preview-transition-log.js';
export {
  recordLivePreviewGateEvaluation,
  getLivePreviewGateHistory,
  getLatestLivePreviewGateResult,
  resetLivePreviewGateHistoryForTests,
} from './live-preview-history.js';
export { buildLivePreviewGateReport } from './live-preview-report-builder.js';
export {
  evaluateLivePreviewGateForOrchestrator,
  shouldExposePreviewUrl,
  type LivePreviewOrchestratorBridgeInput,
  type LivePreviewOrchestratorBridgeResult,
} from './live-preview-orchestrator-bridge.js';

export function resetLivePreviewGateModuleForTests(): void {
  resetLivePreviewUnlockAuthorityForTests();
  resetLivePreviewGateHistoryForTests();
  resetLivePreviewTransitionLogForTests();
}
