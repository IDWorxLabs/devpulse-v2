/**
 * Central Brain bridge — brain remains owner; Reality Replay publishes summaries only.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import type { ReplaySummary } from './types.js';

let latestPublishedSummary: ReplaySummary | null = null;

export function publishReplaySummary(summary: ReplaySummary): ReplaySummary {
  latestPublishedSummary = { ...summary, completeSources: [...summary.completeSources], partialSources: [...summary.partialSources], warnings: [...summary.warnings], errors: [...summary.errors] };
  void getDevPulseV2CentralBrainAuthority().getBrainState();
  return { ...latestPublishedSummary };
}

export function getLatestReplaySummary(): ReplaySummary | null {
  return latestPublishedSummary
    ? {
        ...latestPublishedSummary,
        completeSources: [...latestPublishedSummary.completeSources],
        partialSources: [...latestPublishedSummary.partialSources],
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
    typeof (brain as { reconstructHistory?: unknown }).reconstructHistory === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetReplayBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
