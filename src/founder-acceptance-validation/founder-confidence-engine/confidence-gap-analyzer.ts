/**
 * Founder Confidence Engine — confidence gap analyzer.
 */

import type {
  UnderstandingConfidenceValidation,
  ReasoningVisibilityValidation,
  ProgressTruthValidation,
  NextStepConfidenceValidation,
  DecisionConfidenceValidation,
  UncertaintyHonestyValidation,
  FounderControlConfidenceValidation,
  ConfidenceGap,
  ConfidenceGapAnalysis,
} from './founder-confidence-types.js';
import { CONFIDENCE_GAP_ANALYSIS_PASS, MAX_CONFIDENCE_GAPS } from './founder-confidence-types.js';
import { mergeBoundedGaps } from './confidence-gap-model.js';
import { getCachedConfidenceGapAnalysis, setCachedConfidenceGapAnalysis } from './founder-confidence-cache.js';

export interface ValidatorGapInputs {
  understandingConfidence: UnderstandingConfidenceValidation;
  reasoningVisibility: ReasoningVisibilityValidation;
  progressTruth: ProgressTruthValidation;
  nextStepConfidence: NextStepConfidenceValidation;
  decisionConfidence: DecisionConfidenceValidation;
  uncertaintyHonesty: UncertaintyHonestyValidation;
  founderControlConfidence: FounderControlConfidenceValidation;
}

let gapAnalysisCount = 0;

export function analyzeConfidenceGaps(requestId: string, validators: ValidatorGapInputs): ConfidenceGapAnalysis {
  const cacheKey = [
    requestId,
    validators.understandingConfidence.score,
    validators.progressTruth.score,
    validators.uncertaintyHonesty.score,
  ].join('|');
  const cached = getCachedConfidenceGapAnalysis(cacheKey);
  if (cached) return cached;

  gapAnalysisCount += 1;

  const gaps = mergeBoundedGaps(
    [
      validators.understandingConfidence.gaps,
      validators.reasoningVisibility.gaps,
      validators.progressTruth.gaps,
      validators.nextStepConfidence.gaps,
      validators.decisionConfidence.gaps,
      validators.uncertaintyHonesty.gaps,
      validators.founderControlConfidence.gaps,
    ],
    MAX_CONFIDENCE_GAPS,
  );

  const result: ConfidenceGapAnalysis = {
    gaps,
    criticalConfidenceGaps: gaps.filter((g) => g.severity === 'CRITICAL'),
    majorConfidenceGaps: gaps.filter((g) => g.severity === 'MAJOR'),
    minorConfidenceGaps: gaps.filter((g) => g.severity === 'MINOR'),
    passToken: CONFIDENCE_GAP_ANALYSIS_PASS,
  };
  setCachedConfidenceGapAnalysis(cacheKey, result);
  return result;
}

export function getGapAnalysisCount(): number {
  return gapAnalysisCount;
}

export function resetConfidenceGapAnalyzerForTests(): void {
  gapAnalysisCount = 0;
}
