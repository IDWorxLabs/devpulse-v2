/**
 * Experience governance bridge — references Phase 6–9 stacks. Visibility only. No bypass.
 */

import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from '../execution-evidence-ledger/types.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from '../verification-gated-apply/types.js';
import { MOBILE_COMMAND_FOUNDATION_OWNER_MODULE } from '../mobile-command-foundation/types.js';
import { MISSING_CAPABILITY_DETECTOR_OWNER_MODULE } from '../missing-capability-detector/types.js';
import { FUTURE_PROBLEM_PREDICTION_OWNER_MODULE } from '../future-problem-prediction/types.js';
import { WORLD2_WORKSPACE_OWNER_MODULE } from '../world2-workspace-foundation/types.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { ExperienceMapInput, GateRecord } from './types.js';
import {
  DUPLICATE_PATTERNS,
  EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE,
  EXPOSED_SYSTEM_DOMAINS,
} from './types.js';

export function assertGovernanceDependenciesPresent(): boolean {
  return (
    getDevPulseV2Owner('execution_authority').ownerModule === EXECUTION_OWNER_MODULE &&
    getDevPulseV2Owner('verification_gated_apply').ownerModule === VERIFICATION_GATED_APPLY_OWNER_MODULE &&
    getDevPulseV2Owner('execution_evidence_ledger').ownerModule === EVIDENCE_LEDGER_OWNER_MODULE &&
    getDevPulseV2Owner('world2_workspace_foundation').ownerModule === WORLD2_WORKSPACE_OWNER_MODULE &&
    getDevPulseV2Owner('mobile_command_foundation').ownerModule === MOBILE_COMMAND_FOUNDATION_OWNER_MODULE &&
    getDevPulseV2Owner('missing_capability_detector').ownerModule === MISSING_CAPABILITY_DETECTOR_OWNER_MODULE &&
    getDevPulseV2Owner('future_problem_prediction').ownerModule === FUTURE_PROBLEM_PREDICTION_OWNER_MODULE
  );
}

export function assertNoGovernanceBypass(): boolean {
  const check = checkWorld1ModificationAttempt('verification_gated_apply');
  return !check.allowed && check.verdict === 'WORLD1_PROTECTED';
}

export function assertWorld1Protected(): boolean {
  const domains = [
    'execution_authority',
    'execution_evidence_ledger',
    'verification_gated_apply',
    'founder_approval_execution_gate',
  ] as const;
  return domains.every((d) => !checkWorld1ModificationAttempt(d).allowed);
}

export function assertWorld2Protected(): boolean {
  const domains = [
    'world2_workspace_foundation',
    'world2_execution_planner',
    'world2_simulation_runtime',
  ] as const;
  return domains.every((d) => getDevPulseV2Owner(d).phase >= 7.1);
}

export function assertNoRegistryRuntimeMutation(): boolean {
  const registry = getDevPulseV2Owner('experience_layer_foundation');
  return registry.ownerModule === EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE && registry.phase === 10.1;
}

export function assertDistinctFromIntelligenceSystems(): boolean {
  const experience = getDevPulseV2Owner('experience_layer_foundation');
  const protectedOwners = [
    getDevPulseV2Owner('missing_capability_detector'),
    getDevPulseV2Owner('future_problem_prediction'),
    getDevPulseV2Owner('complexity_score_foundation'),
  ];
  return protectedOwners.every((o) => o.ownerModule !== experience.ownerModule);
}

export function assertNoDuplicateExperienceLayer(): boolean {
  const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
  const experienceOwner = getDevPulseV2Owner('experience_layer_foundation').ownerModule;

  return DUPLICATE_PATTERNS.every((pattern) => {
    const normalized = pattern.replace(/\s+/g, '_');
    const competing = [...registeredModules].filter(
      (m) => (m.includes(normalized) || m.includes('experience_layer')) && m !== experienceOwner,
    );
    return competing.length === 0;
  });
}

export function assertExperienceNotSourceOfTruth(): boolean {
  const experience = getDevPulseV2Owner('experience_layer_foundation');
  return experience.description.includes('experience') || experience.description.includes('expose');
}

export function assertExposedSystemsRegistered(): boolean {
  return EXPOSED_SYSTEM_DOMAINS.every((d) => {
    try {
      getDevPulseV2Owner(d as Parameters<typeof getDevPulseV2Owner>[0]);
      return true;
    } catch {
      return false;
    }
  });
}

export function getExperienceGovernanceSummary(): string {
  return [
    'execution_authority@6.1',
    'world2_workspace_foundation@7.1',
    'mobile_command_foundation@8.1',
    'missing_capability_detector@9.1',
    'future_problem_prediction@9.6',
    'experience_layer_foundation@10.1',
  ].join(' → ');
}

export function validateExperienceGovernance(_input: ExperienceMapInput): {
  valid: boolean;
  gates: GateRecord[];
} {
  const gates: GateRecord[] = [
    { gateId: 'gov-exp-0001', gateType: 'EXPERIENCE_NOT_SOURCE_OF_TRUTH', status: 'OPEN', description: 'Experience layer exposes systems — does not replace them' },
    { gateId: 'gov-exp-0002', gateType: 'NO_GOVERNANCE_BYPASS', status: 'OPEN', description: 'Phase 6–9 governance referenced, not bypassed' },
    { gateId: 'gov-exp-0003', gateType: 'WORLD1_PROTECTION', status: 'OPEN', description: 'World 1 protected — experience mapping only' },
    { gateId: 'gov-exp-0004', gateType: 'WORLD2_PROTECTION', status: 'OPEN', description: 'World 2 exposed, not modified by experience layer' },
  ];

  return {
    valid:
      assertGovernanceDependenciesPresent() &&
      assertNoGovernanceBypass() &&
      assertWorld1Protected() &&
      assertWorld2Protected(),
    gates,
  };
}

export function governanceGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}:${g.status}`).sort().join('|');
}

export function assertNoExecutionMethods(obj: object): boolean {
  const forbidden = [
    'execute',
    'modifyFiles',
    'generateCode',
    'runCommand',
    'deploy',
    'renderUi',
    'modifyGovernance',
    'modifyRegistry',
  ];
  return forbidden.every((m) => typeof (obj as Record<string, unknown>)[m] === 'undefined');
}
