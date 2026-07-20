/**
 * Universal Business Rule Engine V1 — deterministic dependency resolution.
 */

import type { UniversalBusinessRuleDescriptor } from './universal-business-rule-types.js';

export interface RuleDependencyIssue {
  readonly code: 'missing_dependency' | 'circular_dependency' | 'ambiguous_dependency';
  readonly ruleId: string;
  readonly detail: string;
}

export interface RuleDependencyResolution {
  readonly evaluationOrder: readonly string[];
  readonly issues: readonly RuleDependencyIssue[];
}

/**
 * Topologically sorts rules by rule-to-rule dependencies (dependencies that
 * reference other rule IDs). Non-rule dependencies (fields, collections) are
 * treated as external inputs. Detects cycles and missing rule dependencies.
 */
export function resolveRuleDependencies(
  descriptors: readonly UniversalBusinessRuleDescriptor[],
): RuleDependencyResolution {
  const issues: RuleDependencyIssue[] = [];
  const byId = new Map(descriptors.map((d) => [d.ruleId, d]));
  const sortedIds = [...byId.keys()].sort();

  const ruleDeps = new Map<string, string[]>();
  for (const id of sortedIds) {
    const descriptor = byId.get(id)!;
    const deps: string[] = [];
    for (const dep of descriptor.dependencies) {
      if (dep.startsWith('rule-')) {
        if (!byId.has(dep)) {
          issues.push({ code: 'missing_dependency', ruleId: id, detail: `Rule depends on unknown rule '${dep}'` });
          continue;
        }
        deps.push(dep);
      }
    }
    ruleDeps.set(id, deps.sort());
  }

  const order: string[] = [];
  const state = new Map<string, 'visiting' | 'done'>();

  const visit = (id: string, chain: string[]): void => {
    const current = state.get(id);
    if (current === 'done') return;
    if (current === 'visiting') {
      issues.push({
        code: 'circular_dependency',
        ruleId: id,
        detail: `Circular rule dependency: ${[...chain, id].join(' → ')}`,
      });
      return;
    }
    state.set(id, 'visiting');
    for (const dep of ruleDeps.get(id) ?? []) {
      visit(dep, [...chain, id]);
    }
    state.set(id, 'done');
    order.push(id);
  };

  for (const id of sortedIds) visit(id, []);

  const hasCycle = issues.some((issue) => issue.code === 'circular_dependency');
  return { evaluationOrder: hasCycle ? [] : order, issues };
}
