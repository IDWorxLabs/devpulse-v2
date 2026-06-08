/**
 * Self Vision bridge — Self Vision remains owner; Session Replay consumes observation sessions.
 */

import { getDevPulseV2SelfVisionAuthority } from '../self-vision/self-vision-authority.js';
import { SELF_VISION_OWNER_MODULE } from '../self-vision/types.js';
import type { ObservationRecord, ObservationSession } from '../self-vision/types.js';
import { buildSessionReplayRecord, createSessionReplayEvent } from './session-replay-engine.js';
import type { SessionReplayRecord } from './types.js';

function observationToSessionEvent(record: ObservationRecord, session: ObservationSession) {
  return createSessionReplayEvent({
    timestamp: record.createdAt,
    sourceSystemId: 'self_vision',
    eventType: 'OBSERVATION',
    description: `Observation ${record.elementId}: ${record.status} at ${record.selector}`,
    evidenceIds: [],
    warnings: [...record.warnings, ...session.warnings],
    errors: [...record.errors],
  });
}

export function reconstructObservationSessions(): SessionReplayRecord[] {
  const sessions = getDevPulseV2SelfVisionAuthority().getObservationSessions();
  return sessions.map((session) => {
    const events = session.observations.map((record) => observationToSessionEvent(record, session));
    if (events.length === 0) {
      events.push(
        createSessionReplayEvent({
          timestamp: session.createdAt,
          sourceSystemId: 'self_vision',
          eventType: 'OBSERVATION_SESSION',
          description: `Observation session ${session.sessionId} (empty)`,
          evidenceIds: [],
          warnings: [...session.warnings],
          errors: [...session.errors],
        }),
      );
    }
    return buildSessionReplayRecord(session.sessionId, events, session.warnings, session.errors);
  });
}

export function getObservationSessionSummary(): string {
  const records = reconstructObservationSessions();
  const eventCount = records.reduce((n, r) => n + r.events.length, 0);
  if (eventCount === 0) {
    return 'No Self Vision observation sessions available for session reconstruction.';
  }
  return `Observation sessions: ${records.length} session(s), ${eventCount} event(s).`;
}

export function assertSelfVisionOwnershipUnchanged(): boolean {
  const selfVision = getDevPulseV2SelfVisionAuthority();
  return (
    selfVision.constructor.name === 'DevPulseV2SelfVisionAuthority' &&
    typeof selfVision.getObservationSessions === 'function' &&
    typeof (selfVision as { reconstructSession?: unknown }).reconstructSession === 'undefined'
  );
}

export function getSelfVisionOwnerForBridge(): string {
  return SELF_VISION_OWNER_MODULE;
}
