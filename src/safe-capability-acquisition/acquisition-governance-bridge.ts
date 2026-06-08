/**
 * Safe capability acquisition governance bridge — Phase 6 + 7 + 8 + 9.1 stack.
 * Planning only. No governance bypass.
 */

import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from '../execution-evidence-ledger/types.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from '../verification-gated-apply/types.js';
import { CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE } from '../controlled-execution-bridge/types.js';
import { MOBILE_COMMAND_FOUNDATION_OWNER_MODULE } from '../mobile-command-foundation/types.js';
import { MOBILE_CHAT_INTERFACE_OWNER_MODULE } from '../mobile-chat-interface/types.js';
import { MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE } from '../mobile-live-preview-foundation/types.js';
import { MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE } from '../mobile-approval-flow-foundation/types.js';
import { CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE } from '../cross-device-continuity-foundation/types.js';
import { MISSING_CAPABILITY_DETECTOR_OWNER_MODULE } from '../missing-capability-detector/types.js';
import { WORLD2_EXECUTION_PLANNER_OWNER_MODULE } from '../world2-execution-planner/types.js';
import { WORLD2_SIMULATION_RUNTIME_OWNER_MODULE } from '../world2-simulation-runtime/types.js';
import { WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE } from '../world2-autonomous-builder/types.js';
import { WORLD2_COMPLETION_VERIFIER_OWNER_MODULE } from '../world2-completion-verifier/types.js';
import { WORLD2_LEARNING_LOOP_OWNER_MODULE } from '../world2-learning-loop/types.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { AcquisitionInput, GateRecord } from './types.js';
import { DEPENDENCY_SYSTEMS, SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE } from './types.js';

export function assertGovernanceDependenciesPresent(): boolean {
  return (
    getDevPulseV2Owner('missing_capability_detector').ownerModule === MISSING_CAPABILITY_DETECTOR_OWNER_MODULE &&
    getDevPulseV2Owner('world2_execution_planner').ownerModule === WORLD2_EXECUTION_PLANNER_OWNER_MODULE &&
    getDevPulseV2Owner('world2_simulation_runtime').ownerModule === WORLD2_SIMULATION_RUNTIME_OWNER_MODULE &&
    getDevPulseV2Owner('world2_autonomous_builder').ownerModule === WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE &&
    getDevPulseV2Owner('world2_completion_verifier').ownerModule === WORLD2_COMPLETION_VERIFIER_OWNER_MODULE &&
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
  const registry = getDevPulseV2Owner('safe_capability_acquisition');
  return registry.ownerModule === SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE && registry.phase === 9.2;
}

export function assertDistinctFromMissingCapabilityDetector(): boolean {
  const acquisition = getDevPulseV2Owner('safe_capability_acquisition');
  const detector = getDevPulseV2Owner('missing_capability_detector');
  return acquisition.ownerModule !== detector.ownerModule;
}

export function getAcquisitionGovernanceSummary(): string {
  return DEPENDENCY_SYSTEMS.map((d) => `${d}@${formatPhase(d)}`).join(' → ');
}

function formatPhase(domain: string): string {
  if (domain === 'verification_gated_apply') return '6.11';
  if (domain === 'execution_evidence_ledger') return '6.7';
  if (domain === 'execution_authority') return '6.1';
  if (domain === 'founder_approval_execution_gate') return '6.5';
  if (domain === 'controlled_execution_bridge') return '7.7';
  if (domain === 'world2_execution_planner') return '7.2';
  if (domain === 'world2_simulation_runtime') return '7.3';
  if (domain === 'world2_autonomous_builder') return '7.4';
  if (domain === 'world2_completion_verifier') return '7.5';
  if (domain === 'world2_learning_loop') return '7.6';
  if (domain === 'mobile_command_foundation') return '8.1';
  if (domain === 'mobile_chat_interface') return '8.2';
  if (domain === 'mobile_live_preview_foundation') return '8.3';
  if (domain === 'mobile_approval_flow_foundation') return '8.4';
  if (domain === 'cross_device_continuity_foundation') return '8.5';
  if (domain === 'missing_capability_detector') return '9.1';
  if (domain === 'safe_capability_acquisition') return '9.2';
  return String(getDevPulseV2Owner(domain as Parameters<typeof getDevPulseV2Owner>[0]).phase);
}

export interface GovernanceValidationResult {
  valid: boolean;
  reason: string;
  gates: GateRecord[];
}

export function validateAcquisitionGovernance(input: AcquisitionInput): GovernanceValidationResult {
  const gates: GateRecord[] = [];

  if (input.governanceStatus === 'FAIL') {
    gates.push({
      gateId: 'gov-status-0001',
      gateType: 'GOVERNANCE_STATUS',
      status: 'CLOSED',
      description: 'governanceStatus FAIL — acquisition blocked',
    });
    return { valid: false, reason: 'Governance status FAIL', gates };
  }

  const stackPresent = assertGovernanceDependenciesPresent();
  gates.push({
    gateId: 'gov-0001',
    gateType: 'GOVERNANCE_STACK',
    status: stackPresent ? 'OPEN' : 'CLOSED',
    description: stackPresent ? 'Governance stack present' : 'Governance stack incomplete',
  });

  const noBypass = assertNoGovernanceBypass();
  gates.push({
    gateId: 'gov-0002',
    gateType: 'GOVERNANCE_BYPASS',
    status: noBypass ? 'OPEN' : 'CLOSED',
    description: noBypass ? 'No governance bypass' : 'Governance bypass detected',
  });

  const world1Protected = assertWorld1Protected();
  gates.push({
    gateId: 'gov-0003',
    gateType: 'WORLD1_PROTECTION',
    status: world1Protected ? 'OPEN' : 'CLOSED',
    description: world1Protected ? 'World 1 protected' : 'World 1 protection failure',
  });

  const world2Protected = assertWorld2Protected();
  gates.push({
    gateId: 'gov-0004',
    gateType: 'WORLD2_PROTECTION',
    status: world2Protected ? 'OPEN' : 'CLOSED',
    description: world2Protected ? 'World 2 protected' : 'World 2 protection failure',
  });

  if (!stackPresent || !noBypass || !world1Protected) {
    return { valid: false, reason: 'Governance validation failed', gates };
  }

  return { valid: true, reason: 'Governance validated', gates };
}

export function governanceGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}|${g.status}`).join(';');
}
