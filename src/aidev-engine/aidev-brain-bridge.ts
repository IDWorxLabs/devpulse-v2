/**
 * Central Brain bridge — awareness owner unchanged; AiDev publishes summaries only.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { summarizeBuildRequest } from './aidev-request-intake.js';
import type { AiDevRequest, AiDevSummary } from './types.js';

let latestPublishedSummary: AiDevSummary | null = null;

export function publishAiDevSummary(request: AiDevRequest): AiDevSummary {
  const summary: AiDevSummary = {
    requestId: request.requestId,
    status: request.status,
    summary: summarizeBuildRequest(request),
    publishedAt: Date.now(),
  };
  latestPublishedSummary = { ...summary };
  return { ...summary };
}

export function getLatestAiDevSummary(): AiDevSummary | null {
  return latestPublishedSummary ? { ...latestPublishedSummary } : null;
}

export function assertCentralBrainOwnershipUnchanged(): boolean {
  const brain = getDevPulseV2CentralBrainAuthority();
  return (
    brain.constructor.name === 'DevPulseV2CentralBrainAuthority' &&
    typeof brain.getBrainState === 'function' &&
    typeof (brain as { createBuildRequest?: unknown }).createBuildRequest === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetAiDevBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
