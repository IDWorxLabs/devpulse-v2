/**
 * Read-only coordination bridge — Central Brain owns awareness; Context Arbitration owns selection.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { summarizeArbitration } from './context-arbitration-engine.js';
import type { ArbitrationSummary, ContextArbitrationResult } from './types.js';

let latestPublishedSummary: ArbitrationSummary | null = null;

export function publishArbitrationSummary(result: ContextArbitrationResult): ArbitrationSummary {
  const summary: ArbitrationSummary = {
    arbitrationId: result.arbitrationId,
    selectedCount: result.selectedContext.length,
    ignoredCount: result.ignoredContext.length,
    summary: summarizeArbitration(result),
    publishedAt: Date.now(),
  };
  latestPublishedSummary = { ...summary };
  return { ...summary };
}

export function getLatestArbitrationSummary(): ArbitrationSummary | null {
  return latestPublishedSummary ? { ...latestPublishedSummary } : null;
}

export function assertCentralBrainOwnershipUnchanged(): boolean {
  const brain = getDevPulseV2CentralBrainAuthority();
  return (
    brain.constructor.name === 'DevPulseV2CentralBrainAuthority' &&
    typeof brain.getBrainState === 'function' &&
    typeof (brain as { arbitrateContext?: unknown }).arbitrateContext === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetContextBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
