/**
 * Phase 27.04 — V5 Launch Verdict Governance Source Normalization (V1).
 */

export type {
  LaunchVerdictGovernanceProducerAuthority,
  LaunchVerdictGovernanceShapeFailureClass,
  LaunchVerdictGovernanceSourceAudit,
  LaunchVerdictGovernanceShapeDetection,
  LaunchVerdictGovernanceNormalizationRepairPlan,
  LaunchVerdictGovernanceSourceNormalizationRecord,
  V5LaunchVerdictGovernanceSourceNormalizationReport,
  V5LaunchVerdictGovernanceSourceNormalizationAssessment,
  NormalizeLaunchVerdictGovernanceSourceInput,
  ApplyV5LaunchVerdictGovernanceSourceNormalizationInput,
  V5LaunchVerdictGovernanceSourceNormalizationResult,
} from './v5-launch-verdict-governance-source-normalization-types.js';

export {
  V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS,
  V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_CACHE_KEY_PREFIX,
  LAUNCH_VERDICT_GOVERNANCE_SOURCE_PATH,
  LAUNCH_VERDICT_GOVERNANCE_ARRAY_FIELDS,
  LAUNCH_VERDICT_GOVERNANCE_OPTIONAL_ARRAY_FIELDS,
  LAUNCH_VERDICT_GOVERNANCE_NESTED_ARRAY_PATHS,
} from './v5-launch-verdict-governance-source-normalization-registry.js';

export { auditLaunchVerdictGovernanceSource } from './launch-verdict-governance-source-auditor.js';
export { detectLaunchVerdictGovernanceShape } from './launch-verdict-governance-shape-detector.js';
export {
  normalizeLaunchVerdictGovernanceArrays,
  normalizeLaunchVerdictGovernanceAtPath,
} from './launch-verdict-governance-source-normalizer.js';
export { planLaunchVerdictGovernanceNormalizationRepair } from './launch-verdict-governance-repair-planner.js';
export {
  buildLaunchVerdictGovernanceNormalizationMarkdown,
  buildLaunchVerdictGovernanceNormalizationValidationMarkdown,
} from './launch-verdict-governance-normalization-report-builder.js';
export {
  recordLaunchVerdictGovernanceSourceNormalization,
  getLaunchVerdictGovernanceSourceNormalizationHistory,
  resetLaunchVerdictGovernanceSourceNormalizationHistoryForTests,
} from './launch-verdict-governance-normalization-history.js';
export {
  assessV5LaunchVerdictGovernanceSourceNormalization,
  normalizeLaunchVerdictGovernanceSourceSync,
  applyV5LaunchVerdictGovernanceSourceNormalizationSync,
  normalizeRawResultLaunchVerdictGovernanceSource,
  resetV5LaunchVerdictGovernanceSourceNormalizationCounterForTests,
  resetV5LaunchVerdictGovernanceSourceNormalizationModuleForTests,
} from './v5-launch-verdict-governance-source-normalization-authority.js';
