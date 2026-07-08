/**
 * Simple Utility App — public API.
 */

export {
  detectSimpleUtilityAppKind,
  isSimpleUtilityAppPrompt,
  simpleUtilityFeatureModules,
  simpleUtilityRoutes,
  simpleUtilityAppTitle,
  simpleUtilityNormalizedGoal,
  isForbiddenSimpleUtilityModule,
  simpleUtilityRequiredUiTerms,
  SIMPLE_UTILITY_FORBIDDEN_MODULES,
  type SimpleUtilityAppKind,
} from './simple-utility-app-registry.js';

export {
  buildSimpleUtilityUserIdeaContract,
  buildSimpleUtilityRequirementContract,
} from './simple-utility-requirement-contract.js';

export {
  repairSimpleUtilityPlanningAssessment,
  resetSimpleUtilityPlanningRepairCounterForTests,
} from './simple-utility-planning-repair.js';

export { buildCalculatorFeatureComponentTsx } from './calculator-feature-generator.js';
export {
  buildSimpleUtilityAppTsx,
  auditSimpleUtilityWorkspaceMount,
  type SimpleUtilityWorkspaceMountAudit,
} from './simple-utility-app-entry-generator.js';
export { CALCULATOR_BUILD_PROMPT } from './simple-utility-constants.js';
export {
  resolveDirectFeatureRootMount,
  enforceDirectFeatureRootMountInWorkspace,
  patchRegistryPrimaryRoute,
  usesBlueprintAuthShell,
  type DirectFeatureRootMountResolution,
} from './direct-feature-root-mount.js';
