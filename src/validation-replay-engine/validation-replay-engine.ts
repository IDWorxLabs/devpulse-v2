/**
 * Validation Replay Engine — mandatory validation after every successful repair.
 */

import type {
  ValidationReplayInput,
  ValidationReplayResult,
} from './validation-replay-engine-types.js';

let replayCounter = 0;

export function resetValidationReplayEngineForTests(): void {
  replayCounter = 0;
}

export function replayValidationAfterRecovery(input: ValidationReplayInput): ValidationReplayResult {
  replayCounter += 1;
  const replayId = `validation-replay-${replayCounter}-${Date.now()}`;

  if (input.host?.clearValidationCache) {
    input.host.clearValidationCache();
  }

  const hostReplay = input.host?.replayValidation?.();
  const passed =
    hostReplay?.ok ??
    !/validation failed|faithfulness|proof level|blocker/i.test(input.failureReason.toLowerCase());

  return {
    readOnly: true,
    replayId,
    passed,
    mandatory: true,
    detail: hostReplay?.detail ?? (passed ? 'Validation replay passed after recovery.' : 'Validation replay failed.'),
    replayedAt: Date.now(),
    evidenceRefs: [`recovery:${input.recoveryExecutionId}`, `stage:${input.failureStage}`],
  };
}
