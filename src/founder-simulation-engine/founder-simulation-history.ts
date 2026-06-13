/**
 * Founder Simulation History — bounded simulation history (max 16).
 */

import { MAX_FOUNDER_SIMULATION_HISTORY } from './founder-simulation-registry.js';
import type { FounderSimulationHistoryEntry, FounderSimulationResult } from './founder-simulation-types.js';

const history: FounderSimulationHistoryEntry[] = [];
const results: FounderSimulationResult[] = [];

export function resetFounderSimulationHistoryForTests(): void {
  history.length = 0;
  results.length = 0;
}

export function recordFounderSimulationResult(result: FounderSimulationResult): void {
  const entry: FounderSimulationHistoryEntry = {
    simulationId: result.simulationId,
    timestamp: result.simulatedAt,
    scenarioType: result.scenarioType,
    readinessScore: result.readinessScore,
    finalVerdict: result.finalVerdict,
    failedStageCount: result.failedStages.length,
  };

  history.unshift(entry);
  results.unshift(result);

  if (history.length > MAX_FOUNDER_SIMULATION_HISTORY) {
    history.length = MAX_FOUNDER_SIMULATION_HISTORY;
  }
  if (results.length > MAX_FOUNDER_SIMULATION_HISTORY) {
    results.length = MAX_FOUNDER_SIMULATION_HISTORY;
  }
}

export function getFounderSimulationHistorySize(): number {
  return history.length;
}

export function getFounderSimulationHistory(): readonly FounderSimulationHistoryEntry[] {
  return [...history];
}

export function getFounderSimulationResults(): readonly FounderSimulationResult[] {
  return [...results];
}

export function getLatestFounderSimulationResult(): FounderSimulationResult | null {
  return results[0] ?? null;
}
