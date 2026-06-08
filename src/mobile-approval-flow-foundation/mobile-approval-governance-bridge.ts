/**
 * Mobile approval governance bridge — Phase 8 + Phase 6 stack.
 * Foundation only. No governance bypass.
 */

import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { APPROVAL_GATE_OWNER_MODULE } from '../founder-approval-execution/types.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from '../execution-evidence-ledger/types.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from '../verification-gated-apply/types.js';
import { CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE } from '../controlled-execution-bridge/types.js';
import { MOBILE_COMMAND_FOUNDATION_OWNER_MODULE } from '../mobile-command-foundation/types.js';
import { MOBILE_CHAT_INTERFACE_OWNER_MODULE } from '../mobile-chat-interface/types.js';
import { MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE } from '../mobile-live-preview-foundation/types.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { ApprovalInput, GateRecord, GovernanceStatus } from './types.js';
import { DEPENDENCY_SYSTEMS, MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE } from './types.js';

export function assertGovernanceDependenciesPresent(): boolean {
  return (
    getDevPulseV2Owner('mobile_command_foundation').ownerModule === MOBILE_COMMAND_FOUNDATION_OWNER_MODULE &&
    getDevPulseV2Owner('mobile_chat_interface').ownerModule === MOBILE_CHAT_INTERFACE_OWNER_MODULE &&
    getDevPulseV2Owner('mobile_live_preview_foundation').ownerModule ===
      MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE &&
    getDevPulseV2Owner('controlled_execution_bridge').ownerModule ===
      CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE &&
    getDevPulseV2Owner('founder_approval_execution_gate').ownerModule === APPROVAL_GATE_OWNER_MODULE &&
    getDevPulseV2Owner('verification_gated_apply').ownerModule === VERIFICATION_GATED_APPLY_OWNER_MODULE &&
    getDevPulseV2Owner('execution_authority').ownerModule === EXECUTION_OWNER_MODULE &&
    getDevPulseV2Owner('execution_evidence_ledger').ownerModule === EVIDENCE_LEDGER_OWNER_MODULE
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

export function assertNoRegistryRuntimeMutation(): boolean {
  const registry = getDevPulseV2Owner('mobile_approval_flow_foundation');
  return (
    registry.ownerModule === MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE && registry.phase === 8.4
  );
}

export function assertDistinctFromFounderApprovalGate(): boolean {
  const mobile = getDevPulseV2Owner('mobile_approval_flow_foundation');
  const founder = getDevPulseV2Owner('founder_approval_execution_gate');
  return mobile.ownerModule !== founder.ownerModule;
}

export function assertDistinctFromMobileLivePreviewFoundation(): boolean {
  const approval = getDevPulseV2Owner('mobile_approval_flow_foundation');
  const preview = getDevPulseV2Owner('mobile_live_preview_foundation');
  return approval.ownerModule !== preview.ownerModule;
}

export function getMobileApprovalGovernanceSummary(): string {
  return DEPENDENCY_SYSTEMS.map((d) => `${d}@${formatPhase(d)}`).join(' → ');
}

function formatPhase(domain: string): string {
  if (domain === 'verification_gated_apply') return '6.11';
  if (domain === 'execution_evidence_ledger') return '6.7';
  if (domain === 'founder_approval_execution_gate') return '6.5';
  if (domain === 'execution_authority') return '6.1';
  if (domain === 'controlled_execution_bridge') return '7.7';
  if (domain === 'mobile_command_foundation') return '8.1';
  if (domain === 'mobile_chat_interface') return '8.2';
  if (domain === 'mobile_live_preview_foundation') return '8.3';
  if (domain === 'mobile_approval_flow_foundation') return '8.4';
  return String(getDevPulseV2Owner(domain as Parameters<typeof getDevPulseV2Owner>[0]).phase);
}

export interface GovernanceValidationResult {
  valid: boolean;
  reason: string;
  gates: GateRecord[];
}

export function validateApprovalGovernance(input: ApprovalInput): GovernanceValidationResult {
  const gates: GateRecord[] = [];

  if (input.governanceStatus === 'FAIL') {
    gates.push({
      gateId: 'gov-0001',
      gateType: 'GOVERNANCE_STATUS',
      status: 'CLOSED',
      description: 'governanceStatus is FAIL',
    });
    return { valid: false, reason: 'Governance validation failed', gates };
  }

  const stackPresent = assertGovernanceDependenciesPresent();
  gates.push({
    gateId: 'gov-0002',
    gateType: 'GOVERNANCE_STACK',
    status: stackPresent ? 'OPEN' : 'CLOSED',
    description: stackPresent ? 'Governance stack present' : 'Governance stack incomplete',
  });

  const noBypass = assertNoGovernanceBypass();
  gates.push({
    gateId: 'gov-0003',
    gateType: 'GOVERNANCE_BYPASS',
    status: noBypass ? 'OPEN' : 'CLOSED',
    description: noBypass ? 'No governance bypass' : 'Governance bypass detected',
  });

  const world1Protected = assertWorld1Protected();
  gates.push({
    gateId: 'gov-0004',
    gateType: 'WORLD1_PROTECTION',
    status: world1Protected ? 'OPEN' : 'CLOSED',
    description: world1Protected ? 'World 1 protected' : 'World 1 protection failure',
  });

  if (!stackPresent || !noBypass || !world1Protected) {
    return { valid: false, reason: 'Governance stack validation failed', gates };
  }

  return { valid: true, reason: 'Governance validated', gates };
}

export function governanceGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}|${g.status}`).join(';');
}

export function isGovernanceReady(status: GovernanceStatus): boolean {
  return status === 'PASS';
}
