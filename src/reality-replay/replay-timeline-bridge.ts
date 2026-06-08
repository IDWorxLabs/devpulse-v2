/**
 * Timeline Ledger bridge — ledger remains owner; Reality Replay consumes timeline events.
 */

import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { LEDGER_OWNER_MODULE } from '../timeline-ledger/types.js';
import type { TimelineEvent } from '../timeline-ledger/types.js';
import { createReplayEvent } from './reality-replay-engine.js';
import type { ReplayEvent } from './types.js';

function timelineEventToReplayEvent(event: TimelineEvent): ReplayEvent {
  return createReplayEvent({
    timestamp: event.createdAt,
    sourceSystemId: 'timeline_event_ledger',
    eventType: event.category,
    description: `${event.title}: ${event.summary}`,
    evidenceIds: [...event.relatedEvidenceIds],
    warnings: [...event.warnings],
    errors: [...event.errors],
  });
}

export function reconstructTimelineEvents(): ReplayEvent[] {
  const events = getDevPulseV2TimelineLedgerAuthority().listEvents();
  return events.map(timelineEventToReplayEvent);
}

export function getTimelineReplaySummary(): string {
  const events = reconstructTimelineEvents();
  if (events.length === 0) {
    return 'No timeline events available for replay reconstruction.';
  }
  const first = events[0];
  const last = events[events.length - 1];
  return `Timeline replay: ${events.length} event(s) from ${first.timestamp} to ${last.timestamp}.`;
}

export function assertTimelineLedgerOwnershipUnchanged(): boolean {
  const ledger = getDevPulseV2TimelineLedgerAuthority();
  return (
    ledger.constructor.name === 'DevPulseV2TimelineLedgerAuthority' &&
    typeof ledger.listEvents === 'function' &&
    typeof (ledger as { reconstructHistory?: unknown }).reconstructHistory === 'undefined'
  );
}

export function getTimelineLedgerOwnerForBridge(): string {
  return LEDGER_OWNER_MODULE;
}
