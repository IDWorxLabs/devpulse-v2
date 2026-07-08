/**
 * Universal Build Pipeline Verification V1 — bounds and pass token.
 */

export const UNIVERSAL_BUILD_PIPELINE_OWNER_MODULE = 'devpulse_v2_universal_build_pipeline_verification';

export const UNIVERSAL_BUILD_PIPELINE_V1_PASS_TOKEN = 'UNIVERSAL_BUILD_PIPELINE_VERIFICATION_V1_PASS';

export const UNIVERSAL_BUILD_PIPELINE_ARTIFACT_DIR = '.build-pipeline-verification';

export const UNIVERSAL_BUILD_PIPELINE_REPORT_MD = 'universal-build-pipeline-report.md';

export const UNIVERSAL_BUILD_PIPELINE_REPORT_JSON = 'universal-build-pipeline-report.json';

/** 12 canonical app categories (includes LISA assistive regression). */
export const MIN_UNIVERSAL_BUILD_MATRIX_COUNT = 12;

export const PIPELINE_STAGE_ORDER = [
  'PROMPT_INTAKE',
  'INTENT_UNDERSTANDING',
  'PROFILE_RESOLUTION',
  'PROMPT_FAITHFULNESS',
  'MODULE_EXTRACTION',
  'PLAN_CONTRACT',
  'ASE_AUTHORIZATION',
  'WORKSPACE_GENERATION',
  'FEATURE_REALITY',
  'MATERIALIZATION_QUALITY',
  'PERSISTENT_PROMOTION',
  'NPM_INSTALL',
  'NPM_BUILD',
  'AUTOFIX_ELIGIBILITY',
  'PREVIEW_STARTUP',
  'DEVICE_VIEWPORT_PREVIEW',
  'FINAL_REPORT',
] as const;
