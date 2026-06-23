/**
 * Phase 26.90 — Product Readiness Completion Boundary Repair registry (V1).
 */

export const PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS =
  'PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS';

export const PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_CORE_QUESTION =
  'Why does Product Readiness remain RUNNING after all chat stress scenarios have settled?';

/** Canonical completion event — emitted exactly once when Rule 1 is satisfied. */
export const PRODUCT_READINESS_COMPLETE = 'PRODUCT_READINESS_COMPLETE';

export const PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_CACHE_KEY_PREFIX =
  'product-readiness-completion-boundary-repair';

export const COMPLETION_CHAIN_STEPS = [
  'chat-stress-started',
  'scenario-settlement',
  'pending-count-zero',
  'product-readiness-complete',
  'intake-validation-complete',
  'planning-gate-eligible',
] as const;

export type CompletionChainStep = (typeof COMPLETION_CHAIN_STEPS)[number];

export const PRODUCT_READINESS_COMPLETION_FAILURE_CLASSES = [
  'SETTLEMENT_NOT_COMPLETE',
  'COMPLETION_DETECTION_MISSING',
  'COMPLETION_EVENT_NOT_EMITTED',
  'COMPLETION_EVENT_DROPPED',
  'STATE_MACHINE_STALLED',
  'STAGE_ADVANCEMENT_FAILED',
  'PROPAGATION_FAILURE',
  'UNKNOWN_COMPLETION_FAILURE',
] as const;
