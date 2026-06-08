/**
 * Central Brain bridge — brain remains owner; Self Vision publishes summaries only.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import type { ObservationSummary } from './types.js';

let latestPublishedSummary: ObservationSummary | null = null;

export function publishObservationSummary(summary: ObservationSummary): ObservationSummary {
  latestPublishedSummary = { ...summary };
  void getDevPulseV2CentralBrainAuthority().getBrainState();
  return { ...summary };
}

export function getLatestObservationSummary(): ObservationSummary | null {
  return latestPublishedSummary ? { ...latestPublishedSummary } : null;
}

export function assertCentralBrainOwnershipUnchanged(): boolean {
  const brain = getDevPulseV2CentralBrainAuthority();
  return (
    brain.constructor.name === 'DevPulseV2CentralBrainAuthority' &&
    typeof brain.getBrainState === 'function' &&
    typeof (brain as { observeUi?: unknown }).observeUi === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetSelfVisionBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
