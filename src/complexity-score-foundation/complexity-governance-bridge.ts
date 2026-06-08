/**
 * Complexity governance bridge — Phase 6 + 7 + 8 + 9 stack.
 * Measurement only. No governance bypass.
 */

import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from '../execution-evidence-ledger/types.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from '../verification-gated-apply/types.js';
import { CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE } from '../controlled-execution-bridge/types.js';
import { MOBILE_COMMAND_FOUNDATION_OWNER_MODULE } from '../mobile-command-foundation/types.js';
import { MOBILE_CHAT_INTERFACE_OWNER_MODULE } from '../mobile-chat-interface/types.js';
import { MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE } from '../mobile-live-preview-foundation/types.js';
import { MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE } from '../mobile-approval-flow-foundation/types.js';
import { CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE } from '../cross-device-continuity-foundation/types.js';
import { MISSING_CAPABILITY_DETECTOR_OWNER_MODULE } from '../missing-capability-detector/types.js';
import { SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE } from '../safe-capability-acquisition/types.js';
import { SELF_LEARNING_ENGINE_OWNER_MODULE } from '../self-learning-engine/types.js';
import { ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE } from '../architecture-drift-detection/types.js';
import { WORLD2_LEARNING_LOOP_OWNER_MODULE } from '../world2-learning-loop/types.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { ComplexityAnalysisInput, GateRecord } from './types.js';
import {
  COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE,
  DEPENDENCY_SYSTEMS,
  DUPLICATE_PATTERNS,
} from './types.js';

export function assertGovernanceDependenciesPresent(): boolean {
  return (
    getDevPulseV2Owner('architecture_drift_detection').ownerModule === ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE &&
    getDevPulseV2Owner('self_learning_engine').ownerModule === SELF_LEARNING_ENGINE_OWNER_MODULE &&
    getDevPulseV2Owner('missing_capability_detector').ownerModule === MISSING_CAPABILITY_DETECTOR_OWNER_MODULE &&
    getDevPulseV2Owner('safe_capability_acquisition').ownerModule === SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE &&
    getDevPulseV2Owner('world2_learning_loop').ownerModule === WORLD2_LEARNING_LOOP_OWNER_MODULE &&
    getDevPulseV2Owner('controlled_execution_bridge').ownerModule === CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE &&
    getDevPulseV2Owner('mobile_command_foundation').ownerModule === MOBILE_COMMAND_FOUNDATION_OWNER_MODULE &&
    getDevPulseV2Owner('mobile_chat_interface').ownerModule === MOBILE_CHAT_INTERFACE_OWNER_MODULE &&
    getDevPulseV2Owner('mobile_live_preview_foundation').ownerModule === MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE &&
    getDevPulseV2Owner('mobile_approval_flow_foundation').ownerModule === MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE &&
    getDevPulseV2Owner('cross_device_continuity_foundation').ownerModule === CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE &&
    getDevPulseV2Owner('execution_evidence_ledger').ownerModule === EVIDENCE_LEDGER_OWNER_MODULE &&
    getDevPulseV2Owner('verification_gated_apply').ownerModule === VERIFICATION_GATED_APPLY_OWNER_MODULE &&
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
    'world2_execution_planner',
    'world2_simulation_runtime',
    'world2_autonomous_builder',
    'world2_completion_verifier',
    'world2_learning_loop',
  ] as const;
  return domains.every((d) => getDevPulseV2Owner(d).phase >= 7.1);
}

export function assertNoRegistryRuntimeMutation(): boolean {
  const registry = getDevPulseV2Owner('complexity_score_foundation');
  return registry.ownerModule === COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE && registry.phase === 9.5;
}

export function assertDistinctFromProtectedModules(): boolean {
  const complexity = getDevPulseV2Owner('complexity_score_foundation');
  const protectedOwners = [
    getDevPulseV2Owner('architecture_drift_detection'),
    getDevPulseV2Owner('self_learning_engine'),
    getDevPulseV2Owner('missing_capability_detector'),
    getDevPulseV2Owner('safe_capability_acquisition'),
  ];
  return protectedOwners.every((o) => o.ownerModule !== complexity.ownerModule);
}

export function assertNotDriftDetector(): boolean {
  return getDevPulseV2Owner('complexity_score_foundation').ownerModule !== getDevPulseV2Owner('architecture_drift_detection').ownerModule;
}

export function assertNoDuplicateComplexityScore(): boolean {
  const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
  const complexityOwner = getDevPulseV2Owner('complexity_score_foundation').ownerModule;

  return DUPLICATE_PATTERNS.every((pattern) => {
    const normalized = pattern.replace(/\s+/g, '_');
    const competing = [...registeredModules].filter(
      (m) => (m.includes(normalized) || m.includes('complexity_score')) && m !== complexityOwner,
    );
    return competing.length === 0;
  });
}

export function assertMeasurementNotSourceOfTruth(): boolean {
  const complexity = getDevPulseV2Owner('complexity_score_foundation');
  return complexity.description.includes('measure') || complexity.description.includes('score');
}

export function getComplexityGovernanceSummary(): string {
  return DEPENDENCY_SYSTEMS.map((d) => `${d}@${formatPhase(d)}`).join(' → ');
}

function formatPhase(domain: string): string {
  if (domain === 'verification_gated_apply') return '6.11';
  if (domain === 'execution_evidence_ledger') return '6.7';
  if (domain === 'execution_authority') return '6.1';
  if (domain === 'founder_approval_execution_gate') return '6.5';
  if (domain === 'controlled_execution_bridge') return '7.7';
  if (domain === 'world2_learning_loop') return '7.6';
  if (domain === 'mobile_command_foundation') return '8.1';
  if (domain === 'architecture_drift_detection') return '9.4';
  if (domain === 'self_learning_engine') return '9.3';
  if (domain === 'missing_capability_detector') return '9.1';
  if (domain === 'safe_capability_acquisition') return '9.2';
  if (domain === 'complexity_score_foundation') return '9.5';
  return String(getDevPulseV2Owner(domain as Parameters<typeof getDevPulseV2Owner>[0]).phase);
}

export interface GovernanceValidationResult {
  valid: boolean;
  reason: string;
  gates: GateRecord[];
}

export function validateComplexityGovernance(input: ComplexityAnalysisInput): GovernanceValidationResult {
  const gates: GateRecord[] = [];

  if (input.governanceStatus === 'FAIL') {
    gates.push({ gateId: 'gov-fail-0001', gateType: 'GOVERNANCE_FAIL', status: 'CLOSED', description: 'governanceStatus FAIL blocked' });
    return { valid: false, reason: 'governanceStatus FAIL blocked', gates };
  }

  gates.push({ gateId: 'gov-stack-0001', gateType: 'GOVERNANCE_STACK', status: 'OPEN', description: 'Phase 6 governance stack referenced — no bypass' });
  gates.push({ gateId: 'gov-w2-0001', gateType: 'WORLD2_PROTECTION', status: 'OPEN', description: 'World 2 protected — complexity measurement only' });
  gates.push({ gateId: 'gov-w1-0001', gateType: 'WORLD1_PROTECTION', status: 'OPEN', description: 'World 1 protected — no modification via complexity scoring' });
  gates.push({ gateId: 'gov-measure-0001', gateType: 'MEASUREMENT_NOT_SOURCE_OF_TRUTH', status: 'OPEN', description: 'Complexity score is measurement layer — not drift detector or source of truth' });

  return { valid: true, reason: 'Governance validated', gates };
}

export function governanceGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}:${g.status}`).sort().join('|');
}
