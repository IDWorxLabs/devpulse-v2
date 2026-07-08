/**
 * Prompt-Bounded Materialization V1 — universal guard against fallback module contamination.
 */

export {
  PROMPT_BOUNDED_MATERIALIZATION_V1_PASS_TOKEN,
  PROMPT_BOUNDED_MATERIALIZATION_OWNER_MODULE,
  ALLOWED_FEATURE_MODULE_ORIGINS,
  BLOCKED_FEATURE_MODULE_ORIGINS,
  GENERIC_FALLBACK_MODULE_TERMS,
} from './prompt-bounded-materialization-types.js';
export type {
  FeatureModuleCandidate,
  FeatureModuleOrigin,
  ModuleClassificationCategory,
  PromptBoundedMaterializationGuardResult,
  PromptBoundedModulePlan,
  PromptBoundedModulePlanInput,
  PostGenerationContaminationResult,
  BlockedModuleRecord,
  ResolvedMetadataConstraint,
} from './prompt-bounded-materialization-types.js';

export {
  getDevPulseV2PromptBoundedMaterialization,
  getPromptBoundedMaterializationPassToken,
} from './prompt-bounded-materialization-registry.js';
export {
  promptExplicitlyJustifiesGenericModule,
  profileJustifiesGenericModules,
  isGenericFallbackModuleTerm,
  projectManagementProfileAllowsModule,
} from './module-origin-evidence.js';
export {
  classifyPromptPhrase,
  extractDescriptorMetadataFromPrompt,
  shouldCreateFeatureFolder,
} from './descriptor-classification-engine.js';
export {
  collectAllModuleCandidates,
  collectPromptModuleCandidates,
  collectProfileModuleCandidates,
} from './module-candidate-collector.js';
export {
  resolvePromptBoundedModulePlan,
  buildDefinitionFromModulePlan,
  resetPromptBoundedModuleResolverForTests,
} from './prompt-bounded-module-resolver.js';
export {
  enforcePromptBoundedPreGenerationGuard,
  applyPromptBoundedPlanToBuildPlan,
} from './pre-generation-materialization-guard.js';
export { validatePostGenerationContamination } from './post-generation-contamination-validator.js';
export {
  resolvePromptBoundedMaterialization,
  guardPromptBoundedMaterialization,
  guardAndApplyPromptBoundedMaterialization,
  buildPromptBoundedMaterializationEvidence,
  validateWorkspacePromptBoundedMaterialization,
  getLastPromptBoundedModulePlan,
  getLastPromptBoundedMaterializationGuardResult,
  resetPromptBoundedMaterializationForTests,
  resetLastPromptBoundedMaterializationEvidenceForFreshBuild,
  registerPromptBoundedMaterializationWithEra3Pipeline,
} from './prompt-bounded-materialization-authority.js';

import { resetPromptBoundedMaterializationForTests } from './prompt-bounded-materialization-authority.js';

export function resetPromptBoundedMaterializationModuleForTests(): void {
  resetPromptBoundedMaterializationForTests();
}
