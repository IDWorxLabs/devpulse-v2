/**
 * Generation Pipeline Compliance Authority V1 — shared types.
 *
 * Product Faithfulness decides what a build *should* be. Contract-Bound Generation Authority V4
 * (CBGA) decides what modules/routes/navigation/surfaces are *allowed* to be generated. Neither
 * proves that every real generation stage actually *consumed* that decision instead of a legacy
 * template, a hardcoded blueprint default, or a regex-derived title. That is GPCA's one job: it
 * discovers the real generation pipeline, verifies every stage's actual inputs/outputs against
 * CBGA + the canonical product contract, builds an ancestry chain for every generated artifact,
 * scores compliance per stage, and blocks materialization/preview when a stage cannot prove it.
 *
 * GPCA never generates code and never repairs a generator — it audits and it blocks. Every type
 * here is generic pipeline-architecture vocabulary (stage names, evidence shapes), never a
 * product-domain concept — the same "no hardcoded product logic" rule CBGA/AEO/EIAA follow.
 */

import type { CbgaCanonicalContractEvidence, CbgaGenerationReport } from '../contract-bound-generation-authority-v4/index.js';
import type { InfrastructureProductBoundaryAudit } from '../infrastructure-product-boundary-authority-v1/index.js';
import type { GpcaRenderedContentAudit } from './rendered-content-types.js';

export const GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1_CONTRACT =
  'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1' as const;

/**
 * The real generation pipeline, in execution order. This is the architectural skeleton GPCA
 * discovers stage descriptors against — analogous to AEO's repair-capability registry: it
 * describes *what already exists in the codebase* (never a product concept), and every boolean
 * compliance flag on a discovered stage is computed from real per-build evidence, not fixed here.
 */
export type GpcaStageId =
  | 'PROMPT_UNDERSTANDING'
  | 'PLANNING'
  | 'ARCHITECTURE'
  | 'CANONICAL_PRODUCT_CONTRACT'
  | 'CONTRACT_BOUND_GENERATION_AUTHORITY'
  | 'PROMPT_BOUNDED_MODULE_PLAN'
  | 'MODULE_GENERATOR'
  | 'ROUTE_GENERATOR'
  | 'NAVIGATION_GENERATOR'
  | 'SURFACE_GENERATOR'
  | 'BLUEPRINT_GENERATOR'
  | 'UNIVERSAL_FEATURE_CONTRACT'
  | 'MATERIALIZATION'
  | 'WORKSPACE_GENERATION'
  | 'PREVIEW_GENERATION'
  | 'RUNTIME'
  | 'LIVE_PREVIEW'
  | 'PRODUCT_FAITHFULNESS'
  | 'LAUNCH';

export const GPCA_STAGE_IDS: readonly GpcaStageId[] = [
  'PROMPT_UNDERSTANDING',
  'PLANNING',
  'ARCHITECTURE',
  'CANONICAL_PRODUCT_CONTRACT',
  'CONTRACT_BOUND_GENERATION_AUTHORITY',
  'PROMPT_BOUNDED_MODULE_PLAN',
  'MODULE_GENERATOR',
  'ROUTE_GENERATOR',
  'NAVIGATION_GENERATOR',
  'SURFACE_GENERATOR',
  'BLUEPRINT_GENERATOR',
  'UNIVERSAL_FEATURE_CONTRACT',
  'MATERIALIZATION',
  'WORKSPACE_GENERATION',
  'PREVIEW_GENERATION',
  'RUNTIME',
  'LIVE_PREVIEW',
  'PRODUCT_FAITHFULNESS',
  'LAUNCH',
];

export interface GpcaStageComplianceFlags {
  readonly usesCbga: boolean;
  readonly usesCanonicalContract: boolean;
  readonly usesPromptBoundedModulePlan: boolean;
  readonly usesUniversalFeatureContract: boolean;
  readonly usesProfileFeatureDefinition: boolean;
  readonly usesBlueprintDefaults: boolean;
  readonly usesHardcodedTemplate: boolean;
  readonly usesGenericShell: boolean;
  readonly usesLegacyPlanner: boolean;
  readonly usesRegexExtraction: boolean;
  readonly usesFallbackModules: boolean;
  readonly usesDefaultNavigation: boolean;
  readonly usesDefaultRoutes: boolean;
  readonly usesGenericUiCopy: boolean;
  readonly usesReusableComponentShell: boolean;
  readonly usesTitleOutsideContract: boolean;
  readonly usesModuleOutsideContract: boolean;
  readonly usesRouteOutsideContract: boolean;
  readonly usesSurfaceOutsideContract: boolean;
  readonly usesNavigationOutsideContract: boolean;
}

