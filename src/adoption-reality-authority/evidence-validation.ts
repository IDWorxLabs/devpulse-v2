/**
 * Shared evidence validation helpers for adoption analyzers.
 */

import { FABRICATED_EVIDENCE_SOURCES } from './adoption-reality-registry.js';
import type { ObservedEvidenceBase } from './adoption-reality-types.js';

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

export function blockedByTrafficOnly(input: {
  trafficOnly?: boolean;
  signupsOnly?: boolean;
  oneTimeUsage?: boolean;
}): boolean {
  return Boolean(input.trafficOnly || input.signupsOnly || input.oneTimeUsage);
}
