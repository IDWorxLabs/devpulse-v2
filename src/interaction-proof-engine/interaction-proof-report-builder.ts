/**
 * Interaction Proof Engine — pipeline report builder.
 */

import type { InteractionProofPipelineResult } from './interaction-proof-types.js';

export function buildInteractionProofPipelineReport(result: InteractionProofPipelineResult): string {
  return [
    '# Interaction Proof Pipeline Report',
    '',
    `**Pipeline ID:** ${result.pipelineId}`,
    `**Verdict:** ${result.permissionVerdict}`,
    `**Blocked:** ${result.blockedReason ?? 'none'}`,
    '',
    '## Inventory',
    ...result.inventory.map((i) => `- ${i.label} [${i.classification}]`),
    '',
    '## Proof Results',
    ...result.proofResults.map((r) => `- ${r.label}: ${r.passed ? 'PASS' : 'FAIL'}`),
    '',
    '## Whole-App Sweep',
    `${result.wholeAppSweep.passed ? 'PASSED' : 'FAILED'}`,
    `Unknown interactions: ${result.wholeAppSweep.unknownInteractionCount}`,
    ...result.wholeAppSweep.checks.map((c) => `- ${c.check}: ${c.passed ? 'PASS' : 'FAIL'} — ${c.detail}`),
  ].join('\n');
}
