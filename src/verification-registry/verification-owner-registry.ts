/**
 * Verification owner registry — tracks ownership metadata per target.
 */

import type { VerificationOwnerRecord, VerificationTarget } from './types.js';
import { listVerificationTargets } from './verification-target-registry.js';

const owners = new Map<string, VerificationOwnerRecord>();

export function resetVerificationOwnerRegistryForTests(): void {
  owners.clear();
}

const DOMAIN_MAP: Record<string, string> = {
  devpulse_v2_world2_completion_runtime: 'world2_completion_runtime',
  devpulse_v2_live_preview_runtime: 'live_preview_runtime',
  devpulse_v2_self_vision_runtime: 'self_vision_runtime',
  devpulse_v2_ui_inspection_engine: 'ui_inspection_engine',
  devpulse_v2_interaction_testing_engine: 'interaction_testing_engine',
  devpulse_v2_visual_verification_engine: 'visual_verification_engine',
  devpulse_v2_runtime_verification_layer: 'runtime_verification_layer',
  devpulse_v2_command_center_brain: 'command_center_brain',
  devpulse_v2_project_vault_intelligence: 'project_vault_intelligence',
  devpulse_v2_operator_feed: 'operator_feed',
  devpulse_v2_trust_engine: 'trust_engine',
};

export function buildOwnerRecord(target: VerificationTarget): VerificationOwnerRecord {
  return {
    ownerModule: target.ownerModule,
    ownerDomain: DOMAIN_MAP[target.ownerModule] ?? 'unknown',
    ownerPhase: target.phase,
    ownerCapability: target.verificationCategory.replace('_TARGET', '_VERIFICATION'),
    ownerStatus: 'REGISTERED',
    registryOnly: true,
  };
}

export function registerVerificationOwner(owner: VerificationOwnerRecord): {
  ok: boolean;
  duplicate: boolean;
} {
  if (owners.has(owner.ownerModule)) {
    return { ok: false, duplicate: true };
  }
  owners.set(owner.ownerModule, owner);
  return { ok: true, duplicate: false };
}

export function registerInitialOwners(): number {
  let count = 0;
  for (const target of listVerificationTargets()) {
    const result = registerVerificationOwner(buildOwnerRecord(target));
    if (result.ok) count += 1;
  }
  return count;
}

export function getVerificationOwner(ownerModule: string): VerificationOwnerRecord | null {
  return owners.get(ownerModule) ?? null;
}

export function listVerificationOwners(): VerificationOwnerRecord[] {
  return [...owners.values()];
}
