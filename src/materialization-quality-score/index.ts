/**
 * Materialization Quality Score V1 — public API.
 */

export {
  MATERIALIZATION_QUALITY_SCORE_V1_PASS_TOKEN,
  MATERIALIZATION_QUALITY_SCORE_FILENAME,
  WORKSPACE_QUALITY_SCORE_FILENAME,
  type MaterializationQualityVerdict,
  type MaterializationQualityCategoryStatus,
  type MaterializationQualityCategoryId,
  type MaterializationQualityCategoryScore,
  type MaterializationQualityScore,
  type MaterializationQualityScoreEvidence,
  type MaterializationQualityScoreRecordingResult,
} from './materialization-quality-score-types.js';

export {
  MATERIALIZATION_QUALITY_CATEGORIES,
  categoryWeight,
  categoryLabel,
} from './materialization-quality-score-registry.js';

export {
  loadMaterializationQualityEvidence,
  buildMaterializationQualityCategoryScores,
  type MaterializationQualityEvidenceBundle,
} from './materialization-quality-score-breakdown.js';

export {
  detectMaterializationQualityGaps,
  deriveMaterializationStrengths,
} from './materialization-quality-score-gaps.js';

export {
  calculateMaterializationQualityScore,
  recordMaterializationQualityScore,
} from './materialization-quality-score-calculator.js';

export { applyMaterializationQualityScoreToManifest } from './materialization-quality-score-manifest.js';

export {
  buildMaterializationQualityScoreTraceEvents,
  materializationQualityScoreTraceTitles,
} from './materialization-quality-score-trace-events.js';

export {
  buildMaterializationQualityScoreReport,
  buildMaterializationQualityChatSummary,
  materializationQualityEvidenceForChat,
} from './materialization-quality-score-report.js';
