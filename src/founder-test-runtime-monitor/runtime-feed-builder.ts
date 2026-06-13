/**
 * Runtime Feed Builder — live founder test event feed (V1).
 */

import type { FounderTestRuntimeFeed, FounderTestRuntimeFeedEvent } from './founder-test-runtime-types.js';

let eventCounter = 0;

export function resetRuntimeFeedCounterForTests(): void {
  eventCounter = 0;
}

function formatDisplayTime(date: Date): string {
  return date.toTimeString().slice(0, 8);
}

export function appendRuntimeFeedEvent(input: {
  feed: FounderTestRuntimeFeedEvent[];
  message: string;
  stageId?: string | null;
  severity?: FounderTestRuntimeFeedEvent['severity'];
  at?: Date;
  allowDuplicate?: boolean;
}): FounderTestRuntimeFeedEvent[] {
  const stageId = input.stageId ?? null;
  if (!input.allowDuplicate) {
    const last = input.feed[input.feed.length - 1];
    if (last && last.message === input.message && last.stageId === stageId) {
      return input.feed;
    }
  }
  eventCounter += 1;
  const at = input.at ?? new Date();
  const event: FounderTestRuntimeFeedEvent = {
    readOnly: true,
    eventId: `runtime-feed-${eventCounter}`,
    timestamp: at.toISOString(),
    displayTime: formatDisplayTime(at),
    message: input.message,
    stageId: input.stageId ?? null,
    severity: input.severity ?? 'INFO',
  };
  return [...input.feed, event];
}

export function buildRuntimeFeed(events: readonly FounderTestRuntimeFeedEvent[]): FounderTestRuntimeFeed {
  return {
    readOnly: true,
    events: [...events],
  };
}

export function formatRuntimeFeedLines(feed: FounderTestRuntimeFeed): string[] {
  return feed.events.map((event) => `[${event.displayTime}] ${event.message}`);
}
