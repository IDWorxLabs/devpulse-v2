/**
 * Universal Business Rule Engine V1 — aggregation over real source collections.
 *
 * Aggregations always read the supplied source collection; there is no path
 * that returns a placeholder value when the collection is absent — a missing
 * collection is an explicit error result.
 */

import { evaluateRule, type RuleInputBag } from './business-rule-evaluation-engine.js';
import type { RuleEvaluationResult } from './business-rule-result-model.js';
import type { RuleRuntimeValue } from './business-rule-operator-registry.js';
import type { UniversalBusinessRuleDescriptor } from './universal-business-rule-types.js';

export type EmptyCollectionPolicy = 'RETURN_ZERO' | 'RETURN_NULL' | 'FAIL';

export function runAggregationRule(
  descriptor: UniversalBusinessRuleDescriptor,
  sourceRecords: readonly RuleRuntimeValue[],
  extraInputs: RuleInputBag = {},
  emptyPolicy: EmptyCollectionPolicy = 'RETURN_ZERO',
): RuleEvaluationResult {
  const collectionInputName = descriptor.inputDefinitions.find((def) => def.type === 'collection')?.name;
  if (!collectionInputName) {
    return {
      ruleId: descriptor.ruleId,
      status: 'INVALID',
      value: null,
      expectedType: descriptor.outputType,
      actualType: 'null',
      violations: [],
      explanation: 'Aggregation rule declares no collection input',
      dependencyResults: [],
      provenance: descriptor.provenance,
      version: descriptor.version,
    };
  }

  if (sourceRecords.length === 0 && emptyPolicy !== 'FAIL') {
    const value = emptyPolicy === 'RETURN_ZERO' ? 0 : null;
    return {
      ruleId: descriptor.ruleId,
      status: 'VALUE',
      value,
      expectedType: descriptor.outputType,
      actualType: value === null ? 'null' : 'number',
      violations: [],
      explanation: `Empty collection → ${String(value)} per ${emptyPolicy} policy`,
      dependencyResults: [],
      provenance: descriptor.provenance,
      version: descriptor.version,
    };
  }

  return evaluateRule(descriptor, { ...extraInputs, [collectionInputName]: sourceRecords });
}
