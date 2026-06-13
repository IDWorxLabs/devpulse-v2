/**
 * Post-Launch Reality Authority — bounded history.
 */

import { MAX_POST_LAUNCH_REALITY_HISTORY } from './post-launch-reality-registry.js';
import type {
  PostLaunchRealityAssessment,
  PostLaunchRealityHistoryEntry,
  PostLaunchRealityHistorySummary,
} from './post-launch-reality-types.js';

const history: PostLaunchRealityHistoryEntry[] = [];

export function resetPostLaunchRealityHistoryForTests(): void {
  history.length = 0;
}

export function recordPostLaunchRealityAssessment(assessment: PostLaunchRealityAssessment): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    postLaunchRealityState: report.postLaunchRealityState,
    overallPostLaunchScore: report.overallPostLaunchScore,
    activityObserved: report.activityObserved,
  });
  if (history.length > MAX_POST_LAUNCH_REALITY_HISTORY) {
    history.length = MAX_POST_LAUNCH_REALITY_HISTORY;
  }
}

export function getPostLaunchRealityHistorySize(): number {
  return history.length;
}

export function buildPostLaunchRealityHistorySummary(
  entries: readonly PostLaunchRealityHistoryEntry[] = history,
): PostLaunchRealityHistorySummary {
  return {
    totalAssessments: entries.length,
    launchedAssessments: entries.filter((e) => e.postLaunchRealityState !== 'NOT_LAUNCHED').length,
    activityObservedAssessments: entries.filter((e) => e.activityObserved).length,
    establishedProductAssessments: entries.filter((e) => e.postLaunchRealityState === 'ESTABLISHED_PRODUCT').length,
  };
}
