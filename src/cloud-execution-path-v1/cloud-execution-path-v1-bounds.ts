/**
 * Cloud Execution Path V1 — bounds and pass token.
 */

export const CLOUD_EXECUTION_PATH_V1_PASS_TOKEN = 'CLOUD_EXECUTION_PATH_V1_PASS';
export const CLOUD_EXECUTION_PATH_V1_FAIL_TOKEN = 'CLOUD_EXECUTION_PATH_V1_FAIL';
export const CLOUD_EXECUTION_PATH_V1_REPORT_TITLE = 'CLOUD_EXECUTION_PATH_V1_REPORT.md';
export const CLOUD_EXECUTION_PATH_V1_ARTIFACT_DIR = '.cloud-execution-path-v1';
export const CLOUD_EXECUTION_QUEUE_DIR = '.cloud-execution-path-v1/queue';
export const CLOUD_EXECUTION_JOBS_DIR = '.cloud-execution-path-v1/jobs';
export const CLOUD_EXECUTION_CONTRACT_VERSION = 'V1';
export const CLOUD_EXECUTION_WORKSPACE_PREFIX = 'cep';
export const MIN_CONCURRENT_JOBS_PROOF = 3;
export const MAX_CLOUD_EXECUTION_HISTORY = 25;
export const DEFAULT_RUNTIME_TIMEOUT_MS = 300_000;
export const DEFAULT_LOG_MAX_LINES = 500;
export const DEFAULT_ARTIFACT_MAX_BYTES = 5_000_000;

export const CLOUD_EXECUTION_PROOF_PROFILES = [
  'TASK_TRACKER_WEB_V1',
  'CRM_WEB_V1',
  'MARKETPLACE_WEB_V1',
] as const;

export const EXPECTED_ARTIFACT_OUTPUTS = [
  'generated-source-manifest.json',
  'build-logs.txt',
  'preview-proof.json',
  'uvl-verification-proof.json',
  'product-architect-proof.json',
  'afla-verdict.json',
  'production-readiness-result.json',
  'execution-summary.json',
  'cloud-job-package.json',
] as const;

export const PRIOR_PASS_TOKENS = [
  'PRODUCTION_READINESS_GATE_V1_PASS',
  'UVL_VERIFICATION_EXECUTION_V1_PASS',
  'REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS',
  'VALIDATION_RUNTIME_GOVERNANCE_V1_PASS',
  'AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS',
] as const;
