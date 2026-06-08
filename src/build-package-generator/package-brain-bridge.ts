/**
 * Central Brain bridge — awareness owner unchanged; generator publishes summaries only.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { summarizePackages } from './build-package-engine.js';
import type { BuildPackageGenerationResult, PackageSummary } from './types.js';

let latestPublishedSummary: PackageSummary | null = null;

export function publishPackageSummary(result: BuildPackageGenerationResult): PackageSummary {
  const blueprintId = result.packages[0]?.blueprintId ?? 'unknown';
  const summary: PackageSummary = {
    generationId: result.generationId,
    blueprintId,
    packageCount: result.packageCount,
    summary: summarizePackages(result),
    publishedAt: Date.now(),
  };
  latestPublishedSummary = { ...summary };
  return { ...summary };
}

export function getLatestPackageSummary(): PackageSummary | null {
  return latestPublishedSummary ? { ...latestPublishedSummary } : null;
}

export function getBrainSummariesForPackageDetection(): string[] {
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
    typeof (brain as { generateBuildPackages?: unknown }).generateBuildPackages === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetPackageBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
