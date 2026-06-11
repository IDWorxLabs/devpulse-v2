/**
 * Launch Council Finalization — bounded in-memory history.
 */

import { MAX_FINALIZATION_HISTORY } from './launch-council-finalization-bounds.js';
import type { LaunchCouncilFinalizationAssessment } from './launch-council-finalization-types.js';

const history: LaunchCouncilFinalizationAssessment[] = [];

export function resetLaunchCouncilFinalizationHistoryForTests(): void {
  history.length = 0;
}

export function recordLaunchCouncilFinalizationAssessment(
  assessment: LaunchCouncilFinalizationAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_FINALIZATION_HISTORY) {
    history.shift();
  }
}

export function getLaunchCouncilFinalizationHistorySize(): number {
  return history.length;
}

export function getLatestLaunchCouncilFinalizationAssessment(): LaunchCouncilFinalizationAssessment | null {
  return history.at(-1) ?? null;
}
