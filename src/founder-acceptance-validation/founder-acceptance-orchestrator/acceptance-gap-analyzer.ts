/**
 * Founder Acceptance Orchestrator — acceptance gap analyzer.
 */

import type {
  FounderAcceptanceAnalysis,
  ReadinessAcceptanceAnalysis,
  FrictionAcceptanceImpactAnalysis,
  AcceptanceGapAnalysis,
} from './founder-acceptance-orchestrator-types.js';
import { ACCEPTANCE_GAP_ANALYSIS_PASS, MAX_ACCEPTANCE_GAPS } from './founder-acceptance-orchestrator-types.js';
import { mergeBoundedGaps } from './acceptance-gap-model.js';
import { getCachedAcceptanceGapAnalysis, setCachedAcceptanceGapAnalysis } from './founder-acceptance-cache.js';

export interface AcceptanceAnalyzerGapInputs {
  founderAcceptance: FounderAcceptanceAnalysis;
  readinessAcceptance: ReadinessAcceptanceAnalysis;
  frictionImpact: FrictionAcceptanceImpactAnalysis;
}

let gapAnalysisCount = 0;

export function analyzeAcceptanceGaps(
  requestId: string,
  analyzers: AcceptanceAnalyzerGapInputs,
): AcceptanceGapAnalysis {
  const cacheKey = [
    requestId,
    analyzers.founderAcceptance.score,
    analyzers.readinessAcceptance.score,
    analyzers.frictionImpact.score,
  ].join('|');
  const cached = getCachedAcceptanceGapAnalysis(cacheKey);
  if (cached) return cached;

  gapAnalysisCount += 1;

  const gaps = mergeBoundedGaps(
    [
      analyzers.founderAcceptance.gaps,
      analyzers.readinessAcceptance.gaps,
      analyzers.frictionImpact.gaps,
    ],
    MAX_ACCEPTANCE_GAPS,
  );

  const result: AcceptanceGapAnalysis = {
    gaps,
    criticalAcceptanceGaps: gaps.filter((g) => g.severity === 'CRITICAL'),
    majorAcceptanceGaps: gaps.filter((g) => g.severity === 'MAJOR'),
    minorAcceptanceGaps: gaps.filter((g) => g.severity === 'MINOR'),
    passToken: ACCEPTANCE_GAP_ANALYSIS_PASS,
  };
  setCachedAcceptanceGapAnalysis(cacheKey, result);
  return result;
}

export function getGapAnalysisCount(): number {
  return gapAnalysisCount;
}

export function resetAcceptanceGapAnalyzerForTests(): void {
  gapAnalysisCount = 0;
}
