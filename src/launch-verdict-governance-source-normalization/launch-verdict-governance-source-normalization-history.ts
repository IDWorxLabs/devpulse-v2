/**
 * Phase 27.06 — Launch verdict governance source normalization history (V1).
 */

import type { LaunchVerdictGovernanceSourceNormalizationReport } from './launch-verdict-governance-source-normalization-types.js';

const history: LaunchVerdictGovernanceSourceNormalizationReport[] = [];

export function recordLaunchVerdictGovernanceSourceNormalization(
  report: LaunchVerdictGovernanceSourceNormalizationReport,
): void {
  history.push(report);
  if (history.length > 32) {
    history.shift();
  }
}

export function getLaunchVerdictGovernanceSourceNormalizationHistory(): readonly LaunchVerdictGovernanceSourceNormalizationReport[] {
  return history;
}

export function resetLaunchVerdictGovernanceSourceNormalizationHistoryForTests(): void {
  history.length = 0;
}
