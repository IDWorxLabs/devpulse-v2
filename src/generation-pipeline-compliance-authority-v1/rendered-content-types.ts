/**
 * Generation Pipeline Compliance Authority V1 — Rendered Content Evidence Expansion V1 types.
 *
 * GPCA's original evidence surface only ever looked at *structure*: contract, blueprint, module
 * names, route names, navigation, manifest, file paths, generation traceability. That surface can
 * never see what a real user actually receives — a build can produce correct filenames/routes/
 * modules/traceability and still *render* generic template copy, placeholder onboarding, a starter
 * dashboard, or boilerplate navigation, because none of that lives in a file path.
 *
 * This module adds a second, orthogonal evidence layer: rendered content. It never inspects a real
 * browser DOM (no headless browser dependency is introduced) — instead it treats the generated
 * React/TSX source itself as the framework's "rendered React tree", and extracts the same visible
 * surface a browser would eventually paint (headings, button labels, navigation labels, page
 * titles, static text) directly from that source. This is the same technique
 * contract-bound-generation-authority-v4's surface-plan module already uses for *proposed* (pre-
 * generation) surface text — this module applies it to *real, post-generation* rendered text.
 *
 * Every fingerprint here is generic template/placeholder/boilerplate *wording or structure*, never
 * a product domain — the same "no hardcoded product logic" rule every other GPCA/CBGA/AEO/EIAA
 * module follows.
 *
 * Production Pipeline Constitution Adoption Phase 2 — Placeholder & Template Elimination Authority
 * V1 extends every evidence item below with Content Origin / Content Source / Approved Producer /
 * Traceability Chain (Part 4), computed by `placeholder-template-elimination-authority-v1`'s
 * classifier and attached by `rendered-content-collector.ts`. This is purely additive metadata: it
 * never changes which fingerprints exist, never changes the gate, and never turns a block into an
 * allow — it only lets GPCA (and this report) distinguish infrastructure text (exempt from
 * contract-ancestry proof) from product text (which must prove it).
 */

import type { ProductContentOrigin } from '../placeholder-template-elimination-authority-v1/product-content-origin-types.js';
import type { PlaceholderTemplateEliminationAudit } from '../placeholder-template-elimination-authority-v1/product-content-origin-types.js';

export type RenderedEvidenceSource =
  | 'RENDERED_HTML'
  | 'RENDERED_DOM'
  | 'RENDERED_REACT_TREE'
  | 'RENDERED_HEADING'
  | 'RENDERED_BUTTON_LABEL'
  | 'RENDERED_NAVIGATION_LABEL'
  | 'RENDERED_INFRASTRUCTURE_NAVIGATION_LABEL'
  | 'PAGE_TITLE'
  | 'MODULE_SURFACE_TEXT'
  | 'COMPONENT_OUTPUT'
  | 'GENERATED_UI_METADATA'
  | 'ROUTE_RENDER_OUTPUT'
  | 'STATIC_TEXT'
  | 'INTERACTION_SURFACE'
  | 'PLACEHOLDER_COPY'
  | 'TEMPLATE_FINGERPRINT'
  | 'REUSABLE_SHELL_FINGERPRINT'
  | 'ONBOARDING_FINGERPRINT'
  | 'STARTER_DASHBOARD_FINGERPRINT'
  | 'BOILERPLATE_COMPONENT_FINGERPRINT'
  | 'TEMPLATE_PAGE_FINGERPRINT'
  | 'RENDERED_CONTRACT_MATCH';

export const RENDERED_EVIDENCE_SOURCES: readonly RenderedEvidenceSource[] = [
  'RENDERED_HTML',
  'RENDERED_DOM',
  'RENDERED_REACT_TREE',
  'RENDERED_HEADING',
  'RENDERED_BUTTON_LABEL',
  'RENDERED_NAVIGATION_LABEL',
  'RENDERED_INFRASTRUCTURE_NAVIGATION_LABEL',
  'PAGE_TITLE',
  'MODULE_SURFACE_TEXT',
  'COMPONENT_OUTPUT',
  'GENERATED_UI_METADATA',
  'ROUTE_RENDER_OUTPUT',
  'STATIC_TEXT',
  'INTERACTION_SURFACE',
  'PLACEHOLDER_COPY',
  'TEMPLATE_FINGERPRINT',
  'REUSABLE_SHELL_FINGERPRINT',
  'ONBOARDING_FINGERPRINT',
  'STARTER_DASHBOARD_FINGERPRINT',
  'BOILERPLATE_COMPONENT_FINGERPRINT',
  'TEMPLATE_PAGE_FINGERPRINT',
  'RENDERED_CONTRACT_MATCH',
];

