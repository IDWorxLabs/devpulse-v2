/**
 * User Guides — results interpretation guide analyzer.
 */

import type { ResultsInterpretationGuideAnalysis, UserGuidesInput } from './user-guides-types.js';
import { getCachedInterpretationAnalysis, setCachedInterpretationAnalysis } from './user-guides-cache.js';

export interface ResultsInterpretationGuideSnapshot {
  hasTrustScore: boolean;
  hasVerificationResults: boolean;
  hasHardeningScores: boolean;
  hasCheckpoints: boolean;
}

const BASE_RESULT_AREAS = [
  'trust_scores',
  'verification_results',
  'hardening_scores',
  'documentation_scores',
  'readiness_states',
  'warnings',
  'recommendations',
  'checkpoints',
] as const;

let interpretationAnalysisCount = 0;

export function analyzeResultsInterpretationGuide(
  input: UserGuidesInput,
  snapshot: ResultsInterpretationGuideSnapshot,
): ResultsInterpretationGuideAnalysis {
  const cacheKey = [
    snapshot.hasTrustScore,
    snapshot.hasVerificationResults,
    input.missingTrustScoreInterpretation,
    input.missingVerificationResultInterpretation,
    ...(input.undocumentedResultAreas ?? []),
  ].join('|');

  const cached = getCachedInterpretationAnalysis(cacheKey);
  if (cached) return cached;

  interpretationAnalysisCount += 1;
  const interpretationWarnings: string[] = [];
  const undocumentedResultAreas: string[] = [];
  let penalty = 0;

  if (input.missingTrustScoreInterpretation === true) {
    interpretationWarnings.push('missing_trust_score_interpretation');
    undocumentedResultAreas.push('trust_scores');
    penalty += 10;
  }
  if (input.missingVerificationResultInterpretation === true) {
    interpretationWarnings.push('missing_verification_result_interpretation');
    undocumentedResultAreas.push('verification_results');
    penalty += 10;
  }
  if (input.missingHardeningScoreInterpretation === true) {
    interpretationWarnings.push('missing_hardening_score_interpretation');
    undocumentedResultAreas.push('hardening_scores');
    penalty += 9;
  }
  if (input.missingCheckpointInterpretation === true) {
    interpretationWarnings.push('missing_checkpoint_interpretation');
    undocumentedResultAreas.push('checkpoints');
    penalty += 9;
  }

  for (const area of input.undocumentedResultAreas ?? []) {
    if (!undocumentedResultAreas.includes(area)) {
      undocumentedResultAreas.push(area);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.hasTrustScore ? 10 : 0)
    + (snapshot.hasVerificationResults ? 10 : 0)
    + (snapshot.hasHardeningScores ? 8 : 0)
    + (snapshot.hasCheckpoints ? 7 : 0);
  const documented = BASE_RESULT_AREAS.length - undocumentedResultAreas.filter(
    (a) => BASE_RESULT_AREAS.includes(a as typeof BASE_RESULT_AREAS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_RESULT_AREAS.length) * 82 + systemBonus);
  const interpretationCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: ResultsInterpretationGuideAnalysis = {
    interpretationCoverageScore,
    undocumentedResultAreas,
    interpretationWarnings,
  };

  setCachedInterpretationAnalysis(cacheKey, result);
  return result;
}

export function getInterpretationAnalysisCount(): number {
  return interpretationAnalysisCount;
}

export function resetResultsInterpretationGuideAnalyzerForTests(): void {
  interpretationAnalysisCount = 0;
}

export function listBaseResultAreas(): readonly string[] {
  return BASE_RESULT_AREAS;
}
