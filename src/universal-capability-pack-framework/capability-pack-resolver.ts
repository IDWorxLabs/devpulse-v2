/**
 * Universal Capability Pack Framework V1 — provider resolution.
 *
 * Never selects NOT_IMPLEMENTED or experimental packs for production composition.
 */

import { findProvidersForCapability, getPack } from './capability-pack-registry.js';
import type {
  CapabilityRequirementDescriptor,
  PackResolutionCandidate,
  PackResolutionResult,
  RequirementResolutionOutcome,
} from './universal-capability-pack-types.js';

const SELECTABLE_STATUSES = new Set(['PRODUCTION_READY', 'FUNCTIONAL_REFERENCE']);

export function resolveCapabilityRequirement(
  requirement: CapabilityRequirementDescriptor,
): PackResolutionResult {
  const providers = findProvidersForCapability(requirement.capabilityKey);
  const candidates: PackResolutionCandidate[] = providers.map((pack) => {
    let rejectionReason: string | undefined;
    if (!SELECTABLE_STATUSES.has(pack.supportStatus)) {
      rejectionReason = pack.supportStatus === 'NOT_IMPLEMENTED' ? 'pack_not_implemented' : 'pack_not_production_ready';
    } else if (!pack.productionReadiness && pack.supportStatus !== 'FUNCTIONAL_REFERENCE') {
      rejectionReason = 'false_pack_readiness';
    }
    return {
      packId: pack.packId,
      packVersion: pack.packVersion,
      supportStatus: pack.supportStatus,
      selected: !rejectionReason,
      rejectionReason,
    };
  });

  const selected = candidates.find((c) => c.selected);
  let outcome: RequirementResolutionOutcome;
  if (requirement.criticality === 'INFORMATIONAL') {
    outcome = 'INFORMATIONAL';
  } else if (selected) {
    outcome = 'SATISFIED';
  } else if (providers.length === 0) {
    outcome = requirement.criticality === 'REQUIRED' ? 'BLOCKED_BY_MISSING_PACK' : 'INFORMATIONAL';
  } else if (providers.every((p) => p.supportStatus === 'NOT_IMPLEMENTED')) {
    outcome = 'BLOCKED_BY_MISSING_PACK';
  } else {
    outcome = 'BLOCKED_BY_COMPATIBILITY';
  }

  return {
    requirementId: requirement.requirementId,
    capabilityKey: requirement.capabilityKey,
    outcome,
    selectedPackId: selected?.packId ?? null,
    candidates,
    provenance: requirement.provenance,
  };
}

export function resolveAllCapabilityRequirements(
  requirements: readonly CapabilityRequirementDescriptor[],
): PackResolutionResult[] {
  return requirements.map(resolveCapabilityRequirement);
}

/** Maps capability keys already satisfied natively by B1–B6 without a pack. */
export const NATIVE_B1_B6_CAPABILITIES = new Set([
  'crud.entity-management',
  'actions.materialization',
  'workflows.state-machine',
  'relationships.intelligence',
  'runtime.state-coordination',
  'rules.business-evaluation',
]);

export function classifyNativeSatisfaction(capabilityKey: string): boolean {
  return NATIVE_B1_B6_CAPABILITIES.has(capabilityKey);
}

export function resolvePackForId(packId: string): ReturnType<typeof getPack> {
  return getPack(packId);
}
