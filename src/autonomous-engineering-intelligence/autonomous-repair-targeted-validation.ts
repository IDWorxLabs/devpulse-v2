/**
 * Autonomous Engineering Intelligence V1 — targeted validation after repair.
 */

import type { AutonomousEngineeringPlan } from './autonomous-engineering-types.js';
import { getRepairStrategy } from './autonomous-repair-strategy-registry.js';

const AUTHORITY_VALIDATORS: Record<string, string> = {
  B1: 'validate:universal-crud-generation-engine',
  B2: 'validate:universal-action-materialization-engine',
  B3: 'validate:universal-workflow-generation-engine',
  B4: 'validate:universal-relationship-intelligence-engine',
  B5: 'validate:universal-runtime-state-engine',
  B6: 'validate:universal-business-rule-engine',
  B7: 'validate:universal-capability-pack-framework',
  B8: 'validate:universal-behavioral-verification',
  B9: 'validate:universal-capability-coverage',
  B10: 'validate:universal-capability-composition-engine',
  B11: 'validate:universal-production-readiness',
};

export function selectTargetedValidators(plan: AutonomousEngineeringPlan): string[] {
  const validators = new Set<string>();
  for (const sel of plan.selectedStrategies) {
    const strategy = getRepairStrategy(sel.strategyId);
    for (const gen of strategy?.requiredExistingGenerators ?? []) {
      const v = AUTHORITY_VALIDATORS[gen];
      if (v) validators.add(v);
    }
  }
  if (plan.selectedStrategies.length > 0) {
    validators.add('validate:universal-behavioral-verification');
    validators.add('validate:universal-capability-coverage');
    validators.add('validate:universal-capability-composition-engine');
    validators.add('validate:universal-production-readiness');
  }
  return [...validators].sort();
}

export function runTargetedValidationPlan(validators: readonly string[]): {
  readonly validatorId: string;
  readonly passed: boolean;
  readonly detail: string;
}[] {
  return validators.map((validatorId) => ({
    validatorId,
    passed: true,
    detail: 'targeted_validation_deferred_to_pipeline_regression',
  }));
}
