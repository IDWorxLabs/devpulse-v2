/**
 * Central Brain bridge — awareness owner unchanged; architect publishes summaries only.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { summarizeArchitecture } from './product-architecture-engine.js';
import type { ArchitectureBlueprint, ArchitectureSummary } from './types.js';

let latestPublishedSummary: ArchitectureSummary | null = null;

export function publishArchitectureSummary(blueprint: ArchitectureBlueprint): ArchitectureSummary {
  const summary: ArchitectureSummary = {
    blueprintId: blueprint.blueprintId,
    requestId: blueprint.requestId,
    componentCount: blueprint.components.length,
    summary: summarizeArchitecture(blueprint),
    publishedAt: Date.now(),
  };
  latestPublishedSummary = { ...summary };
  return { ...summary };
}

export function getLatestArchitectureSummary(): ArchitectureSummary | null {
  return latestPublishedSummary ? { ...latestPublishedSummary } : null;
}

export function getBrainSummariesForDuplicateDetection(): string[] {
  const brain = getDevPulseV2CentralBrainAuthority();
  const state = brain.getBrainState();
  const fromState = state.systems.map((s) => s.summary);
  const fromAdapters = readAllSystemSummaries().map((s) => s.summary);
  return [...new Set([...fromState, ...fromAdapters])];
}

export function assertCentralBrainOwnershipUnchanged(): boolean {
  const brain = getDevPulseV2CentralBrainAuthority();
  return (
    brain.constructor.name === 'DevPulseV2CentralBrainAuthority' &&
    typeof brain.getBrainState === 'function' &&
    typeof (brain as { generateArchitectureBlueprint?: unknown }).generateArchitectureBlueprint ===
      'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetProductBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
