/**
 * Read-only coordination bridge — Central Brain owns awareness; Intent Architecture owns intent.
 * No ownership transfer. No mutation of Central Brain state.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { summarizeIntent } from './intent-extractor.js';
import type { IntentRecord, IntentSummary } from './types.js';

let latestPublishedSummary: IntentSummary | null = null;

export function publishIntentSummary(intent: IntentRecord): IntentSummary {
  const summary: IntentSummary = {
    intentId: intent.intentId,
    intentType: intent.intentType,
    confidence: intent.confidence,
    summary: summarizeIntent(intent),
    publishedAt: Date.now(),
  };
  latestPublishedSummary = { ...summary };
  return { ...summary };
}

export function getLatestIntentSummary(): IntentSummary | null {
  return latestPublishedSummary ? { ...latestPublishedSummary } : null;
}

/** Verify Central Brain ownership unchanged — bridge observes only. */
export function assertCentralBrainOwnershipUnchanged(): boolean {
  const brain = getDevPulseV2CentralBrainAuthority();
  return (
    brain.constructor.name === 'DevPulseV2CentralBrainAuthority' &&
    typeof brain.getBrainState === 'function' &&
    typeof (brain as { extractIntent?: unknown }).extractIntent === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetIntentBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
