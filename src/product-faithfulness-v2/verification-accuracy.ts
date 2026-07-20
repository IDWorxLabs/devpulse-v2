/**
 * Product Faithfulness Verification Accuracy V1 — identity matching, fragment suppression, invariants.
 */

import { normalizeTraceabilityIdentity } from '../contract-to-module-traceability/contract-to-module-identity.js';

export function normalizeCapabilityIdentity(value: string): string {
  return normalizeTraceabilityIdentity(value);
}

export function capabilityIdentitiesMatch(left: string, right: string): boolean {
  const a = normalizeCapabilityIdentity(left);
  const b = normalizeCapabilityIdentity(right);
  if (!a || !b) return false;
  return a === b;
}

/** True when candidate is a single token that only appears inside a longer recognized capability. */
export function isLexicalFragmentOfCapability(candidate: string, capability: string): boolean {
  const candidateId = normalizeCapabilityIdentity(candidate);
  const capabilityId = normalizeCapabilityIdentity(capability);
  if (!candidateId || !capabilityId || candidateId === capabilityId) return false;
  const candidateParts = candidateId.split('-').filter(Boolean);
  if (candidateParts.length !== 1) return false;
  const capabilityParts = new Set(capabilityId.split('-').filter(Boolean));
  return capabilityParts.has(candidateParts[0]!);
}

export function suppressLexicalFragmentsOfCapabilities(
  candidates: readonly string[],
  recognizedCapabilities: readonly string[],
): string[] {
  return candidates.filter(
    (candidate) =>
      !recognizedCapabilities.some((capability) => isLexicalFragmentOfCapability(candidate, capability)),
  );
}

export function matchCapabilityAgainstSurfaces(
  capability: string,
  surfaces: readonly string[],
): string | null {
  const capabilityId = normalizeCapabilityIdentity(capability);
  for (const surface of surfaces) {
    if (capabilityIdentitiesMatch(capability, surface)) return surface;
  }
  for (const surface of surfaces) {
    const surfaceId = normalizeCapabilityIdentity(surface);
    if (surfaceId.includes(capabilityId) || capabilityId.includes(surfaceId)) return surface;
  }
  return null;
}

export interface FaithfulnessMetricInvariantInput {
  requestedConcepts: readonly string[];
  matchedConcepts: readonly string[];
  missingConcepts: readonly string[];
  unexpectedConcepts: readonly string[];
  conceptRetentionPercent: number;
  conceptDriftPercent: number;
  firstBrokenByConcept?: ReadonlyMap<string, string>;
  provenDownstreamConcepts?: readonly string[];
}

export function assertFaithfulnessMetricInvariants(input: FaithfulnessMetricInvariantInput): void {
  const requestedIds = new Set(input.requestedConcepts.map(normalizeCapabilityIdentity));
  const matchedIds = new Set(input.matchedConcepts.map(normalizeCapabilityIdentity));
  const missingIds = new Set(input.missingConcepts.map(normalizeCapabilityIdentity));
  const unexpected = [...input.unexpectedConcepts];

  for (const id of matchedIds) {
    if (missingIds.has(id)) {
      throw new Error(`verification_invariant:concept_both_matched_and_missing:${id}`);
    }
  }

  if (input.conceptRetentionPercent === 100 && missingIds.size > 0) {
    throw new Error(
      `verification_invariant:retention_100_with_missing:${[...missingIds].slice(0, 8).join(',')}`,
    );
  }

  const expectedRetention =
    requestedIds.size === 0
      ? 100
      : Math.round(((requestedIds.size - missingIds.size) / requestedIds.size) * 100);
  if (Math.abs(expectedRetention - input.conceptRetentionPercent) > 1) {
    throw new Error(
      `verification_invariant:retention_formula_mismatch:reported=${input.conceptRetentionPercent}:expected=${expectedRetention}`,
    );
  }

  if (Math.abs(100 - input.conceptRetentionPercent - input.conceptDriftPercent) > 1) {
    throw new Error(
      `verification_invariant:drift_not_complement_of_retention:retention=${input.conceptRetentionPercent}:drift=${input.conceptDriftPercent}`,
    );
  }

  const recognized = [...input.requestedConcepts, ...input.matchedConcepts];
  for (const fragment of unexpected) {
    if (recognized.some((capability) => isLexicalFragmentOfCapability(fragment, capability))) {
      throw new Error(`verification_invariant:lexical_fragment_unexpected:${fragment}`);
    }
  }

  if (input.firstBrokenByConcept && input.provenDownstreamConcepts) {
    for (const proven of input.provenDownstreamConcepts) {
      const provenId = normalizeCapabilityIdentity(proven);
      const boundary = input.firstBrokenByConcept.get(provenId);
      if (boundary && boundary !== 'UNKNOWN') {
        throw new Error(
          `verification_invariant:proven_downstream_marked_broken:${provenId}:${boundary}`,
        );
      }
    }
  }
}

export function retentionPercentFromMissing(
  requestedCount: number,
  missingCount: number,
): { conceptRetentionPercent: number; conceptDriftPercent: number; conceptRetentionRatio: number; conceptDriftRatio: number } {
  const conceptRetentionRatio = requestedCount === 0 ? 1 : Math.max(0, (requestedCount - missingCount) / requestedCount);
  const conceptDriftRatio = 1 - conceptRetentionRatio;
  return {
    conceptRetentionRatio,
    conceptDriftRatio,
    conceptRetentionPercent: Math.round(conceptRetentionRatio * 100),
    conceptDriftPercent: Math.round(conceptDriftRatio * 100),
  };
}
