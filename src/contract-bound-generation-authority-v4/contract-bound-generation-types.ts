/**
 * Contract-Bound Generation Authority V4 — shared types.
 *
 * CBGA makes the real app generator obey the approved canonical product contract. It never
 * invents product-specific rules — every module/route/navigation/surface requirement is derived
 * mechanically from whatever concepts the contract contains, for any product domain.
 *
 * The "approved canonical product contract" this module consumes is a minimal, structural view of
 * product-faithfulness-v2's `CanonicalProductContract` (deliberately decoupled, like AEO/EIAA's
 * evidence bridges) so CBGA can be built and unit-tested without importing that module's internals.
 */

export const CONTRACT_BOUND_GENERATION_AUTHORITY_V4_CONTRACT =
  'CONTRACT_BOUND_GENERATION_AUTHORITY_V4' as const;

/** Structural, minimal view of product-faithfulness-v2's CanonicalProductContract. */
export interface CbgaCanonicalContractEvidence {
  contractId: string;
  productIdentity: string;
  primaryWorkflows: readonly string[];
  coreEntities: readonly string[];
  coreActions: readonly string[];
  navigationExpectations: readonly string[];
  majorFeatureGroups: readonly string[];
  businessConcepts: readonly string[];
  allConceptNames: readonly string[];
}

export type CbgaModuleEvidenceSource =
  | 'CONTRACT_ENTITY'
  | 'CONTRACT_WORKFLOW'
  | 'CONTRACT_CAPABILITY';

export interface CbgaModulePlanEntry {
  readOnly: true;
  moduleId: string;
  displayName: string;
  sourceContractConcept: string;
  requiredWorkflows: string[];
  requiredActions: string[];
  requiredEntities: string[];
  requiredUiSurfaces: string[];
  evidenceSource: CbgaModuleEvidenceSource;
  confidence: number;
  generationAllowed: boolean;
}

/** Cross-cutting infrastructure concepts every app reasonably needs — generic, not product-specific. */
export const CBGA_SYSTEM_SHELL_MODULE_IDS: readonly string[] = ['auth', 'dashboard', 'settings', 'persistence'];

/** Known generic/placeholder module terms that must never be treated as contract evidence. */
export const CBGA_GENERIC_FALLBACK_MODULE_TERMS: readonly string[] = [
  'records',
  'item',
  'items',
  'general',
  'misc',
  'feature',
  'features',
  'reusable-components',
  'reusable-components-where',
  'custom-app',
];

export type CbgaProposedModuleVerdict =
  | 'CONTRACT_SUPPORTED'
  | 'SYSTEM_SHELL_ALLOWED'
  | 'GENERIC_UNSUPPORTED'
  | 'UNSUPPORTED_FALLBACK';

export interface CbgaProposedModuleEvaluation {
  readOnly: true;
  moduleId: string;
  verdict: CbgaProposedModuleVerdict;
  matchedPlanEntry: CbgaModulePlanEntry | null;
  reason: string;
}

export interface CbgaRoutePlanEntry {
  readOnly: true;
  routeId: string;
  path: string;
  label: string;
  moduleId: string;
  sourceContractConcept: string;
  requiredScreenPurpose: string;
}

export type CbgaProposedRouteVerdict = 'CONTRACT_SUPPORTED' | 'SYSTEM_SHELL_ALLOWED' | 'UNSUPPORTED_NO_MODULE';

export interface CbgaProposedRouteEvaluation {
  readOnly: true;
  path: string;
  verdict: CbgaProposedRouteVerdict;
  matchedRoute: CbgaRoutePlanEntry | null;
  reason: string;
}

export interface CbgaNavigationPlanItem {
  readOnly: true;
  label: string;
  path: string;
  moduleId: string;
  sourceContractConcept: string;
  visibilityReason: string;
}

