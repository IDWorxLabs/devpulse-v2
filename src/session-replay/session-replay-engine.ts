/**
 * Session Replay engine — read-only complete session reconstruction.
 * Does NOT execute, repair, predict failures, or perform root cause analysis.
 */

import { getDevPulseV2ChatAuthority } from '../chat/chat-authority.js';
import { getDevPulseV2PlanningStackValidationAuthority } from '../planning-stack-validation/planning-stack-validation-authority.js';
import type {
  SessionReplayEvent,
  SessionReplayRecord,
  SessionReplayStatus,
  SessionReplaySummary,
} from './types.js';

function createSessionReplayEventId(): string {
  return `session-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSessionReplayRecordId(): string {
  return `session-replay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSessionReplayEvent(
  input: Omit<SessionReplayEvent, 'replayEventId'> & { replayEventId?: string },
): SessionReplayEvent {
  return {
    replayEventId: input.replayEventId ?? createSessionReplayEventId(),
    timestamp: input.timestamp,
    sourceSystemId: input.sourceSystemId,
    eventType: input.eventType,
    description: input.description,
    evidenceIds: [...input.evidenceIds],
    warnings: [...input.warnings],
    errors: [...input.errors],
  };
}

export function sortSessionEventsChronologically(events: SessionReplayEvent[]): SessionReplayEvent[] {
  return [...events].sort((a, b) => a.timestamp - b.timestamp);
}

export function deriveSessionReplayStatus(events: SessionReplayEvent[]): SessionReplayStatus {
  if (events.length === 0) return 'INCOMPLETE';
  const hasErrors = events.some((e) => e.errors.length > 0);
  const sourceCount = new Set(events.map((e) => e.sourceSystemId)).size;
  if (!hasErrors && sourceCount >= 2) return 'COMPLETE';
  if (events.length > 0) return 'PARTIAL';
  return 'INCOMPLETE';
}

export function buildSessionReplayRecord(
  sessionId: string,
  events: SessionReplayEvent[],
  warnings: string[] = [],
  errors: string[] = [],
): SessionReplayRecord {
  const sorted = sortSessionEventsChronologically(events);
  return {
    sessionReplayId: createSessionReplayRecordId(),
    createdAt: Date.now(),
    sessionId,
    events: sorted.map((e) => ({
      ...e,
      evidenceIds: [...e.evidenceIds],
      warnings: [...e.warnings],
      errors: [...e.errors],
    })),
    status: deriveSessionReplayStatus(sorted),
    warnings: [
      'Session Replay reconstructs sessions read-only — no execution, repair, prediction, or root cause analysis.',
      ...warnings,
    ],
    errors: [...errors],
  };
}

export function reconstructSession(records: SessionReplayRecord[]): SessionReplayRecord {
  const allEvents = records.flatMap((r) => r.events);
  const mergedWarnings = records.flatMap((r) => r.warnings);
  const mergedErrors = records.flatMap((r) => r.errors);
  return buildSessionReplayRecord('complete-session', allEvents, mergedWarnings, mergedErrors);
}

export function reconstructUserSession(): SessionReplayRecord {
  const chat = getDevPulseV2ChatAuthority();
  const state = chat.getState();
  const events = state.messages.map((message) =>
    createSessionReplayEvent({
      timestamp: message.createdAt,
      sourceSystemId: 'chat_authority',
      eventType: message.role === 'user' ? 'USER_MESSAGE' : 'ASSISTANT_MESSAGE',
      description: `${message.role}: ${message.text.slice(0, 120)}`,
      evidenceIds: [],
      warnings: [],
      errors: [],
    }),
  );
  return buildSessionReplayRecord(state.chatId, events, state.warnings, state.errors);
}

export function reconstructAiDevSession(events: SessionReplayEvent[]): SessionReplayRecord {
  return buildSessionReplayRecord('aidev-session', events);
}

export function reconstructObservationSession(events: SessionReplayEvent[]): SessionReplayRecord {
  return buildSessionReplayRecord('observation-session', events);
}

export function reconstructPlanningSession(): SessionReplayRecord {
  const runs = getDevPulseV2PlanningStackValidationAuthority().listRuns();
  const events = runs.flatMap((run) => [
    createSessionReplayEvent({
      timestamp: run.createdAt,
      sourceSystemId: 'planning_stack_reality_validation',
      eventType: 'PLANNING_VALIDATION',
      description: `Planning validation ${run.validationId}: ${run.overallStatus} — ${run.handoffs.length} handoffs`,
      evidenceIds: [],
      warnings: [...run.warnings],
      errors: [...run.errors],
    }),
    ...run.handoffs.map((handoff) =>
      createSessionReplayEvent({
        timestamp: run.createdAt,
        sourceSystemId: 'planning_stack_reality_validation',
        eventType: 'PLANNING_HANDOFF',
        description: `${handoff.handoffId}: ${handoff.sourceSystem} → ${handoff.targetSystem}`,
        evidenceIds: [],
        warnings: [],
        errors: handoff.sourceProducedOutput && handoff.targetConsumedOutput ? [] : ['Handoff incomplete'],
      }),
    ),
  ]);
  return buildSessionReplayRecord('planning-session', events);
}

export function summarizeSessionReplay(records: SessionReplayRecord[]): SessionReplaySummary {
  const allEvents = records.flatMap((r) => r.events);
  return {
    sessionCount: records.length,
    eventCount: allEvents.length,
    completeCount: records.filter((r) => r.status === 'COMPLETE').length,
    partialCount: records.filter((r) => r.status === 'PARTIAL').length,
    incompleteCount: records.filter((r) => r.status === 'INCOMPLETE').length,
    warnings: records.flatMap((r) => r.warnings),
    errors: records.flatMap((r) => r.errors),
  };
}
