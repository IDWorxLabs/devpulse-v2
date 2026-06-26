/**
 * Live Preview Gate — markdown report builder.
 */

import type { LivePreviewGateResult } from './live-preview-gate-types.js';

export function buildLivePreviewGateReport(result: LivePreviewGateResult): string {
  const lines = [
    '# Live Preview Gate — Engineering Report',
    '',
    `Gate ID: ${result.gateId}`,
    `State: **${result.state}**`,
    `Unlock verdict: **${result.unlockVerdict}**`,
    `Launch verdict: ${result.launchVerdict}`,
    '',
    '## Status card',
    `- Progress: ${result.statusCard.overallProgress}%`,
    `- Passed gates: ${result.statusCard.passedGates.length}`,
    `- Blocked gate: ${result.statusCard.blockedGate ?? 'none'}`,
    `- Estimated risk: ${result.statusCard.estimatedRisk}`,
    '',
    '## Blocker explanation',
    result.blockerExplanation.summary,
    '',
    '## Recommended next step',
    result.recommendedNextStep,
  ];

  if (result.blockers.length) {
    lines.push('', '## Blockers');
    for (const blocker of result.blockers) {
      lines.push(`- ${blocker}`);
    }
  }

  if (result.transitionLog.length) {
    lines.push('', '## Latest transition');
    const latest = result.transitionLog[0];
    if (latest) {
      lines.push(`- ${latest.previousState} → ${latest.nextState}: ${latest.reason}`);
    }
  }

  return lines.join('\n');
}
