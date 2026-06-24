/**
 * Validation Runtime Governance V1 — bounds and pass token.
 */

export const VALIDATION_RUNTIME_GOVERNANCE_V1_PASS_TOKEN =
  'VALIDATION_RUNTIME_GOVERNANCE_V1_PASS';

export const VALIDATION_RUNTIME_GOVERNANCE_V1_REPORT_TITLE =
  'VALIDATION_RUNTIME_GOVERNANCE_V1_REPORT.md';

export const VALIDATION_RUNTIME_GOVERNANCE_V1_ARTIFACT_DIR =
  '.validation-runtime-governance-v1';

export const AUDIT_V1_PASS_TOKEN = 'VALIDATION_RUNTIME_AUDIT_V1_PASS';

/** Targets from audit V1 baseline. */
export const BASELINE_VALIDATION_OVERHEAD_PERCENT = 63.8;
export const BASELINE_DUPLICATE_WORK_PERCENT = 96;
export const TARGET_VALIDATION_OVERHEAD_PERCENT = 20;
export const TARGET_DUPLICATE_WORK_PERCENT = 25;

export const TIER_TARGET_RUNTIME_SECONDS = {
  FAST: 60,
  STANDARD: 300,
  FULL: 900,
  LAUNCH: 0,
} as const;

export const LAUNCH_TIER_VALIDATORS: readonly string[] = [
  'validate:uvl-verification-execution-v1',
  'validate:uvl-maturity-verification-hub-v1',
  'validate:product-architect-intelligence-v1',
  'validate:autonomous-founder-launch-authority-v1',
  'validate:afla-trust-calibration-v1',
  'validate:real-build-execution-pipeline-v1-1',
  'validate:capability-audit-v3',
];

export const FAST_FORBIDDEN_PATTERNS: readonly string[] = [
  'afla',
  'autonomous-founder-launch',
  'uvl-verification-execution',
  'uvl-maturity',
  'large-scale-multi-app',
  'capability-audit',
  'real-build-execution-pipeline',
  'feature-reality',
  'engineering-reality',
  'universal-app-blueprint-visual',
  'universal-feature-contract',
];

export const AFLA_FORBIDDEN_TIERS: readonly string[] = ['FAST', 'STANDARD'];

export const REGRESSION_VALIDATORS: readonly string[] = [
  'validate:capability-audit-v3',
  'validate:validation-runtime-audit-v1',
  'validate:uvl-verification-execution-v1',
  'validate:real-build-execution-pipeline-v1-1',
  'validate:afla-trust-calibration-v1',
  'validate:product-architect-intelligence-v1',
  'validate:autonomous-founder-launch-authority-v1',
];
