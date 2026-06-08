/**
 * Protection gate engine — evaluates workspace and World 1 protection gates.
 * Classification only. No execution.
 */

import type { BridgeInput, ExecutionReadiness, GateRecord } from './types.js';

export function isGlobalEligibilityMet(input: BridgeInput): boolean {
  return (
    input.founderApproved &&
    input.simulationPassed &&
    ['COMPLETE', 'COMPLETE_WITH_WARNINGS'].includes(input.completionStatus) &&
    (input.completionConfidence === 'MEDIUM' || input.completionConfidence === 'HIGH') &&
    input.workspaceIsolationStatus === 'PASS' &&
    input.world1ProtectionStatus === 'PASS' &&
    input.governanceStatus === 'PASS' &&
    input.verificationRequirements.length > 0 &&
    input.rollbackRequirements.length > 0 &&
    input.riskControls.length > 0
  );
}

export function determineExecutionReadiness(input: BridgeInput, ownershipValid: boolean): ExecutionReadiness {
  if (!ownershipValid) return 'BLOCKED';
  if (input.world1ProtectionStatus !== 'PASS') return 'BLOCKED';
  if (input.workspaceIsolationStatus !== 'PASS') return 'BLOCKED';
  if (input.governanceStatus !== 'PASS') return 'BLOCKED';
  if (['REJECTED', 'NOT_STARTED'].includes(input.completionStatus)) return 'BLOCKED';
  if (!input.simulationPassed) return 'NOT_READY';
  if (!input.founderApproved) return 'NEEDS_FOUNDER_APPROVAL';
  if (input.completionConfidence === 'LOW') return 'NOT_READY';
  if (!['COMPLETE', 'COMPLETE_WITH_WARNINGS'].includes(input.completionStatus)) return 'NOT_READY';
  if (input.verificationRequirements.length === 0) return 'NEEDS_VERIFICATION_GATE';
  if (!isGlobalEligibilityMet(input)) return 'NEEDS_VERIFICATION_GATE';
  return 'READY_FOR_GATED_EXECUTION';
}

export function generateProtectionGates(input: BridgeInput): GateRecord[] {
  return [
    {
      gateId: 'protect-ws-0001',
      gateType: 'WORKSPACE_ISOLATION',
      status: input.workspaceIsolationStatus === 'PASS' ? 'OPEN' : 'CLOSED',
      description: `Workspace isolation: ${input.workspaceIsolationStatus}`,
    },
    {
      gateId: 'protect-w1-0001',
      gateType: 'WORLD1_PROTECTION',
      status: input.world1ProtectionStatus === 'PASS' ? 'OPEN' : 'CLOSED',
      description: `World 1 protection: ${input.world1ProtectionStatus}`,
    },
    {
      gateId: 'protect-gov-0001',
      gateType: 'GOVERNANCE',
      status: input.governanceStatus === 'PASS' ? 'OPEN' : 'CLOSED',
      description: `Governance status: ${input.governanceStatus}`,
    },
    {
      gateId: 'protect-sim-0001',
      gateType: 'SIMULATION_PASSED',
      status: input.simulationPassed ? 'OPEN' : 'CLOSED',
      description: `Simulation passed: ${input.simulationPassed}`,
    },
    {
      gateId: 'protect-complete-0001',
      gateType: 'COMPLETION_STATUS',
      status: ['COMPLETE', 'COMPLETE_WITH_WARNINGS'].includes(input.completionStatus) ? 'OPEN' : 'CLOSED',
      description: `Completion status: ${input.completionStatus}`,
    },
  ];
}

export function protectionGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}|${g.status}`).join(';');
}
