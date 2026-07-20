/**
 * Product Faithfulness V1 — comparison + scoring.
 *
 * Deterministic set comparison between requested and generated concepts, plus a 0-100
 * faithfulness score. No LLM, no heuristics beyond simple arithmetic on the comparison result.
 */

import type { ExtractedProductConcept, ProductFaithfulnessComparison } from './product-faithfulness-types.js';
import {
  capabilityIdentitiesMatch,
  normalizeCapabilityIdentity,
  suppressLexicalFragmentsOfCapabilities,
} from '../product-faithfulness-v2/verification-accuracy.js';

function canonical(concept: string): string {
  return normalizeCapabilityIdentity(concept) || concept.trim().toLowerCase();
}

export function compareProductConcepts(
  requested: ExtractedProductConcept[],
  generated: ExtractedProductConcept[],
): ProductFaithfulnessComparison {
  const requestedNames = new Map(requested.map((c) => [canonical(c.concept), c.concept]));
  const generatedNames = new Map(generated.map((c) => [canonical(c.concept), c.concept]));
  const requestedDisplay = requested.map((c) => c.concept);

  const matched: string[] = [];
  const missing: string[] = [];
  for (const [key, displayName] of requestedNames) {
    const generatedHit =
      generatedNames.has(key) ||
      [...generatedNames.keys()].some((generatedKey) => capabilityIdentitiesMatch(key, generatedKey));
    if (generatedHit) {
      matched.push(displayName);
    } else {
      missing.push(displayName);
    }
  }

  const matchedIds = new Set(matched.map(canonical));
  const unexpectedRaw: string[] = [];
  for (const [key, displayName] of generatedNames) {
    if (matchedIds.has(key) || requestedNames.has(key)) continue;
    if ([...requestedNames.keys()].some((requestedKey) => capabilityIdentitiesMatch(key, requestedKey))) continue;
    unexpectedRaw.push(displayName);
  }
  const unexpected = suppressLexicalFragmentsOfCapabilities(unexpectedRaw, [
    ...requestedDisplay,
    ...matched,
  ]);

  const requestedTotal = Math.max(1, requestedNames.size);
  const generatedTotal = Math.max(1, matched.length + unexpected.length);

  return {
    readOnly: true,
    matched,
    missing,
    unexpected,
    coverageRatio: matched.length / requestedTotal,
    precisionRatio: matched.length / generatedTotal,
  };
}

/**
 * Score rewards coverage (did the generated app cover what was requested — feature names,
 * navigation, workflow, domain language) most heavily, and precision (is the generated app
 * mostly the requested concepts, not a mostly-unrelated product) as a secondary factor. A large
 * domain mismatch drives both ratios toward zero, which drives the score toward zero.
 */
export function computeFaithfulnessScore(comparison: ProductFaithfulnessComparison): number {
  const raw = comparison.coverageRatio * 0.75 + comparison.precisionRatio * 0.25;
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}
