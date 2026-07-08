/**
 * Runtime Banner Truth Reconciliation V1 — public API.
 */

export {
  RUNTIME_BANNER_TRUTH_RECONCILIATION_V1_PASS_TOKEN,
  COMMAND_CENTER_RUNTIME_TRUTH_READY_TRACE,
  RUNTIME_BANNER_DIAGNOSTIC_TRACE,
  STALE_RUNTIME_SESSION_STORAGE_KEYS,
  STALE_RUNTIME_LOCAL_STORAGE_KEYS,
  RUNTIME_BANNER_BLOCKED_BODY_CLASS,
  type RuntimeBannerReconciliationInput,
  type RuntimeBannerReconciliationResult,
  type RuntimeTruthClientResult,
  type PersistedStaleRuntimeState,
} from './runtime-banner-truth-reconciliation-types.js';

export {
  buildRuntimeBannerDiagnostic,
  collectStaleReasons,
  isRuntimeAuthorityReady,
  isRuntimeAuthorityVerifying,
  isRuntimeHealthReady,
  isRuntimeTruthFresh,
  normalizeRuntimeTruthClientResult,
  reconcileRuntimeBannerState,
} from './runtime-banner-truth-reconciliation-engine.js';

export {
  RuntimeBannerTruthReconciliationHarness,
  STALE_BANNER_TEXT,
} from './runtime-banner-truth-reconciliation-harness.js';

export const RUNTIME_BANNER_TRUTH_STORAGE_KEYS = {
  session: ['aidevengine.stale-runtime-error.v1'] as const,
  localRuntimeId: 'aidevengine.runtimeTruth.runtimeId' as const,
} as const;
