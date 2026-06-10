/**
 * Visual QA Engine — empty space utilization analyzer.
 */

import type { EmptySpaceUtilizationAnalysis, VisualQAInput } from './visual-qa-types.js';
import { clampScore } from './visual-qa-types.js';
import { getCachedEmptySpaceUtilization, setCachedEmptySpaceUtilization } from './visual-qa-cache.js';

export interface EmptySpaceUtilizationSnapshot {
  welcomeStatePresent: boolean;
  chatWorkspacePresent: boolean;
}

let emptySpaceAnalysisCount = 0;

export function analyzeEmptySpaceUtilization(
  input: VisualQAInput,
  snapshot: EmptySpaceUtilizationSnapshot,
): EmptySpaceUtilizationAnalysis {
  const cacheKey = [
    input.deadSpace,
    input.unusedRealEstate,
    snapshot.welcomeStatePresent,
    snapshot.chatWorkspacePresent,
  ].join('|');

  const cached = getCachedEmptySpaceUtilization(cacheKey);
  if (cached) return cached;

  emptySpaceAnalysisCount += 1;
  const emptySpaceProblems: string[] = [];
  let penalty = 0;

  const deadSpace = input.deadSpace === true;
  const unusedRealEstate = input.unusedRealEstate === true;

  if (deadSpace) { emptySpaceProblems.push('DEAD_SPACE'); penalty += 18; }
  if (unusedRealEstate) { emptySpaceProblems.push('UNUSED_REAL_ESTATE'); penalty += 16; }

  const balanceBonus =
    (snapshot.welcomeStatePresent ? 10 : 0)
    + (snapshot.chatWorkspacePresent ? 12 : 0);

  const emptySpaceScore = clampScore(82 + balanceBonus - penalty);

  const result: EmptySpaceUtilizationAnalysis = {
    emptySpaceScore,
    deadSpace,
    unusedRealEstate,
    emptySpaceProblems,
  };

  setCachedEmptySpaceUtilization(cacheKey, result);
  return result;
}

export function getEmptySpaceAnalysisCount(): number {
  return emptySpaceAnalysisCount;
}

export function resetEmptySpaceUtilizationAnalyzerForTests(): void {
  emptySpaceAnalysisCount = 0;
}