export const GPCA_COMPLIANT_STAGE_FLAGS: GpcaStageComplianceFlags = {
  usesCbga: false,
  usesCanonicalContract: false,
  usesPromptBoundedModulePlan: false,
  usesUniversalFeatureContract: false,
  usesProfileFeatureDefinition: false,
  usesBlueprintDefaults: false,
  usesHardcodedTemplate: false,
  usesGenericShell: false,
  usesLegacyPlanner: false,
  usesRegexExtraction: false,
  usesFallbackModules: false,
  usesDefaultNavigation: false,
  usesDefaultRoutes: false,
  usesGenericUiCopy: false,
  usesReusableComponentShell: false,
  usesTitleOutsideContract: false,
  usesModuleOutsideContract: false,
  usesRouteOutsideContract: false,
  usesSurfaceOutsideContract: false,
  usesNavigationOutsideContract: false,
};

export interface GpcaStageDescriptor {
  readOnly: true;
  stageId: GpcaStageId;
  stageName: string;
  responsibleModule: string;
  inputObjects: readonly string[];
  outputObjects: readonly string[];
  flags: GpcaStageComplianceFlags;
}

export type GpcaComplianceStatus = 'PASS' | 'FAIL';

export interface GpcaStageComplianceScore {
  readOnly: true;
  stageId: GpcaStageId;
  stageName: string;
  contractCompliancePercent: number;
  inputCompliancePercent: number;
  outputCompliancePercent: number;
  traceabilityPercent: number;
  templateLeakagePercent: number;
  legacyUsagePercent: number;
  blueprintUsagePercent: number;
  overallCompliancePercent: number;
  status: GpcaComplianceStatus;
  reasons: readonly string[];
}

/** One link in a generated artifact's ancestry chain — from prompt to contract to generator. */
export interface GpcaProvenanceLink {
  readOnly: true;
  artifact: string;
  generatedBy: GpcaStageId;
  inputSource: string;
  derivedFrom: string;
  originContractConcept: string | null;
}

export interface GpcaTraceabilityResult {
  readOnly: true;
  artifact: string;
  artifactKind: 'MODULE' | 'ROUTE' | 'NAVIGATION_ITEM' | 'TITLE' | 'SURFACE' | 'METADATA' | 'SAMPLE_DATA' | 'PROVENANCE' | 'REPAIR_REALITY' | 'PRODUCTION_BUILD_ENVELOPE';
  proven: boolean;
  chain: readonly GpcaProvenanceLink[];
  brokenAtLink: string | null;
  reason: string;
}

export type GpcaGenerationGateOutcome =
  | 'COMPLIANCE_ALLOWED'
  | 'COMPLIANCE_BLOCKED_LEGACY_GENERATOR'
  | 'COMPLIANCE_BLOCKED_TEMPLATE_GENERATOR'
  | 'COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS'
  | 'COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE'
  | 'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS'
  | 'COMPLIANCE_BLOCKED_PIPELINE_NON_COMPLIANCE'
  /** Rendered Content Evidence Expansion V1 — structure passed, but real rendered output did not. */
  | 'COMPLIANCE_BLOCKED_PLACEHOLDER_APPLICATION'
  | 'COMPLIANCE_BLOCKED_GENERIC_TEMPLATE_OUTPUT'
  | 'COMPLIANCE_BLOCKED_RENDERED_CONTRACT_DRIFT'
  | 'COMPLIANCE_BLOCKED_RENDERED_CONTENT_NON_COMPLIANCE';

export const GPCA_GENERATION_GATE_OUTCOMES: readonly GpcaGenerationGateOutcome[] = [
  'COMPLIANCE_ALLOWED',
  'COMPLIANCE_BLOCKED_LEGACY_GENERATOR',
  'COMPLIANCE_BLOCKED_TEMPLATE_GENERATOR',
  'COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS',
  'COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE',
  'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS',
  'COMPLIANCE_BLOCKED_PIPELINE_NON_COMPLIANCE',
  'COMPLIANCE_BLOCKED_PLACEHOLDER_APPLICATION',
  'COMPLIANCE_BLOCKED_GENERIC_TEMPLATE_OUTPUT',
  'COMPLIANCE_BLOCKED_RENDERED_CONTRACT_DRIFT',
  'COMPLIANCE_BLOCKED_RENDERED_CONTENT_NON_COMPLIANCE',
];

