/**
 * Self Vision runtime diagnostics tracker.
 */

import type { ObservationState, SelfVisionRuntimeDiagnostics } from './types.js';

let diagnostics: SelfVisionRuntimeDiagnostics = {
  selfVisionRuntimeActive: false,
  selfVisionSessionCount: 0,
  blockedObservationCount: 0,
  readyObservationCount: 0,
  lastQuery: null,
  lastState: null,
};

export function selfVisionRuntimeKey(): string {
  return 'self_vision_runtime';
}

export function getSelfVisionRuntimeDiagnostics(): SelfVisionRuntimeDiagnostics {
  return { ...diagnostics };
}

export function resetSelfVisionRuntimeDiagnostics(): void {
  diagnostics = {
    selfVisionRuntimeActive: false,
    selfVisionSessionCount: 0,
    blockedObservationCount: 0,
    readyObservationCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function updateSelfVisionRuntimeDiagnostics(
  query: string,
  state: ObservationState,
  sessionCreated: boolean,
): void {
  diagnostics.selfVisionRuntimeActive = true;
  diagnostics.lastQuery = query;
  diagnostics.lastState = state;
  if (sessionCreated) {
    diagnostics.selfVisionSessionCount += 1;
  }
  if (state === 'OBSERVATION_BLOCKED') {
    diagnostics.blockedObservationCount += 1;
  }
  if (state === 'READY_FOR_OBSERVATION' || state === 'WAITING_FOR_CAPTURE' || state === 'PLANNED') {
    diagnostics.readyObservationCount += 1;
  }
}
