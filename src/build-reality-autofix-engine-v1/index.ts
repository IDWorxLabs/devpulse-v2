/**
 * BUILD_REALITY_AUTOFIX_ENGINE_V1 — public API.
 */

export {
  BUILD_REALITY_AUTOFIX_ENGINE_V1_PASS,
  BUILD_REALITY_AUTOFIX_MAX_ATTEMPTS,
  BUILD_REALITY_AUTOFIX_PLAYWRIGHT_INSTALL_COMMAND,
} from './build-reality-autofix-types.js';

export type {
  BuildRealityAutofixAttemptRecord,
  BuildRealityAutofixEvidence,
  BuildRealityAutofixFailureClass,
  BuildRealityAutofixFailureFinding,
  BuildRealityAutofixInput,
  BuildRealityAutofixPatchRecord,
  BuildRealityAutofixRepairPlan,
  BuildRealityAutofixReport,
  BuildRealityAutofixResult,
  BuildRealityAutofixValidationResult,
  BuildRealityAutofixVerdict,
} from './build-reality-autofix-types.js';

export {
  buildEvidenceFromValidationResult,
  classifyBuildRealityFailures,
  isPlaywrightEnvironmentFailure,
  selectPrimaryFailureClass,
} from './build-reality-autofix-classifier.js';

export { isUnsafeRepairPlan, planBuildRealityRepair } from './build-reality-autofix-planner.js';

export { applyBuildRealityRepairPatch } from './build-reality-autofix-patcher.js';

export {
  createCustomValidationRunner,
  createTypeScriptBuildValidationRunner,
  runWorkspaceTypeScriptBuild,
} from './build-reality-autofix-validator.js';

export {
  buildBuildRealityAutofixReport,
  formatBuildRealityAutofixReportMarkdown,
} from './build-reality-autofix-report.js';

export {
  buildAutofixEvidenceFromE2eReport,
  runBuildRealityAutofix,
} from './build-reality-autofix-engine.js';

export {
  BUILD_REALITY_AUTOFIX_DOM_MARKER,
  BUILD_REALITY_AUTOFIX_INJECT_MARKER,
  createAutofixFixtureWorkspace,
  createPlaywrightUnavailableEvidence,
  createUnknownUnsafeEvidence,
  injectDomInteractionFailure,
  injectImportExportMismatch,
  injectMissingModule,
  injectRootMountMismatch,
  injectValidatorHarnessFailure,
  validateDomInteractionFixture,
  validateImportExportFixture,
  validateMissingModuleFixture,
  validatePassingFixture,
  validateRootMountFixture,
  validateValidatorHarnessFixture,
} from './build-reality-autofix-test-fixtures.js';
