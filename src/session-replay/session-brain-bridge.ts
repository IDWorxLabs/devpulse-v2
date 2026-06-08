/**
 * Central Brain bridge — brain remains owner; Session Replay publishes summaries only.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import type { SessionReplaySummary } from './types.js';

let latestPublishedSummary: SessionReplaySummary | null = null;

export function publishSessionReplaySummary(summary: SessionReplaySummary): SessionReplaySummary {
  latestPublishedSummary = {
    ...summary,
    warnings: [...summary.warnings],
    errors: [...summary.errors],
  };
  void getDevPulseV2CentralBrainAuthority().getBrainState();
  return { ...latestPublishedSummary };
}

export function getLatestSessionReplaySummary(): SessionReplaySummary | null {
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
    typeof (brain as { reconstructSession?: unknown }).reconstructSession === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetSessionReplayBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
