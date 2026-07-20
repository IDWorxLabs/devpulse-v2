/**
 * Infrastructure vs Product Boundary Authority V1 — Phase 3/6 boundary classifier.
 *
 * This is the one function that answers GPCA's new question — "what responsibility does this file
 * perform?" — instead of the old question, "does this file exist?". It combines the two orthogonal,
 * generic, content-based signal detectors (infrastructure-signal-detection.ts,
 * business-content-signal-detection.ts) into exactly one of four classifications. Nothing here ever
 * inspects `file.path` to decide the classification — the path is carried through purely for
 * reporting/lookup, never consulted by the boundary logic itself.
 */

import { detectBusinessContentSignals } from './business-content-signal-detection.js';
import { detectInfrastructureSignals } from './infrastructure-signal-detection.js';
import type { BoundaryFileClassification, BoundaryFileInput } from './infrastructure-product-boundary-types.js';

function uniqueKinds(signals: readonly { kind: string }[]): string[] {
  return [...new Set(signals.map((s) => s.kind))];
}

/**
 * Phase 3 boundary rule, applied generically to any file's real content:
 *   - infrastructure signal(s) + zero business-content signal(s)  -> INFRASTRUCTURE (safe)
 *   - business-content signal(s) + zero infrastructure signal(s)  -> PRODUCT (must stay contract-bound)
 *   - both present                                                 -> MIXED (must be decomposed/rejected)
 *   - neither present                                              -> UNKNOWN (must fail)
 */
export function classifyBoundaryFile(
  file: BoundaryFileInput,
  contractVocabulary: readonly string[],
): BoundaryFileClassification {
  const infrastructureSignals = detectInfrastructureSignals(file.content);
  const business = detectBusinessContentSignals(file.content, contractVocabulary);

  const hasInfrastructure = infrastructureSignals.length > 0;
  const hasBusiness = business.hasAny;

  const reasons: string[] = [];
  let classification: BoundaryFileClassification['classification'];

  if (hasInfrastructure && !hasBusiness) {
    classification = 'INFRASTRUCTURE';
    reasons.push(
      `Matched ${infrastructureSignals.length} structural infrastructure signal(s) (${uniqueKinds(infrastructureSignals).join(', ')}) and zero business-content signals — safe to host the product without being the product.`,
    );
  } else if (hasBusiness && !hasInfrastructure) {
    classification = 'PRODUCT';
    reasons.push(
      `Matched ${business.signals.length} business-content signal(s) (${uniqueKinds(business.signals).join(', ')}) and zero structural infrastructure signals — must remain fully contract-bound (Product Faithfulness + Rendered Content Evidence continue to govern it).`,
    );
  } else if (hasInfrastructure && hasBusiness) {
    classification = 'MIXED';
    reasons.push(
      `Contains BOTH structural infrastructure signal(s) (${uniqueKinds(infrastructureSignals).join(', ')}) AND business-content signal(s) (${uniqueKinds(business.signals).join(', ')}) — a single file may not carry both responsibilities; it must be decomposed or rejected.`,
    );
  } else {
    classification = 'UNKNOWN';
    reasons.push('No structural infrastructure signal and no business-content signal was found in this file\'s real content — its responsibility could not be determined, so it must fail.');
  }

  const safeAsInfrastructure = classification === 'INFRASTRUCTURE';

  return {
    readOnly: true,
    path: file.path,
    classification,
    infrastructureSignals,
    businessContentSignals: business.signals,
    contractReferenced: business.contractReferenced,
    safeAsInfrastructure,
    reasons,
  };
}
