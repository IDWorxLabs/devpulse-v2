/**
 * Universal Capability Composition Engine V1 — provider candidate resolution.
 */

import { findProvidersForCapability, getPack } from '../universal-capability-pack-framework/capability-pack-registry.js';
import { classifyNativeSatisfaction } from '../universal-capability-pack-framework/capability-pack-resolver.js';
import type { CapabilityRequirementDescriptor } from '../universal-capability-pack-framework/universal-capability-pack-types.js';
import {
  findNativeProvidersForCapability,
} from './native-capability-provider-registry.js';
import type { ProviderAssignmentCandidate } from './universal-capability-composition-types.js';

const SELECTABLE_PACK_STATUSES = new Set(['PRODUCTION_READY', 'FUNCTIONAL_REFERENCE']);

export function resolveProviderCandidates(
  requirement: CapabilityRequirementDescriptor,
): ProviderAssignmentCandidate[] {
  const candidates: ProviderAssignmentCandidate[] = [];

  if (classifyNativeSatisfaction(requirement.capabilityKey)) {
    for (const native of findNativeProvidersForCapability(requirement.capabilityKey)) {
      candidates.push({
        providerId: native.providerId,
        providerKind: 'NATIVE',
        version: native.version,
        selected: native.productionReadiness,
        rejectionReason: native.productionReadiness ? undefined : 'native_not_production_ready',
        rankingScore: 100,
        rankingEvidence: ['exact_native_capability_match', 'production_ready'],
      });
    }
  }

  const packProviders = findProvidersForCapability(requirement.capabilityKey);
  for (const pack of packProviders) {
    let rejectionReason: string | undefined;
    if (!SELECTABLE_PACK_STATUSES.has(pack.supportStatus)) {
      rejectionReason =
        pack.supportStatus === 'NOT_IMPLEMENTED' ? 'pack_not_implemented' : 'pack_not_production_ready';
    } else if (!pack.productionReadiness && pack.supportStatus !== 'FUNCTIONAL_REFERENCE') {
      rejectionReason = 'false_pack_readiness';
    } else if (requirement.criticality === 'REQUIRED' && pack.supportStatus === 'EXPERIMENTAL') {
      rejectionReason = 'experimental_not_approved_for_production';
    }
    candidates.push({
      providerId: pack.packId,
      providerKind: 'PACK',
      packId: pack.packId,
      version: pack.packVersion,
      supportStatus: pack.supportStatus,
      selected: !rejectionReason,
      rejectionReason,
      rankingScore: pack.supportStatus === 'PRODUCTION_READY' ? 90 : 70,
      rankingEvidence: [
        pack.supportStatus === 'PRODUCTION_READY' ? 'production_ready_pack' : 'functional_reference_pack',
      ],
    });
  }

  if (candidates.length === 0 && classifyNativeSatisfaction(requirement.capabilityKey)) {
    return candidates;
  }

  return candidates.sort((a, b) => {
    if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore;
    return a.providerId.localeCompare(b.providerId);
  });
}

export function resolvePackCandidateById(packId: string): ProviderAssignmentCandidate | null {
  const pack = getPack(packId);
  if (!pack) return null;
  return {
    providerId: pack.packId,
    providerKind: 'PACK',
    packId: pack.packId,
    version: pack.packVersion,
    supportStatus: pack.supportStatus,
    selected: SELECTABLE_PACK_STATUSES.has(pack.supportStatus),
    rankingScore: 0,
    rankingEvidence: [],
  };
}
