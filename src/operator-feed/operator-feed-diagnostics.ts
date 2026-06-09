/**
 * Operator Feed Foundation diagnostics.
 */

import { isTimelineOrdered } from './operator-feed-timeline.js';
import type { OperatorFeedDiagnostics, OperatorFeedTimeline } from './operator-feed-types.js';

let diagnostics: OperatorFeedDiagnostics = {
  operatorFeedActive: false,
  eventCount: 0,
  stageCount: 0,
  lastQuery: null,
  lastPrimaryCapability: null,
  lastSourceSystem: null,
  responseReadyEmitted: false,
  timelineOrdered: false,
};

export function getOperatorFeedDiagnostics(): OperatorFeedDiagnostics {
  return { ...diagnostics };
}

export function updateOperatorFeedDiagnostics(timeline: OperatorFeedTimeline): void {
  const lastEvent = timeline.events[timeline.events.length - 1];
  diagnostics = {
    operatorFeedActive: true,
    eventCount: timeline.events.length,
    stageCount: timeline.stageCount,
    lastQuery: timeline.query,
    lastPrimaryCapability: timeline.primaryCapability,
    lastSourceSystem: lastEvent?.sourceSystem ?? null,
    responseReadyEmitted: timeline.responseReady,
    timelineOrdered: isTimelineOrdered(timeline),
  };
}

export function resetOperatorFeedDiagnostics(): void {
  diagnostics = {
    operatorFeedActive: false,
    eventCount: 0,
    stageCount: 0,
    lastQuery: null,
    lastPrimaryCapability: null,
    lastSourceSystem: null,
    responseReadyEmitted: false,
    timelineOrdered: false,
  };
}

export function operatorFeedFoundationKey(): string {
  const d = diagnostics;
  return [
    String(d.operatorFeedActive),
    String(d.eventCount),
    String(d.stageCount),
    String(d.responseReadyEmitted),
    String(d.timelineOrdered),
  ].join('|');
}
