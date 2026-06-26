/**
 * Materialization Quality Score V1 — manifest integration.
 */

import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { MaterializationQualityScoreEvidence } from './materialization-quality-score-types.js';

export function applyMaterializationQualityScoreToManifest(
  manifest: GeneratedAppManifest,
  evidence: MaterializationQualityScoreEvidence,
): GeneratedAppManifest {
  return {
    ...manifest,
    materializationQualityScore: evidence.materializationQualityScore,
    materializationQualityVerdict: evidence.materializationQualityVerdict,
    materializationQualityCategories: evidence.materializationQualityCategories,
    materializationQualityGaps: evidence.materializationQualityGaps,
    materializationQualityStrengths: evidence.materializationQualityStrengths,
    materializationQualityCriticalFailures: evidence.materializationQualityCriticalFailures,
    materializationQualityScorePath: evidence.materializationQualityScorePath,
    materializationQualityPersistentScorePath: evidence.materializationQualityPersistentScorePath,
    materializationQualityRecordedAt: evidence.materializationQualityRecordedAt,
  };
}
