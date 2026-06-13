/**
 * Shared evidence validation helpers for scale readiness analyzers.
 */

import { FABRICATED_EVIDENCE_SOURCES } from './scale-readiness-registry.js';
import type { ObservedEvidenceBase } from './scale-readiness-types.js';

export function isFabricatedSource(source: string): boolean {
  return FABRICATED_EVIDENCE_SOURCES.some((s) => source.toUpperCase().includes(s));
}

export function hasValidObservedEvidence(
  evidence: ObservedEvidenceBase | null,
  rejectFabricated: boolean,
): boolean {
  if (!evidence) return false;
  if (!evidence.evidenceSource || evidence.evidencePaths.length === 0) return false;
  if (rejectFabricated && isFabricatedSource(evidence.evidenceSource)) return false;
  return true;
}

export function blockedByUpstreamOnlySignals(input: {
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  infrastructureOnly?: boolean;
}): boolean {
  return Boolean(input.revenueOnly || input.adoptionOnly || input.infrastructureOnly);
}

export function dimensionReady(score: number, threshold = 65): boolean {
  return score >= threshold;
}
