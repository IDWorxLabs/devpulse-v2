/**
 * First-Impression Judge — launch readiness perception analyzer.
 */

import type { FirstImpressionInput, FirstVisitContext, LaunchReadinessPerceptionAnalysis } from './first-impression-types.js';
import { LAUNCH_READINESS_PERCEPTION_PASS, clampScore } from './first-impression-types.js';
import { getCachedLaunchReadinessPerception, setCachedLaunchReadinessPerception } from './first-impression-cache.js';

export interface LaunchReadinessPerceptionSnapshot {
  diagnosticSectionCount: number;
  placeholderNavCount: number;
  brainConnectedPresent: boolean;
}

let launchReadinessAnalysisCount = 0;

export function analyzeLaunchReadinessPerception(
  input: FirstImpressionInput,
  context: FirstVisitContext,
  snapshot: LaunchReadinessPerceptionSnapshot,
): LaunchReadinessPerceptionAnalysis {
  const cacheKey = [input.launchReadinessPerceptionLow, input.publicReadinessRisk, context.persona, snapshot.diagnosticSectionCount].join('|');
  const cached = getCachedLaunchReadinessPerception(cacheKey);
  if (cached) return cached;

  launchReadinessAnalysisCount += 1;
  const launchProblems: string[] = [];
  let penalty = 0;

  const launchReadinessPerceptionLow = input.launchReadinessPerceptionLow === true;
  const publicReadinessRisk = input.publicReadinessRisk === true;

  if (launchReadinessPerceptionLow) { launchProblems.push('LAUNCH_READINESS_PERCEPTION_LOW'); penalty += 22; }
  if (publicReadinessRisk) { launchProblems.push('PUBLIC_READINESS_RISK'); penalty += 24; }

  if (snapshot.diagnosticSectionCount > 4) {
    launchProblems.push('temporary_diagnostics_visible');
    penalty += Math.min((snapshot.diagnosticSectionCount - 4) * 3, 15);
  }
  if (snapshot.placeholderNavCount > 3) {
    launchProblems.push('placeholder_navigation_visible');
    penalty += 8;
  }

  let perceivedStage: LaunchReadinessPerceptionAnalysis['perceivedStage'] = 'production_ready';
  const rawScore = 88 - penalty + (snapshot.brainConnectedPresent ? 8 : 0);
  if (rawScore < 45) perceivedStage = 'internal_alpha';
  else if (rawScore < 60) perceivedStage = 'founder_alpha';
  else if (rawScore < 78) perceivedStage = 'beta';

  const launchReadinessPerceptionScore = clampScore(rawScore);

  const result: LaunchReadinessPerceptionAnalysis = {
    launchReadinessPerceptionScore,
    launchReadinessPerceptionLow,
    publicReadinessRisk,
    perceivedStage,
    launchProblems,
    passToken: LAUNCH_READINESS_PERCEPTION_PASS,
  };
  setCachedLaunchReadinessPerception(cacheKey, result);
  return result;
}

export function getLaunchReadinessAnalysisCount(): number {
  return launchReadinessAnalysisCount;
}

export function resetLaunchReadinessPerceptionAnalyzerForTests(): void {
  launchReadinessAnalysisCount = 0;
}
