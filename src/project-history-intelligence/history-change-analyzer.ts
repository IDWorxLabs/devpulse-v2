/**
 * History change analyzer — change and rollback tracking.
 */

import type { HistoryChange, HistoryEvent, HistoryRollback } from './project-history-intelligence-types.js';

let changeCounter = 0;
let rollbackCounter = 0;

export function buildHistoryChanges(events: HistoryEvent[]): HistoryChange[] {
  return events
    .filter((e) => e.changeType !== 'ROLLBACK' && e.changeType !== 'RESTORE')
    .map((e) => {
      changeCounter += 1;
      return {
        changeId: `chg-${changeCounter.toString().padStart(4, '0')}`,
        eventId: e.eventId,
        phase: e.phase,
        changeType: e.changeType,
        summary: e.summary,
        reason: e.reason,
        confidence: e.confidence,
        readOnly: true as const,
      };
    });
}

export function buildRollbacks(events: HistoryEvent[]): HistoryRollback[] {
  const rollbacks: HistoryRollback[] = [];
  for (const e of events) {
    if (e.changeType !== 'ROLLBACK' && e.changeType !== 'RESTORE') continue;
    rollbackCounter += 1;
    const restored = e.changeType === 'RESTORE'
      ? events.find((r) => r.rollbackReference === e.rollbackReference && r.changeType === 'ROLLBACK')
      : null;
    rollbacks.push({
      rollbackId: `rb-${rollbackCounter.toString().padStart(4, '0')}`,
      eventId: e.eventId,
      phase: e.phase,
      summary: e.summary,
      reason: e.reason,
      restoredBy: restored ? e.source : e.changeType === 'RESTORE' ? e.source : null,
      confidence: e.confidence,
      readOnly: true,
    });
  }
  return rollbacks;
}

export function filterEventsByPhase(events: HistoryEvent[], phaseQuery: string): HistoryEvent[] {
  const lower = phaseQuery.toLowerCase();
  if (lower.includes('phase 11') || lower === '11') {
    return events.filter((e) => e.phase.startsWith('11'));
  }
  if (lower.includes('phase 12') || lower === '12') {
    return events.filter((e) => e.phase.startsWith('12'));
  }
  return events.filter((e) => e.phase.toLowerCase().includes(lower));
}

export function recentChanges(events: HistoryEvent[], limit = 5): HistoryEvent[] {
  return [...events].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

export function findCapabilityIntroduction(
  capabilityQuery: string,
  events: HistoryEvent[],
): HistoryEvent | null {
  const lower = capabilityQuery.toLowerCase();
  return (
    events.find(
      (e) =>
        (e.changeType === 'CAPABILITY_ADDED' || e.changeType === 'INTEGRATION') &&
        (e.source.toLowerCase().includes(lower.replace(/\s+/g, '_')) ||
          e.summary.toLowerCase().includes(lower) ||
          lower.includes(e.source.replace(/_/g, ' '))),
    ) ?? null
  );
}
