/**
 * General-Purpose Code Generation V1 — public API.
 */

export {
  GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN,
  GENERAL_PURPOSE_CODE_GENERATION_V1_FAIL_TOKEN,
  GENERAL_PURPOSE_CODE_GENERATION_V1_REPORT_TITLE,
  GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR,
  GENERAL_PURPOSE_WORKSPACE_PREFIX,
  MIN_GENERAL_PURPOSE_PROOF_DOMAINS,
  MIN_GENERAL_PURPOSE_MATURITY_SCORE,
  MAX_GENERAL_PURPOSE_HISTORY,
  PRIOR_PASS_TOKENS,
} from './general-purpose-code-generation-v1-bounds.js';

export type {
  GenerationStrategy,
  GenerationStrategyDefinition,
  GeneralPurposeAppModel,
  GeneralPurposeDomainResult,
  GeneralPurposeCodeGenerationV1Assessment,
  WorkflowContract,
  RoleContract,
  DomainLogicReportEntry,
} from './general-purpose-code-generation-v1-types.js';

export { GENERAL_PURPOSE_PROOF_SUITE, resolveGeneralPurposeProofEntry } from './general-purpose-code-generation-v1-suite-registry.js';
export {
  routeGenerationStrategy,
  getGenerationStrategyDefinition,
  GENERATION_STRATEGY_DEFINITIONS,
} from './generation-strategy-router.js';
export {
  buildGeneralPurposeAppModel,
  buildWorkflowContract,
  buildRoleContract,
  buildDomainLogicReport,
} from './general-purpose-app-model-builder.js';
export { buildExtendedFeatureContracts } from './feature-contract-upgrade.js';
export { runGeneralPurposeGenerationForDomain } from './general-purpose-generation-runner.js';
export {
  runGeneralPurposeCodeGenerationV1,
  generalPurposeCodeGenerationProven,
} from './general-purpose-code-generation-assessor.js';
export { buildGeneralPurposeCodeGenerationV1ReportMarkdown } from './general-purpose-code-generation-report-builder.js';
export {
  recordGeneralPurposeAssessment,
  getLastGeneralPurposeAssessment,
  loadGeneralPurposeAssessmentFromDisk,
  resetGeneralPurposeHistoryForTests,
} from './general-purpose-code-generation-history.js';
