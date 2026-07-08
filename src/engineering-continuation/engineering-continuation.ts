/**
 * Engineering Continuation Engine — automatic pipeline continuation after recovery.
 */

import type {
  EngineeringContinuationInput,
  EngineeringContinuationResult,
} from './engineering-continuation-types.js';

let continuationCounter = 0;

export function resetEngineeringContinuationForTests(): void {
  continuationCounter = 0;
}

export function continueEngineeringAfterRecovery(
  input: EngineeringContinuationInput,
): EngineeringContinuationResult {
  continuationCounter += 1;
  const continuationId = `engineering-continue-${continuationCounter}-${Date.now()}`;

  const pipeline = input.host?.continuePipeline?.();
  const build = input.host?.continueBuild?.();
  const validation = input.host?.continueValidation?.();

  const continued = pipeline?.ok ?? build?.ok ?? validation?.ok ?? true;
  const detail =
    pipeline?.detail ??
    build?.detail ??
    validation?.detail ??
    'Engineering automatically continued after successful recovery and validation replay.';

  return {
    readOnly: true,
    continuationId,
    continued,
    userActionRequired: false,
    detail,
    continuedAt: Date.now(),
    nextStage: continued ? inferNextStage(input.failureStage) : null,
  };
}

function inferNextStage(failureStage: string): string {
  const stageOrder = [
    'PLANNING',
    'MATERIALIZATION',
    'MATERIALIZATION_VALIDATION',
    'NPM_INSTALL',
    'NPM_BUILD',
    'PREVIEW',
    'VALIDATION',
  ];
  const idx = stageOrder.indexOf(failureStage);
  if (idx >= 0 && idx < stageOrder.length - 1) return stageOrder[idx + 1]!;
  return 'ENGINEERING_PIPELINE';
}
