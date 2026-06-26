/**
 * Missing Capability Evolution Engine — evolution history.
 */

import type { MissingCapabilityEvolutionPipelineResult } from './missing-capability-evolution-types.js';
import { DEFAULT_MAX_EVOLUTION_HISTORY } from './missing-capability-evolution-types.js';

const history: Array<{ pipelineId: string; result: MissingCapabilityEvolutionPipelineResult; recordedAt: number }> = [];

export function resetCapabilityEvolutionHistoryForTests(): void {
  history.length = 0;
}

export function recordCapabilityEvolutionHistory(result: MissingCapabilityEvolutionPipelineResult): void {
  history.push({ pipelineId: result.pipelineId, result, recordedAt: Date.now() });
  while (history.length > DEFAULT_MAX_EVOLUTION_HISTORY) {
    history.shift();
  }
}

export function getCapabilityEvolutionHistorySize(): number {
  return history.length;
}

export function getCapabilityEvolutionHistory(): readonly (typeof history)[number][] {
  return history;
}