export type GpcaFailureClass =
  | 'GENERATION_PIPELINE_NON_COMPLIANCE'
  | 'LEGACY_GENERATOR_DETECTED'
  | 'TEMPLATE_GENERATOR_DETECTED'
  | 'BLUEPRINT_BYPASS'
  | 'CONTRACT_TRACEABILITY_FAILURE'
  | 'GENERATOR_INPUT_BYPASS'
  | 'PIPELINE_COMPLIANCE_FAILURE'
  /** Rendered Content Evidence Expansion V1. */
  | 'RENDERED_CONTENT_NON_COMPLIANT'
  | 'PLACEHOLDER_APPLICATION'
  | 'GENERIC_TEMPLATE_OUTPUT'
  | 'RENDERED_CONTRACT_DRIFT';

export const GPCA_FAILURE_CLASSES: readonly GpcaFailureClass[] = [
  'GENERATION_PIPELINE_NON_COMPLIANCE',
  'LEGACY_GENERATOR_DETECTED',
  'TEMPLATE_GENERATOR_DETECTED',
  'BLUEPRINT_BYPASS',
  'CONTRACT_TRACEABILITY_FAILURE',
  'GENERATOR_INPUT_BYPASS',
  'PIPELINE_COMPLIANCE_FAILURE',
  'RENDERED_CONTENT_NON_COMPLIANT',
  'PLACEHOLDER_APPLICATION',
  'GENERIC_TEMPLATE_OUTPUT',
  'RENDERED_CONTRACT_DRIFT',
];

/** Maps a GPCA gate outcome to the AEO failure class it should be diagnosed as. */
export const GPCA_GATE_OUTCOME_TO_FAILURE_CLASS: Readonly<Record<GpcaGenerationGateOutcome, GpcaFailureClass | null>> = {
  COMPLIANCE_ALLOWED: null,
  COMPLIANCE_BLOCKED_LEGACY_GENERATOR: 'LEGACY_GENERATOR_DETECTED',
  COMPLIANCE_BLOCKED_TEMPLATE_GENERATOR: 'TEMPLATE_GENERATOR_DETECTED',
  COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS: 'BLUEPRINT_BYPASS',
  COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE: 'CONTRACT_TRACEABILITY_FAILURE',
  COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS: 'GENERATOR_INPUT_BYPASS',
  COMPLIANCE_BLOCKED_PIPELINE_NON_COMPLIANCE: 'PIPELINE_COMPLIANCE_FAILURE',
  COMPLIANCE_BLOCKED_PLACEHOLDER_APPLICATION: 'PLACEHOLDER_APPLICATION',
  COMPLIANCE_BLOCKED_GENERIC_TEMPLATE_OUTPUT: 'GENERIC_TEMPLATE_OUTPUT',
  COMPLIANCE_BLOCKED_RENDERED_CONTRACT_DRIFT: 'RENDERED_CONTRACT_DRIFT',
  COMPLIANCE_BLOCKED_RENDERED_CONTENT_NON_COMPLIANCE: 'RENDERED_CONTENT_NON_COMPLIANT',
};

/** Maps a rendered-content gate outcome (rendered-content-gate.ts) to the GPCA gate outcome it becomes. */
export const RENDERED_CONTENT_OUTCOME_TO_GATE_OUTCOME: Readonly<
  Record<import('./rendered-content-types.js').GpcaRenderedContentGateOutcome, GpcaGenerationGateOutcome>
> = {
  RENDERED_CONTENT_ALLOWED: 'COMPLIANCE_ALLOWED',
  RENDERED_CONTENT_BLOCKED_PLACEHOLDER_APPLICATION: 'COMPLIANCE_BLOCKED_PLACEHOLDER_APPLICATION',
  RENDERED_CONTENT_BLOCKED_GENERIC_TEMPLATE_OUTPUT: 'COMPLIANCE_BLOCKED_GENERIC_TEMPLATE_OUTPUT',
  RENDERED_CONTENT_BLOCKED_RENDERED_CONTRACT_DRIFT: 'COMPLIANCE_BLOCKED_RENDERED_CONTRACT_DRIFT',
  RENDERED_CONTENT_BLOCKED_NON_COMPLIANCE: 'COMPLIANCE_BLOCKED_RENDERED_CONTENT_NON_COMPLIANCE',
};

