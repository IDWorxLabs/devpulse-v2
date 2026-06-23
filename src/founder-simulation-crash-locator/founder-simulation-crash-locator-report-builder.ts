/**
 * Phase 26.99 — Founder simulation crash locator report builder.
 */

import type {
  FounderSimulationCrashContext,
  FounderSimulationCrashLocatorReport,
} from './founder-simulation-crash-locator-types.js';
import {
  FOUNDER_SIMULATION_CRASH_LOCATOR_CORE_QUESTION,
  FOUNDER_SIMULATION_CRASH_LOCATOR_PASS,
} from './founder-simulation-crash-locator-registry.js';

export function buildFounderSimulationCrashLocatorReportMarkdown(
  report: FounderSimulationCrashLocatorReport,
): string {
  const ctx = report.context;
  const lines = [
    '# Founder Simulation Crash Locator Report',
    '',
    FOUNDER_SIMULATION_CRASH_LOCATOR_CORE_QUESTION,
    '',
    `Locator ID: ${report.locatorId}`,
    `Generated: ${report.generatedAt}`,
    '',
    '## Crash Context',
    '',
    `- Run ID: ${ctx.runId ?? 'n/a'}`,
    `- Stage: ${ctx.stage ?? 'n/a'}`,
    `- Completion event: ${ctx.completionEvent ?? 'n/a'}`,
    `- Degraded: ${ctx.degraded ? 'yes' : 'no'}`,
    `- Failure class: ${ctx.failureClass}`,
    `- Original error: ${ctx.originalError}`,
    `- Crash location: ${ctx.crashLocation ?? 'unknown'}`,
    `- Crash field path: ${ctx.crashFieldPath ?? 'unknown'}`,
    `- Field kind: ${ctx.fieldKind}`,
    `- Guard missed field: ${ctx.guardMissedField ? 'yes' : 'no'}`,
    `- Patch applied: ${ctx.patchApplied ? 'yes' : 'no'}`,
    `- Patched field path: ${ctx.patchedFieldPath ?? 'none'}`,
    '',
    '## Likely Field Paths',
    '',
    ...(report.likelyFieldPaths.length
      ? report.likelyFieldPaths.map((path) => `- ${path}`)
      : ['- none']),
    '',
    '## Stack Frames',
    '',
    ...(report.stackFrames.length
      ? report.stackFrames.slice(0, 8).map((frame) => `- ${frame.raw}`)
      : ['- none captured']),
  ];

  if (ctx.originalStack) {
    lines.push('', '## Original Stack', '', '```', ctx.originalStack, '```');
  }

  if (report.passToken === FOUNDER_SIMULATION_CRASH_LOCATOR_PASS) {
    lines.push('', `**${FOUNDER_SIMULATION_CRASH_LOCATOR_PASS}**`);
  }

  return lines.join('\n');
}

export function buildGuardedCrashDiagnosticSection(context: FounderSimulationCrashContext): string[] {
  return [
    '',
    '## Crash Locator',
    '',
    `- Crash location: ${context.crashLocation ?? 'unknown'}`,
    `- Crash field path: ${context.crashFieldPath ?? 'unknown'}`,
    `- Failure class: ${context.failureClass}`,
    `- Guard missed field: ${context.guardMissedField ? 'yes' : 'no'}`,
    `- Patch applied: ${context.patchApplied ? context.patchedFieldPath ?? 'yes' : 'no'}`,
  ];
}

export function buildFounderSimulationCrashLocatorValidationMarkdown(input: {
  checks: readonly { name: string; passed: boolean; detail: string }[];
  passToken: string | null;
}): string {
  const lines = [
    '# Founder Simulation Crash Locator Validation',
    '',
    `Result: ${input.passToken ?? 'FAILED'}`,
    '',
    ...input.checks.map((check) => `- [${check.passed ? 'x' : ' '}] ${check.name}: ${check.detail}`),
  ];
  if (input.passToken) {
    lines.push('', `**${input.passToken}**`);
  }
  return lines.join('\n');
}