/** The generic default-shell navigation labels that must never appear unless contract-supported. */
export const CBGA_DEFAULT_SHELL_NAVIGATION_LABELS: readonly string[] = [
  'Features',
  'Activity',
  'Alerts',
  'Profile',
  'Settings',
  'Help',
  'Feedback',
  'Legal',
];

export type CbgaProposedNavigationVerdict =
  | 'CONTRACT_SUPPORTED'
  | 'UNSUPPORTED_DEFAULT_SHELL'
  | 'UNSUPPORTED_MISSING_MODULE';

export interface CbgaProposedNavigationEvaluation {
  readOnly: true;
  label: string;
  verdict: CbgaProposedNavigationVerdict;
  matchedItem: CbgaNavigationPlanItem | null;
  reason: string;
}

export interface CbgaSurfacePlan {
  readOnly: true;
  titleRequirement: string;
  primaryInteractionRequirement: string;
  emptyStateRequirement: string;
  successStateRequirement: string;
  requiredControls: string[];
  requiredDataConcepts: string[];
  sourceContractConcept: string;
}

export interface CbgaProposedGeneratorInputs {
  proposedModuleIds: readonly string[];
  proposedRoutes: readonly string[];
  proposedNavigationLabels: readonly string[];
  proposedAppTitle: string;
  proposedWelcomeSurfaceText?: string | null;
  proposedPrimaryWorkflowVisible?: boolean;
  proposedPrimaryWorkflowInteractive?: boolean;
}

export interface CbgaSurfaceEvaluation {
  readOnly: true;
  titleIsGeneric: boolean;
  titleMatchesProductIdentity: boolean;
  welcomeSurfaceIsGenericShell: boolean;
  primaryWorkflowVisible: boolean;
  primaryWorkflowInteractive: boolean;
  reasons: string[];
}

export type CbgaGenerationGateOutcome =
  | 'GENERATION_ALLOWED'
  | 'GENERATION_BLOCKED_CONTRACT_INCONSISTENT'
  | 'GENERATION_REQUIRES_MODULE_PLAN_REPAIR'
  | 'GENERATION_REQUIRES_SURFACE_PLAN_REPAIR'
  | 'GENERATION_REQUIRES_ROUTE_NAV_REPAIR';

export type CbgaRepairActionId =
  | 'REMOVE_UNSUPPORTED_FALLBACK_MODULE'
  | 'REBUILD_MODULE_PLAN'
  | 'REBUILD_ROUTE_PLAN'
  | 'REBUILD_NAVIGATION_PLAN'
  | 'REBUILD_SURFACE_PLAN'
  | 'REPLACE_GENERIC_APP_IDENTITY'
  | 'REPLACE_GENERIC_WELCOME_SURFACE';

export interface CbgaRepairAction {
  readOnly: true;
  actionId: CbgaRepairActionId;
  detail: string;
}

export interface CbgaRepairedGeneratorInputs {
  readOnly: true;
  moduleIds: string[];
  routes: string[];
  navigationLabels: string[];
  appTitle: string;
  welcomeSurfaceText: string;
  actionsPerformed: CbgaRepairAction[];
}

export interface CbgaGenerationGateResult {
  readOnly: true;
  outcome: CbgaGenerationGateOutcome;
  reasons: string[];
  moduleEvaluations: CbgaProposedModuleEvaluation[];
  routeEvaluations: CbgaProposedRouteEvaluation[];
  navigationEvaluations: CbgaProposedNavigationEvaluation[];
  surfaceEvaluation: CbgaSurfaceEvaluation;
  unsupportedModulesRemoved: string[];
  unsupportedRoutesRemoved: string[];
  unsupportedNavigationRemoved: string[];
  genericShellSurfaceBlocked: boolean;
  contractConceptsMissing: string[];
}

