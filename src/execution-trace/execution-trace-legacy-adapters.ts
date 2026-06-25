/**
 * Backward compatibility between Operator Feed and Execution Trace event shapes.
 */

import type { OperatorFeedEvent } from '../command-center-brain/brain-types.js';
import type { ExecutionTraceEvent, ExecutionTraceSeverity } from './execution-trace-types.js';

function severityFromLegacyStatus(
  status: OperatorFeedEvent['status'] | undefined,
): ExecutionTraceSeverity {
  if (status === 'Blocked') return 'ERROR';
  if (status === 'Warning') return 'WARN';
  return 'INFO';
}

function mapLegacyStatus(
  status: OperatorFeedEvent['status'] | undefined,
): ExecutionTraceEvent['status'] {
  if (!status) return 'Completed';
  return status;
}

export function operatorFeedEventToExecutionTrace(event: OperatorFeedEvent): ExecutionTraceEvent {
  const title = event.action ?? event.eventType;
  const detail = event.detail ?? '';
  return {
    eventId: event.eventId,
    timestamp: event.timestamp,
    runtimeStage: event.section ?? 'Runtime',
    component: event.eventType,
    severity: severityFromLegacyStatus(event.status),
    eventTitle: title,
    technicalDetail: detail,
    evidence: event.evidence,
    status: mapLegacyStatus(event.status),
    metadata: {
      legacyEventType: event.eventType,
      stepIndex: event.stepIndex ?? null,
      stepTotal: event.stepTotal ?? null,
    },
    informationalOnly: event.informationalOnly,
    eventType: event.eventType,
    section: event.section,
    action: event.action,
    detail: event.detail,
    stepIndex: event.stepIndex,
    stepTotal: event.stepTotal,
  };
}

export function executionTraceEventToOperatorFeed(event: ExecutionTraceEvent): OperatorFeedEvent {
  return {
    eventId: event.eventId,
    eventType: (event.eventType ?? event.component) as OperatorFeedEvent['eventType'],
    timestamp: event.timestamp,
    informationalOnly: true,
    section: event.section ?? event.runtimeStage,
    action: event.action ?? event.eventTitle,
    detail: event.detail ?? event.technicalDetail,
    status:
      event.status === 'PASS' || event.status === 'Completed'
        ? 'Completed'
        : event.status === 'FAIL' || event.status === 'Blocked'
          ? 'Blocked'
          : event.status === 'Warning'
            ? 'Warning'
            : event.status === 'Queued'
              ? 'Queued'
              : event.status === 'Active'
                ? 'Active'
                : 'Completed',
    stepIndex: event.stepIndex,
    stepTotal: event.stepTotal,
    evidence: event.evidence,
  };
}

export function operatorFeedEventsToExecutionTrace(
  events: OperatorFeedEvent[],
): ExecutionTraceEvent[] {
  return events.map(operatorFeedEventToExecutionTrace);
}

export function executionTraceEventsToOperatorFeed(
  events: ExecutionTraceEvent[],
): OperatorFeedEvent[] {
  return events.map(executionTraceEventToOperatorFeed);
}
