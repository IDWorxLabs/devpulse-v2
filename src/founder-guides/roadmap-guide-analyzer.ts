/**
 * Founder Guides — roadmap guide analyzer.
 */

import type { FounderGuidesInput, RoadmapGuideAnalysis } from './founder-guides-types.js';
import { getCachedRoadmapAnalysis, setCachedRoadmapAnalysis } from './founder-guides-cache.js';

export interface RoadmapGuideSnapshot {
  completedPhaseCount: number;
  currentPhase: string;
  nextPhase: string;
  hasRecommendedNextStep: boolean;
}

let roadmapAnalysisCount = 0;

export function analyzeRoadmapGuide(
  input: FounderGuidesInput,
  snapshot: RoadmapGuideSnapshot,
): RoadmapGuideAnalysis {
  const cacheKey = [
    snapshot.completedPhaseCount,
    snapshot.currentPhase,
    input.missingCompletedPhases,
    input.missingCurrentPhase,
    input.missingFuturePhases,
    input.missingRoadmapOrdering,
    ...(input.undocumentedRoadmapAreas ?? []),
  ].join('|');

  const cached = getCachedRoadmapAnalysis(cacheKey);
  if (cached) return cached;

  roadmapAnalysisCount += 1;
  const roadmapWarnings: string[] = [];
  const undocumentedRoadmapAreas: string[] = [];
  let penalty = 0;

  if (input.missingCompletedPhases === true) {
    roadmapWarnings.push('missing_completed_phases');
    penalty += 12;
  }
  if (input.missingCurrentPhase === true) {
    roadmapWarnings.push('missing_current_phase');
    penalty += 12;
  }
  if (input.missingFuturePhases === true) {
    roadmapWarnings.push('missing_future_phases');
    penalty += 10;
  }
  if (input.missingRoadmapOrdering === true) {
    roadmapWarnings.push('missing_roadmap_ordering');
    penalty += 10;
  }

  for (const area of input.undocumentedRoadmapAreas ?? []) {
    undocumentedRoadmapAreas.push(area);
    penalty += 6;
  }

  const baseScore = Math.min(95, Math.round(
    55
      + Math.min(20, snapshot.completedPhaseCount * 2)
      + (snapshot.currentPhase.length > 0 ? 10 : 0)
      + (snapshot.nextPhase.length > 0 ? 8 : 0)
      + (snapshot.hasRecommendedNextStep ? 7 : 0),
  ));
  const roadmapCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: RoadmapGuideAnalysis = {
    roadmapCoverageScore,
    undocumentedRoadmapAreas,
    roadmapWarnings,
  };

  setCachedRoadmapAnalysis(cacheKey, result);
  return result;
}

export function getRoadmapAnalysisCount(): number {
  return roadmapAnalysisCount;
}

export function resetRoadmapGuideAnalyzerForTests(): void {
  roadmapAnalysisCount = 0;
}
