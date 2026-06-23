/**
 * Phase 26.93 — Authority recursion guard authority + guard runner (V1).
 */

import { runWithAuthorityExecutionContext } from './authority-execution-context.js';
import {
  detectAuthorityRecursion,
  getAuthorityRecursionDetections,
  resetAuthorityRecursionDetectionsForTests,
} from './authority-recursion-detector.js';
import {
  AUTHORITY_RECURSION_GUARD_CORE_QUESTION,
  AUTHORITY_RECURSION_GUARD_PASS,
  GUARDED_AUTHORITIES,
} from './authority-recursion-guard-registry.js';
import {
  recordAuthorityRecursionGuardReport,
  resetAuthorityRecursionGuardHistoryForTests,
} from './authority-recursion-guard-history.js';
import type {
  AssessAuthorityRecursionGuardInput,
  AuthorityRecursionGuardAssessment,
  AuthorityRecursionGuardReport,
  RunWithAuthorityGuardInput,
} from './authority-recursion-guard-types.js';
import { resetAuthorityExecutionContextForTests } from './authority-execution-context.js';

export function resetAuthorityRecursionGuardModuleForTests(): void {
  resetAuthorityExecutionContextForTests();
  resetAuthorityRecursionDetectionsForTests();
  resetAuthorityRecursionGuardHistoryForTests();
}

let guardCounter = 0;

function nextGuardId(): string {
  guardCounter += 1;
  return `authority-recursion-guard-${guardCounter}-${Date.now()}`;
}

export function runWithAuthorityGuard<T>(input: RunWithAuthorityGuardInput<T>): T {
  const detection = detectAuthorityRecursion(input.authorityName, input.options ?? {});
  if (detection) {
    return input.onRecursion(detection);
  }
  return runWithAuthorityExecutionContext(input.authorityName, input.options ?? {}, input.invoke);
}

export function guardHeavyOrchestrationCall<T>(input: {
  authorityName: RunWithAuthorityGuardInput<T>['authorityName'];
  skip?: boolean;
  precomputed?: T | null | undefined;
  invoke: () => T;
  onBlocked: (detection: NonNullable<ReturnType<typeof detectAuthorityRecursion>>) => T;
}): T | null {
  if (input.skip) return input.precomputed ?? null;
  if (input.precomputed != null) return input.precomputed;

  const detection = detectAuthorityRecursion(input.authorityName, {
    requireHeavyOrchestration: true,
  });
  if (detection) {
    return input.onBlocked(detection);
  }

  return runWithAuthorityGuard({
    authorityName: input.authorityName,
    options: { allowHeavyOrchestration: true },
    invoke: input.invoke,
    onRecursion: input.onBlocked,
  });
}

export function assessAuthorityRecursionGuard(
  input: AssessAuthorityRecursionGuardInput = {},
): AuthorityRecursionGuardAssessment {
  const detections = [...getAuthorityRecursionDetections()];
  const report: AuthorityRecursionGuardReport = {
    readOnly: true,
    guardId: nextGuardId(),
    generatedAt: new Date().toISOString(),
    coreQuestion: AUTHORITY_RECURSION_GUARD_CORE_QUESTION,
    detections,
    guardsApplied: GUARDED_AUTHORITIES,
    passToken: AUTHORITY_RECURSION_GUARD_PASS,
  };

  if (!input.skipHistoryRecording) {
    recordAuthorityRecursionGuardReport(report);
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'AUTHORITY_RECURSION_GUARD_COMPLETE',
    report,
  };
}

export { detectAuthorityRecursion, shouldBlockHeavyOrchestration } from './authority-recursion-detector.js';
export {
  enterAuthorityValidatorMode,
  exitAuthorityValidatorMode,
  isAuthorityValidatorMode,
  getAuthorityCallerStack,
  getCurrentAuthorityExecutionContext,
} from './authority-execution-context.js';

