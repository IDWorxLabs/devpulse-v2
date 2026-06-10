/**
 * Founder Readiness Authority — readiness gap analyzer.
 */

import type {
  WorkflowReadinessAnalysis,
  ConfidenceReadinessAnalysis,
  TrustReadinessAnalysis,
  ProductivityReadinessAnalysis,
  FrictionReadinessAnalysis,
  ReadinessGapAnalysis,
} from './founder-readiness-types.js';
import { READINESS_GAP_ANALYSIS_PASS, MAX_READINESS_GAPS } from './founder-readiness-types.js';
import { mergeBoundedGaps } from './readiness-gap-model.js';
import { getCachedReadinessGapAnalysis, setCachedReadinessGapAnalysis } from './founder-readiness-cache.js';

export interface AnalyzerGapInputs {
  workflowReadiness: WorkflowReadinessAnalysis;
  confidenceReadiness: ConfidenceReadinessAnalysis;
  trustReadiness: TrustReadinessAnalysis;
  productivityReadiness: ProductivityReadinessAnalysis;
  frictionReadiness: FrictionReadinessAnalysis;
}

let gapAnalysisCount = 0;

export function analyzeReadinessGaps(requestId: string, analyzers: AnalyzerGapInputs): ReadinessGapAnalysis {
  const cacheKey = [
    requestId,
    analyzers.workflowReadiness.score,
    analyzers.frictionReadiness.score,
    analyzers.trustReadiness.score,
  ].join('|');
  const cached = getCachedReadinessGapAnalysis(cacheKey);
  if (cached) return cached;

  gapAnalysisCount += 1;

  const gaps = mergeBoundedGaps(
    [
      analyzers.workflowReadiness.gaps,
      analyzers.confidenceReadiness.gaps,
      analyzers.trustReadiness.gaps,
      analyzers.productivityReadiness.gaps,
      analyzers.frictionReadiness.gaps,
    ],
    MAX_READINESS_GAPS,
  );

  const result: ReadinessGapAnalysis = {
    gaps,
    criticalReadinessGaps: gaps.filter((g) => g.severity === 'CRITICAL'),
    majorReadinessGaps: gaps.filter((g) => g.severity === 'MAJOR'),
    minorReadinessGaps: gaps.filter((g) => g.severity === 'MINOR'),
    passToken: READINESS_GAP_ANALYSIS_PASS,
  };
  setCachedReadinessGapAnalysis(cacheKey, result);
  return result;
}

export function getGapAnalysisCount(): number {
  return gapAnalysisCount;
}

export function resetReadinessGapAnalyzerForTests(): void {
  gapAnalysisCount = 0;
}
