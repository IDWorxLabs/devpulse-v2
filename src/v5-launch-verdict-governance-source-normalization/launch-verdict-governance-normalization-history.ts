/**
 * Phase 27.04 — Launch verdict governance normalization history (V1).
 */

import type { V5LaunchVerdictGovernanceSourceNormalizationReport } from './v5-launch-verdict-governance-source-normalization-types.js';

const history: V5LaunchVerdictGovernanceSourceNormalizationReport[] = [];

export function recordLaunchVerdictGovernanceSourceNormalization(
  report: V5LaunchVerdictGovernanceSourceNormalizationReport,
): void {
  history.push(report);
  if (history.length > 32) {
    history.shift();
  }
}

export function getLaunchVerdictGovernanceSourceNormalizationHistory(): readonly V5LaunchVerdictGovernanceSourceNormalizationReport[] {
  return history;
}

export function resetLaunchVerdictGovernanceSourceNormalizationHistoryForTests(): void {
  history.length = 0;
}
