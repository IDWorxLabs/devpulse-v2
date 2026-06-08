/**
 * World 2 governance bridge — connects to Phase 6 stack without bypassing governance.
 */

import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from '../verification-gated-apply/types.js';
import { FOUNDATION_ENFORCEMENT_PASS_TOKEN } from '../foundation/types.js';
import { checkWorld1ModificationAttempt } from './workspace-boundary-rules.js';
import { DEPENDENCY_SYSTEMS } from './types.js';

export function assertGovernanceStackPresent(): boolean {
  return (
    getDevPulseV2Owner('law_enforcement').ownerModule === 'devpulse_v2_foundation_enforcement' &&
    getDevPulseV2Owner('execution_authority').ownerModule === EXECUTION_OWNER_MODULE &&
    getDevPulseV2Owner('verification_gated_apply').ownerModule === VERIFICATION_GATED_APPLY_OWNER_MODULE
  );
}

export function assertNoGovernanceBypassAttempt(): boolean {
  const check = checkWorld1ModificationAttempt('verification_gated_apply');
  return !check.allowed && check.verdict === 'WORLD1_PROTECTED';
}

export function assertWorld1FoundationProtected(): boolean {
  const domains = ['law_enforcement', 'execution_authority', 'verification_gated_apply'] as const;
  return domains.every((d) => !checkWorld1ModificationAttempt(d).allowed);
}

export function getGovernanceBridgeSummary(): string {
  return DEPENDENCY_SYSTEMS.map((d) => `${d}@${formatPhase(d)}`).join(' → ');
}

function formatPhase(domain: string): string {
  if (domain === 'verification_gated_apply') return '6.11';
  if (domain === 'execution_authority') return '6.1';
  return String(getDevPulseV2Owner(domain as Parameters<typeof getDevPulseV2Owner>[0]).phase);
}

export function assertConstitutionReferenced(): boolean {
  return FOUNDATION_ENFORCEMENT_PASS_TOKEN.length > 0;
}

export function assertDistinctFromWorld2IsolationGate(): boolean {
  const workspace = getDevPulseV2Owner('world2_workspace_foundation');
  const isolation = getDevPulseV2Owner('world2_isolation');
  return workspace.ownerModule !== isolation.ownerModule;
}
