/**
 * Verification capability registry — supported modes and future expansion.
 */

import type { VerificationCapabilityRecord } from './types.js';
import {
  listVerificationTargets,
  getVerificationTarget,
} from './verification-target-registry.js';

let capCounter = 0;
const capabilities = new Map<string, VerificationCapabilityRecord>();

const CAPABILITY_MODES: Record<string, { modes: string[]; expansion: string[] }> = {
  WORLD2_TARGET: { modes: ['COMPLETION_CHECK', 'ROLLBACK_CHECK'], expansion: ['WORLD2_LEARNING_LOOP'] },
  PREVIEW_TARGET: { modes: ['PREVIEW_READINESS', 'TARGET_REGISTRATION'], expansion: ['MOBILE_PREVIEW'] },
  SELF_VISION_TARGET: { modes: ['OBSERVATION_PLAN', 'CAPTURE_READINESS'], expansion: ['SCREEN_CAPTURE'] },
  UI_INSPECTION_TARGET: { modes: ['STRUCTURE_INSPECTION', 'SURFACE_CLASSIFICATION'], expansion: ['RESPONSIVE_INSPECTION'] },
  INTERACTION_TARGET: { modes: ['INTERACTION_SIMULATION', 'OUTCOME_RECORDING'], expansion: ['WORKFLOW_TRAVERSAL'] },
  VISUAL_VERIFICATION_TARGET: { modes: ['OUTCOME_VERIFICATION', 'EVIDENCE_CLASSIFICATION'], expansion: ['REGRESSION_COMPARE'] },
  RUNTIME_TARGET: { modes: ['TRUST_ASSESSMENT', 'GAP_ANALYSIS'], expansion: ['CHAIN_VERIFICATION'] },
  COMMAND_CENTER_TARGET: { modes: ['ROUTING_VERIFICATION', 'RESPONSE_VERIFICATION'], expansion: ['MULTI_CAPABILITY'] },
  PROJECT_VAULT_TARGET: { modes: ['PROFILE_VERIFICATION', 'FACT_VERIFICATION'], expansion: ['VAULT_SYNC'] },
  OPERATOR_FEED_TARGET: { modes: ['STAGE_VERIFICATION', 'EVENT_VERIFICATION'], expansion: ['FEED_REPLAY'] },
  TRUST_TARGET: { modes: ['POLICY_VERIFICATION', 'SCORE_VERIFICATION'], expansion: ['TRUST_EXPANSION'] },
};

export function resetVerificationCapabilityRegistryForTests(): void {
  capCounter = 0;
  capabilities.clear();
}

function nextCapId(): string {
  capCounter += 1;
  return `vcap-${capCounter.toString().padStart(4, '0')}`;
}

export interface RegisterCapabilityResult {
  ok: boolean;
  record: VerificationCapabilityRecord | null;
  error: string | null;
}

export function registerVerificationCapability(
  record: VerificationCapabilityRecord,
): RegisterCapabilityResult {
  const target = getVerificationTarget(record.targetId);
  if (!target) {
    return { ok: false, record: null, error: 'Invalid capability — target not found' };
  }
  if (capabilities.has(record.capabilityId)) {
    return { ok: false, record: null, error: 'Duplicate capability rejected' };
  }
  capabilities.set(record.capabilityId, record);
  return { ok: true, record, error: null };
}

export function buildCapabilityRecord(targetId: string, category: string): VerificationCapabilityRecord {
  const caps = CAPABILITY_MODES[category] ?? { modes: ['REGISTRY_ONLY'], expansion: [] };
  return {
    capabilityId: nextCapId(),
    targetId,
    supportedModes: [...caps.modes],
    futureExpansion: [...caps.expansion],
    registryOnly: true,
  };
}

export function registerInitialCapabilities(): RegisterCapabilityResult[] {
  const results: RegisterCapabilityResult[] = [];
  for (const target of listVerificationTargets()) {
    results.push(
      registerVerificationCapability(
        buildCapabilityRecord(target.verificationTargetId, target.verificationCategory),
      ),
    );
  }
  return results;
}

export function getVerificationCapability(capabilityId: string): VerificationCapabilityRecord | null {
  return capabilities.get(capabilityId) ?? null;
}

export function listVerificationCapabilities(): VerificationCapabilityRecord[] {
  return [...capabilities.values()];
}
