/**
 * Phase 26.95 — Chat Intelligence Scenario Consumption report builder (V1).
 */

import {
  CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_CORE_QUESTION,
  CHAT_SCENARIO_CONSUMPTION_RULES,
  INTEGRATION_TARGETS,
  PIPELINE_STAGES,
} from './chat-intelligence-scenario-consumption-registry.js';
import type { ChatIntelligenceScenarioConsumptionReport } from './chat-intelligence-scenario-consumption-types.js';

export function buildChatIntelligenceScenarioConsumptionReportMarkdown(
  report: ChatIntelligenceScenarioConsumptionReport,
): string {
  const lines: string[] = [
    '# Chat Intelligence Scenario Consumption Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Audit ID: ${report.auditId}`,
    '',
    '## Core Question',
    '',
    CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_CORE_QUESTION,
    '',
    '## Reconciliation Rules',
    '',
    ...CHAT_SCENARIO_CONSUMPTION_RULES.map((r) => `- ${r}`),
    '',
    '## Summary',
    '',
    `- Registered scenarios: **${report.registeredScenarioCount}**`,
    `- Discovered scenarios: **${report.discoveredScenarioCount}**`,
    `- Executed scenarios: **${report.executedScenarioCount}**`,
    `- Scored scenarios: **${report.scoredScenarioCount}**`,
    `- Propagated scenarios: **${report.propagatedScenarioCount}**`,
    `- Founder Test consumed: **${report.founderTestConsumed ? 'yes' : 'no'}**`,
    `- Chat Intelligence score: **${report.chatIntelligenceScore}/100**`,
    `- Scenarios passed: **${report.scenariosPassed}/${report.scenariosRun}**`,
    `- Capability answer quality pass: **${report.capabilityAnswerQualityPass ? 'yes' : 'no'}**`,
    `- Capability answer quality score: **${report.capabilityAnswerQualityScore ?? 'n/a'}**`,
    `- Chat stress available: **${report.chatStressAvailable ? 'yes' : 'no'}**`,
    `- Chat stress score: **${report.chatStressScore ?? 'n/a'}**`,
    '',
  ];

  if (report.contradictionDetected) {
    lines.push('## Contradiction Detected', '', `**${report.contradictionDetail}**`, '');
  }

  lines.push('## Pipeline Trace', '');
  lines.push('| Scenario | Source | Reg | Disc | Sel | Exec | Capture | Score | Prop | Failure |');
  lines.push('|----------|--------|-----|------|-----|------|---------|-------|------|---------|');

  for (const trace of report.traces) {
    lines.push(
      `| ${trace.scenarioId} | ${trace.source} | ${trace.registered ? 'Y' : 'N'} | ${trace.discovered ? 'Y' : 'N'} | ${trace.selected ? 'Y' : 'N'} | ${trace.executed ? 'Y' : 'N'} | ${trace.resultCaptured ? 'Y' : 'N'} | ${trace.score ?? '-'} | ${trace.propagated ? 'Y' : 'N'} | ${trace.failureClass ?? '-'} |`,
    );
  }

  lines.push('');
  lines.push('## Integration Targets', '');
  for (const target of INTEGRATION_TARGETS) {
    lines.push(`- ${target}`);
  }

  lines.push('');
  report.passToken ? lines.push(`Pass token: **${report.passToken}**`) : lines.push('Pass token: not issued');

  return lines.join('\n');
}

export function buildChatIntelligenceScenarioPipelineAuditMarkdown(
  report: ChatIntelligenceScenarioConsumptionReport,
): string {
  const lines: string[] = [
    '# Chat Intelligence Scenario Pipeline Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Pipeline Stages',
    '',
    ...PIPELINE_STAGES.map((stage) => `- ${stage}`),
    '',
    '## Stage Evidence',
    '',
  ];

  for (const stage of PIPELINE_STAGES) {
    lines.push(`### ${stage}`, '');
    switch (stage) {
      case 'REGISTRATION':
        lines.push(`Registered count: ${report.registeredScenarioCount}`);
        break;
      case 'DISCOVERY':
        lines.push(`Discovered count: ${report.discoveredScenarioCount}`);
        break;
      case 'EXECUTION':
        lines.push(`Executed count: ${report.executedScenarioCount}`);
        break;
      case 'RESULT_CAPTURE':
        lines.push(`Captured count: ${report.traces.filter((t) => t.resultCaptured).length}`);
        break;
      case 'SCORING':
        lines.push(`Scored count: ${report.scoredScenarioCount}`);
        break;
      case 'PROPAGATION':
        lines.push(`Propagated count: ${report.propagatedScenarioCount}`);
        break;
      case 'FOUNDER_TEST_CONSUMPTION':
        lines.push(`Founder Test consumed: ${report.founderTestConsumed}`);
        lines.push(`Derived score: ${report.chatIntelligenceScore}/100 (${report.scenariosPassed}/${report.scenariosRun})`);
        break;
      case 'REPORT_RENDER':
        lines.push(`Report reflects score: ${report.founderTestConsumed && report.chatIntelligenceScore > 0}`);
        break;
      default:
        lines.push('See consumption report trace table.');
    }
    lines.push('');
  }

  const failures = report.traces.filter((t) => t.failureClass);
  lines.push('## Failure Classification', '');
  if (failures.length) {
    for (const trace of failures) {
      lines.push(`- **${trace.failureClass}** — ${trace.scenarioId}: ${trace.detail}`);
    }
  } else {
    lines.push('- None');
  }

  return lines.join('\n');
}

export function buildChatIntelligenceScenarioConsumptionValidationMarkdown(
  results: Array<{ name: string; passed: boolean; detail: string }>,
  passToken: string | null,
): string {
  const passed = results.filter((r) => r.passed).length;
  const lines: string[] = [
    '# Chat Intelligence Scenario Consumption Validation',
    '',
    `Checks passed: ${passed}/${results.length}`,
    '',
    '## Checks',
    '',
  ];

  for (const result of results) {
    lines.push(`- [${result.passed ? 'x' : ' '}] **${result.name}** — ${result.detail}`);
  }

  lines.push('');
  passToken ? lines.push(`Pass token: **${passToken}**`) : lines.push('Pass token: not issued');

  return lines.join('\n');
}
