/**
 * Placeholder & Template Elimination Authority V1 — Parts 1 & 4: the classifier.
 *
 * Deterministic, generic classification of one rendered text fragment into exactly one
 * `ProductContentOrigin`. Never inspects a product domain — every rule here is either a structural
 * shape (business-placeholder wording, infrastructure lexicon, materialization-metadata shape) or a
 * word-overlap check against *this build's own* approved vocabularies (contract / CBGA plan /
 * prompt). Reused by GPCA's rendered-content-collector so every evidence item can carry Content
 * Origin, Content Source, Approved Producer, and Traceability Chain (Part 4) without GPCA's
 * existing detectors/gate changing at all.
 */

import { referencesContractVocabulary } from '../generation-pipeline-compliance-authority-v1/rendered-content-fingerprints.js';
import { matchBusinessPlaceholderFingerprints } from './business-placeholder-fingerprints.js';
import { isInfrastructureContentText } from './infrastructure-content-lexicon.js';
import {
  ANCESTRY_EXEMPT_ORIGINS,
  PRODUCT_CONTENT_ORIGIN_APPROVED_PRODUCER,
  type ContentOriginClassification,
  type ProductContentOrigin,
} from './product-content-origin-types.js';

export interface ContentOriginClassifierContext {
  readonly contractVocabulary: readonly string[];
  readonly cbgaVocabulary: readonly string[];
  readonly promptVocabulary: readonly string[];
}

const MATERIALIZATION_METADATA_PATTERNS: readonly RegExp[] = [
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?$/, // ISO date/timestamp
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID
  /^v?\d+\.\d+\.\d+(?:[-+][0-9a-zA-Z.]+)?$/, // semver
  /^[0-9a-f]{7,40}$/i, // commit-ish hash
];

function isMaterializationMetadataText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return MATERIALIZATION_METADATA_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function buildOriginResult(
  text: string,
  location: string,
  origin: ProductContentOrigin,
  contentSource: string,
  traceabilityChain: readonly string[],
  overrides?: { matchedBusinessPlaceholderFingerprint?: string | null },
): ContentOriginClassification {
  const ancestryRequired = !ANCESTRY_EXEMPT_ORIGINS.includes(origin);
  const ancestryProven = origin !== 'UNKNOWN_CONTENT' && (!ancestryRequired || traceabilityChain.length > 0);
  return {
    readOnly: true,
    text,
    location,
    origin,
    contentSource,
    approvedProducer: PRODUCT_CONTENT_ORIGIN_APPROVED_PRODUCER[origin],
    traceabilityChain,
    isBusinessPlaceholder: Boolean(overrides?.matchedBusinessPlaceholderFingerprint),
    matchedBusinessPlaceholderFingerprint: overrides?.matchedBusinessPlaceholderFingerprint ?? null,
    ancestryRequired,
    ancestryProven,
  };
}

/**
 * Forces a classification for text this build's real structure has already, independently proven
 * belongs to a given origin (e.g. a `data-nav-kind` infrastructure navigation marker, or a fragment
 * that already matched one of GPCA's existing generic template/placeholder fingerprints). Never
 * guesses — every caller of this function already has real structural proof.
 */
export function forcedContentOriginClassification(
  text: string,
  location: string,
  origin: ProductContentOrigin,
  contentSource: string,
  traceabilityChain: readonly string[] = [],
  matchedBusinessPlaceholderFingerprint: string | null = null,
): ContentOriginClassification {
  return buildOriginResult(text, location, origin, contentSource, traceabilityChain, { matchedBusinessPlaceholderFingerprint });
}

/**
 * Classifies one rendered text fragment. Deterministic priority order:
 *   1. Business-placeholder fingerprint match  -> UNKNOWN_CONTENT (always fails; Part 2).
 *   2. Infrastructure lexicon match            -> INFRASTRUCTURE_CONTENT (Part 3).
 *   3. Materialization-metadata shape          -> MATERIALIZATION_METADATA.
 *   4. References contract vocabulary          -> CONTRACT_PRODUCT_CONTENT.
 *   5. References CBGA-approved plan vocabulary -> CBGA_PRODUCT_CONTENT.
 *   6. References prompt-derived vocabulary    -> PROMPT_PRODUCT_CONTENT.
 *   7. Otherwise                               -> UNKNOWN_CONTENT (always fails).
 */
export function classifyContentOrigin(
  text: string,
  location: string,
  context: ContentOriginClassifierContext,
): ContentOriginClassification {
  const businessMatches = matchBusinessPlaceholderFingerprints(text, context.contractVocabulary);
  if (businessMatches.length > 0) {
    return buildOriginResult(text, location, 'UNKNOWN_CONTENT', `BUSINESS_PLACEHOLDER_FINGERPRINT:${businessMatches[0]!.id}`, [], {
      matchedBusinessPlaceholderFingerprint: businessMatches[0]!.id,
    });
  }

  if (isInfrastructureContentText(text)) {
    return buildOriginResult(text, location, 'INFRASTRUCTURE_CONTENT', 'INFRASTRUCTURE_CONTENT_LEXICON', [
      'BlueprintInfrastructure.genericUiChrome',
    ]);
  }

  if (isMaterializationMetadataText(text)) {
    return buildOriginResult(text, location, 'MATERIALIZATION_METADATA', 'MATERIALIZATION_METADATA_SHAPE', [
      'Materialization.buildMetadata',
    ]);
  }

  if (referencesContractVocabulary(text, context.contractVocabulary)) {
    return buildOriginResult(text, location, 'CONTRACT_PRODUCT_CONTENT', 'CanonicalProductContract.allConceptNames', [
      'CanonicalProductContract',
      `matched concept vocabulary: ${text}`,
    ]);
  }

  if (referencesContractVocabulary(text, context.cbgaVocabulary)) {
    return buildOriginResult(text, location, 'CBGA_PRODUCT_CONTENT', 'CbgaGenerationReport.approvedPlanVocabulary', [
      'ContractBoundGenerationAuthority',
      `matched approved plan vocabulary: ${text}`,
    ]);
  }

  if (referencesContractVocabulary(text, context.promptVocabulary)) {
    return buildOriginResult(text, location, 'PROMPT_PRODUCT_CONTENT', 'PromptFeatureExtraction.promptDerivedVocabulary', [
      'PromptFaithfulGeneration',
      `matched prompt-derived vocabulary: ${text}`,
    ]);
  }

  return buildOriginResult(text, location, 'UNKNOWN_CONTENT', 'NO_APPROVED_VOCABULARY_MATCH', []);
}
