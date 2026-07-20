/** Canonical BuildOutcome resolution. */
import type { BuildContextIntegrityReport, BuildOutcome } from './build-context-types.js';

export function resolveBuildContextOutcome(input: {
  readonly buildContextReport?: Pick<BuildContextIntegrityReport, 'complianceOutcome'> | null;
  readonly gpcaBlocked?: boolean;
  readonly productFaithfulnessBlocked?: boolean;
  readonly traceabilityBlocked?: boolean;
  readonly runtimeBlocked?: boolean;
  readonly previewBlocked?: boolean;
  readonly regenerationRequired?: boolean;
  readonly newCapabilityRequired?: boolean;
  readonly humanDecisionRequired?: boolean;
  readonly failed?: boolean;
}): BuildOutcome {
  if (input.buildContextReport?.complianceOutcome === 'BUILD_CONTEXT_BLOCKED') return 'BUILD_BLOCKED_PREVIEW';
  if (input.traceabilityBlocked) return 'BUILD_BLOCKED_TRACEABILITY';
  if (input.gpcaBlocked) return 'BUILD_BLOCKED_GPCA';
  if (input.productFaithfulnessBlocked) return 'BUILD_BLOCKED_PRODUCT_FAITHFULNESS';
  if (input.runtimeBlocked) return 'BUILD_BLOCKED_RUNTIME';
  if (input.previewBlocked) return 'BUILD_BLOCKED_PREVIEW';
  if (input.regenerationRequired) return 'BUILD_REQUIRES_REGENERATION';
  if (input.newCapabilityRequired) return 'BUILD_REQUIRES_NEW_CAPABILITY';
  if (input.humanDecisionRequired) return 'BUILD_REQUIRES_HUMAN_DECISION';
  if (input.failed) return 'BUILD_FAILED';
  return 'BUILD_SUCCEEDED';
}

export function isBlockedBuildOutcome(outcome: BuildOutcome): boolean {
  return outcome !== 'BUILD_SUCCEEDED';
}
