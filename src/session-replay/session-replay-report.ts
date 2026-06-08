/**
 * Session Replay founder-readable report.
 */

import type { SessionReplayRecord, SessionReplaySummary, SessionReplayReport } from './types.js';
import { SESSION_REPLAY_OWNER_MODULE } from './types.js';

export function buildSessionReplayReport(
  records: SessionReplayRecord[],
  latestSummary: SessionReplaySummary | null = null,
): SessionReplayReport {
  const allEvents = records.flatMap((r) => r.events);
  const completeCount = records.filter((r) => r.status === 'COMPLETE').length;
  const partialCount = records.filter((r) => r.status === 'PARTIAL').length;
  const incompleteCount = records.filter((r) => r.status === 'INCOMPLETE').length;
  const sourceSystems = [...new Set(allEvents.map((e) => e.sourceSystemId))];

  let recommendation =
    'Session Replay reconstructs complete sessions read-only — use for Failure Prediction and Root Cause Attribution inputs.';
  if (allEvents.length === 0) {
    recommendation =
      'No session events reconstructed — populate user, AiDev, planning, observation, or replay history first.';
  } else if (latestSummary) {
    recommendation = `Reconstructed ${latestSummary.sessionCount} session(s) with ${latestSummary.eventCount} event(s).`;
  }

  return {
    ownerModule: SESSION_REPLAY_OWNER_MODULE,
    replaySessionCount: records.length,
    eventCount: allEvents.length,
    completeCount,
    partialCount,
    incompleteCount,
    sourceSystems,
    warnings: records.flatMap((r) => r.warnings),
    errors: records.flatMap((r) => r.errors),
    recommendation,
  };
}

export function formatSessionReplayReport(
  records: SessionReplayRecord[],
  latestSummary: SessionReplaySummary | null = null,
): string {
  const report = buildSessionReplayReport(records, latestSummary);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'DevPulse V2 Session Replay Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Replay sessions: ${report.replaySessionCount}`,
    `Total events: ${report.eventCount}`,
    `Complete sessions: ${report.completeCount}`,
    `Partial sessions: ${report.partialCount}`,
    `Incomplete sessions: ${report.incompleteCount}`,
    '',
    'Source systems:',
  ];

  if (report.sourceSystems.length === 0) {
    lines.push('  (none)');
  } else {
    for (const source of report.sourceSystems) {
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
    'Session Replay is reconstruction-only — no execution, repair, prediction, or root cause analysis.',
  );
  return lines.join('\n');
}
