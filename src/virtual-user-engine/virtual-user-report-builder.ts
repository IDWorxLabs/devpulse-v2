/**
 * Virtual User Engine — pipeline report builder.
 */

import type { VirtualUserPipelineResult } from './virtual-user-types.js';

export function buildVirtualUserPipelineReport(result: VirtualUserPipelineResult): string {
  return [
    '# Virtual User Pipeline Report',
    '',
    `**Pipeline ID:** ${result.pipelineId}`,
    `**Verdict:** ${result.permissionVerdict}`,
    `**Blocked:** ${result.blockedReason ?? 'none'}`,
    '',
    '## Virtual Users',
    ...result.profiles.map((p) => `- ${p.role} (${p.userId})`),
    '',
    '## Goals',
    ...result.goals.map((g) => `- ${g.description} [${g.priority}]`),
    '',
    '## Journey Results',
    ...result.journeyResults.map(
      (j) => `- ${j.journeyId}: ${j.completionStatus} (${j.stepCount} steps, ${j.frictionEvents.length} friction)`,
    ),
    '',
    '## Whole-App Sweep',
    `${result.wholeAppSweep.passed ? 'PASSED' : 'FAILED'}`,
    ...result.wholeAppSweep.checks.map((c) => `- ${c.check}: ${c.passed ? 'PASS' : 'FAIL'} — ${c.detail}`),
  ].join('\n');
}