/**
 * Real, structural evidence of the actual files a build wrote (or, before materialization, an
 * empty list). Known generic blueprint page paths are only ever evaluated against this real
 * evidence — never guessed — so "detected" always means "found on disk for this build."
 */
export const GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES: ReadonlyArray<{ path: string; navLabel: string | null; kind: string }> = [
  { path: 'src/blueprint/WelcomeScreen.tsx', navLabel: null, kind: 'template welcome screen' },
  { path: 'src/blueprint/OnboardingScreen.tsx', navLabel: null, kind: 'template onboarding screen' },
  { path: 'src/blueprint/pages/ProfilePage.tsx', navLabel: 'Profile', kind: 'generic profile page' },
  { path: 'src/blueprint/pages/SettingsPage.tsx', navLabel: 'Settings', kind: 'generic settings page' },
  { path: 'src/blueprint/pages/HelpCenterPage.tsx', navLabel: 'Help', kind: 'generic help page' },
  { path: 'src/blueprint/pages/FeedbackPage.tsx', navLabel: 'Feedback', kind: 'generic feedback page' },
  { path: 'src/blueprint/pages/LegalPage.tsx', navLabel: 'Legal', kind: 'generic legal page' },
  { path: 'src/blueprint/pages/NotificationsPage.tsx', navLabel: 'Alerts', kind: 'generic alerts page' },
  { path: 'src/blueprint/pages/AboutPage.tsx', navLabel: null, kind: 'generic about page' },
  { path: 'src/blueprint/pages/SearchPage.tsx', navLabel: null, kind: 'generic search page' },
];

export interface GpcaProposedGeneratorInputs {
  readonly appTitle: string;
  readonly moduleIds: readonly string[];
  readonly routes: readonly string[];
  readonly navigationLabels: readonly string[];
  /** Real files this build actually wrote. Empty before materialization (pre-materialization phase). */
  readonly generatedFilePaths: readonly string[];
}

export interface GpcaPipelineEvidenceInput {
  readonly contract: CbgaCanonicalContractEvidence;
  readonly cbgaReport: CbgaGenerationReport | null;
  readonly proposed: GpcaProposedGeneratorInputs;
}

export interface GpcaComplianceReport {
  readOnly: true;
  contractVersion: typeof GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1_CONTRACT;
  contractId: string;
  productIdentity: string;
  stages: readonly GpcaStageDescriptor[];
  scores: readonly GpcaStageComplianceScore[];
  traceability: readonly GpcaTraceabilityResult[];
  legacyGeneratorsDetected: readonly string[];
  templateGeneratorsDetected: readonly string[];
  genericShellSurfacesBlocked: readonly string[];
  blueprintBypassDetected: readonly string[];
  contractBypassDetected: readonly string[];
  finalGateOutcome: GpcaGenerationGateOutcome;
  blockedReasons: readonly string[];
  overallCompliancePercent: number;
  phase: 'PRE_MATERIALIZATION' | 'POST_MATERIALIZATION';
  /**
   * Rendered Content Evidence Expansion V1 — audits what a real user actually sees (headings, nav,
   * buttons, page titles, static text, generic-template/placeholder/reusable-shell fingerprints),
   * not just structure. `null` before materialization or when no rendered file contents were
   * supplied to this report — never fabricated, only ever real evidence.
   */
  renderedContentAudit: GpcaRenderedContentAudit | null;
  /**
   * Infrastructure vs Product Boundary Authority V1 — per-file INFRASTRUCTURE/PRODUCT/MIXED/UNKNOWN
   * classification for this build's real generated files, or `null` before real file content exists
   * (pre-materialization) or when the caller supplied none. Purely additive evidence: it can only
   * ever exempt a file the presence-based detectors below would otherwise flag, by proving — from
   * the file's own real content, never its path — that it is pure hosting infrastructure with zero
   * business content. It can never turn a genuine violation into an allow.
   */
  boundaryAudit: InfrastructureProductBoundaryAudit | null;
  generatedAt: string;
}
