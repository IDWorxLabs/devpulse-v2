/**
 * World 2 Execution Activation diagnostics.
 */

import type {
  World2ExecutionActivationDiagnostics,
  World2ActivationPlan,
} from './world2-execution-activation-types.js';

let diagnostics: World2ExecutionActivationDiagnostics = {
  world2ExecutionActivationActive: false,
  activationPlanCount: 0,
  blockedActivationCount: 0,
  readyForFutureActivationCount: 0,
  lastActivationQuery: null,
  lastActivationReadiness: null,
  isolationStatus: null,
  governanceGateStatus: null,
};

export function getWorld2ExecutionActivationDiagnostics(): World2ExecutionActivationDiagnostics {
  return { ...diagnostics };
}

export function updateWorld2ExecutionActivationDiagnostics(
  query: string,
  plan: World2ActivationPlan,
): void {
  const readyStates = ['READY_FOR_FUTURE_ACTIVATION', 'ACTIVATED_SIMULATION_ONLY', 'SIMULATION_ONLY'];
  const wasReady = readyStates.includes(plan.activationState);

  diagnostics = {
    world2ExecutionActivationActive: true,
    activationPlanCount: diagnostics.activationPlanCount + 1,
    blockedActivationCount: diagnostics.blockedActivationCount + (plan.blocked ? 1 : 0),
    readyForFutureActivationCount:
      diagnostics.readyForFutureActivationCount + (wasReady && !plan.blocked ? 1 : 0),
    lastActivationQuery: query,
    lastActivationReadiness: plan.readiness,
    isolationStatus: plan.isolationReport.world2Isolated
      ? `World 2 isolated — World 1 protected (${plan.isolationReport.targetWorkspaceId})`
      : 'Isolation check failed',
    governanceGateStatus: `${plan.governanceGates.gates.filter((g) => g.satisfied).length}/${plan.governanceGates.gates.length} gates satisfied`,
  };
}

export function resetWorld2ExecutionActivationDiagnostics(): void {
  diagnostics = {
    world2ExecutionActivationActive: false,
    activationPlanCount: 0,
    blockedActivationCount: 0,
    readyForFutureActivationCount: 0,
    lastActivationQuery: null,
    lastActivationReadiness: null,
    isolationStatus: null,
    governanceGateStatus: null,
  };
}

export function world2ExecutionActivationKey(): string {
  const d = diagnostics;
  return [
    String(d.world2ExecutionActivationActive),
    String(d.activationPlanCount),
    String(d.blockedActivationCount),
    String(d.readyForFutureActivationCount),
    d.lastActivationQuery ?? '',
    d.lastActivationReadiness ?? '',
  ].join('|');
}
