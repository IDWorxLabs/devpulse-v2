/**
 * Autonomous Completion Engine — loop guard (detection only).
 */

import type {
  CompletionInput,
  CompletionLoopGuardResult,
  LoopGuardStatus,
} from './autonomous-completion-engine-types.js';
import { COMPLETION_LOOP_THRESHOLD } from './autonomous-completion-engine-types.js';

let loopGuardDetectionCount = 0;

export function evaluateCompletionLoopGuard(input: CompletionInput): CompletionLoopGuardResult {
  const reasoning: string[] = [];
  const testingCycles = input.testingCycles ?? 0;
  const fixingCycles = input.fixingCycles ?? 0;
  const verificationCycles = input.verificationCycles ?? 0;
  const completionEvaluations = input.completionEvaluations ?? 0;

  let status: LoopGuardStatus = 'OK';

  if (testingCycles >= COMPLETION_LOOP_THRESHOLD) {
    status = 'LOOP_DETECTED';
    reasoning.push(`Testing cycle threshold exceeded (${testingCycles} >= ${COMPLETION_LOOP_THRESHOLD})`);
  }

  if (fixingCycles >= COMPLETION_LOOP_THRESHOLD) {
    status = 'LOOP_DETECTED';
    reasoning.push(`Fixing cycle threshold exceeded (${fixingCycles} >= ${COMPLETION_LOOP_THRESHOLD})`);
  }

  if (verificationCycles >= COMPLETION_LOOP_THRESHOLD) {
    status = 'LOOP_DETECTED';
    reasoning.push(`Verification cycle threshold exceeded (${verificationCycles} >= ${COMPLETION_LOOP_THRESHOLD})`);
  }

  if (completionEvaluations >= COMPLETION_LOOP_THRESHOLD + 2) {
    status = 'LOOP_DETECTED';
    reasoning.push(`Completion evaluation threshold exceeded (${completionEvaluations})`);
  }

  if ((input.repeatFailures ?? 0) >= COMPLETION_LOOP_THRESHOLD) {
    status = 'LOOP_DETECTED';
    reasoning.push(`Repeated failure threshold exceeded (${input.repeatFailures})`);
  }

  if (status === 'LOOP_DETECTED') {
    loopGuardDetectionCount += 1;
    reasoning.push('Recommend escalation or trust recovery rather than repeating identical actions');
  } else {
    reasoning.push('No autonomous loop detected');
  }

  return {
    status,
    testingCycles,
    fixingCycles,
    verificationCycles,
    completionEvaluations,
    reasoning,
  };
}

export function getCompletionLoopGuardDetectionCount(): number {
  return loopGuardDetectionCount;
}

export function resetCompletionLoopGuardForTests(): void {
  loopGuardDetectionCount = 0;
}
