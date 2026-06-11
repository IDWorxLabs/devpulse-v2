/**
 * Launch Verdict Governance — bounded in-memory history.
 */

import { MAX_GOVERNANCE_HISTORY } from './launch-verdict-governance-bounds.js';
import type { LaunchVerdictGovernanceAssessment } from './launch-verdict-governance-types.js';

const history: LaunchVerdictGovernanceAssessment[] = [];

export function resetLaunchVerdictGovernanceHistoryForTests(): void {
  history.length = 0;
}

export function recordLaunchVerdictGovernanceAssessment(assessment: LaunchVerdictGovernanceAssessment): void {
  history.push(assessment);
  while (history.length > MAX_GOVERNANCE_HISTORY) {
    history.shift();
  }
}

export function getLaunchVerdictGovernanceHistorySize(): number {
  return history.length;
}

export function getLatestLaunchVerdictGovernanceAssessment(): LaunchVerdictGovernanceAssessment | null {
  return history.at(-1) ?? null;
}
