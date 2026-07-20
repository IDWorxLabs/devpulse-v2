/**
 * Autonomous Engineering Intelligence V1 — repair strategy registry.
 */

import { createHash } from 'node:crypto';
import type { RepairStrategyDescriptor } from './autonomous-engineering-types.js';
import { AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE } from './autonomous-engineering-types.js';
import { REFERENCE_REPAIR_STRATEGIES } from './strategies/index.js';

const registry = new Map<string, RepairStrategyDescriptor>();

export function bootstrapRepairStrategyRegistry(strategies: readonly RepairStrategyDescriptor[] = REFERENCE_REPAIR_STRATEGIES): void {
  registry.clear();
  for (const s of strategies) {
    registry.set(s.strategyId, s);
  }
}

export function resetRepairStrategyRegistryForTests(): void {
  registry.clear();
  bootstrapRepairStrategyRegistry();
}

export function registerRepairStrategy(strategy: RepairStrategyDescriptor): void {
  if (registry.has(strategy.strategyId)) {
    throw new Error(`duplicate_repair_strategy:${strategy.strategyId}`);
  }
  registry.set(strategy.strategyId, strategy);
}

export function getRepairStrategy(strategyId: string): RepairStrategyDescriptor | undefined {
  return registry.get(strategyId);
}

export function listRepairStrategies(): RepairStrategyDescriptor[] {
  return [...registry.values()].sort((a, b) => a.strategyId.localeCompare(b.strategyId));
}

export function findStrategiesForFinding(diagnosticCode: string, category: string): RepairStrategyDescriptor[] {
  return listRepairStrategies().filter(
    (s) => s.supportedDiagnosticCodes.includes(diagnosticCode) || s.supportedRepairCategories.includes(category as never),
  );
}

export function fingerprintRepairStrategy(strategy: RepairStrategyDescriptor): string {
  return createHash('sha256').update(`${strategy.strategyId}@${strategy.strategyVersion}|${strategy.fingerprint}`).digest('hex').slice(0, 16);
}

export function detectDuplicateRepairStrategy(): string[] {
  return [];
}

export function validateRepairStrategy(strategy: RepairStrategyDescriptor): string[] {
  const errors: string[] = [];
  if (!strategy.strategyId) errors.push('repair_strategy_invalid');
  if (strategy.safetyClassification === 'FORBIDDEN') errors.push('repair_strategy_not_production_ready');
  if (strategy.supportedDiagnosticCodes.length === 0) errors.push('repair_strategy_invalid');
  return errors;
}

export function inspectRepairAuthorityDependencies(strategy: RepairStrategyDescriptor): string[] {
  return [...strategy.requiredExistingGenerators];
}
