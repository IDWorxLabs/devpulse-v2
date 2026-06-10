/**
 * Missing Capability Escalation — repeated blocked state detection.
 */

import type { BlockedStateEvent, BlockedStatePatternResult } from './escalation-types.js';

let blockedPatternCount = 0;

const BLOCKED_STATES = ['READY', 'WAITING', 'BLOCKED'];

export function detectRepeatedBlockedStates(
  events: BlockedStateEvent[],
  threshold = 3,
): BlockedStatePatternResult {
  if (events.length < threshold) {
    return {
      detected: false,
      blockedFrequency: events.length,
      blockedDurationMs: 0,
      loopDetected: false,
    };
  }

  const blockedEvents = events.filter((e) => BLOCKED_STATES.includes(e.state));
  const blockedFrequency = blockedEvents.length;
  const blockedDurationMs = blockedEvents.reduce((sum, e) => sum + e.durationMs, 0);

  let loopDetected = false;
  for (let i = 0; i < events.length - 2; i++) {
    const a = events[i].state;
    const b = events[i + 1]?.state;
    const c = events[i + 2]?.state;
    if (a === 'BLOCKED' && b === 'RETRY' && c === 'BLOCKED') {
      loopDetected = true;
      break;
    }
    if (a === 'BLOCKED' && b === 'BLOCKED') {
      loopDetected = true;
      break;
    }
  }

  const detected = loopDetected || blockedFrequency >= threshold;

  if (detected) blockedPatternCount += 1;

  return {
    detected,
    blockedFrequency,
    blockedDurationMs,
    loopDetected,
  };
}

export function getBlockedPatternCount(): number {
  return blockedPatternCount;
}

export function resetBlockedStateDetectorForTests(): void {
  blockedPatternCount = 0;
}
