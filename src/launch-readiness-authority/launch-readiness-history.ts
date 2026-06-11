/**
 * Launch Readiness Authority History — bounded assessment retention.
 */

import { MAX_LAUNCH_READINESS_HISTORY } from './launch-readiness-thresholds.js';
import type { LaunchReadinessAuthorityAssessment } from './launch-readiness-types.js';

const history: LaunchReadinessAuthorityAssessment[] = [];

export function resetLaunchReadinessHistoryForTests(): void {
  history.length = 0;
}

export function recordLaunchReadinessAssessment(assessment: LaunchReadinessAuthorityAssessment): void {
  history.push(assessment);
  while (history.length > MAX_LAUNCH_READINESS_HISTORY) {
    history.shift();
  }
}

export function getLaunchReadinessHistorySize(): number {
  return history.length;
}

export function getLatestLaunchReadinessAssessment(): LaunchReadinessAuthorityAssessment | null {
  return history.at(-1) ?? null;
}
