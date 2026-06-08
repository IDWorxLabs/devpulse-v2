/**
 * Implementation Strategy bridge — strategy engine remains owner; planner consumes read-only.
 */

import { getDevPulseV2ImplementationStrategyAuthority } from '../implementation-strategy-engine/implementation-strategy-authority.js';
import { STRATEGY_OWNER_MODULE } from '../implementation-strategy-engine/types.js';
import type { ImplementationStrategy } from '../implementation-strategy-engine/types.js';
import { generateCodePlan } from './code-planning-engine.js';
import { buildPlanDuplicateContextFromBridges } from './code-plan-vault-bridge.js';
import type { CodeGenerationPlan } from './types.js';

export function generatePlanFromStrategy(strategy: ImplementationStrategy): CodeGenerationPlan {
  const context = buildPlanDuplicateContextFromBridges(strategy);
  return generateCodePlan(strategy, context);
}

export function getStrategySummary(strategy: ImplementationStrategy): string {
  const phaseTitles = strategy.phases.map((p) => p.title).join(' → ');
  return (
    `Strategy ${strategy.strategyId}: phases=${strategy.phases.length} ` +
    `status=${strategy.status} order=[${phaseTitles}]`
  );
}

export function assertImplementationStrategyOwnershipUnchanged(): boolean {
  const engine = getDevPulseV2ImplementationStrategyAuthority();
  return (
    engine.constructor.name === 'DevPulseV2ImplementationStrategyAuthority' &&
    typeof engine.generateAndStore === 'function' &&
    typeof (engine as { generateCodePlan?: unknown }).generateCodePlan === 'undefined'
  );
}

export function getImplementationStrategyOwnerForBridge(): string {
  return STRATEGY_OWNER_MODULE;
}
