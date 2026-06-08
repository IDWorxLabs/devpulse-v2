/**
 * Central Brain bridge — brain remains owner; Failure Prediction publishes summaries only.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import type { PredictionSummary } from './types.js';

let latestPublishedSummary: PredictionSummary | null = null;

export function publishPredictionSummary(summary: PredictionSummary): PredictionSummary {
  latestPublishedSummary = {
    ...summary,
    warnings: [...summary.warnings],
    errors: [...summary.errors],
  };
  void getDevPulseV2CentralBrainAuthority().getBrainState();
  return { ...latestPublishedSummary };
}

export function getLatestPredictionSummary(): PredictionSummary | null {
  return latestPublishedSummary
    ? {
        ...latestPublishedSummary,
        warnings: [...latestPublishedSummary.warnings],
        errors: [...latestPublishedSummary.errors],
      }
    : null;
}

export function assertCentralBrainOwnershipUnchanged(): boolean {
  const brain = getDevPulseV2CentralBrainAuthority();
  return (
    brain.constructor.name === 'DevPulseV2CentralBrainAuthority' &&
    typeof brain.getBrainState === 'function' &&
    typeof (brain as { predictFailure?: unknown }).predictFailure === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetPredictionBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
