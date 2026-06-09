/**
 * World 2 governance gate checker — evaluates gates without activating execution.
 */

import type { World2GovernanceGate, World2GovernanceGateReport } from './world2-execution-activation-types.js';
import type { World2WorkspaceIsolationReport } from './world2-execution-activation-types.js';
import type { RuntimeVerificationReport } from '../runtime-verification-layer/runtime-verification-types.js';

let reportCounter = 0;
let gateCounter = 0;

function nextReportId(): string {
  reportCounter += 1;
  return `w2gov-${reportCounter.toString().padStart(4, '0')}`;
}

function nextGateId(): string {
  gateCounter += 1;
  return `w2gate-${gateCounter.toString().padStart(3, '0')}`;
}

export function resetWorld2GovernanceCounterForTests(): void {
  reportCounter = 0;
  gateCounter = 0;
}

export function checkWorld2GovernanceGates(
  isolation: World2WorkspaceIsolationReport,
  verification: RuntimeVerificationReport,
): World2GovernanceGateReport {
  const gates: World2GovernanceGate[] = [
    {
      gateId: nextGateId(),
      name: 'World 2 workspace isolation gate',
      required: true,
      satisfied: isolation.world2Isolated && isolation.world1Protected,
      summary: 'World 2 workspace must be isolated; World 1 must remain protected',
      simulationOnly: true,
    },
    {
      gateId: nextGateId(),
      name: 'Founder approval gate',
      required: true,
      satisfied: false,
      summary: 'Founder approval required before any future World 2 execution activation',
      simulationOnly: true,
    },
    {
      gateId: nextGateId(),
      name: 'Runtime verification gate',
      required: true,
      satisfied: verification.verificationScore >= 50,
      summary: `Runtime verification score ${verification.verificationScore}/100 — chain structurally verified`,
      simulationOnly: true,
    },
    {
      gateId: nextGateId(),
      name: 'No World 1 modification gate',
      required: true,
      satisfied: isolation.noWorld1ModificationPath,
      summary: 'World 2 activation must not modify World 1 control system',
      simulationOnly: true,
    },
    {
      gateId: nextGateId(),
      name: 'Rollback readiness gate',
      required: true,
      satisfied: true,
      summary: 'Rollback plan available from auto-fix runtime — simulation only',
      simulationOnly: true,
    },
    {
      gateId: nextGateId(),
      name: 'Operator feed visibility gate',
      required: true,
      satisfied: true,
      summary: 'Operator feed publishes World 2 activation planning stages',
      simulationOnly: true,
    },
    {
      gateId: nextGateId(),
      name: 'Failure visibility gate',
      required: true,
      satisfied: true,
      summary: 'Failed isolation/gate checks surface in failure visibility',
      simulationOnly: true,
    },
    {
      gateId: nextGateId(),
      name: 'Testing simulation gate',
      required: true,
      satisfied: verification.testingPlan.planningOnly === true,
      summary: 'Testing remains simulation-only — no test execution in Phase 15.1',
      simulationOnly: true,
    },
  ];

  const requiredGates = gates.filter((g) => g.required);
  const allRequiredSatisfied = requiredGates.every((g) => g.satisfied);

  return {
    reportId: nextReportId(),
    gates,
    allRequiredSatisfied,
    approvalRequired: true,
    simulationOnly: true,
  };
}
