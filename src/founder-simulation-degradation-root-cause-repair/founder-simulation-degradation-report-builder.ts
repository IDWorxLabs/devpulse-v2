/**
 * Phase 27.02 — Founder Simulation Degradation report builder (V1).
 */

import {
  DEGRADATION_INVESTIGATION_RULES,
  FOUNDER_SIMULATION_DEGRADATION_CORE_QUESTION,
  INTEGRATION_TARGETS,
} from './founder-simulation-degradation-root-cause-registry.js';
import type { FounderSimulationDegradationRootCauseReport } from './founder-simulation-degradation-root-cause-types.js';

function formatSeconds(ms: number): string {
  return `${Math.round(ms / 1000)}s`;
}

export function buildFounderSimulationDegradationReportMarkdown(
  report: FounderSimulationDegradationRootCauseReport,
): string {
  const lines: string[] = [
    '# Founder Simulation Degradation Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Investigation ID: ${report.investigationId}`,
    '',
    '## Core Question',
    '',
    FOUNDER_SIMULATION_DEGRADATION_CORE_QUESTION,
    '',
    '## Rules',
    '',
    ...DEGRADATION_INVESTIGATION_RULES.map((r) => `- ${r}`),
    '',
    '## Summary',
    '',
    `- Run ID: **${report.runId ?? 'n/a'}**`,
    `- Total runtime: **${formatSeconds(report.totalSimulationRuntimeMs)}** (${report.totalSimulationRuntimeMs}ms)`,
    `- Completion event: **${report.completionEventId ?? 'n/a'}**`,
    `- Degraded: **${report.degraded ? 'yes' : 'no'}**`,
    `- Slowest authority: **${report.slowestAuthority?.authorityName ?? 'n/a'}** (${formatSeconds(report.slowestAuthority?.elapsedMs ?? 0)})`,
    `- Slowest substep: **${report.slowestSubstep?.substepLabel ?? 'n/a'}** (${formatSeconds(report.slowestSubstep?.elapsedMs ?? 0)})`,
    '',
    '## Ranked Authority Runtime',
    '',
  ];

  for (const profile of report.authorityProfiles.slice(0, 10)) {
    lines.push(
      `${profile.rank}. **${profile.authorityName}** — Elapsed: ${formatSeconds(profile.elapsedMs)} (${profile.runtimePercent.toFixed(1)}%)`,
    );
  }

  lines.push('');
  lines.push('## Ranked Substep Runtime');
  lines.push('');
  for (const substep of report.substepProfiles.slice(0, 10)) {
    lines.push(
      `${substep.rank}. **${substep.substepLabel}** — Elapsed: ${formatSeconds(substep.elapsedMs)} (${substep.runtimePercent.toFixed(1)}%)`,
    );
  }

  lines.push('');
  lines.push('## Degradation Signals');
  lines.push('');
  if (report.degradationSignals.length) {
    for (const signal of report.degradationSignals) {
      lines.push(`- **${signal.kind}**: ${signal.detail}`);
    }
  } else {
    lines.push('- None');
  }

  lines.push('');
  lines.push('## Integration Targets');
  lines.push('');
  for (const target of INTEGRATION_TARGETS) {
    lines.push(`- ${target}`);
  }

  lines.push('');
  report.passToken ? lines.push(`Pass token: **${report.passToken}**`) : lines.push('Pass token: not issued');

  return lines.join('\n');
}

export function buildFounderSimulationDegradationRootCauseMarkdown(
  report: FounderSimulationDegradationRootCauseReport,
): string {
  const lines: string[] = ['# Founder Simulation Degradation Root Cause', ''];

  for (const finding of report.findings) {
    lines.push('```text');
    lines.push(`Root Cause: ${finding.rootCause}`);
    lines.push(`Authority: ${finding.authority}`);
    lines.push(`Substep: ${finding.substep ?? 'n/a'}`);
    lines.push(`Elapsed: ${Math.round(finding.elapsedMs / 1000)}s`);
    lines.push(`Impact: ${finding.impact}`);
    lines.push(`Recommended Repair: ${finding.recommendedRepair}`);
    lines.push('```');
    lines.push('');
  }

  if (!report.findings.length) {
    lines.push('No degradation findings recorded.');
  }

  return lines.join('\n');
}

export function buildFounderSimulationDegradationRepairPlanMarkdown(
  report: FounderSimulationDegradationRootCauseReport,
): string {
  const plan = report.repairPlan;
  const lines: string[] = [
    '# Founder Simulation Degradation Repair Plan',
    '',
    `- Primary bottleneck authority: **${plan.primaryBottleneckAuthority ?? 'n/a'}**`,
    `- Primary bottleneck substep: **${plan.primaryBottleneckSubstep ?? 'n/a'}**`,
    `- Warning completion authority: **${plan.warningCompletionAuthority ?? 'n/a'}**`,
    `- Total runtime: **${Math.round(plan.totalSimulationRuntimeMs / 1000)}s**`,
    '',
    '## Actions',
    '',
  ];

  for (const action of plan.actions) {
    lines.push(`- ${action}`);
  }

  return lines.join('\n');
}

export function buildFounderSimulationDegradationValidationMarkdown(
  passed: boolean,
  checkCount: number,
  failedCount: number,
): string {
  return [
    '# Founder Simulation Degradation Validation',
    '',
    `- Checks: ${checkCount}`,
    `- Failed: ${failedCount}`,
    `- Result: **${passed ? 'PASS' : 'FAIL'}**`,
    passed ? `- Pass token: **FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_REPAIR_PASS**` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
