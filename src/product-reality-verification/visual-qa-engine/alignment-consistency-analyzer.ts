/**
 * Visual QA Engine — alignment consistency analyzer.
 */

import type { AlignmentConsistencyAnalysis, VisualQAInput } from './visual-qa-types.js';
import { ALIGNMENT_ANALYSIS_PASS, clampScore } from './visual-qa-types.js';
import { getCachedAlignmentConsistency, setCachedAlignmentConsistency } from './visual-qa-cache.js';

export interface AlignmentConsistencySnapshot {
  gridLayoutPresent: boolean;
  flexLayoutPresent: boolean;
}

let alignmentAnalysisCount = 0;

export function analyzeAlignmentConsistency(
  input: VisualQAInput,
  snapshot: AlignmentConsistencySnapshot,
): AlignmentConsistencyAnalysis {
  const cacheKey = [
    input.alignmentDrift,
    input.misalignedComponents,
    snapshot.gridLayoutPresent,
    snapshot.flexLayoutPresent,
  ].join('|');

  const cached = getCachedAlignmentConsistency(cacheKey);
  if (cached) return cached;

  alignmentAnalysisCount += 1;
  const alignmentProblems: string[] = [];
  let penalty = 0;

  const alignmentDrift = input.alignmentDrift === true;
  const misalignedComponents = input.misalignedComponents === true;

  if (alignmentDrift) { alignmentProblems.push('ALIGNMENT_DRIFT'); penalty += 20; }
  if (misalignedComponents) { alignmentProblems.push('MISALIGNED_COMPONENTS'); penalty += 18; }

  const layoutBonus =
    (snapshot.gridLayoutPresent ? 12 : 0)
    + (snapshot.flexLayoutPresent ? 10 : 0);

  const alignmentScore = clampScore(85 + layoutBonus - penalty);

  const result: AlignmentConsistencyAnalysis = {
    alignmentScore,
    alignmentDrift,
    misalignedComponents,
    alignmentProblems,
    passToken: ALIGNMENT_ANALYSIS_PASS,
  };

  setCachedAlignmentConsistency(cacheKey, result);
  return result;
}

export function getAlignmentAnalysisCount(): number {
  return alignmentAnalysisCount;
}

export function resetAlignmentConsistencyAnalyzerForTests(): void {
  alignmentAnalysisCount = 0;
}