export interface CbgaGenerationReport {
  readOnly: true;
  contractVersion: typeof CONTRACT_BOUND_GENERATION_AUTHORITY_V4_CONTRACT;
  contractId: string;
  productIdentity: string;
  /**
   * Identity Computation Collapse V1 — the single authoritative post-repair product identity
   * (PPC-1207 No Parallel Truth). Every downstream production stage must consume this instead of
   * independently deriving `productIdentity`/`repairedInputs.appTitle` on its own.
   */
  approvedIdentity: import('./approved-product-identity.js').ApprovedProductIdentity;
  /**
   * Navigation Computation Collapse V1 — the single authoritative post-repair navigation plan
   * (PPC-1207 No Parallel Truth). Every downstream production stage must consume this instead of
   * independently deriving/inferring/merging/repairing `navigationPlan`/`repairedInputs.navigationLabels`.
   */
  approvedNavigationPlan: import('./approved-navigation-plan.js').ApprovedNavigationPlan;
  /**
   * Module Computation Collapse V1 — the single authoritative post-repair module plan (PPC-1207
   * No Parallel Truth). Every downstream production stage must consume this instead of
   * independently deriving/inferring/merging/repairing/inventing a module list of its own
   * (`modulePlan`/`repairedInputs.moduleIds` remain the raw CBGA plans this object packages).
   */
  approvedModulePlan: import('./approved-module-plan.js').ApprovedModulePlan;
  /**
   * Metadata Computation Collapse V1 — the single, immutable, composed metadata handoff (title,
   * subtitle, description, module/navigation/route counts, and summary strings) every downstream
   * production stage must consume instead of independently parsing/inferring/counting/summarizing
   * metadata of its own. Composed only from `approvedIdentity` + `approvedNavigationPlan` +
   * `approvedModulePlan` + the canonical contract evidence — never a new derivation.
   */
  approvedMetadataPlan: import('./approved-metadata-plan.js').ApprovedMetadataPlan;
  /**
   * Sample Data Computation Collapse V1 — the single, immutable, composed sample/demo/seed/preview
   * handoff every downstream production stage must consume instead of independently inventing sample
   * data of its own. Composed only from `approvedIdentity` + `approvedNavigationPlan` +
   * `approvedModulePlan` + `approvedMetadataPlan` + the canonical contract evidence — never a new
   * derivation of business records.
   */
  approvedSampleDataPlan: import('./approved-sample-data-plan.js').ApprovedSampleDataPlan;
  /**
   * Provenance Computation Collapse V1 — the single, immutable, composed provenance/ancestry handoff
   * every downstream production stage must consume instead of independently reconstructing/inferring
   * artifact provenance of its own. Composed only from all prior approved handoffs plus CBGA's
   * repaired inputs and canonical contract evidence — never a new derivation.
   */
  approvedProvenancePlan: import('./approved-provenance-plan.js').ApprovedProvenancePlan;
  /**
   * Repair Reality Alignment V1 — the single, immutable, classified repair record every downstream
   * production stage must consume instead of inferring repair type or claiming mutations heuristically.
   * Built from CBGA repairs at approval time; extended immutably by the orchestrator after every
   * real post-CBGA repair.
   */
  approvedRepairRealityPlan: import('./approved-repair-reality-plan.js').ApprovedRepairRealityPlan;
  /**
   * Final Immutable Production Pipeline V1 — the single immutable constitutional envelope for this
   * build. Every downstream production stage must consume this object instead of reading individual
   * handoffs in parallel (PPC-1207 No Parallel Truth).
   */
  approvedProductionBuildEnvelope: import('./approved-production-build-envelope.js').ApprovedProductionBuildEnvelope;
  modulePlan: CbgaModulePlanEntry[];
  routePlan: CbgaRoutePlanEntry[];
  navigationPlan: CbgaNavigationPlanItem[];
  surfacePlan: CbgaSurfacePlan;
  initialGate: CbgaGenerationGateResult;
  repairsApplied: CbgaRepairAction[];
  repairedInputs: CbgaRepairedGeneratorInputs;
  finalGate: CbgaGenerationGateResult;
  finalGateOutcome: CbgaGenerationGateOutcome;
  generatedAt: string;
}
