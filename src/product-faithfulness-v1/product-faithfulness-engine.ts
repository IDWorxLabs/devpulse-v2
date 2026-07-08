/**
 * Product Faithfulness V1 — engine.
 *
 * Orchestrates: extract requested concepts -> extract generated concepts -> compare -> score ->
 * verdict -> plain-English report. Deterministic, evidence-driven, no LLM, no new orchestration
 * engine — this is a pure function over evidence that already exists in the build pipeline.
 */

import { PRODUCT_FAITHFULNESS_V1_CONTRACT } from './product-faithfulness-types.js';
import type { ProductFaithfulnessInput, ProductFaithfulnessReport } from './product-faithfulness-types.js';
import { extractGeneratedConcepts, extractRequestedConcepts } from './product-faithfulness-feature-extractor.js';
import { compareProductConcepts, computeFaithfulnessScore } from './product-faithfulness-comparator.js';
import { resolveFaithfulnessVerdict } from './product-faithfulness-verdict.js';
import { buildFaithfulnessSummary } from './product-faithfulness-report.js';

export function evaluateProductFaithfulness(input: ProductFaithfulnessInput): ProductFaithfulnessReport {
  const requestedExtraction = extractRequestedConcepts(input);
  const generatedConcepts = extractGeneratedConcepts(input);

  const requested = {
    readOnly: true as const,
    concepts: requestedExtraction.concepts,
    domainLabel: requestedExtraction.domainLabel,
    domainClassification: requestedExtraction.domainClassification,
  };
  const generated = { readOnly: true as const, concepts: generatedConcepts };

  const comparison = compareProductConcepts(requested.concepts, generated.concepts);
  const score = computeFaithfulnessScore(comparison);
  const verdict = resolveFaithfulnessVerdict(score);
  const summary = buildFaithfulnessSummary(requested, generated, comparison, verdict);

  return {
    readOnly: true,
    contractVersion: PRODUCT_FAITHFULNESS_V1_CONTRACT,
    score,
    verdict,
    requested,
    generated,
    comparison,
    summary,
  };
}
