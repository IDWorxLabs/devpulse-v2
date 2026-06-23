/**
 * Phase 27.06 — Launch Verdict Governance Source Normalization (V1).
 */

export type {
  LaunchVerdictGovernanceUpstreamProducer,
  LaunchVerdictGovernanceSourceFailureClass,
  GovernanceSourceAudit,
  GovernancePayloadShapeValidation,
  MissingArrayDetection,
  DegradedPathDetection,
  LaunchVerdictGovernanceNormalizationPlan,
  LaunchVerdictGovernanceSourceNormalizationRecord,
  LaunchVerdictGovernanceSourceNormalizationReport,
  LaunchVerdictGovernanceSourceNormalizationAssessment,
  NormalizeLaunchVerdictGovernanceSourceInput,
  ApplyLaunchVerdictGovernanceSourceNormalizationInput,
  LaunchVerdictGovernanceSourceNormalizationResult,
} from './launch-verdict-governance-source-normalization-types.js';

export {
  LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS,
  LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_CACHE_KEY_PREFIX,
  LAUNCH_VERDICT_GOVERNANCE_CRASH_UPSTREAM_PRODUCER,
  LAUNCH_VERDICT_GOVERNANCE_SOURCE_PATH,
  LAUNCH_VERDICT_GOVERNANCE_REQUIRED_ARRAY_FIELDS,
  LAUNCH_VERDICT_GOVERNANCE_OPTIONAL_ARRAY_FIELDS,
  LAUNCH_VERDICT_GOVERNANCE_PROPAGATION_CHAIN,
} from './launch-verdict-governance-source-normalization-registry.js';

export { auditGovernanceSource } from './governance-source-auditor.js';
export {
  validateGovernancePayloadShape,
  assertGovernancePayloadShapeForReportBuilder,
} from './governance-payload-shape-validator.js';
export { detectMissingGovernanceArrays } from './missing-array-detector.js';
export { detectDegradedGovernancePath } from './degraded-path-detector.js';
export { planLaunchVerdictGovernanceNormalization } from './normalization-planner.js';
export {
  applyLaunchVerdictGovernanceSourceInvariant,
  normalizeLaunchVerdictGovernanceAtPath,
} from './launch-verdict-governance-source-normalizer.js';
export {
  buildLaunchVerdictGovernanceSourceNormalizationMarkdown,
  buildLaunchVerdictGovernanceSourceNormalizationValidationMarkdown,
} from './launch-verdict-governance-source-normalization-report-builder.js';
export {
  recordLaunchVerdictGovernanceSourceNormalization,
  getLaunchVerdictGovernanceSourceNormalizationHistory,
  resetLaunchVerdictGovernanceSourceNormalizationHistoryForTests,
} from './launch-verdict-governance-source-normalization-history.js';
export {
  assessLaunchVerdictGovernanceSourceNormalization,
  normalizeLaunchVerdictGovernanceSourceSync,
  applyLaunchVerdictGovernanceSourceNormalizationSync,
  normalizeRawResultLaunchVerdictGovernanceSource,
  resetLaunchVerdictGovernanceSourceNormalizationCounterForTests,
  resetLaunchVerdictGovernanceSourceNormalizationModuleForTests,
} from './launch-verdict-governance-source-normalization-authority.js';
