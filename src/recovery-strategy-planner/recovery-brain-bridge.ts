/**
 * Central Brain bridge — awareness owner unchanged; recovery planner publishes summaries only.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { summarizeRecoveryStrategy } from './recovery-strategy-engine.js';
import type { RecoveryStrategy, RecoverySummary } from './types.js';

let latestPublishedSummary: RecoverySummary | null = null;

export function publishRecoverySummary(strategy: RecoveryStrategy): RecoverySummary {
  const summary: RecoverySummary = {
    strategyId: strategy.strategyId,
    codePlanId: strategy.codePlanId,
    scenarioCount: strategy.scenarios.length,
    summary: summarizeRecoveryStrategy(strategy),
    publishedAt: Date.now(),
  };
  latestPublishedSummary = { ...summary };
  return { ...summary };
}

export function getLatestRecoverySummary(): RecoverySummary | null {
  return latestPublishedSummary ? { ...latestPublishedSummary } : null;
}

export function getBrainSummariesForRecoveryDetection(): string[] {
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
    typeof (brain as { generateRecoveryStrategy?: unknown }).generateRecoveryStrategy ===
      'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetRecoveryBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
