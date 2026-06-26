/**
 * ASE — report builder.
 */

import type { AutonomousSoftwareEngineeringPipelineResult } from './ase-types.js';

export function buildAseReport(result: AutonomousSoftwareEngineeringPipelineResult): string {
  const lines = [
    '# Autonomous Software Engineering Engine Report',
    '',
    `**Run ID:** ${result.runId}`,
    `**Overall Status:** ${result.overallStatus}`,
    `**Current Stage:** ${result.currentStage}`,
    `**Ready For Preview:** ${result.readyForPreview}`,
    `**Launch Verdict:** ${result.launchReadiness?.verdict?.verdict ?? 'UNAVAILABLE'}`,
    `**Preview State:** ${result.livePreviewGate?.state ?? 'LOCKED'}`,
    '',
    '## Status Card',
    `- Progress: ${result.statusCard.overallProgress}%`,
    `- Next Action: ${result.nextAction}`,
    `- Risk: ${result.statusCard.risk}`,
    '',
    '## Gates',
    ...result.gates.map((g) => `- ${g.gateId}: ${g.passed ? 'PASS' : 'FAIL'}${g.blockedReason ? ` (${g.blockedReason})` : ''}`),
    '',
    '## Timeline',
    ...result.timeline.map((e) => `- ${e.label}`),
    '',
    '## Blockers',
    ...(result.blockers.length ? result.blockers.map((b) => `- ${b}`) : ['- None']),
  ];
  return lines.join('\n');
}
