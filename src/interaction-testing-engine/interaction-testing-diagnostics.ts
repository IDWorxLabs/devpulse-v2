/**
 * Interaction testing diagnostics tracker.
 */

import type { InteractionState, InteractionTestingDiagnostics } from './types.js';

let diagnostics: InteractionTestingDiagnostics = {
  interactionTestingActive: false,
  interactionTestCount: 0,
  blockedInteractionCount: 0,
  completedInteractionCount: 0,
  lastQuery: null,
  lastState: null,
};

export function interactionTestingKey(): string {
  return 'interaction_testing_engine';
}

export function getInteractionTestingDiagnostics(): InteractionTestingDiagnostics {
  return { ...diagnostics };
}

export function resetInteractionTestingDiagnostics(): void {
  diagnostics = {
    interactionTestingActive: false,
    interactionTestCount: 0,
    blockedInteractionCount: 0,
    completedInteractionCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function updateInteractionTestingDiagnostics(query: string, state: InteractionState): void {
  diagnostics.interactionTestingActive = true;
  diagnostics.interactionTestCount += 1;
  diagnostics.lastQuery = query;
  diagnostics.lastState = state;
  if (state === 'BLOCKED') {
    diagnostics.blockedInteractionCount += 1;
  }
  if (state === 'COMPLETED' || state === 'EXECUTING') {
    diagnostics.completedInteractionCount += 1;
  }
}
