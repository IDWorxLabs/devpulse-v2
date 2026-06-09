/**
 * World 2 activation readiness evaluator.
 */

import type {
  World2ActivationReadinessReport,
  World2ActivationState,
  World2ActivationConfidence,
} from './world2-execution-activation-types.js';
import type { World2GovernanceGateReport } from './world2-execution-activation-types.js';
import type { World2WorkspaceIsolationReport } from './world2-execution-activation-types.js';
import type { World2RuntimeChainLink } from './world2-execution-activation-types.js';

let reportCounter = 0;

function nextReportId(): string {
  reportCounter += 1;
  return `w2rdy-${reportCounter.toString().padStart(4, '0')}`;
}

export function resetWorld2ActivationReadinessCounterForTests(): void {
  reportCounter = 0;
}

function resolveActivationState(blocked: boolean, gates: World2GovernanceGateReport): World2ActivationState {
  if (blocked) return 'BLOCKED';
  if (!gates.allRequiredSatisfied) return 'WAITING_APPROVAL';
  if (gates.approvalRequired) return 'SIMULATION_ONLY';
  return 'READY_FOR_FUTURE_ACTIVATION';
}

function confidenceFromPlan(blocked: boolean, blockerCount: number): World2ActivationConfidence {
  if (blocked || blockerCount > 6) return 'LOW';
  if (blockerCount <= 4) return 'MEDIUM';
  return 'LOW';
}

export function evaluateWorld2ActivationReadiness(opts: {
  isolation: World2WorkspaceIsolationReport;
  governance: World2GovernanceGateReport;
  runtimeChain: World2RuntimeChainLink;
}): {
  readinessReport: World2ActivationReadinessReport;
  state: World2ActivationState;
  blocked: boolean;
  blockers: string[];
  confidence: World2ActivationConfidence;
  readiness: string;
} {
  const blockers = [
    'Phase 15.1 World 2 Execution Activation — activation foundation only, no real execution',
    'No file writes, no apply operations, no test execution, no shell commands',
    'World 1 protected — World 2 activation must not modify World 1',
    'Execution remains blocked — executionAllowed must stay false',
    'Code generation remains proposal-only; testing and auto-fix remain simulation-only',
    'Founder approval required before any future World 2 governed execution',
  ];

  if (!opts.isolation.world1Protected || !opts.isolation.world2Isolated) {
    blockers.push('World 2 workspace isolation or World 1 protection check failed');
  }

  if (!opts.governance.allRequiredSatisfied) {
    for (const gate of opts.governance.gates.filter((g) => g.required && !g.satisfied)) {
      blockers.push(`Governance gate unsatisfied: ${gate.name}`);
    }
  }

  if (opts.runtimeChain.executionAllowed) {
    blockers.push('Runtime chain executionAllowed must remain false');
  }

  const blocked = blockers.length > 0;
  const state = resolveActivationState(blocked, opts.governance);
  const readinessLabel = `isolation: ${opts.isolation.world2Isolated ? 'OK' : 'FAIL'} | gates: ${opts.governance.gates.filter((g) => g.satisfied).length}/${opts.governance.gates.length} | ${state}`;

  const readinessReport: World2ActivationReadinessReport = {
    reportId: nextReportId(),
    readiness: readinessLabel,
    canActivateNow: false,
    blocked: blocked || state === 'BLOCKED',
    blockers,
    approvalRequired: true,
    simulationOnly: true,
  };

  return {
    readinessReport,
    state,
    blocked: blocked || state === 'BLOCKED',
    blockers,
    confidence: confidenceFromPlan(blocked, blockers.length),
    readiness: readinessLabel,
  };
}
