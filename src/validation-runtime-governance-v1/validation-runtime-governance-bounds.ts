/**
 * Validation Runtime Governance V1 — bounds, targets, and pass token.
 */

export const VALIDATION_RUNTIME_GOVERNANCE_V1_PASS_TOKEN =
  'VALIDATION_RUNTIME_GOVERNANCE_V1_PASS';

export const VALIDATION_RUNTIME_GOVERNANCE_V1_REPORT_TITLE =
  'VALIDATION_RUNTIME_GOVERNANCE_V1_REPORT.md';

export const VALIDATION_RUNTIME_GOVERNANCE_V1_ARTIFACT_DIR =
  '.validation-runtime-governance-v1';

export const GOVERNANCE_TARGET_VALIDATION_OVERHEAD_PERCENT = 20;

export const GOVERNANCE_TARGET_DUPLICATE_WORK_PERCENT = 25;

export const TIER_TARGET_RUNTIME_SECONDS = {
  FAST: 60,
  STANDARD: 300,
  FULL: 900,
  LAUNCH: null,
} as const;

export const FORBIDDEN_FAST_PATTERNS: readonly RegExp[] = [
  /afla/i,
  /autonomous-founder-launch-authority/,
  /uvl-maturity|uvl-verification|large-scale-multi-app/,
  /capability-audit/,
];

export const LAUNCH_ONLY_VALIDATORS: readonly string[] = [
  'validate:autonomous-founder-launch-authority-v1',
  'validate:uvl-verification-execution-v1',
  'validate:uvl-maturity-verification-hub-v1',
  'validate:afla-trust-calibration-v1',
  'validate:product-architect-intelligence-v1',
  'validate:large-scale-multi-app-validation-v1',
  'validate:capability-audit-v3',
  'validate:launch-council',
  'validate:connected-launch-readiness-proof',
  'validate:founder-launch-decision-authority',
];

export const AFLA_VALIDATORS: readonly string[] = [
  'validate:afla-trust-calibration-v1',
  'validate:autonomous-founder-launch-authority-v1',
  'validate:founder-review-operator-dashboard-v1',
];

export const REUSE_EVIDENCE_TYPES = [
  'EXECUTION_PROOF',
  'VERIFICATION_PROOF',
  'BUILD_PROOF',
  'BLUEPRINT_PROOF',
  'AFLA_ASSESSMENT',
] as const;
