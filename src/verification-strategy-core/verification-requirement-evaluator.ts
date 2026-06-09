/**
 * Verification Strategy Core — validator requirement evaluation.
 */

import type {
  VerificationRequirementResult,
  VerificationStrategyInput,
} from './verification-strategy-types.js';

export function evaluateVerificationRequirements(
  input: VerificationStrategyInput,
): VerificationRequirementResult {
  const requiredValidators = new Set<string>();
  const optionalValidators = new Set<string>();
  const reasons: string[] = [];

  const addRequired = (validator: string, reason: string): void => {
    requiredValidators.add(validator);
    reasons.push(reason);
  };

  const addOptional = (validator: string, reason: string): void => {
    optionalValidators.add(validator);
    reasons.push(reason);
  };

  if (input.taskType === 'UI_CHANGE') {
    addRequired('UVL', 'UI change requires UVL coverage');
  }

  if (input.brainChanged || input.taskType === 'BRAIN') {
    addRequired('Intelligence Validation', 'Brain change requires Intelligence Validation');
  }

  if (
    input.cloudRuntimeTouched ||
    input.executionMode === 'CLOUD' ||
    input.executionMode === 'REMOTE' ||
    input.executionMode === 'API' ||
    input.taskType === 'CLOUD'
  ) {
    addRequired('Cloud Validation', 'Cloud change requires Cloud Validation');
  }

  if (input.routingChanged || input.taskType === 'ROUTING') {
    addRequired('Route Validation', 'Routing change requires Route Validation');
  }

  if (
    input.executionMode === 'WORLD2' ||
    input.executionMode === 'AUTONOMOUS' ||
    input.world2ExecutionActive ||
    input.taskType === 'WORLD2' ||
    input.taskType === 'AUTONOMOUS' ||
    input.taskType === 'BUILDER'
  ) {
    addRequired('Execution Validation', 'Execution change requires Execution Validation');
  }

  if (input.taskType === 'RELEASE' || input.releaseReady) {
    addRequired('Release Validation', 'Release preparation requires Release Validation');
  }

  if (input.taskType === 'DATA_MODEL' || input.dataModelChanged) {
    addRequired('Data Model Validation', 'Data model change requires schema validation');
    addOptional('UVL', 'UVL provides supplemental coverage for data model changes');
  }

  if (
    input.taskType === 'ARCHITECTURE' ||
    input.taskType === 'INFRASTRUCTURE' ||
    input.changeScope === 'MAJOR' ||
    input.changeScope === 'LARGE'
  ) {
    addRequired('Runtime', 'Major change requires Runtime validation');
  }

  if (
    input.taskType === 'READ_ONLY' ||
    input.taskType === 'DOCUMENTATION' ||
    input.taskType === 'PLANNING' ||
    input.taskType === 'SUMMARY'
  ) {
    addOptional('UVL', 'Non-execution planning may skip heavy validators');
  }

  if (requiredValidators.size === 0) {
    addRequired('UVL', 'Default UVL coverage for unspecified change surface');
    addOptional('Runtime', 'Runtime validation recommended for general changes');
  }

  for (const v of requiredValidators) {
    optionalValidators.delete(v);
  }

  return {
    requiredValidators: [...requiredValidators],
    optionalValidators: [...optionalValidators],
    reasons,
  };
}
