/**
 * Autonomous Engineering Intelligence V1 — repair plan validation.
 */

import type { AutonomousEngineeringPlan } from './autonomous-engineering-types.js';
import { fingerprintAutonomousEngineeringPlan } from './autonomous-repair-plan-fingerprint.js';
import { buildRepairDependencyGraph } from './autonomous-repair-dependency-graph.js';
import { getRepairStrategy } from './autonomous-repair-strategy-registry.js';
import { detectForbiddenConstitutionalMutation } from './autonomous-repair-mutation-policy.js';

export function validateAutonomousEngineeringPlan(plan: AutonomousEngineeringPlan): string[] {
  const errors: string[] = [];
  if (plan.fingerprint !== fingerprintAutonomousEngineeringPlan(plan)) {
    errors.push('repair_strategy_invalid');
  }
  const graph = buildRepairDependencyGraph(plan);
  if (graph.issues.includes('repair_dependency_cycle')) {
    errors.push('repair_dependency_cycle');
  }
  for (const sel of plan.selectedStrategies) {
    const strategy = getRepairStrategy(sel.strategyId);
    if (!strategy) errors.push('no_repair_strategy');
    if (strategy?.safetyClassification === 'FORBIDDEN') errors.push('unsafe_autonomous_repair');
    for (const deny of strategy?.mutationDenylist ?? []) {
      if (detectForbiddenConstitutionalMutation(deny)) errors.push('forbidden_constitutional_mutation');
    }
  }
  if (plan.selectedStrategies.length === 0 && plan.unresolvedFindings.length === 0 && plan.humanRequiredFindings.length === 0) {
    errors.push('repair_not_required');
  }
  return errors;
}
