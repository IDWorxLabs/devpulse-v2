/**
 * Universal Business Rule Engine V1 — derived value recomputation.
 *
 * Derived values are read-only outputs of exactly one active rule authority.
 * They are recomputed whenever a dependency changes; manual mutation is not
 * exposed by this engine.
 */

import { evaluateRule, type RuleInputBag } from './business-rule-evaluation-engine.js';
import { RuleMemoizationCache } from './business-rule-memoization.js';
import type { RuleEvaluationResult } from './business-rule-result-model.js';
import type { UniversalBusinessRuleDescriptor } from './universal-business-rule-types.js';

export class DerivedValueEngine {
  private readonly cache = new RuleMemoizationCache();

  constructor(private readonly descriptors: readonly UniversalBusinessRuleDescriptor[]) {}

  /** Computes (or returns memoized) derived value. Memo key includes inputs + rule version. */
  compute(descriptor: UniversalBusinessRuleDescriptor, inputs: RuleInputBag): RuleEvaluationResult {
    const memoized = this.cache.get(descriptor, inputs);
    if (memoized) return memoized;
    const result = evaluateRule(descriptor, inputs);
    if (result.status === 'VALUE' || result.status === 'PASSED' || result.status === 'FAILED') {
      this.cache.set(descriptor, inputs, result);
    }
    return result;
  }

  /** Invalidate every derived value depending on the changed dependency. */
  invalidateDependency(changedRuleId: string): string[] {
    return this.cache.invalidateDependents(changedRuleId, this.descriptors);
  }

  memoSize(): number {
    return this.cache.size();
  }
}
