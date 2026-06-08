/**
 * Central Brain bridge — brain remains owner; attribution publishes summaries only.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import type { AttributionSummary } from './types.js';

let latestPublishedSummary: AttributionSummary | null = null;

export function publishAttributionSummary(summary: AttributionSummary): AttributionSummary {
  latestPublishedSummary = {
    ...summary,
    warnings: [...summary.warnings],
    errors: [...summary.errors],
  };
  void getDevPulseV2CentralBrainAuthority().getBrainState();
  return { ...latestPublishedSummary };
}

export function getLatestAttributionSummary(): AttributionSummary | null {
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
    typeof (brain as { generateAttributions?: unknown }).generateAttributions === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetAttributionBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
