/**
 * Autonomous Engineering Intelligence V1 — repair dependency graph.
 */

import type { AutonomousEngineeringPlan } from './autonomous-engineering-types.js';

export function buildRepairDependencyGraph(plan: Pick<AutonomousEngineeringPlan, 'selectedStrategies'>): {
  edges: { from: string; to: string }[];
  order: string[];
  issues: string[];
} {
  const strategyIds = [...new Set(plan.selectedStrategies.map((s) => s.strategyId))].sort();
  const edges: { from: string; to: string }[] = [];
  const issues: string[] = [];

  if (strategyIds.includes('missing-generated-artifact-repair.v1')) {
    for (const dep of ['missing-action-handler-repair.v1', 'missing-runtime-scope-repair.v1']) {
      if (strategyIds.includes(dep)) edges.push({ from: dep, to: 'missing-generated-artifact-repair.v1' });
    }
  }
  if (strategyIds.includes('missing-verification-scenario-repair.v1')) {
    for (const dep of strategyIds.filter((s) => s !== 'missing-verification-scenario-repair.v1' && s !== 'missing-evidence-emission-repair.v1')) {
      edges.push({ from: dep, to: 'missing-verification-scenario-repair.v1' });
    }
  }
  if (strategyIds.includes('missing-evidence-emission-repair.v1')) {
    if (strategyIds.includes('missing-verification-scenario-repair.v1')) {
      edges.push({ from: 'missing-verification-scenario-repair.v1', to: 'missing-evidence-emission-repair.v1' });
    }
  }

  const visited = new Set<string>();
  const order: string[] = [];
  const visit = (id: string, stack: Set<string>) => {
    if (visited.has(id)) return;
    if (stack.has(id)) {
      issues.push('repair_dependency_cycle');
      return;
    }
    stack.add(id);
    for (const e of edges.filter((x) => x.to === id)) visit(e.from, stack);
    stack.delete(id);
    visited.add(id);
    order.push(id);
  };
  for (const id of strategyIds) visit(id, new Set());

  return { edges, order: order.length ? order : strategyIds, issues };
}
