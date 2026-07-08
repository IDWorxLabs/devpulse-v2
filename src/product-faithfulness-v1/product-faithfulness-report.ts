/**
 * Product Faithfulness V1 — plain-English report assembly.
 */

import type {
  GeneratedProductProfile,
  ProductFaithfulnessComparison,
  ProductFaithfulnessPlainEnglishSummary,
  ProductFaithfulnessVerdict,
  RequestedProductProfile,
} from './product-faithfulness-types.js';

const TOP_N = 6;

const VERDICT_HEADLINE: Record<ProductFaithfulnessVerdict, string> = {
  PRODUCT_FAITHFUL: 'This looks like the product you asked for.',
  PRODUCT_MOSTLY_FAITHFUL: 'This is mostly the product you asked for, with a few gaps.',
  PARTIALLY_FAITHFUL: 'This only partially matches the product you asked for.',
  LOW_FAITHFULNESS: 'This does not look much like the product you asked for.',
  PRODUCT_MISMATCH: 'This does not look like the product you asked for.',
};

function describeConceptList(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function buildReason(
  requested: RequestedProductProfile,
  generated: GeneratedProductProfile,
  comparison: ProductFaithfulnessComparison,
  verdict: ProductFaithfulnessVerdict,
): string {
  const requestedLabel =
    requested.domainLabel ??
    (describeConceptList(requested.concepts.slice(0, 3).map((c) => c.concept)) || 'the requested product');
  const generatedLabel =
    describeConceptList(generated.concepts.slice(0, 3).map((c) => c.concept)) || 'generic functionality';

  if (verdict === 'PRODUCT_FAITHFUL') {
    return `The generated application covers the concepts requested for ${requestedLabel}: ${describeConceptList(
      comparison.matched.slice(0, TOP_N),
    ) || 'the core requested concepts'}.`;
  }

  if (comparison.matched.length === 0) {
    return (
      `The generated application appears to contain ${generatedLabel} functionality but does not include ` +
      `${describeConceptList(comparison.missing.slice(0, TOP_N)) || 'the concepts'} requested in the prompt` +
      `${requested.domainLabel ? ` for ${requested.domainLabel}` : ''}.`
    );
  }

  const missingPart =
    comparison.missing.length > 0
      ? ` It is missing ${describeConceptList(comparison.missing.slice(0, TOP_N))}.`
      : '';
  const unexpectedPart =
    comparison.unexpected.length > 0
      ? ` It also includes ${describeConceptList(comparison.unexpected.slice(0, TOP_N))}, which was not part of the request.`
      : '';

  return (
    `The generated application matches ${describeConceptList(comparison.matched.slice(0, TOP_N))} from the request.` +
    `${missingPart}${unexpectedPart}`
  );
}

export function buildFaithfulnessSummary(
  requested: RequestedProductProfile,
  generated: GeneratedProductProfile,
  comparison: ProductFaithfulnessComparison,
  verdict: ProductFaithfulnessVerdict,
): ProductFaithfulnessPlainEnglishSummary {
  return {
    readOnly: true,
    headline: VERDICT_HEADLINE[verdict],
    reason: buildReason(requested, generated, comparison, verdict),
    topMatched: comparison.matched.slice(0, TOP_N),
    topMissing: comparison.missing.slice(0, TOP_N),
    topUnexpected: comparison.unexpected.slice(0, TOP_N),
  };
}
