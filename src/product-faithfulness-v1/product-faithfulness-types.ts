/**
 * Product Faithfulness V1 — types.
 *
 * Constitutional principle: a generated application is unsuccessful if it does not substantially
 * represent the requested product, regardless of whether it compiles, previews, validates, or
 * passes interaction proof. Technical correctness alone is insufficient — product correctness is
 * a first-class quality objective.
 *
 * This module is deterministic and evidence-driven. It never calls an LLM. It only reads evidence
 * that already exists elsewhere in the pipeline (the prompt, manifest, routes, feature contract,
 * navigation, visible UI text, interaction proof evidence) and never invents missing information.
 */

export const PRODUCT_FAITHFULNESS_V1_CONTRACT = 'PRODUCT_FAITHFULNESS_V1' as const;

/** Where an extracted concept's evidence came from — purely descriptive, used for diagnostics. */
export type ProductConceptSource =
  | 'PROMPT'
  | 'PROMPT_UNDERSTANDING'
  | 'ARCHITECTURE_SUMMARY'
  | 'FEATURE_CONTRACT'
  | 'MATERIALIZATION_MANIFEST'
  | 'ROUTES'
  | 'PAGES'
  | 'COMPONENTS'
  | 'FEATURE_MODULES'
  | 'NAVIGATION'
  | 'VISIBLE_UI_TEXT'
  | 'INTERACTION_PROOF'
  | 'GENERATED_PROFILE';

/** A single extracted product concept — a human-readable name plus where it was found. */
export interface ExtractedProductConcept {
  readOnly: true;
  /** Canonical, display-ready concept name, e.g. "Appointments". */
  concept: string;
  sources: ProductConceptSource[];
}

/**
 * Product Faithfulness Glossary Precision V1 — a single piece of textual evidence considered
 * while classifying a domain candidate, plus whether it was strong (domain-specific) or generic
 * (a common business verb/noun that never independently proves a domain on its own).
 */
export interface DomainEvidenceItem {
  readOnly: true;
  keyword: string;
  strength: 'STRONG' | 'GENERIC';
  /** Concept the keyword belongs to, or null when it is one of the domain's own trigger keywords. */
  concept: string | null;
}

/** Weighted-evidence diagnostics for exactly one domain candidate in the glossary. */
export interface DomainCandidateEvidence {
  readOnly: true;
  domain: string;
  /** 0..1, deterministic function of matched strong/generic evidence. */
  confidence: number;
  /** Whether this candidate had at least one STRONG (domain-specific) match — the only way to qualify to win. */
  qualifies: boolean;
  matchedEvidence: DomainEvidenceItem[];
  ignoredGenericEvidence: DomainEvidenceItem[];
  /** Concepts in this domain's glossary bundle for which zero evidence (strong or generic) was found. */
  missingEvidence: string[];
  /** Non-null explanation of why this candidate did NOT win, null when it is the winner. */
  rejectedReason: string | null;
}

/** Full weighted-evidence classification result across every domain in the glossary. */
export interface DomainClassificationDiagnostics {
  readOnly: true;
  winningDomain: string | null;
  winningConfidence: number;
  /** Every domain candidate considered, sorted by confidence descending (deterministic tie-break by glossary order). */
  candidates: DomainCandidateEvidence[];
  /** Human-readable explanation of why the winner won (or why nothing won). */
  explanation: string;
}

/** Evidence bundle for the requested product — what the user asked for. */
export interface RequestedProductProfile {
  readOnly: true;
  concepts: ExtractedProductConcept[];
  /** Best-effort recognized domain label (e.g. "Booking / Scheduling"), null when no known domain matched. */
  domainLabel: string | null;
  /** Weighted-evidence diagnostics behind domainLabel — why it won, and why every competitor lost. */
  domainClassification?: DomainClassificationDiagnostics;
}

/** Evidence bundle for the generated product — what was actually built. */
export interface GeneratedProductProfile {
  readOnly: true;
  concepts: ExtractedProductConcept[];
}

export interface ProductFaithfulnessComparison {
  readOnly: true;
  matched: string[];
  missing: string[];
  unexpected: string[];
  /** matched.length / max(1, requested concept count) */
  coverageRatio: number;
  /** matched.length / max(1, generated concept count) */
  precisionRatio: number;
}

export type ProductFaithfulnessVerdict =
  | 'PRODUCT_FAITHFUL'
  | 'PRODUCT_MOSTLY_FAITHFUL'
  | 'PARTIALLY_FAITHFUL'
  | 'LOW_FAITHFULNESS'
  | 'PRODUCT_MISMATCH';

export interface ProductFaithfulnessPlainEnglishSummary {
  readOnly: true;
  headline: string;
  reason: string;
  topMatched: string[];
  topMissing: string[];
  topUnexpected: string[];
}

export interface ProductFaithfulnessReport {
  readOnly: true;
  contractVersion: typeof PRODUCT_FAITHFULNESS_V1_CONTRACT;
  /** 0-100 */
  score: number;
  verdict: ProductFaithfulnessVerdict;
  requested: RequestedProductProfile;
  generated: GeneratedProductProfile;
  comparison: ProductFaithfulnessComparison;
  summary: ProductFaithfulnessPlainEnglishSummary;
}

/**
 * Evidence input — every field is optional because "do not invent missing information" means
 * this module must degrade gracefully when a given evidence source was never produced for a
 * particular build. Only real, existing evidence is ever used.
 */
export interface ProductFaithfulnessInput {
  /** 1. Original user prompt. Required — everything else is optional supporting evidence. */
  prompt: string;
  /** 2. Product understanding — any free-text or structured description already derived from the prompt. */
  promptUnderstanding?: string | string[] | Record<string, unknown> | null;
  /** 3. Architecture plan / summary text, if one was produced. */
  architectureSummary?: string | string[] | null;
  /** 4. Feature contract — planned/generated feature records or plain feature name strings. */
  featureContract?: Array<string | { featureName?: string; name?: string; title?: string }> | null;
  /** Materialization manifest hints — feature module names, prompt-derived terms, routes. */
  materializationManifestHints?: {
    featureModuleNames?: string[];
    promptTerms?: string[];
    routes?: string[];
  } | null;
  /** 5. Generated workspace evidence. */
  generatedRoutes?: string[];
  generatedPages?: string[];
  generatedComponents?: string[];
  generatedFeatureModules?: string[];
  navigationLabels?: string[];
  /** Coarse generated-app profile classification, when known (e.g. "BOOKING_WEB_V1"). */
  generatedProfile?: string | null;
  /** 6. Running application evidence — visible UI text / DOM text and interaction proof evidence. */
  visibleHeadings?: string[];
  domText?: string | null;
  interactionProofEvidence?: {
    primaryFeatureTextFound?: string | null;
    candidateTermsTried?: string[];
    whatWorked?: string[];
    whatFailed?: string[];
  } | null;
  /** Freeform workspace manifest summary lines, when available. */
  workspaceManifestSummary?: string[] | null;
}
