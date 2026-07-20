/**
 * Infrastructure vs Product Boundary Authority V1 — taxonomy + result types.
 *
 * GPCA's own audit (Production Contract Consumption Trace V1, Blueprint Generator Contract-Bound
 * Replacement V1) surfaced a genuine, generic architectural fact that has nothing to do with any one
 * product: every application AiDevEngine builds is made of two fundamentally different kinds of
 * generated file —
 *
 *   INFRASTRUCTURE — code that only ever hosts the product. It bootstraps the runtime, wires
 *   routing/providers/error-and-loading boundaries/lifecycle/theme/configuration, and switches
 *   between screens. It carries no business identity, no product terminology, and no hardcoded
 *   copy of its own.
 *
 *   PRODUCT — code whose entire reason to exist is business-specific: pages, screens, modules,
 *   features, workflows, navigation labels, headings, button copy, forms, dashboards. Every one of
 *   these must originate from the Approved Product Contract / CBGA-repaired Build Plan /
 *   PromptBoundedModulePlan / Architecture / Universal Feature Contract — never a template.
 *
 * Neither kind is illegitimate. The prior conflict (GPCA blocking files that ~15 other production
 * authorities require to exist) was never a bug in either system — it was the absence of a formal
 * boundary between them. This module is that boundary, expressed as a fully generic, content-based
 * classifier: it NEVER inspects a file path/name to decide anything (no filename whitelist, no
 * per-file special case) — it only ever asks what responsibility the file's real, current content
 * actually performs, using the same real-content-extraction primitives GPCA's Rendered Content
 * Evidence Expansion V1 already uses (never duplicated, always imported).
 */

/** Phase 1 — infrastructure taxonomy. Every kind below hosts the product; none of them is ever the product itself. */
export type InfrastructureResponsibilityKind =
  | 'APPLICATION_BOOTSTRAP'
  | 'RUNTIME_STARTUP'
  | 'DEPENDENCY_WIRING'
  | 'ROUTING_INFRASTRUCTURE'
  | 'LAYOUT_INFRASTRUCTURE'
  | 'NAVIGATION_INFRASTRUCTURE'
  | 'RENDER_PIPELINE'
  | 'THEME_INFRASTRUCTURE'
  | 'CONFIGURATION'
  | 'SERVICE_REGISTRATION'
  | 'DEPENDENCY_INJECTION'
  | 'PROVIDER_HIERARCHY'
  | 'ERROR_BOUNDARY'
  | 'LOADING_BOUNDARY'
  | 'APPLICATION_SHELL'
  | 'STARTUP_ORCHESTRATION'
  | 'LIFECYCLE_INFRASTRUCTURE'
  | 'SHARED_RUNTIME';

export const INFRASTRUCTURE_RESPONSIBILITY_KINDS: readonly InfrastructureResponsibilityKind[] = [
  'APPLICATION_BOOTSTRAP',
  'RUNTIME_STARTUP',
  'DEPENDENCY_WIRING',
  'ROUTING_INFRASTRUCTURE',
  'LAYOUT_INFRASTRUCTURE',
  'NAVIGATION_INFRASTRUCTURE',
  'RENDER_PIPELINE',
  'THEME_INFRASTRUCTURE',
  'CONFIGURATION',
  'SERVICE_REGISTRATION',
  'DEPENDENCY_INJECTION',
  'PROVIDER_HIERARCHY',
  'ERROR_BOUNDARY',
  'LOADING_BOUNDARY',
  'APPLICATION_SHELL',
  'STARTUP_ORCHESTRATION',
  'LIFECYCLE_INFRASTRUCTURE',
  'SHARED_RUNTIME',
];

/** Phase 2 — product taxonomy. Every kind below must be traceable to the approved contract/build plan. */
export type ProductResponsibilityKind =
  | 'PAGE'
  | 'SCREEN'
  | 'MODULE'
  | 'FEATURE'
  | 'BUSINESS_WORKFLOW'
  | 'BUSINESS_NAVIGATION'
  | 'BUSINESS_COPY'
  | 'LABEL'
  | 'HEADING'
  | 'BUTTON'
  | 'FORM'
  | 'DASHBOARD'
  | 'BUSINESS_COMPONENT'
  | 'BUSINESS_SERVICE'
  | 'BUSINESS_VALIDATION'
  | 'BUSINESS_INTERACTION'
  | 'CONTRACT_DERIVED_CONTENT';

export const PRODUCT_RESPONSIBILITY_KINDS: readonly ProductResponsibilityKind[] = [
  'PAGE',
  'SCREEN',
  'MODULE',
  'FEATURE',
  'BUSINESS_WORKFLOW',
  'BUSINESS_NAVIGATION',
  'BUSINESS_COPY',
  'LABEL',
  'HEADING',
  'BUTTON',
  'FORM',
  'DASHBOARD',
  'BUSINESS_COMPONENT',
  'BUSINESS_SERVICE',
  'BUSINESS_VALIDATION',
  'BUSINESS_INTERACTION',
  'CONTRACT_DERIVED_CONTENT',
];

/** Phase 5 — the only four outcomes the generic verifier may ever produce for a file. */
export type BoundaryClassification = 'INFRASTRUCTURE' | 'PRODUCT' | 'MIXED' | 'UNKNOWN';

export const BOUNDARY_CLASSIFICATIONS: readonly BoundaryClassification[] = ['INFRASTRUCTURE', 'PRODUCT', 'MIXED', 'UNKNOWN'];

/** The only shape this authority ever reads. Never a file path lookup — always real content. */
export interface BoundaryFileInput {
  readonly path: string;
  readonly content: string;
}

/** One matched signal — either an infrastructure-responsibility kind or a business-content kind, plus the real evidence that matched. */
export interface BoundarySignalMatch {
  readonly kind: string;
  readonly evidence: string;
}

export interface BoundaryFileClassification {
  readOnly: true;
  readonly path: string;
  readonly classification: BoundaryClassification;
  readonly infrastructureSignals: readonly BoundarySignalMatch[];
  readonly businessContentSignals: readonly BoundarySignalMatch[];
  /** Whether any business-content signal in this file actually references a real contract concept. */
  readonly contractReferenced: boolean;
  /** True only when classification === 'INFRASTRUCTURE' — the single flag GPCA's gate is allowed to consult. */
  readonly safeAsInfrastructure: boolean;
  readonly reasons: readonly string[];
}

export interface InfrastructureProductBoundaryAudit {
  readOnly: true;
  readonly generatedAt: string;
  readonly results: readonly BoundaryFileClassification[];
  readonly infrastructureCount: number;
  readonly productCount: number;
  readonly mixedCount: number;
  readonly unknownCount: number;
  /** Paths GPCA may treat as pure hosting infrastructure — never a filename list, always this build's actual classification output. */
  readonly safeInfrastructurePaths: readonly string[];
  /** MIXED or UNKNOWN paths — Phase 5: these must be decomposed or rejected, never silently allowed. */
  readonly violatingPaths: readonly string[];
}

export const INFRASTRUCTURE_PRODUCT_BOUNDARY_AUTHORITY_V1_CONTRACT = 'INFRASTRUCTURE_PRODUCT_BOUNDARY_AUTHORITY_V1' as const;
