/**
 * Execution governance — Phase 14.1 readiness-only authority rules.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import {
  EXECUTION_RUNTIME_OWNER_MODULE,
  FORBIDDEN_EXECUTION_RUNTIME_DUPLICATES,
  type ExecutionReadinessReport,
} from './execution-runtime-types.js';
import { foundationBlocksRealExecution } from './execution-safety-boundary.js';

export function assertExecutionRuntimeOwnership(): boolean {
  const owner = getDevPulseV2Owner('execution_runtime');
  return owner.ownerModule === EXECUTION_RUNTIME_OWNER_MODULE && owner.phase === 14.1;
}

export function assertNoDuplicateExecutionRuntimeAuthority(): boolean {
  const owners = FORBIDDEN_EXECUTION_RUNTIME_DUPLICATES.map((dup) => {
    try {
      return getDevPulseV2Owner(dup as never);
    } catch {
      return null;
    }
  });
  return owners.every((o) => o === null);
}

export function governanceAllowsPacketCreation(): boolean {
  return assertExecutionRuntimeOwnership() && foundationBlocksRealExecution();
}

export function governanceAllowsStateCreation(): boolean {
  return governanceAllowsPacketCreation();
}

export function governanceForbidsActionExecution(): true {
  return true;
}

export function applyGovernanceToReadiness(report: ExecutionReadinessReport): ExecutionReadinessReport {
  return {
    ...report,
    executionAllowed: false,
    basis: `${report.basis} Phase 14.1 foundation — readiness evaluation only; no real execution.`,
    simulationOnly: true,
  };
}

export function requiredApprovalGates(): string[] {
  return [
    'founder_approval_execution_gate',
    'execution_command_gate',
    'execution_verification_loop',
    'controlled_execution_bridge',
  ];
}
