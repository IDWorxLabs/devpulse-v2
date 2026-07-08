/**
 * Chat-to-Build Execution Bridge V1 — runtime evidence and operator feed adapters.
 */

import type { ChatToBuildBridgeEvent } from './bridge-types.js';

export function bridgeEventsToExecutionTrace(events: readonly ChatToBuildBridgeEvent[]): Array<Record<string, unknown>> {
  return events.map((event) => ({
    eventId: event.eventId,
    timestamp: Date.parse(event.timestamp) || Date.now(),
    runtimeStage: event.section,
    component: 'chat_to_build_execution_bridge',
    severity: event.status === 'Failed' ? 'ERROR' : event.status === 'Warning' ? 'WARN' : 'INFO',
    eventTitle: event.title,
    technicalDetail: event.detail,
    status: event.status,
    metadata: { engineeringState: event.state },
    section: event.section,
    action: event.title,
    detail: event.detail,
    stepIndex: event.stepIndex,
    stepTotal: event.stepTotal,
  }));
}

export function bridgeEventsToOperatorFeed(events: readonly ChatToBuildBridgeEvent[]): Array<Record<string, unknown>> {
  return events.map((event) => ({
    eventType: event.title,
    action: event.title,
    detail: event.detail,
    section: event.section,
    status: event.status,
    stepIndex: event.stepIndex,
    stepTotal: event.stepTotal,
  }));
}
