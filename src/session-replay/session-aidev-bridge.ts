/**
 * AiDev Engine bridge — AiDev remains request owner; Session Replay consumes request history.
 */

import { getDevPulseV2AiDevEngineAuthority } from '../aidev-engine/aidev-engine-authority.js';
import { AIDEV_OWNER_MODULE } from '../aidev-engine/types.js';
import type { AiDevRequest } from '../aidev-engine/types.js';
import { buildSessionReplayRecord, createSessionReplayEvent } from './session-replay-engine.js';
import type { SessionReplayRecord } from './types.js';

function requestToEvents(request: AiDevRequest) {
  const events = [
    createSessionReplayEvent({
      timestamp: request.createdAt,
      sourceSystemId: 'aidev_engine',
      eventType: 'AIDEV_REQUEST',
      description: `AiDev request ${request.requestId}: ${request.status} — ${request.normalizedInput}`,
      evidenceIds: [],
      warnings: [...request.warnings],
      errors: [...request.errors],
    }),
  ];
  return events;
}

export function reconstructAiDevRequests(): SessionReplayRecord[] {
  const requests = getDevPulseV2AiDevEngineAuthority().listRequests();
  return requests.map((request) =>
    buildSessionReplayRecord(request.requestId, requestToEvents(request), request.warnings, request.errors),
  );
}

export function getAiDevSessionSummary(): string {
  const records = reconstructAiDevRequests();
  if (records.length === 0) {
    return 'No AiDev requests available for session reconstruction.';
  }
  const eventCount = records.reduce((n, r) => n + r.events.length, 0);
  return `AiDev sessions: ${records.length} request session(s), ${eventCount} event(s).`;
}

export function assertAiDevOwnershipUnchanged(): boolean {
  const aidev = getDevPulseV2AiDevEngineAuthority();
  return (
    aidev.constructor.name === 'DevPulseV2AiDevEngineAuthority' &&
    typeof aidev.listRequests === 'function' &&
    typeof (aidev as { reconstructSession?: unknown }).reconstructSession === 'undefined'
  );
}

export function getAiDevOwnerForBridge(): string {
  return AIDEV_OWNER_MODULE;
}
