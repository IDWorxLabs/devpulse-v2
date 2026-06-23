/**
 * Phase 26.97 — Founder simulation payload repair planner.
 */

import type {
  FounderSimulationPayloadFieldRepair,
  FounderSimulationPayloadGuardMetadata,
} from './founder-simulation-payload-guard-types.js';

export function planFounderSimulationPayloadRepairs(input: {
  repairs: readonly FounderSimulationPayloadFieldRepair[];
  degraded: boolean;
  completionEvent: string | null;
  originalError: string | null;
}): FounderSimulationPayloadGuardMetadata {
  return {
    readOnly: true,
    degraded: input.degraded,
    completionEvent: input.completionEvent,
    originalError: input.originalError,
    missingFields: input.repairs.map((repair) => repair.path),
    repairs: input.repairs,
  };
}

export function buildGuardedDiagnosticMarkdown(input: {
  guard: FounderSimulationPayloadGuardMetadata;
  elapsedMs?: number;
  partialReportMarkdown?: string | null;
}): string {
  const lines = [
    '# Founder Simulation Guarded Diagnostic Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Completion event: ${input.guard.completionEvent ?? 'n/a'}`,
    `Degraded: ${input.guard.degraded ? 'yes' : 'no'}`,
    ...(input.elapsedMs != null ? [`Elapsed: ${input.elapsedMs}ms`] : []),
    '',
    '## Warning Metadata',
    '',
    `- Original error: ${input.guard.originalError ?? 'none'}`,
    `- Missing fields repaired: ${input.guard.missingFields.length}`,
    ...(input.guard.crashLocation
      ? [`- Crash location: ${input.guard.crashLocation}`]
      : []),
    ...(input.guard.crashFieldPath
      ? [`- Crash field path: ${input.guard.crashFieldPath}`]
      : []),
    ...(input.guard.patchApplied != null
      ? [`- Patch applied: ${input.guard.patchApplied ? 'yes' : 'no'}`]
      : []),
    ...(input.guard.missingFields.length
      ? input.guard.missingFields.map((field) => `- ${field}`)
      : ['- none']),
    '',
    '## Repairs Applied',
    '',
  ];

  if (input.guard.repairs.length) {
    for (const repair of input.guard.repairs) {
      lines.push(`- **${repair.failureClass}** @ ${repair.path} → ${repair.defaultApplied}`);
    }
  } else {
    lines.push('- None');
  }

  if (input.partialReportMarkdown?.trim()) {
    lines.push('', '## Partial Report', '', input.partialReportMarkdown.trim());
  }

  return lines.join('\n');
}
