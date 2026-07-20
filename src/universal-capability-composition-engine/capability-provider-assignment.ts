/**
 * Universal Capability Composition Engine V1 — deterministic provider assignment.
 */

import { classifyNativeSatisfaction } from '../universal-capability-pack-framework/capability-pack-resolver.js';
import type { CapabilityRequirementDescriptor } from '../universal-capability-pack-framework/universal-capability-pack-types.js';
import { resolveProviderCandidates } from './capability-provider-candidate-resolver.js';
import { rankProviderCandidates, selectTopCandidate } from './capability-provider-ranker.js';
import type { ProviderAssignment } from './universal-capability-composition-types.js';
import { UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE } from './universal-capability-composition-types.js';

export interface AssignmentResult {
  readonly assignments: ProviderAssignment[];
  readonly unresolvedRequirements: string[];
  readonly blockedRequirements: string[];
  readonly optionalDeferredRequirements: string[];
  readonly selectedPackIds: string[];
  readonly selectedNativeProviderIds: string[];
}

export function assignProvidersForRequirements(
  requirements: readonly CapabilityRequirementDescriptor[],
): AssignmentResult {
  const assignments: ProviderAssignment[] = [];
  const unresolvedRequirements: string[] = [];
  const blockedRequirements: string[] = [];
  const optionalDeferredRequirements: string[] = [];
  const selectedPackIds = new Set<string>();
  const selectedNativeProviderIds = new Set<string>();
  const assignedCapabilityKeys = new Map<string, string>();

  for (const requirement of requirements) {
    const candidates = resolveProviderCandidates(requirement);
    const ranked = rankProviderCandidates(candidates, {
      exactMatch: true,
      productionReady: requirement.criticality === 'REQUIRED',
      configurationComplete: true,
      securityFit: true,
      runtimeFit: true,
      persistenceFit: true,
      dependencyCost: 0,
      collisionRisk: 0,
      unresolvedDependencyCount: 0,
    });
    const selected = selectTopCandidate(ranked);

    let outcome: ProviderAssignment['outcome'];
    if (requirement.criticality === 'INFORMATIONAL') {
      outcome = 'DEFERRED';
      optionalDeferredRequirements.push(requirement.requirementId);
    } else if (selected) {
      const existing = assignedCapabilityKeys.get(requirement.capabilityKey);
      if (existing && existing !== selected.providerId && !requirement.optional) {
        blockedRequirements.push(requirement.requirementId);
        outcome = 'BLOCKED';
      } else {
        outcome = 'SATISFIED';
        assignedCapabilityKeys.set(requirement.capabilityKey, selected.providerId);
        if (selected.providerKind === 'PACK' && selected.packId) {
          selectedPackIds.add(selected.packId);
        } else if (selected.providerKind === 'NATIVE') {
          selectedNativeProviderIds.add(selected.providerId);
        }
      }
    } else if (classifyNativeSatisfaction(requirement.capabilityKey)) {
      blockedRequirements.push(requirement.requirementId);
      outcome = 'BLOCKED';
    } else if (requirement.criticality === 'REQUIRED') {
      blockedRequirements.push(requirement.requirementId);
      outcome = 'BLOCKED';
    } else if (requirement.optional) {
      optionalDeferredRequirements.push(requirement.requirementId);
      outcome = 'DEFERRED';
    } else {
      unresolvedRequirements.push(requirement.requirementId);
      outcome = 'UNRESOLVED';
    }

    assignments.push({
      requirementId: requirement.requirementId,
      capabilityKey: requirement.capabilityKey,
      providerId: selected?.providerId ?? '',
      providerKind: selected?.providerKind ?? 'PACK',
      packId: selected?.packId ?? null,
      version: selected?.version ?? '',
      outcome,
      candidates: ranked,
      provenance: [UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE, requirement.requirementId],
    });
  }

  return {
    assignments,
    unresolvedRequirements: [...unresolvedRequirements].sort(),
    blockedRequirements: [...blockedRequirements].sort(),
    optionalDeferredRequirements: [...optionalDeferredRequirements].sort(),
    selectedPackIds: [...selectedPackIds].sort(),
    selectedNativeProviderIds: [...selectedNativeProviderIds].sort(),
  };
}
