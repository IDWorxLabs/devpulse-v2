/**
 * Central Brain bridge — brain remains owner; Execution Authority publishes summaries only.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import type { ExecutionAuthoritySummary } from './types.js';

let latestPublishedSummary: ExecutionAuthoritySummary | null = null;

export function publishExecutionAuthoritySummary(
  summary: ExecutionAuthoritySummary,
): ExecutionAuthoritySummary {
  latestPublishedSummary = {
    ...summary,
  };
  void getDevPulseV2CentralBrainAuthority().getBrainState();
  return { ...latestPublishedSummary };
}

export function getLatestExecutionAuthoritySummary(): ExecutionAuthoritySummary | null {
  return latestPublishedSummary ? { ...latestPublishedSummary } : null;
}

export function assertCentralBrainOwnershipUnchanged(): boolean {
  const brain = getDevPulseV2CentralBrainAuthority();
  return (
    brain.constructor.name === 'DevPulseV2CentralBrainAuthority' &&
    typeof brain.getBrainState === 'function' &&
    typeof (brain as { evaluateExecutionRequest?: unknown }).evaluateExecutionRequest === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetExecutionBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
