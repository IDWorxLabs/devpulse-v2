/**
 * World 2 completion verifier governance bridge — connects to World 2 stack and Phase 6.
 * Verification only. No governance bypass.
 */

import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { REALITY_VALIDATION_OWNER_MODULE } from '../execution-reality-validation/types.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from '../execution-evidence-ledger/types.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from '../verification-gated-apply/types.js';
import { WORLD2_WORKSPACE_OWNER_MODULE } from '../world2-workspace-foundation/types.js';
import { WORLD2_EXECUTION_PLANNER_OWNER_MODULE } from '../world2-execution-planner/types.js';
import { WORLD2_SIMULATION_RUNTIME_OWNER_MODULE } from '../world2-simulation-runtime/types.js';
import { WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE } from '../world2-autonomous-builder/types.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import { DEPENDENCY_SYSTEMS } from './types.js';

export function assertGovernanceDependenciesPresent(): boolean {
  return (
    getDevPulseV2Owner('world2_workspace_foundation').ownerModule === WORLD2_WORKSPACE_OWNER_MODULE &&
    getDevPulseV2Owner('world2_execution_planner').ownerModule === WORLD2_EXECUTION_PLANNER_OWNER_MODULE &&
    getDevPulseV2Owner('world2_simulation_runtime').ownerModule === WORLD2_SIMULATION_RUNTIME_OWNER_MODULE &&
    getDevPulseV2Owner('world2_autonomous_builder').ownerModule === WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE &&
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

export function assertNoRegistryRuntimeMutation(): boolean {
  const registry = getDevPulseV2Owner('world2_completion_verifier');
  return registry.ownerModule === 'devpulse_v2_world2_completion_verifier' && registry.phase === 7.5;
}

export function getVerifierGovernanceSummary(): string {
  return DEPENDENCY_SYSTEMS.map((d) => `${d}@${formatPhase(d)}`).join(' → ');
}

function formatPhase(domain: string): string {
  if (domain === 'verification_gated_apply') return '6.11';
  if (domain === 'execution_reality_validation') return '6.6';
  if (domain === 'execution_evidence_ledger') return '6.7';
  if (domain === 'world2_workspace_foundation') return '7.1';
  if (domain === 'world2_execution_planner') return '7.2';
  if (domain === 'world2_simulation_runtime') return '7.3';
  if (domain === 'world2_autonomous_builder') return '7.4';
  return String(getDevPulseV2Owner(domain as Parameters<typeof getDevPulseV2Owner>[0]).phase);
}

export function assertDistinctFromAutonomousBuilder(): boolean {
  const verifier = getDevPulseV2Owner('world2_completion_verifier');
  const builder = getDevPulseV2Owner('world2_autonomous_builder');
  return verifier.ownerModule !== builder.ownerModule;
}

export function assertExecutionAuthorityPresent(): boolean {
  return getDevPulseV2Owner('execution_authority').ownerModule === EXECUTION_OWNER_MODULE;
}
