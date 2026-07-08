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
