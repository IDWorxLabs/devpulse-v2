/**
 * Phase 26.96 — Founder simulation repair planner.
 */

import {
  FOUNDER_SIMULATION_COMPLETE,
  FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
} from './founder-simulation-completion-boundary-repair-registry.js';
import type { FounderSimulationCompletionEventId } from './founder-simulation-completion-boundary-repair-types.js';

export function planFounderSimulationStageCompletion(input: {
  eventId: FounderSimulationCompletionEventId;
  errorMessage: string | null;
}): {
  readOnly: true;
  completionMessage: string;
  stageStatus: 'PASSED' | 'FAILED' | 'SKIPPED';
} {
  if (input.eventId === FOUNDER_SIMULATION_COMPLETE) {
    return {
      readOnly: true,
      completionMessage: 'Founder Simulation Complete',
      stageStatus: 'PASSED',
    };
  }

  const suffix = input.errorMessage ? `: ${input.errorMessage}` : ' (degraded/partial)';
  return {
    readOnly: true,
    completionMessage: `Founder Simulation Complete With Warnings${suffix}`,
    stageStatus: 'PASSED',
  };
}

export function buildFounderSimulationDiagnosticMarkdown(input: {
  errorMessage: string;
  elapsedMs: number;
  eventId: FounderSimulationCompletionEventId;
  partialDetail?: string | null;
}): string {
  const lines = [
    '# Founder Simulation Diagnostic Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Completion event: ${input.eventId}`,
    `Elapsed: ${input.elapsedMs}ms`,
    '',
    '## Failure',
    '',
    input.errorMessage,
  ];
  if (input.partialDetail) {
    lines.push('', '## Partial Detail', '', input.partialDetail);
  }
  return lines.join('\n');
}
