/**
 * AFLA Trust Calibration V1 — public API.
 */

export {
  AFLA_TRUST_CALIBRATION_V1_PASS_TOKEN,
  AFLA_TRUST_CALIBRATION_OWNER_MODULE,
  AFLA_TRUST_CALIBRATION_PHASE,
  MAX_AFLA_TRUST_CALIBRATION_HISTORY,
  VERDICT_STABILITY_RUN_COUNT,
  VERDICT_STABILITY_MAX_VARIANCE,
  REVIEWER_ALIGNMENT_DIVERGENCE_THRESHOLD,
  CONFIDENCE_ACCURACY_MAX_GAP,
  TRUST_SCORE_MIN_SUITE_APPS,
} from './afla-trust-calibration-bounds.js';

export type {
  VerdictStabilityReport,
  FalsePositiveFinding,
  FalseNegativeFinding,
  ConfidenceCalibrationReport,
  ReviewerAlignmentReport,
  AflaTrustCalibrationHistoryEntry,
  AflaTrustCalibrationAssessment,
  AssessAflaTrustCalibrationInput,
} from './afla-trust-calibration-types.js';

export {
  FOUNDER_TRUST_CALIBRATION_SUITE_APPS,
  resolveTrustCalibrationSuiteApp,
  type FounderTrustCalibrationProfile,
} from './afla-trust-calibration-suite-registry.js';

export { detectFalsePositives, countFalsePositives } from './afla-trust-false-positive-detector.js';
export { detectFalseNegatives, countFalseNegatives } from './afla-trust-false-negative-detector.js';
export {
  buildFounderLaunchAssessmentFromPrompt,
  runVerdictStabilityTest,
} from './afla-trust-verdict-stability.js';
export { analyzeConfidenceCalibration } from './afla-trust-confidence-calibration.js';
export { analyzeReviewerAlignment } from './afla-trust-reviewer-alignment.js';
export { computeAflaTrustScore, deriveVerdictQuality } from './afla-trust-score.js';

export {
  resetAflaTrustCalibrationHistoryForTests,
  recordAflaTrustCalibrationAssessment,
  getLastAflaTrustCalibrationAssessment,
  listAflaTrustCalibrationHistory,
  getAflaTrustCalibrationHistorySize,
} from './afla-trust-calibration-history.js';

export { assessAflaTrustCalibration, getAflaTrustScore } from './afla-trust-calibration-assessor.js';
