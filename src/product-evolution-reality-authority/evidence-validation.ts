/**
 * Shared evidence validation helpers for evolution analyzers.
 */

import { FABRICATED_EVIDENCE_SOURCES } from './product-evolution-reality-registry.js';
import type { ObservedEvidenceBase } from './product-evolution-reality-types.js';

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

export function blockedByNonLearningSignals(input: {
  featureAdditionsOnly?: boolean;
  roadmapOnly?: boolean;
}): boolean {
  return Boolean(input.featureAdditionsOnly || input.roadmapOnly);
}
