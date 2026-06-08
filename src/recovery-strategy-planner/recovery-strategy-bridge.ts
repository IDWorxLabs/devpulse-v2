/**
 * Implementation Strategy bridge — strategy engine remains owner; recovery consumes read-only.
 */

import { getDevPulseV2ImplementationStrategyAuthority } from '../implementation-strategy-engine/implementation-strategy-authority.js';
import { STRATEGY_OWNER_MODULE } from '../implementation-strategy-engine/types.js';
import type { CodeGenerationPlan } from '../code-generation-planner/types.js';
import type { ImplementationStrategy } from '../implementation-strategy-engine/types.js';
import { generateRecoveryFromCodePlan } from './recovery-code-plan-bridge.js';
import type { RecoveryStrategy } from './types.js';

export function generateRecoveryFromStrategy(
  strategy: ImplementationStrategy,
  codePlan: CodeGenerationPlan,
): RecoveryStrategy {
  return generateRecoveryFromCodePlan(codePlan, strategy);
}

export function getStrategySummary(strategy: ImplementationStrategy): string {
  const phaseTitles = strategy.phases.map((p) => p.title).join(' → ');
  return (
    `Implementation strategy ${strategy.strategyId}: phases=${strategy.phases.length} ` +
    `status=${strategy.status} order=[${phaseTitles}]`
  );
}

export function assertImplementationStrategyOwnershipUnchanged(): boolean {
  const engine = getDevPulseV2ImplementationStrategyAuthority();
  return (
    engine.constructor.name === 'DevPulseV2ImplementationStrategyAuthority' &&
    typeof engine.generateAndStore === 'function' &&
    typeof (engine as { generateRecoveryStrategy?: unknown }).generateRecoveryStrategy ===
      'undefined'
  );
}

export function getImplementationStrategyOwnerForBridge(): string {
  return STRATEGY_OWNER_MODULE;
}
