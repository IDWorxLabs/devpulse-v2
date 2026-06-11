/**
 * Launch Council History — bounded assessment retention.
 */

import type { LaunchCouncilAssessment } from './launch-council-types.js';
import { MAX_COUNCIL_HISTORY } from './launch-council-bounds.js';

const history: LaunchCouncilAssessment[] = [];

export function resetLaunchCouncilHistoryForTests(): void {
  history.length = 0;
}

export function recordLaunchCouncilAssessment(assessment: LaunchCouncilAssessment): void {
  history.push(assessment);
  while (history.length > MAX_COUNCIL_HISTORY) {
    history.shift();
  }
}

export function getLaunchCouncilHistorySize(): number {
  return history.length;
}

export function getLatestLaunchCouncilAssessment(): LaunchCouncilAssessment | null {
  return history.at(-1) ?? null;
}
