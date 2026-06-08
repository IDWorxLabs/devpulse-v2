/**
 * Self Vision bridge — Self Vision remains owner; Reality Replay consumes observation history.
 */

import { getDevPulseV2SelfVisionAuthority } from '../self-vision/self-vision-authority.js';
import { SELF_VISION_OWNER_MODULE } from '../self-vision/types.js';
import type { ObservationRecord, ObservationSession } from '../self-vision/types.js';
import { createReplayEvent } from './reality-replay-engine.js';
import type { ReplayEvent, ReplaySession } from './types.js';
import { replayObservationHistory } from './reality-replay-engine.js';

function observationToReplayEvent(record: ObservationRecord, session: ObservationSession): ReplayEvent {
  return createReplayEvent({
    timestamp: record.createdAt,
    sourceSystemId: 'self_vision',
    eventType: 'OBSERVATION',
    description: `Observation ${record.elementId}: ${record.status} at ${record.selector}`,
    evidenceIds: [],
    warnings: [...record.warnings, ...session.warnings],
    errors: [...record.errors],
  });
}

export function replayObservationSessions(): ReplaySession {
  const sessions = getDevPulseV2SelfVisionAuthority().getObservationSessions();
  const events: ReplayEvent[] = [];

  for (const session of sessions) {
    for (const record of session.observations) {
      events.push(observationToReplayEvent(record, session));
    }
    if (session.observations.length === 0) {
      events.push(
        createReplayEvent({
          timestamp: session.createdAt,
          sourceSystemId: 'self_vision',
          eventType: 'OBSERVATION_SESSION',
          description: `Empty observation session ${session.sessionId}`,
          evidenceIds: [],
          warnings: [...session.warnings],
          errors: [...session.errors],
        }),
      );
    }
  }

  return replayObservationHistory(events);
}

export function getObservationReplaySummary(): string {
  const session = replayObservationSessions();
  if (session.events.length === 0) {
    return 'No Self Vision observation history available for replay.';
  }
  return `Observation replay: ${session.events.length} event(s) from Self Vision sessions — status ${session.status}.`;
}

export function assertSelfVisionOwnershipUnchanged(): boolean {
  const selfVision = getDevPulseV2SelfVisionAuthority();
  return (
    selfVision.constructor.name === 'DevPulseV2SelfVisionAuthority' &&
    typeof selfVision.getObservationSessions === 'function' &&
    typeof (selfVision as { reconstructHistory?: unknown }).reconstructHistory === 'undefined'
  );
}

export function getSelfVisionOwnerForBridge(): string {
  return SELF_VISION_OWNER_MODULE;
}
