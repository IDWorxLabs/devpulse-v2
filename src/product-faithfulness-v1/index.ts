/**
 * Product Faithfulness V1 — public entry point.
 *
 * The generated application must faithfully represent the user's requested product. Technical
 * correctness (it compiles, it previews, it passes interaction proof) is necessary but not
 * sufficient — this module answers the separate question of whether the generated app is
 * recognizably the app the user asked for.
 */

export { PRODUCT_FAITHFULNESS_V1_CONTRACT } from './product-faithfulness-types.js';
export type {
  DomainCandidateEvidence,
  DomainClassificationDiagnostics,
  DomainEvidenceItem,
  ExtractedProductConcept,
  GeneratedProductProfile,
  ProductConceptSource,
  ProductFaithfulnessComparison,
  ProductFaithfulnessInput,
  ProductFaithfulnessPlainEnglishSummary,
  ProductFaithfulnessReport,
  ProductFaithfulnessVerdict,
  RequestedProductProfile,
} from './product-faithfulness-types.js';

export {
  classifyRequestedDomain,
  extractGeneratedConcepts,
  extractRequestedConcepts,
} from './product-faithfulness-feature-extractor.js';
export { compareProductConcepts, computeFaithfulnessScore } from './product-faithfulness-comparator.js';
export { isSeriousFaithfulnessProblem, resolveFaithfulnessVerdict } from './product-faithfulness-verdict.js';
export { buildFaithfulnessSummary } from './product-faithfulness-report.js';
export { evaluateProductFaithfulness } from './product-faithfulness-engine.js';
