/**
 * Build request engine — creates build request packets.
 * Planning only. No build execution performed.
 */

import type {
  AcquisitionInput,
  AcquisitionStrategy,
  BuildRequestPacket,
} from './types.js';
import { nextBuildRequestId, SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE } from './types.js';
import { approvalRequiredForMode } from './acquisition-approval-engine.js';
import { rollbackRequiredForMode } from './acquisition-rollback-engine.js';
import { verificationRequiredForMode } from './acquisition-verification-engine.js';

const STRATEGY_LAYER_MAP: Partial<Record<AcquisitionStrategy, string>> = {
  PLAN_INTERNAL_BUILD: 'INTERNAL_TOOL',
  PLAN_DIAGNOSTIC_LAYER: 'DIAGNOSTIC_LAYER',
  PLAN_VERIFICATION_LAYER: 'VERIFICATION_LAYER',
  PLAN_SIMULATION_LAYER: 'SIMULATION_LAYER',
  PLAN_PREVIEW_LAYER: 'PREVIEW_LAYER',
  PLAN_GOVERNANCE_LAYER: 'GOVERNANCE_LAYER',
  PLAN_DEPENDENCY_REVIEW: 'DEPENDENCY_REVIEW',
  PLAN_EXTERNAL_TOOL_REVIEW: 'EXTERNAL_TOOL_REVIEW',
};

const BUILD_STRATEGIES: readonly AcquisitionStrategy[] = [
  'PLAN_INTERNAL_BUILD',
  'PLAN_DIAGNOSTIC_LAYER',
  'PLAN_VERIFICATION_LAYER',
  'PLAN_SIMULATION_LAYER',
  'PLAN_PREVIEW_LAYER',
  'PLAN_GOVERNANCE_LAYER',
  'PLAN_DEPENDENCY_REVIEW',
  'PLAN_EXTERNAL_TOOL_REVIEW',
];

export function createBuildRequestPacket(
  input: AcquisitionInput,
  strategy: AcquisitionStrategy,
  blocked: boolean,
): BuildRequestPacket | null {
  if (blocked || !(BUILD_STRATEGIES as readonly string[]).includes(strategy)) return null;

  const layerType = STRATEGY_LAYER_MAP[strategy] ?? 'INTERNAL_TOOL';

  return {
    buildRequestId: nextBuildRequestId(),
    capabilityGapId: input.capabilityGapId,
    capabilityName: input.capabilityName,
    proposedLayerType: layerType,
    proposedOwner: SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE,
    proposedPhase: '9.2',
    requiresApproval: approvalRequiredForMode(input.requestedAcquisitionMode),
    requiresVerification: verificationRequiredForMode(input.requestedAcquisitionMode)
      || input.capabilityType === 'ARCHITECTURE_CAPABILITY'
      || input.capabilityType === 'GOVERNANCE_CAPABILITY',
    requiresRollback: rollbackRequiredForMode(input.requestedAcquisitionMode)
      || input.capabilityType === 'ARCHITECTURE_CAPABILITY'
      || input.capabilityType === 'GOVERNANCE_CAPABILITY',
    status: 'READY',
  };
}

export function buildPacketKey(packet: BuildRequestPacket | null): string {
  if (!packet) return 'none';
  return `${packet.buildRequestId}|${packet.proposedLayerType}`;
}
