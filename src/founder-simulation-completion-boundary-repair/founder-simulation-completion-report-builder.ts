/**
 * Phase 26.96 — Founder Simulation Completion report builder (V1).
 */

import {
  FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_CORE_QUESTION,
  FOUNDER_SIMULATION_COMPLETION_RULES,
  INTEGRATION_TARGETS,
} from './founder-simulation-completion-boundary-repair-registry.js';
import type { FounderSimulationCompletionBoundaryReport } from './founder-simulation-completion-boundary-repair-types.js';

export function buildFounderSimulationCompletionBoundaryReportMarkdown(
  report: FounderSimulationCompletionBoundaryReport,
): string {
  const t = report.trace;
  const lines = [
    '# Founder Simulation Completion Boundary Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Repair ID: ${report.repairId}`,
    '',
    '## Core Question',
    '',
    FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_CORE_QUESTION,
    '',
    '## Completion Rules',
    '',
    ...FOUNDER_SIMULATION_COMPLETION_RULES.map((r) => `- ${r}`),
    '',
    '## Summary',
    '',
    `- Elapsed: **${report.elapsedMs}ms**`,
    `- Degraded: **${report.degraded ? 'yes' : 'no'}**`,
    `- Budget exceeded: **${report.budgetExceeded ? 'yes' : 'no'}**`,
    `- Completion message: **${report.completionMessage}**`,
    `- Stage status: **${report.stageStatus}**`,
    `- Cross-system orchestration eligible: **${report.crossSystemOrchestrationEligible ? 'yes' : 'no'}**`,
    '',
    '## Pipeline Audit',
    '',
    `| Check | Result |`,
    `|-------|--------|`,
    `| Simulation started | ${t.simulationStarted ? 'yes' : 'no'} |`,
    `| Result produced | ${t.resultProduced ? 'yes' : 'no'} |`,
    `| Completion detected | ${t.completionDetected ? 'yes' : 'no'} |`,
    `| Completion event emitted | ${t.completionEventEmitted ? 'yes' : 'no'} (${t.completionEventId ?? 'none'}) |`,
    `| Next stage eligible | ${t.nextStageEligible ? 'yes' : 'no'} |`,
    `| Runtime monitor active | ${t.runtimeMonitorActive ? 'yes' : 'no'} |`,
    `| Diagnostic stored | ${t.diagnosticStored ? 'yes' : 'no'} |`,
    `| Failure class | ${t.failureClass ?? 'none'} |`,
    '',
    '## Integration Targets',
    '',
    ...INTEGRATION_TARGETS.map((target) => `- ${target}`),
    '',
    report.passToken ? `Pass token: **${report.passToken}**` : 'Pass token: not issued',
  ];
  return lines.join('\n');
}

export function buildFounderSimulationCompletionRepairReportMarkdown(
  report: FounderSimulationCompletionBoundaryReport,
): string {
  return [
    '# Founder Simulation Completion Repair Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Repair Applied',
    '',
    `- Ensured Stage 7 emits **${report.trace.completionEventId ?? 'n/a'}** exactly once`,
    `- Stage completes as **${report.stageStatus}** instead of indefinite RUNNING`,
    `- Cross-System Orchestration Proof eligibility: **${report.crossSystemOrchestrationEligible}**`,
    `- Heartbeats during V5 execution prevent false stall at 180s`,
    '',
    '## Detail',
    '',
    report.trace.detail,
  ].join('\n');
}

export function buildFounderSimulationCompletionValidationMarkdown(
  results: Array<{ name: string; passed: boolean; detail: string }>,
  passToken: string | null,
): string {
  const passed = results.filter((r) => r.passed).length;
  const lines = [
    '# Founder Simulation Completion Validation',
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
