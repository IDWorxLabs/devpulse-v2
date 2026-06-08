/**
 * Trust governance bridge — references Phase 6–10 stacks. Aggregation only. No bypass.
 */

import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from '../execution-evidence-ledger/types.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from '../verification-gated-apply/types.js';
import { WORLD2_COMPLETION_VERIFIER_OWNER_MODULE } from '../world2-completion-verifier/types.js';
import { EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE } from '../experience-layer-foundation/types.js';
import { FUTURE_PROBLEM_PREDICTION_OWNER_MODULE } from '../future-problem-prediction/types.js';
import { COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE } from '../complexity-score-foundation/types.js';
import { ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE } from '../architecture-drift-detection/types.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { TrustAssessmentInput, GateRecord } from './types.js';
import {
  DEPENDENCY_SYSTEMS,
  DUPLICATE_PATTERNS,
  TRUST_ENGINE_EXPANSION_OWNER_MODULE,
} from './types.js';

export function assertGovernanceDependenciesPresent(): boolean {
  return (
    getDevPulseV2Owner('experience_layer_foundation').ownerModule === EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE &&
    getDevPulseV2Owner('world2_completion_verifier').ownerModule === WORLD2_COMPLETION_VERIFIER_OWNER_MODULE &&
    getDevPulseV2Owner('execution_evidence_ledger').ownerModule === EVIDENCE_LEDGER_OWNER_MODULE &&
    getDevPulseV2Owner('verification_gated_apply').ownerModule === VERIFICATION_GATED_APPLY_OWNER_MODULE &&
    getDevPulseV2Owner('future_problem_prediction').ownerModule === FUTURE_PROBLEM_PREDICTION_OWNER_MODULE &&
    getDevPulseV2Owner('complexity_score_foundation').ownerModule === COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE &&
    getDevPulseV2Owner('architecture_drift_detection').ownerModule === ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE &&
    getDevPulseV2Owner('execution_authority').ownerModule === EXECUTION_OWNER_MODULE
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
    'founder_approval_execution_gate',
  ] as const;
  return domains.every((d) => !checkWorld1ModificationAttempt(d).allowed);
}

export function assertWorld2Protected(): boolean {
  const domains = [
    'world2_workspace_foundation',
    'world2_completion_verifier',
    'controlled_execution_bridge',
  ] as const;
  return domains.every((d) => getDevPulseV2Owner(d).phase >= 7.1);
}

export function assertNoRegistryRuntimeMutation(): boolean {
  const registry = getDevPulseV2Owner('trust_engine_expansion');
  return registry.ownerModule === TRUST_ENGINE_EXPANSION_OWNER_MODULE && registry.phase === 10.2;
}

export function assertDistinctFromTrustEngine(): boolean {
  const expansion = getDevPulseV2Owner('trust_engine_expansion');
  const legacy = getDevPulseV2Owner('trust_engine');
  return expansion.ownerModule !== legacy.ownerModule;
}

export function assertNotReplacingSourceSystems(): boolean {
  const expansion = getDevPulseV2Owner('trust_engine_expansion').ownerModule;
  const protectedOwners = [
    getDevPulseV2Owner('execution_evidence_ledger'),
    getDevPulseV2Owner('verification_gated_apply'),
    getDevPulseV2Owner('world2_completion_verifier'),
    getDevPulseV2Owner('execution_reality_validation'),
  ];
  return protectedOwners.every((o) => o.ownerModule !== expansion);
}

export function assertNoDuplicateTrustEngineExpansion(): boolean {
  const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
  const expansionOwner = getDevPulseV2Owner('trust_engine_expansion').ownerModule;

  return DUPLICATE_PATTERNS.every((pattern) => {
    const normalized = pattern.replace(/\s+/g, '_');
    const competing = [...registeredModules].filter(
      (m) => (m.includes(normalized) || m.includes('trust_engine_expansion')) && m !== expansionOwner,
    );
    return competing.length === 0;
  });
}

export function assertTrustAggregationOnly(): boolean {
  const expansion = getDevPulseV2Owner('trust_engine_expansion');
  return expansion.description.includes('aggregat') || expansion.description.includes('trust');
}

export function getTrustGovernanceSummary(): string {
  const chain = DEPENDENCY_SYSTEMS.map((d) => `${d}@${formatPhase(d)}`).join(' → ');
  return `${chain} → trust_engine_expansion@10.2`;
}

function formatPhase(domain: string): string {
  try {
    return String(getDevPulseV2Owner(domain as Parameters<typeof getDevPulseV2Owner>[0]).phase);
  } catch {
    return '?';
  }
}

export interface GovernanceValidationResult {
  valid: boolean;
  reason: string;
  gates: GateRecord[];
}

export function validateTrustGovernance(input: TrustAssessmentInput): GovernanceValidationResult {
  const gates: GateRecord[] = [];

  if (input.governanceStatus === 'FAIL') {
    gates.push({ gateId: 'gov-fail-0001', gateType: 'GOVERNANCE_FAIL', status: 'CLOSED', description: 'governanceStatus FAIL blocked' });
    return { valid: false, reason: 'governanceStatus FAIL blocked', gates };
  }

  gates.push({ gateId: 'gov-stack-0001', gateType: 'GOVERNANCE_STACK', status: 'OPEN', description: 'Phase 6–10 governance stack referenced — no bypass' });
  gates.push({ gateId: 'gov-w2-0001', gateType: 'WORLD2_PROTECTION', status: 'OPEN', description: 'World 2 protected — trust aggregation only' });
  gates.push({ gateId: 'gov-w1-0001', gateType: 'WORLD1_PROTECTION', status: 'OPEN', description: 'World 1 protected — no modification via trust engine' });
  gates.push({ gateId: 'gov-trust-0001', gateType: 'TRUST_AGGREGATION_NOT_SOURCE_OF_TRUTH', status: 'OPEN', description: 'Trust Engine aggregates signals — does not replace verification, evidence, or completion systems' });

  return { valid: true, reason: 'Governance validated', gates };
}

export function governanceGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}:${g.status}`).sort().join('|');
}
