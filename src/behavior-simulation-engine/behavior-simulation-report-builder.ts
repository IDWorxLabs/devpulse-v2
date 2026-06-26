/**
 * Behavior Simulation Engine — pipeline report builder.
 */

import type { BehaviorSimulationPipelineResult } from './behavior-simulation-types.js';

export function buildBehaviorSimulationPipelineReport(result: BehaviorSimulationPipelineResult): string {
  return [
    '# Behavior Simulation Pipeline Report',
    '',
    `**Pipeline ID:** ${result.pipelineId}`,
    `**Verdict:** ${result.permissionVerdict}`,
    `**Blocked:** ${result.blockedReason ?? 'none'}`,
    '',
    '## Scenarios',
    ...result.scenarios.map((s) => `- ${s.name} (${s.scenarioId})`),
    '',
    '## Results',
    ...result.scenarioResults.map((r) => `- ${r.scenarioId}: ${r.passed ? 'PASS' : 'FAIL'}`),
    '',
    '## Whole-App Sweep',
    `${result.wholeAppSweep.passed ? 'PASSED' : 'FAILED'}`,
  ].join('\n');
}
