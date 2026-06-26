/**
 * Materialization Quality Score V1 — evidence-backed score types.
 */

export const MATERIALIZATION_QUALITY_SCORE_V1_PASS_TOKEN = 'MATERIALIZATION_QUALITY_SCORE_V1_PASS';

export const MATERIALIZATION_QUALITY_SCORE_FILENAME = 'materialization-quality-score.json';

export const WORKSPACE_QUALITY_SCORE_FILENAME = '.materialization-quality-score.json';

export type MaterializationQualityVerdict =
  | 'HIGH_QUALITY'
  | 'ACCEPTABLE'
  | 'NEEDS_WORK'
  | 'NOT_MATERIALIZED';

export type MaterializationQualityCategoryStatus = 'PASS' | 'WARN' | 'FAIL';

export type MaterializationQualityCategoryId =
  | 'blueprint'
  | 'promptAlignment'
  | 'featureCoverage'
  | 'modularArchitecture'
  | 'routeReachability'
  | 'serviceTypesValidation'
  | 'build'
  | 'preview'
  | 'productionValidation'
  | 'buildHistory'
  | 'persistentProjectReality'
  | 'genericityAvoidance'
  | 'launchReadiness';

export interface MaterializationQualityCategoryScore {
  readOnly: true;
  id: MaterializationQualityCategoryId;
  label: string;
  score: number;
  weight: number;
  weightedContribution: number;
  status: MaterializationQualityCategoryStatus;
  evidencePaths: string[];
  reasons: string[];
  missingEvidence: string[];
}

export interface MaterializationQualityScore {
  readOnly: true;
  overallScore: number;
  verdict: MaterializationQualityVerdict;
  categories: MaterializationQualityCategoryScore[];
  strengths: string[];
  gaps: string[];
  criticalFailures: string[];
  recommendedNextActions: string[];
  computedFromCategories: true;
  recordedAt: string;
  buildRunId: string;
  projectId: string;
  scoreArtifactPath: string | null;
  persistentScoreArtifactPath: string | null;
}

export interface MaterializationQualityScoreEvidence {
  readOnly: true;
  materializationQualityScore: number;
  materializationQualityVerdict: MaterializationQualityVerdict;
  materializationQualityCategories: MaterializationQualityCategoryScore[];
  materializationQualityGaps: string[];
  materializationQualityStrengths: string[];
  materializationQualityCriticalFailures: string[];
  materializationQualityScorePath: string | null;
  materializationQualityPersistentScorePath: string | null;
  materializationQualityRecordedAt: string;
}

export interface MaterializationQualityScoreRecordingResult {
  readOnly: true;
  score: MaterializationQualityScore;
  evidence: MaterializationQualityScoreEvidence;
}
