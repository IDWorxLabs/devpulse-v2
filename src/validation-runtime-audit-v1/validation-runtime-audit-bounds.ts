/**
 * Validation Runtime Audit V1 — bounds and pass token.
 */

export const VALIDATION_RUNTIME_AUDIT_V1_PASS_TOKEN = 'VALIDATION_RUNTIME_AUDIT_V1_PASS';

export const VALIDATION_RUNTIME_AUDIT_V1_REPORT_TITLE = 'VALIDATION_RUNTIME_AUDIT_V1_REPORT.md';

export const VALIDATION_RUNTIME_AUDIT_V1_ARTIFACT_DIR = '.validation-runtime-audit-v1';

/** Measured runtimes from recent execution evidence (seconds). */
export const MEASURED_RUNTIME_BASELINES: Readonly<Record<string, number>> = {
  'validate:capability-audit-v3': 6,
  'validate:capability-audit-v2': 6,
  'validate:capability-audit-v1': 5,
  'validate:real-build-execution-pipeline-v1-1': 65,
  'validate:real-build-execution-pipeline-v1': 18,
  'validate:uvl-verification-execution-v1': 6,
  'validate:clarifying-question-intelligence-maturity-v1': 0.01,
  'validate:afla-trust-calibration-v1': 8,
  'validate:product-architect-intelligence-v1': 1,
  'validate:autonomous-founder-launch-authority-v1': 426,
  'validate:feature-reality-v1': 180,
  'validate:engineering-reality-v1': 180,
};

export const TYPICAL_PHASE_REGRESSION_VALIDATORS: readonly string[] = [
  'validate:capability-audit-v3',
  'validate:real-build-execution-pipeline-v1',
  'validate:real-build-execution-pipeline-v1-1',
  'validate:uvl-verification-execution-v1',
  'validate:clarifying-question-intelligence-maturity-v1',
  'validate:afla-trust-calibration-v1',
  'validate:product-architect-intelligence-v1',
  'validate:autonomous-founder-launch-authority-v1',
];

export const TYPICAL_IMPLEMENTATION_MINUTES = 5;
