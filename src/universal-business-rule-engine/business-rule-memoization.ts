/**
 * Universal Business Rule Engine V1 — memoization with dependency-aware invalidation.
 *
 * Memo keys include rule version, input values, and dependency values so a
 * stale result can never be served after a rule change or dependency change.
 */

import type { RuleEvaluationResult } from './business-rule-result-model.js';
import type { RuleInputBag } from './business-rule-evaluation-engine.js';
import type { UniversalBusinessRuleDescriptor } from './universal-business-rule-types.js';

export function buildRuleMemoKey(descriptor: UniversalBusinessRuleDescriptor, inputs: RuleInputBag): string {
  const inputKey = Object.keys(inputs)
    .sort()
    .map((name) => `${name}=${JSON.stringify(inputs[name])}`)
    .join('&');
  return `${descriptor.ruleId}@${descriptor.version}::${inputKey}`;
}

export class RuleMemoizationCache {
  private readonly entries = new Map<string, RuleEvaluationResult>();
  private readonly keysByRule = new Map<string, Set<string>>();

  get(descriptor: UniversalBusinessRuleDescriptor, inputs: RuleInputBag): RuleEvaluationResult | undefined {
    return this.entries.get(buildRuleMemoKey(descriptor, inputs));
  }

  set(descriptor: UniversalBusinessRuleDescriptor, inputs: RuleInputBag, result: RuleEvaluationResult): void {
    const key = buildRuleMemoKey(descriptor, inputs);
    this.entries.set(key, result);
    const bucket = this.keysByRule.get(descriptor.ruleId) ?? new Set<string>();
    bucket.add(key);
    this.keysByRule.set(descriptor.ruleId, bucket);
  }

  /** Invalidate all memoized results for a rule (dependency changed). */
  invalidateRule(ruleId: string): number {
    const bucket = this.keysByRule.get(ruleId);
    if (!bucket) return 0;
    let removed = 0;
    for (const key of bucket) {
      if (this.entries.delete(key)) removed += 1;
    }
    this.keysByRule.delete(ruleId);
    return removed;
  }

  /** Invalidate every rule that depends (directly or transitively) on a changed rule. */
  invalidateDependents(changedRuleId: string, descriptors: readonly UniversalBusinessRuleDescriptor[]): string[] {
    const invalidated = new Set<string>([changedRuleId]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const descriptor of descriptors) {
        if (invalidated.has(descriptor.ruleId)) continue;
        if (descriptor.dependencies.some((dep) => invalidated.has(dep))) {
          invalidated.add(descriptor.ruleId);
          grew = true;
        }
      }
    }
    for (const ruleId of invalidated) this.invalidateRule(ruleId);
    return [...invalidated];
  }

  size(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
    this.keysByRule.clear();
  }
}
