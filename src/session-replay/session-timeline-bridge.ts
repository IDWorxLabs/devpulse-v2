/**
 * Timeline Ledger bridge — ledger remains owner; Session Replay consumes timeline history.
 */

import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { LEDGER_OWNER_MODULE } from '../timeline-ledger/types.js';
import type { TimelineEvent } from '../timeline-ledger/types.js';
import { buildSessionReplayRecord, createSessionReplayEvent } from './session-replay-engine.js';
import type { SessionReplayRecord } from './types.js';

function timelineEventToSessionEvent(event: TimelineEvent) {
  return createSessionReplayEvent({
    timestamp: event.createdAt,
    sourceSystemId: 'timeline_event_ledger',
    eventType: event.category,
    description: `${event.title}: ${event.summary}`,
    evidenceIds: [...event.relatedEvidenceIds],
    warnings: [...event.warnings],
    errors: [...event.errors],
  });
}

export function reconstructTimelineSessions(): SessionReplayRecord[] {
  const events = getDevPulseV2TimelineLedgerAuthority().listEvents();
  if (events.length === 0) {
    return [];
  }

  const bySession = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const key = event.relatedRecordId ?? 'timeline-session';
    const group = bySession.get(key) ?? [];
    group.push(event);
    bySession.set(key, group);
  }

  return [...bySession.entries()].map(([sessionId, group]) =>
    buildSessionReplayRecord(
      sessionId,
      group.map(timelineEventToSessionEvent),
      [],
      [],
    ),
  );
}

export function getTimelineSessionSummary(): string {
  const records = reconstructTimelineSessions();
  const eventCount = records.reduce((n, r) => n + r.events.length, 0);
  if (eventCount === 0) {
    return 'No timeline sessions available for session reconstruction.';
  }
  return `Timeline sessions: ${records.length} session(s), ${eventCount} event(s).`;
}

export function assertTimelineLedgerOwnershipUnchanged(): boolean {
  const ledger = getDevPulseV2TimelineLedgerAuthority();
  return (
    ledger.constructor.name === 'DevPulseV2TimelineLedgerAuthority' &&
    typeof ledger.listEvents === 'function' &&
    typeof (ledger as { reconstructSession?: unknown }).reconstructSession === 'undefined'
  );
}

export function getTimelineLedgerOwnerForBridge(): string {
  return LEDGER_OWNER_MODULE;
}
