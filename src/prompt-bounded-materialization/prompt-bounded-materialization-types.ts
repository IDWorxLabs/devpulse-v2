/**
 * Prompt-Bounded Materialization — universal module origin and plan types.
 */

export const PROMPT_BOUNDED_MATERIALIZATION_V1_PASS_TOKEN = 'PROMPT_BOUNDED_MATERIALIZATION_V1_PASS';
export const PROMPT_BOUNDED_MATERIALIZATION_OWNER_MODULE = 'devpulse_v2_prompt_bounded_materialization';

export type FeatureModuleOrigin =
  | 'PROMPT_REQUIRED'
  | 'PROMPT_DERIVED'
  | 'PIM_DERIVED'
  | 'CAPABILITY_REQUIRED'
  | 'SYSTEM_SHELL_REQUIRED'
  | 'PROFILE_FALLBACK'
  | 'TEMPLATE_DEFAULT'
  | 'DEMO_DEFAULT'
  | 'SAMPLE_APP_DEFAULT'
  | 'GENERIC_PLACEHOLDER';

export const ALLOWED_FEATURE_MODULE_ORIGINS: readonly FeatureModuleOrigin[] = [
  'PROMPT_REQUIRED',
  'PROMPT_DERIVED',
  'PIM_DERIVED',
  'CAPABILITY_REQUIRED',
  'SYSTEM_SHELL_REQUIRED',
];

export const BLOCKED_FEATURE_MODULE_ORIGINS: readonly FeatureModuleOrigin[] = [
  'PROFILE_FALLBACK',
  'TEMPLATE_DEFAULT',
  'DEMO_DEFAULT',
  'SAMPLE_APP_DEFAULT',
  'GENERIC_PLACEHOLDER',
];

export type ModuleClassificationCategory =
  | 'FEATURE_MODULE'
  | 'SERVICE_MODULE'
  | 'DATA_MODEL'
  | 'WORKFLOW'
  | 'UI_CONSTRAINT'
  | 'ACCESSIBILITY_CONSTRAINT'
  | 'PLATFORM_CONSTRAINT'
  | 'SECURITY_CONSTRAINT'
  | 'PERFORMANCE_CONSTRAINT'
  | 'DESIGN_CONSTRAINT'
  | 'VALIDATION_REQUIREMENT'
  | 'METADATA_TAG';

export const GENERIC_FALLBACK_MODULE_TERMS = [
  'projects',
  'tasks',
  'team',
  'timeline',
  'dashboard',
  'board',
  'backlog',
  'sprint',
  'roadmap',
  'kanban',
  'calendar',
  'users',
  'deals',
  'leads',
  'expenses',
  'inventory',
  'filter',
  'export',
] as const;

export type GenericFallbackModuleTerm = (typeof GENERIC_FALLBACK_MODULE_TERMS)[number];

export interface FeatureModuleCandidate {
  readOnly: true;
  moduleId: string;
  normalizedName: string;
  displayName: string;
  origin: FeatureModuleOrigin;
  sourceEvidence: readonly string[];
  requirementIds: readonly string[];
  capabilityIds: readonly string[];
  confidence: number;
  reasonIncluded: string;
  classification: ModuleClassificationCategory;
  sourceLayer: string;
}

export interface ResolvedMetadataConstraint {
  readOnly: true;
  label: string;
  category: ModuleClassificationCategory;
  sourceEvidence: readonly string[];
}

export interface BlockedModuleRecord {
  readOnly: true;
  moduleId: string;
  origin: FeatureModuleOrigin;
  reason: string;
  sourceEvidence: readonly string[];
}

export interface PromptBoundedModulePlan {
  readOnly: true;
  planId: string;
  rawPromptHash: string;
  approvedModules: readonly FeatureModuleCandidate[];
  approvedModuleIds: readonly string[];
  routes: readonly string[];
  blockedModules: readonly BlockedModuleRecord[];
  metadataConstraints: readonly ResolvedMetadataConstraint[];
  contaminationDetected: boolean;
  contaminationReasons: readonly string[];
  passedPreGenerationGuard: boolean;
}

export interface PromptBoundedMaterializationGuardResult {
  readOnly: true;
  allowed: boolean;
  plan: PromptBoundedModulePlan;
  blockedReason: string | null;
  warnings: readonly string[];
}

export interface PostGenerationContaminationResult {
  readOnly: true;
  passed: boolean;
  unjustifiedModules: readonly BlockedModuleRecord[];
  missingPlannedModules: readonly string[];
  failureMessages: readonly string[];
}

export interface PromptBoundedModulePlanInput {
  rawPrompt: string;
  materializationProfile: string;
  extraction: import('../prompt-faithful-generation/prompt-faithful-generation-types.js').PromptFeatureExtraction;
  profileDefinition: import('../universal-prompt-to-app-materialization/profile-feature-map.js').ProfileFeatureDefinition;
  productIntelligenceModel?: import('../intent-understanding-engine/intent-understanding-types.js').ProductIntelligenceModel | null;
  capabilityPlanning?: import('../capability-planning-engine/capability-planning-types.js').CapabilityPlanningPipelineResult | null;
  guardApplied?: boolean;
}
