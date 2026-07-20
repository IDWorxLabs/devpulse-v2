/**
 * Production Pipeline Constitution Adoption Phase 2 — Placeholder & Template Elimination
 * Authority V1 — Product Content Origin taxonomy.
 *
 * Every visible piece of product content a real build renders must belong to exactly one
 * constitutional origin. This module defines that taxonomy generically — never a product domain,
 * never a per-application special case — and is the single source of truth every classifier in
 * this authority (and every GPCA evidence item that carries origin metadata) must use.
 *
 * Allowed origins (PPC-1600/PPC-1700 "single source of truth" / "pipeline data contract" style):
 *   - CONTRACT_PRODUCT_CONTENT   — traces to the Approved Canonical Product Contract.
 *   - CBGA_PRODUCT_CONTENT       — traces to CBGA's approved generation plan (module/route/nav).
 *   - PROMPT_PRODUCT_CONTENT     — traces to prompt-derived product copy (raw prompt vocabulary).
 *   - INFRASTRUCTURE_CONTENT     — generic UI chrome that hosts the product; carries no business
 *                                  identity and is exempt from contract-ancestry proof.
 *   - MATERIALIZATION_METADATA   — build/version/identifier metadata, never business content.
 *   - UNKNOWN_CONTENT            — cannot be traced to any approved origin. Always fails.
 */

export type ProductContentOrigin =
  | 'CONTRACT_PRODUCT_CONTENT'
  | 'CBGA_PRODUCT_CONTENT'
  | 'PROMPT_PRODUCT_CONTENT'
  | 'INFRASTRUCTURE_CONTENT'
  | 'MATERIALIZATION_METADATA'
  | 'UNKNOWN_CONTENT';

export const PRODUCT_CONTENT_ORIGINS: readonly ProductContentOrigin[] = [
  'CONTRACT_PRODUCT_CONTENT',
  'CBGA_PRODUCT_CONTENT',
  'PROMPT_PRODUCT_CONTENT',
  'INFRASTRUCTURE_CONTENT',
  'MATERIALIZATION_METADATA',
  'UNKNOWN_CONTENT',
];

/** Origins that are never required to prove ancestry to CBGA/the contract (Part 4). */
export const ANCESTRY_EXEMPT_ORIGINS: readonly ProductContentOrigin[] = [
  'INFRASTRUCTURE_CONTENT',
  'MATERIALIZATION_METADATA',
];

/** UNKNOWN_CONTENT must always fail validation — the one origin with no valid producer. */
export const PRODUCT_CONTENT_ORIGIN_FAILS_VALIDATION: Readonly<Record<ProductContentOrigin, boolean>> = {
  CONTRACT_PRODUCT_CONTENT: false,
  CBGA_PRODUCT_CONTENT: false,
  PROMPT_PRODUCT_CONTENT: false,
  INFRASTRUCTURE_CONTENT: false,
  MATERIALIZATION_METADATA: false,
  UNKNOWN_CONTENT: true,
};

/** The constitutional producer allowed to own each origin — never a product domain, always a pipeline stage/authority. */
export const PRODUCT_CONTENT_ORIGIN_APPROVED_PRODUCER: Readonly<Record<ProductContentOrigin, string | null>> = {
  CONTRACT_PRODUCT_CONTENT: 'CANONICAL_PRODUCT_CONTRACT',
  CBGA_PRODUCT_CONTENT: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
  PROMPT_PRODUCT_CONTENT: 'PROMPT_FAITHFUL_GENERATION',
  INFRASTRUCTURE_CONTENT: 'BLUEPRINT_INFRASTRUCTURE',
  MATERIALIZATION_METADATA: 'MATERIALIZATION',
  UNKNOWN_CONTENT: null,
};

/** One rendered text fragment, classified into exactly one constitutional origin. */
export interface ContentOriginClassification {
  readOnly: true;
  text: string;
  location: string;
  origin: ProductContentOrigin;
  /** Human-readable description of what evidence produced this origin (e.g. "CanonicalProductContract.allConceptNames"). */
  contentSource: string;
  /** The constitutional authority/stage allowed to have produced this content, or null for UNKNOWN_CONTENT. */
  approvedProducer: string | null;
  /** Ancestry path from this fragment back to its approved origin, outermost first. Empty when none exists. */
  traceabilityChain: readonly string[];
  /** True when this fragment matched a generic, generator-invented business-placeholder pattern (Sample/Demo/Preview/Fake/...). */
  isBusinessPlaceholder: boolean;
  matchedBusinessPlaceholderFingerprint: string | null;
  /** False for INFRASTRUCTURE_CONTENT/MATERIALIZATION_METADATA — those are exempt from ancestry proof (Part 4). */
  ancestryRequired: boolean;
  ancestryProven: boolean;
}

export interface PlaceholderTemplateEliminationAudit {
  readOnly: true;
  generatedAt: string;
  classifications: readonly ContentOriginClassification[];
  totalFragmentsClassified: number;
  originCounts: Readonly<Record<ProductContentOrigin, number>>;
  businessPlaceholderMatches: readonly string[];
  unknownContentFragments: readonly string[];
  /** True only when zero fragments classified UNKNOWN_CONTENT and every ancestry-required fragment proved ancestry. */
  allContentConstitutionallyTraceable: boolean;
}

export const PLACEHOLDER_TEMPLATE_ELIMINATION_AUTHORITY_V1_CONTRACT =
  'PLACEHOLDER_TEMPLATE_ELIMINATION_AUTHORITY_V1' as const;
