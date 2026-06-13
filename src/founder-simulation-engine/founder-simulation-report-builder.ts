/**
 * Founder Simulation Report Builder — markdown simulation report (V1).
 */

import {
  FOUNDER_SIMULATION_ENGINE_REPORT_TITLE,
  FOUNDER_SIMULATION_ENGINE_V1_PASS,
} from './founder-simulation-registry.js';
import type {
  FounderSimulationEngineReport,
  FounderSimulationResult,
} from './founder-simulation-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildFounderSimulationEngineReport(input: {
  results: readonly FounderSimulationResult[];
  aggregateReadinessScore: number;
  aggregateReadinessCategory: string;
  systemIntegrationProof: import('./founder-simulation-types.js').SystemIntegrationProof;
  recommendations: readonly string[];
  nextBestAction: string;
  alignmentImpacts?: readonly import('../intake-alignment-engine/intake-alignment-types.js').SimulationAlignmentImpact[];
}): FounderSimulationEngineReport {
  const failedStagesSummary = [
    ...new Set(input.results.flatMap((r) => r.failedStages.map((s) => `${r.scenarioType}:${s}`))),
  ];
  const launchBlockers = [
    ...new Set(input.results.flatMap((r) => r.systemIntegrationProof.launchBlockers)),
  ];

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalRuns: input.results.length,
    scenarioResults: input.results,
    aggregateReadinessScore: input.aggregateReadinessScore,
    aggregateReadinessCategory: input.aggregateReadinessCategory as import('./founder-simulation-types.js').FounderReadinessCategory,
    systemIntegrationProof: input.systemIntegrationProof,
    failedStagesSummary,
    launchBlockers,
    recommendations: input.recommendations,
    nextBestAction: input.nextBestAction,
    alignmentImpacts: input.alignmentImpacts,
  };
}

export function buildFounderSimulationEngineReportMarkdown(
  report: FounderSimulationEngineReport,
): string {
  const lines: string[] = [
    `# ${FOUNDER_SIMULATION_ENGINE_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total simulation runs: ${report.totalRuns}`,
    `- Aggregate readiness score: ${report.aggregateReadinessScore}/100`,
    `- Aggregate readiness category: ${report.aggregateReadinessCategory}`,
    `- Next best action: ${report.nextBestAction}`,
    '',
    '## System Integration Proof',
    '',
    '- Authorities reached:',
    formatList(report.systemIntegrationProof.authoritiesReached),
    '- Authorities passed:',
    formatList(report.systemIntegrationProof.authoritiesPassed),
    '- Authorities failed:',
    formatList(report.systemIntegrationProof.authoritiesFailed),
    '- Weak links:',
    formatList(report.systemIntegrationProof.weakLinks),
    '- Launch blockers:',
    formatList(report.launchBlockers),
    '',
  ];

  for (const result of report.scenarioResults) {
    lines.push(`## Scenario: ${result.scenarioName}`, '');
    lines.push(`- Simulation ID: ${result.simulationId}`);
    lines.push(`- Scenario type: ${result.scenarioType}`);
    lines.push(`- Final verdict: ${result.finalVerdict}`);
    lines.push(`- Readiness score: ${result.readinessScore}/100`);
    lines.push(`- Explanation: ${result.founderFacingExplanation}`);
    lines.push('');

    lines.push('### Stage Chain Proof', '');
    for (const stage of result.stageResults) {
      lines.push(
        `- ${stage.stageId}: ${stage.status} (confidence: ${stage.confidence ?? 'n/a'}, readiness: ${stage.readiness ?? 'n/a'})`,
      );
    }
    lines.push('');

    if (result.failureAnalysis.length > 0) {
      lines.push('### Failure Analysis', '');
      for (const failure of result.failureAnalysis) {
        lines.push(`- [${failure.severity}] ${failure.failingModule}: ${failure.likelyCause}`);
      }
      lines.push('');
    }
  }

  lines.push('## Recommendations', '');
  lines.push(formatList(report.recommendations));
  lines.push('');

  if (report.alignmentImpacts && report.alignmentImpacts.length > 0) {
    lines.push('## Simulation Alignment Impact', '');
    for (const impact of report.alignmentImpacts) {
      lines.push(`### ${impact.scenarioType}`, '');
      lines.push(`- Readiness before repair: ${impact.readinessBeforeRepair}/100`);
      lines.push(`- Readiness after repair: ${impact.readinessAfterRepair}/100`);
      lines.push(`- Confidence before repair: ${impact.confidenceBeforeRepair}/100`);
      lines.push(`- Confidence after repair: ${impact.confidenceAfterRepair}/100`);
      lines.push(`- False conflicts repaired: ${impact.falseConflictsRepaired}`);
      lines.push(`- Real conflicts retained: ${impact.realConflictsRetained}`);
      lines.push(`- Gate decision before: ${impact.gateDecisionBefore ?? 'n/a'}`);
      lines.push(`- Gate decision after: ${impact.gateDecisionAfter ?? 'n/a'}`);
      lines.push('');
    }
  }

  lines.push('---', '', `Pass token: ${FOUNDER_SIMULATION_ENGINE_V1_PASS}`, '');

  return lines.join('\n');
}
