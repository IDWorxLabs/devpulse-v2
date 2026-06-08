/**
 * Central Brain bridge — awareness owner unchanged; extractor publishes summaries only.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { summarizeRequirements } from './requirement-extraction-engine.js';
import type { RequirementExtractionResult, RequirementSummary } from './types.js';

let latestPublishedSummary: RequirementSummary | null = null;

export function publishRequirementSummary(result: RequirementExtractionResult): RequirementSummary {
  const summary: RequirementSummary = {
    extractionId: result.extractionId,
    requestId: result.requestId,
    requirementCount: result.requirements.length,
    summary: summarizeRequirements(result),
    publishedAt: Date.now(),
  };
  latestPublishedSummary = { ...summary };
  return { ...summary };
}

export function getLatestRequirementSummary(): RequirementSummary | null {
  return latestPublishedSummary ? { ...latestPublishedSummary } : null;
}

export function assertCentralBrainOwnershipUnchanged(): boolean {
  const brain = getDevPulseV2CentralBrainAuthority();
  return (
    brain.constructor.name === 'DevPulseV2CentralBrainAuthority' &&
    typeof brain.getBrainState === 'function' &&
    typeof (brain as { extractRequirements?: unknown }).extractRequirements === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetRequirementBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
