/**
 * World 2 simulation governance bridge — connects to workspace foundation, planner, and Phase 6 stack.
 * Simulation only. No governance bypass.
 */

import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { REALITY_VALIDATION_OWNER_MODULE } from '../execution-reality-validation/types.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from '../execution-evidence-ledger/types.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from '../verification-gated-apply/types.js';
import { WORLD2_WORKSPACE_OWNER_MODULE } from '../world2-workspace-foundation/types.js';
import { WORLD2_EXECUTION_PLANNER_OWNER_MODULE } from '../world2-execution-planner/types.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import { DEPENDENCY_SYSTEMS } from './types.js';

export function assertGovernanceDependenciesPresent(): boolean {
  return (
    getDevPulseV2Owner('world2_workspace_foundation').ownerModule === WORLD2_WORKSPACE_OWNER_MODULE &&
    getDevPulseV2Owner('world2_execution_planner').ownerModule === WORLD2_EXECUTION_PLANNER_OWNER_MODULE &&
    getDevPulseV2Owner('execution_reality_validation').ownerModule === REALITY_VALIDATION_OWNER_MODULE &&
    getDevPulseV2Owner('execution_evidence_ledger').ownerModule === EVIDENCE_LEDGER_OWNER_MODULE &&
    getDevPulseV2Owner('verification_gated_apply').ownerModule === VERIFICATION_GATED_APPLY_OWNER_MODULE
  );
}

export function assertNoGovernanceBypass(): boolean {
  const check = checkWorld1ModificationAttempt('verification_gated_apply');
  return !check.allowed && check.verdict === 'WORLD1_PROTECTED';
}

export function assertWorld1Protected(): boolean {
  const domains = [
    'execution_authority',
    'execution_reality_validation',
    'execution_evidence_ledger',
    'verification_gated_apply',
  ] as const;
  return domains.every((d) => !checkWorld1ModificationAttempt(d).allowed);
}

export function getSimulationGovernanceSummary(): string {
  return DEPENDENCY_SYSTEMS.map((d) => `${d}@${formatPhase(d)}`).join(' → ');
}

function formatPhase(domain: string): string {
  if (domain === 'verification_gated_apply') return '6.11';
  if (domain === 'execution_reality_validation') return '6.6';
  if (domain === 'execution_evidence_ledger') return '6.7';
  if (domain === 'world2_workspace_foundation') return '7.1';
  if (domain === 'world2_execution_planner') return '7.2';
  return String(getDevPulseV2Owner(domain as Parameters<typeof getDevPulseV2Owner>[0]).phase);
}

export function assertDistinctFromExecutionPlanner(): boolean {
  const simulation = getDevPulseV2Owner('world2_simulation_runtime');
  const planner = getDevPulseV2Owner('world2_execution_planner');
  return simulation.ownerModule !== planner.ownerModule;
}

export function assertExecutionAuthorityPresent(): boolean {
  return getDevPulseV2Owner('execution_authority').ownerModule === EXECUTION_OWNER_MODULE;
}
