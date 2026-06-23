/**
 * Phase 26.97 — Founder Simulation Payload Guard report builder (V1).
 */

import {
  FOUNDER_SIMULATION_PAYLOAD_GUARD_CORE_QUESTION,
  FOUNDER_SIMULATION_PAYLOAD_GUARD_RULES,
  INTEGRATION_TARGETS,
} from './founder-simulation-payload-guard-registry.js';
import type { FounderSimulationPayloadGuardReport } from './founder-simulation-payload-guard-types.js';

export function buildFounderSimulationPayloadGuardReportMarkdown(
  report: FounderSimulationPayloadGuardReport,
): string {
  return [
    '# Founder Simulation Payload Guard Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Guard ID: ${report.guardId}`,
    '',
    '## Core Question',
    '',
    FOUNDER_SIMULATION_PAYLOAD_GUARD_CORE_QUESTION,
    '',
    '## Rules',
    '',
    ...FOUNDER_SIMULATION_PAYLOAD_GUARD_RULES.map((rule) => `- ${rule}`),
    '',
    '## Summary',
    '',
    `- Repairs applied: **${report.repairsApplied}**`,
    `- Degraded: **${report.degraded ? 'yes' : 'no'}**`,
    `- Completion event: **${report.completionEvent ?? 'n/a'}**`,
    `- Report generation safe: **${report.reportGenerationSafe ? 'yes' : 'no'}**`,
    '',
    '## Missing Fields',
    '',
    ...(report.missingFields.length ? report.missingFields.map((field) => `- ${field}`) : ['- none']),
    '',
    '## Integration Targets',
    '',
    ...INTEGRATION_TARGETS.map((target) => `- ${target}`),
    '',
    report.passToken ? `Pass token: **${report.passToken}**` : 'Pass token: not issued',
  ].join('\n');
}

export function buildFounderSimulationPayloadGuardValidationMarkdown(
  results: Array<{ name: string; passed: boolean; detail: string }>,
  passToken: string | null,
): string {
  const passed = results.filter((r) => r.passed).length;
  const lines = [
    '# Founder Simulation Payload Guard Validation',
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
