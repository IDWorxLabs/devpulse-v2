/**
 * Interactive Explanations — next-step guidance analyzer.
 */

import type {
  InteractiveExplanationsInput,
  NextStepGuidanceAnalysis,
} from './interactive-explanations-types.js';
import { getCachedNextStepGuidance, setCachedNextStepGuidance } from './interactive-explanations-cache.js';

export interface NextStepGuidanceSnapshot {
  hasRoadmapProgression: boolean;
  hasCheckpointProgression: boolean;
  hasDependencyProgression: boolean;
}

const BASE_GUIDANCE_AREAS = [
  'next_phase',
  'next_checkpoint',
  'next_action',
  'roadmap_progression',
  'dependency_progression',
] as const;

let guidanceAnalysisCount = 0;

export function analyzeNextStepGuidance(
  input: InteractiveExplanationsInput,
  snapshot: NextStepGuidanceSnapshot,
): NextStepGuidanceAnalysis {
  const cacheKey = [
    snapshot.hasRoadmapProgression,
    snapshot.hasCheckpointProgression,
    input.missingNextPhaseGuidance,
    input.missingNextCheckpointGuidance,
    ...(input.undocumentedGuidanceAreas ?? []),
  ].join('|');

  const cached = getCachedNextStepGuidance(cacheKey);
  if (cached) return cached;

  guidanceAnalysisCount += 1;
  const guidanceWarnings: string[] = [];
  const undocumentedGuidanceAreas: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingNextPhaseGuidance, 'missing_next_phase_guidance', 'next_phase'],
    [input.missingNextCheckpointGuidance, 'missing_next_checkpoint_guidance', 'next_checkpoint'],
    [input.missingNextActionGuidance, 'missing_next_action_guidance', 'next_action'],
    [input.missingRoadmapProgressionGuidance, 'missing_roadmap_progression_guidance', 'roadmap_progression'],
    [input.missingDependencyProgressionGuidance, 'missing_dependency_progression_guidance', 'dependency_progression'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      guidanceWarnings.push(warning);
      undocumentedGuidanceAreas.push(area);
      penalty += 9;
    }
  }

  for (const area of input.undocumentedGuidanceAreas ?? []) {
    if (!undocumentedGuidanceAreas.includes(area)) {
      undocumentedGuidanceAreas.push(area);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.hasRoadmapProgression ? 10 : 0)
    + (snapshot.hasCheckpointProgression ? 9 : 0)
    + (snapshot.hasDependencyProgression ? 8 : 0);
  const documented = BASE_GUIDANCE_AREAS.length - undocumentedGuidanceAreas.filter(
    (a) => BASE_GUIDANCE_AREAS.includes(a as typeof BASE_GUIDANCE_AREAS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_GUIDANCE_AREAS.length) * 80 + systemBonus);
  const guidanceCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: NextStepGuidanceAnalysis = {
    guidanceCoverageScore,
    undocumentedGuidanceAreas,
    guidanceWarnings,
  };
  setCachedNextStepGuidance(cacheKey, result);
  return result;
}

export function getGuidanceAnalysisCount(): number {
  return guidanceAnalysisCount;
}

export function resetNextStepGuidanceAnalyzerForTests(): void {
  guidanceAnalysisCount = 0;
}

export function listBaseGuidanceAreas(): readonly string[] {
  return BASE_GUIDANCE_AREAS;
}
