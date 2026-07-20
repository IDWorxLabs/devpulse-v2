/**
 * Placeholder & Template Elimination Authority V1 — main entry point.
 *
 * Pure, read-only aggregation: classifies a batch of rendered text fragments (already extracted by
 * GPCA's Rendered Content Evidence Expansion V1 primitives — never duplicated here) and reports
 * whether every fragment traces to an approved constitutional origin. This module never blocks a
 * build itself and never mutates anything — GPCA's existing rendered-content gate is the only
 * enforcement point; this authority only supplies evidence/classification (Part 4).
 */

import { classifyContentOrigin, type ContentOriginClassifierContext } from './content-origin-classifier.js';
import {
  PLACEHOLDER_TEMPLATE_ELIMINATION_AUTHORITY_V1_CONTRACT,
  PRODUCT_CONTENT_ORIGINS,
  type ContentOriginClassification,
  type PlaceholderTemplateEliminationAudit,
  type ProductContentOrigin,
} from './product-content-origin-types.js';

export { PLACEHOLDER_TEMPLATE_ELIMINATION_AUTHORITY_V1_CONTRACT };

export interface ContentFragmentInput {
  readonly text: string;
  readonly location: string;
}

export interface PlaceholderTemplateEliminationAuditInput {
  readonly fragments: readonly ContentFragmentInput[];
  readonly contractVocabulary: readonly string[];
  readonly cbgaVocabulary: readonly string[];
  readonly promptVocabulary: readonly string[];
}

function emptyOriginCounts(): Record<ProductContentOrigin, number> {
  const counts = {} as Record<ProductContentOrigin, number>;
  for (const origin of PRODUCT_CONTENT_ORIGINS) counts[origin] = 0;
  return counts;
}

export function auditProductContentOrigins(input: PlaceholderTemplateEliminationAuditInput): PlaceholderTemplateEliminationAudit {
  const context: ContentOriginClassifierContext = {
    contractVocabulary: input.contractVocabulary,
    cbgaVocabulary: input.cbgaVocabulary,
    promptVocabulary: input.promptVocabulary,
  };

  const classifications: ContentOriginClassification[] = input.fragments.map((fragment) =>
    classifyContentOrigin(fragment.text, fragment.location, context),
  );

  const originCounts = emptyOriginCounts();
  const businessPlaceholderMatches: string[] = [];
  const unknownContentFragments: string[] = [];
  let allContentConstitutionallyTraceable = true;

  for (const classification of classifications) {
    originCounts[classification.origin] += 1;
    if (classification.matchedBusinessPlaceholderFingerprint) {
      businessPlaceholderMatches.push(classification.matchedBusinessPlaceholderFingerprint);
    }
    if (classification.origin === 'UNKNOWN_CONTENT') {
      unknownContentFragments.push(classification.text);
      allContentConstitutionallyTraceable = false;
    } else if (classification.ancestryRequired && !classification.ancestryProven) {
      allContentConstitutionallyTraceable = false;
    }
  }

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    classifications,
    totalFragmentsClassified: classifications.length,
    originCounts,
    businessPlaceholderMatches: [...new Set(businessPlaceholderMatches)],
    unknownContentFragments: [...new Set(unknownContentFragments)],
    allContentConstitutionallyTraceable,
  };
}
