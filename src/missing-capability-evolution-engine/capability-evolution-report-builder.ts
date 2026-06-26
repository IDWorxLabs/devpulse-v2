/**
 * Missing Capability Evolution Engine — pipeline report builder.
 */

import type { MissingCapabilityEvolutionPipelineResult } from './missing-capability-evolution-types.js';

export function buildMissingCapabilityEvolutionReport(
  result: MissingCapabilityEvolutionPipelineResult,
): string {
  const lines = [
    '# Missing Capability Evolution Report',
    '',
    `Pipeline: ${result.pipelineId}`,
    `Verdict: ${result.permissionVerdict}`,
    `Intake items: ${result.intakeItems.length}`,
    `Evolved: ${result.registryRecords.length}`,
    `Reused: ${result.reusedCapabilityIds.length}`,
    `Attempts: ${result.evolutionAttempts.length}`,
  ];

  if (result.blockedReason) {
    lines.push(`Blocked: ${result.blockedReason}`);
  }
  if (result.humanReview) {
    lines.push(`Human review: ${result.humanReview.problemSummary}`);
  }
  for (const record of result.registryRecords) {
    lines.push(`- ${record.name} (${record.status})`);
  }

  return lines.join('\n');
}