/** One piece of rendered-content evidence. Every field below is mandatory per this milestone's spec. */
export interface RenderedEvidenceItem {
  readOnly: true;
  source: RenderedEvidenceSource;
  /** 0-100. Higher means more certain this is a real compliance signal, not a coincidental word match. */
  confidence: number;
  reason: string;
  /** File (and, where useful, tag/snippet) the evidence was extracted from. */
  location: string;
  /** The generic fingerprint id that matched, or null when this is neutral/positive evidence. */
  matchedFingerprint: string | null;
  /** What the canonical contract actually expected here, or null when not applicable. */
  contractExpectation: string | null;
  /** Placeholder & Template Elimination Authority V1 (Part 4) — this fragment's constitutional origin. */
  contentOrigin: ProductContentOrigin;
  /** Human-readable description of the evidence that produced `contentOrigin`. */
  contentSource: string;
  /** The constitutional authority/stage allowed to have produced this content, or null for UNKNOWN_CONTENT. */
  approvedProducer: string | null;
  /** Ancestry path from this fragment back to its approved origin, outermost first. */
  traceabilityChain: readonly string[];
}

export interface RenderedContentEvidence {
  readOnly: true;
  items: readonly RenderedEvidenceItem[];
}

export interface RenderedHeadingEvidence extends RenderedContentEvidence {
  headings: readonly string[];
}

export interface RenderedNavigationEvidence extends RenderedContentEvidence {
  /** Product/business navigation labels only — never GPCA's contract-navigation comparison input for an infrastructure-marked item. */
  navigationLabels: readonly string[];
  /**
   * Contract-Bound Root Navigation Authority V1 — navigation labels this build's real source
   * structurally marked as infrastructure (root shell/frame/entry-surface) navigation. Reported for
   * transparency only; never consulted by GPCA's contract-navigation comparison, CBGA approval
   * checks, or any hardcoded-navigation detector.
   */
  infrastructureNavigationLabels: readonly string[];
}

export interface RenderedInteractionEvidence extends RenderedContentEvidence {
  buttonLabels: readonly string[];
}

export interface RenderedSurfaceEvidence extends RenderedContentEvidence {
  visibleText: readonly string[];
  pageTitles: readonly string[];
}

export interface RenderedTemplateEvidence extends RenderedContentEvidence {
  templateFingerprintsMatched: readonly string[];
  genericShellFingerprintsMatched: readonly string[];
}

export interface RenderedPlaceholderEvidence extends RenderedContentEvidence {
  placeholderPhrasesMatched: readonly string[];
}

export type GpcaRenderedContentGateOutcome =
  | 'RENDERED_CONTENT_ALLOWED'
  | 'RENDERED_CONTENT_BLOCKED_PLACEHOLDER_APPLICATION'
  | 'RENDERED_CONTENT_BLOCKED_GENERIC_TEMPLATE_OUTPUT'
  | 'RENDERED_CONTENT_BLOCKED_RENDERED_CONTRACT_DRIFT'
  | 'RENDERED_CONTENT_BLOCKED_NON_COMPLIANCE';

export const GPCA_RENDERED_CONTENT_GATE_OUTCOMES: readonly GpcaRenderedContentGateOutcome[] = [
  'RENDERED_CONTENT_ALLOWED',
  'RENDERED_CONTENT_BLOCKED_PLACEHOLDER_APPLICATION',
  'RENDERED_CONTENT_BLOCKED_GENERIC_TEMPLATE_OUTPUT',
  'RENDERED_CONTENT_BLOCKED_RENDERED_CONTRACT_DRIFT',
  'RENDERED_CONTENT_BLOCKED_NON_COMPLIANCE',
];

/**
 * The full rendered-content audit for one build. This is the object the GPCA report attaches as
 * `renderedContentAudit` — always present once real generated files exist, `null` before
 * materialization (there is nothing rendered yet to audit).
 */
export interface GpcaRenderedContentAudit {
  readOnly: true;
  filesAudited: readonly string[];
  routesAudited: readonly string[];
  headings: RenderedHeadingEvidence;
  navigation: RenderedNavigationEvidence;
  interactions: RenderedInteractionEvidence;
  surfaces: RenderedSurfaceEvidence;
  templates: RenderedTemplateEvidence;
  placeholders: RenderedPlaceholderEvidence;
  /** % of audited visible text (headings/titles/nav) that references at least one real contract concept. */
  renderedContractMatchPercent: number;
  overallRenderedCompliancePercent: number;
  gateOutcome: GpcaRenderedContentGateOutcome;
  blockedReasons: readonly string[];
  /**
   * Placeholder & Template Elimination Authority V1 — the full Content Origin classification for
   * every rendered text fragment this audit extracted (Part 1/4). Purely additive evidence: never
   * consulted by `evaluateRenderedContentGate` directly (that gate is unchanged), but every
   * business-placeholder match this audit's classifications found is already merged into
   * `placeholders.placeholderPhrasesMatched` above, so it still blocks through the existing gate.
   */
  contentOriginAudit: PlaceholderTemplateEliminationAudit;
  generatedAt: string;
}
