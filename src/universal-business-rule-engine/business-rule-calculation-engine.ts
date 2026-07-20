/**
 * Universal Business Rule Engine V1 — calculation rule facade.
 */

import { evaluateRule, type RuleInputBag } from './business-rule-evaluation-engine.js';
import type { RuleEvaluationResult } from './business-rule-result-model.js';
import type { UniversalBusinessRuleDescriptor } from './universal-business-rule-types.js';

const CALCULATION_KINDS = new Set(['CALCULATION', 'AGGREGATION', 'DERIVED_VALUE']);

export function isCalculationRule(descriptor: UniversalBusinessRuleDescriptor): boolean {
  return CALCULATION_KINDS.has(descriptor.ruleKind);
}

/** Runs all calculation-class rules and returns each deterministic result. */
export function runCalculationRules(
  descriptors: readonly UniversalBusinessRuleDescriptor[],
  inputs: RuleInputBag,
): RuleEvaluationResult[] {
  return descriptors
    .filter(isCalculationRule)
    .filter((descriptor) => descriptor.inputDefinitions.every((def) => def.optional || def.name in inputs))
    .map((descriptor) => evaluateRule(descriptor, inputs));
}
