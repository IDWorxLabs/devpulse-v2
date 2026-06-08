/**
 * Founder-readable Timeline Ledger report.
 */

import type { LedgerState, TimelineEvent, TimelineLedgerReport } from './types.js';
import { LEDGER_OWNER_MODULE } from './types.js';

export function buildTimelineLedgerReport(
  state: LedgerState,
  events: TimelineEvent[],
): TimelineLedgerReport {
  const eventsBySource: TimelineLedgerReport['eventsBySource'] = {};
  const eventsByCategory: TimelineLedgerReport['eventsByCategory'] = {};

  for (const event of events) {
    eventsBySource[event.source] = (eventsBySource[event.source] ?? 0) + 1;
    eventsByCategory[event.category] = (eventsByCategory[event.category] ?? 0) + 1;
  }

  const latest = events.length > 0 ? events[events.length - 1] : null;

  let recommendation =
    'Timeline Ledger foundation healthy — chronological event history is recording references only.';
  if (state.eventCount === 0) {
    recommendation = 'Add timeline events from system outputs to begin chronological history.';
  } else if (state.errors.length > 0) {
    recommendation = 'Resolve ledger errors before attaching intelligence or execution layers.';
  }

  const summary = [
    `events=${state.eventCount}`,
    `snapshots=${state.snapshotCount}`,
    `sources=${Object.keys(eventsBySource).length}`,
  ].join(' | ');

  return {
    ownerModule: LEDGER_OWNER_MODULE,
    totalEvents: state.eventCount,
    eventsBySource,
    eventsByCategory,
    latestEvent: latest?.title ?? null,
    snapshotCount: state.snapshotCount,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
    summary,
  };
}

export function formatTimelineLedgerReport(
  state: LedgerState,
  events: TimelineEvent[],
): string {
  const report = buildTimelineLedgerReport(state, events);
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — Timeline / Event Ledger Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Ledger owner:           ${report.ownerModule}`);
  lines.push(`Ledger ID:              ${state.ledgerId}`);
  lines.push(`Summary:                ${report.summary}`);
  lines.push('');
  lines.push(`Total events:           ${report.totalEvents}`);
  lines.push(`Snapshot count:         ${report.snapshotCount}`);
  lines.push(`Latest event:           ${report.latestEvent ?? '(none)'}`);
  lines.push('');

  lines.push('Events by source:');
  for (const [source, count] of Object.entries(report.eventsBySource)) {
    lines.push(`  ${source}: ${count}`);
  }
  lines.push('');

  lines.push('Events by category:');
  for (const [category, count] of Object.entries(report.eventsByCategory)) {
    lines.push(`  ${category}: ${count}`);
  }
  lines.push('');

  if (report.warnings.length > 0) {
    lines.push(`Warnings (${report.warnings.length}):`);
    for (const w of report.warnings) {
      lines.push(`  • ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push(`Errors (${report.errors.length}):`);
    for (const e of report.errors) {
      lines.push(`  • ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation:         ${report.recommendation}`);
  lines.push('───────────────────────────────────────────────────');

  return lines.join('\n');
}
