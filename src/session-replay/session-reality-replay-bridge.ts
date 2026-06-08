/**
 * Reality Replay bridge — Reality Replay remains owner; Session Replay consumes replay sessions.
 */

import { getDevPulseV2RealityReplayAuthority } from '../reality-replay/reality-replay-authority.js';
import { REPLAY_OWNER_MODULE } from '../reality-replay/types.js';
import type { ReplayEvent, ReplaySession } from '../reality-replay/types.js';
import { buildSessionReplayRecord, createSessionReplayEvent } from './session-replay-engine.js';
import type { SessionReplayRecord } from './types.js';

function replayEventToSessionEvent(event: ReplayEvent) {
  return createSessionReplayEvent({
    replayEventId: event.replayEventId,
    timestamp: event.timestamp,
    sourceSystemId: event.sourceSystemId,
    eventType: event.eventType,
    description: event.description,
    evidenceIds: event.evidenceIds,
    warnings: event.warnings,
    errors: event.errors,
  });
}

function replaySessionToRecord(session: ReplaySession): SessionReplayRecord {
  return buildSessionReplayRecord(
    session.replaySessionId,
    session.events.map(replayEventToSessionEvent),
    session.warnings,
    session.errors,
  );
}

export function reconstructReplaySessions(): SessionReplayRecord[] {
  const replay = getDevPulseV2RealityReplayAuthority();
  const existing = replay.getReplaySessions();
  if (existing.length > 0) {
    return existing.map(replaySessionToRecord);
  }
  const reconstructed = replay.reconstructTimeline();
  return [replaySessionToRecord(reconstructed)];
}

export function getReplaySessionSummary(): string {
  const records = reconstructReplaySessions();
  const eventCount = records.reduce((n, r) => n + r.events.length, 0);
  if (eventCount === 0) {
    return 'No Reality Replay sessions available for session reconstruction.';
  }
  return `Reality Replay sessions: ${records.length} session(s), ${eventCount} event(s) consumed read-only.`;
}

export function assertRealityReplayOwnershipUnchanged(): boolean {
  const replay = getDevPulseV2RealityReplayAuthority();
  return (
    replay.constructor.name === 'DevPulseV2RealityReplayAuthority' &&
    typeof replay.getReplaySessions === 'function' &&
    typeof (replay as { reconstructSession?: unknown }).reconstructSession === 'undefined'
  );
}

export function getRealityReplayOwnerForBridge(): string {
  return REPLAY_OWNER_MODULE;
}
