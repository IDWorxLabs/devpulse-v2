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
  artifactKind: 'MODULE' | 'ROUTE' | 'NAVIGATION_ITEM' | 'TITLE' | 'SURFACE';
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
  | 'COMPLIANCE_BLOCKED_PIPELINE_NON_COMPLIANCE';

export const GPCA_GENERATION_GATE_OUTCOMES: readonly GpcaGenerationGateOutcome[] = [
  'COMPLIANCE_ALLOWED',
  'COMPLIANCE_BLOCKED_LEGACY_GENERATOR',
  'COMPLIANCE_BLOCKED_TEMPLATE_GENERATOR',
  'COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS',
  'COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE',
  'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS',
  'COMPLIANCE_BLOCKED_PIPELINE_NON_COMPLIANCE',
];

export type GpcaFailureClass =
  | 'GENERATION_PIPELINE_NON_COMPLIANCE'
  | 'LEGACY_GENERATOR_DETECTED'
  | 'TEMPLATE_GENERATOR_DETECTED'
  | 'BLUEPRINT_BYPASS'
  | 'CONTRACT_TRACEABILITY_FAILURE'
  | 'GENERATOR_INPUT_BYPASS'
  | 'PIPELINE_COMPLIANCE_FAILURE';

export const GPCA_FAILURE_CLASSES: readonly GpcaFailureClass[] = [
  'GENERATION_PIPELINE_NON_COMPLIANCE',
  'LEGACY_GENERATOR_DETECTED',
  'TEMPLATE_GENERATOR_DETECTED',
  'BLUEPRINT_BYPASS',
  'CONTRACT_TRACEABILITY_FAILURE',
  'GENERATOR_INPUT_BYPASS',
  'PIPELINE_COMPLIANCE_FAILURE',
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
  generatedAt: string;
}
