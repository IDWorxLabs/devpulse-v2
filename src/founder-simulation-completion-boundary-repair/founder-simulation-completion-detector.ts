/**
 * Phase 26.96 — Founder simulation completion detector.
 */

import {
  FOUNDER_SIMULATION_COMPLETE,
  FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  FOUNDER_SIMULATION_STAGE_BUDGET_MS,
} from './founder-simulation-completion-boundary-repair-registry.js';
import type { FounderSimulationCompletionEventId } from './founder-simulation-completion-boundary-repair-types.js';

let completionEventEmitted = false;
let lastCompletionEventId: FounderSimulationCompletionEventId | null = null;

export function resetFounderSimulationCompletionDetectionForTests(): void {
  completionEventEmitted = false;
  lastCompletionEventId = null;
}

export function hasFounderSimulationCompletionEventEmitted(): boolean {
  return completionEventEmitted;
}

export function getLastFounderSimulationCompletionEventId(): FounderSimulationCompletionEventId | null {
  return lastCompletionEventId;
}

export function detectFounderSimulationCompletion(input: {
  resultProduced: boolean;
  degraded: boolean;
  budgetExceeded: boolean;
  errorMessage: string | null;
  elapsedMs: number;
}): {
  readOnly: true;
  complete: boolean;
  eventId: FounderSimulationCompletionEventId;
  reason: string;
} {
  const withinBudget = input.elapsedMs <= FOUNDER_SIMULATION_STAGE_BUDGET_MS;
  const degraded = input.degraded || input.budgetExceeded || Boolean(input.errorMessage) || !withinBudget;

  if (!input.resultProduced && input.errorMessage) {
    return {
      readOnly: true,
      complete: true,
      eventId: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
      reason: input.errorMessage,
    };
  }

  if (input.resultProduced) {
    return {
      readOnly: true,
      complete: true,
      eventId: degraded ? FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS : FOUNDER_SIMULATION_COMPLETE,
      reason: degraded
        ? `Degraded completion (${input.elapsedMs}ms${input.budgetExceeded ? ', budget exceeded' : ''})`
        : `Clean completion (${input.elapsedMs}ms)`,
    };
  }

  return {
    readOnly: true,
    complete: false,
    eventId: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
    reason: 'No simulation result produced',
  };
}

export function emitFounderSimulationCompletionOnce(
  eventId: FounderSimulationCompletionEventId,
): { readOnly: true; emitted: boolean; duplicate: boolean; eventId: FounderSimulationCompletionEventId } {
  if (completionEventEmitted) {
    return {
      readOnly: true,
      emitted: false,
      duplicate: true,
      eventId: lastCompletionEventId ?? eventId,
    };
  }
  completionEventEmitted = true;
  lastCompletionEventId = eventId;
  return { readOnly: true, emitted: true, duplicate: false, eventId };
}
