/**
 * Reality Replay founder-readable report.
 */

import type { ReplaySession, ReplaySummary, RealityReplayReport } from './types.js';
import { REPLAY_OWNER_MODULE } from './types.js';

export function buildRealityReplayReport(
  sessions: ReplaySession[],
  latestSummary: ReplaySummary | null = null,
): RealityReplayReport {
  const allEvents = sessions.flatMap((s) => s.events);
  const completeCount = sessions.filter((s) => s.status === 'COMPLETE').length;
  const partialCount = sessions.filter((s) => s.status === 'PARTIAL').length;
  const incompleteCount = sessions.filter((s) => s.status === 'INCOMPLETE').length;

  const replaySources = [
    ...new Set(allEvents.map((e) => e.sourceSystemId)),
  ];

  const sessionWarnings = sessions.flatMap((s) => s.warnings);
  const sessionErrors = sessions.flatMap((s) => s.errors);

  let recommendation =
    'Reality Replay reconstructs historical sequences read-only — use for session replay and future root cause attribution.';
  if (allEvents.length === 0) {
    recommendation =
      'No replay events reconstructed — populate Timeline, Evidence, Self Vision, Browser, or Verification history first.';
  } else if (incompleteCount > 0) {
    recommendation =
      'Some replay sessions are incomplete — additional evidence sources may be needed; Reality Replay does not diagnose causes.';
  } else if (latestSummary) {
    recommendation = latestSummary.summary;
  }

  return {
    ownerModule: REPLAY_OWNER_MODULE,
    replaySessionCount: sessions.length,
    eventCount: allEvents.length,
    completeCount,
    partialCount,
    incompleteCount,
    replaySources,
    warnings: [...sessionWarnings],
    errors: [...sessionErrors],
    recommendation,
  };
}

export function formatRealityReplayReport(
  sessions: ReplaySession[],
  latestSummary: ReplaySummary | null = null,
): string {
  const report = buildRealityReplayReport(sessions, latestSummary);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'DevPulse V2 Reality Replay Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Replay sessions: ${report.replaySessionCount}`,
    `Total events: ${report.eventCount}`,
    `Complete sessions: ${report.completeCount}`,
    `Partial sessions: ${report.partialCount}`,
    `Incomplete sessions: ${report.incompleteCount}`,
    '',
    'Replay sources:',
  ];

  if (report.replaySources.length === 0) {
    lines.push('  (none)');
  } else {
    for (const source of report.replaySources) {
      lines.push(`  • ${source}`);
    }
  }
  lines.push('');

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const e of report.errors) {
      lines.push(`  ✗ ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('');
  lines.push(
    'Reality Replay is reconstruction-only — no execution, repair, prediction, or root cause analysis.',
  );
  return lines.join('\n');
}
