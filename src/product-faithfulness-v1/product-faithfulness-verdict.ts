/**
 * Product Faithfulness V1 — verdict thresholds.
 *
 * A single, deterministic score-to-verdict mapping. Kept in its own file so the thresholds are
 * easy to find, review, and adjust without touching extraction or comparison logic.
 */

import type { ProductFaithfulnessVerdict } from './product-faithfulness-types.js';

export function resolveFaithfulnessVerdict(score: number): ProductFaithfulnessVerdict {
  if (score >= 85) return 'PRODUCT_FAITHFUL';
  if (score >= 65) return 'PRODUCT_MOSTLY_FAITHFUL';
  if (score >= 40) return 'PARTIALLY_FAITHFUL';
  if (score >= 20) return 'LOW_FAITHFULNESS';
  return 'PRODUCT_MISMATCH';
}

export function isSeriousFaithfulnessProblem(verdict: ProductFaithfulnessVerdict): boolean {
  return verdict === 'PRODUCT_MISMATCH' || verdict === 'LOW_FAITHFULNESS';
}
