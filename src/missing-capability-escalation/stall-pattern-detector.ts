/**
 * Missing Capability Escalation — stall pattern detection.
 * Stalls are NOT failures — unacceptable progress without explicit failure.
 */

import type { StallEvent, StallPatternResult } from './escalation-types.js';
import { DEFAULT_STALL_THRESHOLD_MS } from './escalation-types.js';
import { getCachedStallPattern, setCachedStallPattern } from './escalation-cache.js';

let stallPatternCount = 0;

export function detectRepeatedStalls(
  stalls: StallEvent[],
  stallThresholdMs = DEFAULT_STALL_THRESHOLD_MS,
): StallPatternResult {
  const cacheKey = stalls.map((s) => `${s.actualDurationMs}:${s.progressVelocity}`).join('|');
  const cached = getCachedStallPattern(cacheKey);
  if (cached) return cached;

  if (stalls.length === 0) {
    const result: StallPatternResult = {
      stallDetected: false,
      stallEscalationRequired: false,
      stallDurationMs: 0,
      progressVelocity: 0,
      frequency: 0,
    };
    setCachedStallPattern(cacheKey, result);
    return result;
  }

  const longStalls = stalls.filter((s) => s.actualDurationMs >= stallThresholdMs);
  const collapsedVelocity = stalls.filter((s) => s.progressVelocity < 0.05);
  const stateFrozen = stalls.filter((s) => s.stateUnchanged);
  const exceededExpected = stalls.filter((s) => s.actualDurationMs > s.expectedDurationMs * 2);

  const stallDetected = longStalls.length > 0
    || collapsedVelocity.length > 0
    || stateFrozen.length >= 2
    || exceededExpected.length > 0;

  const maxDuration = Math.max(...stalls.map((s) => s.actualDurationMs), 0);
  const minVelocity = Math.min(...stalls.map((s) => s.progressVelocity), 1);
  const frequency = longStalls.length + collapsedVelocity.length;

  const stallEscalationRequired = frequency >= 2
    || maxDuration >= stallThresholdMs * 2
    || (stallDetected && collapsedVelocity.length >= 1 && stateFrozen.length >= 1);

  if (stallEscalationRequired) stallPatternCount += 1;

  const result: StallPatternResult = {
    stallDetected,
    stallEscalationRequired,
    stallDurationMs: maxDuration,
    progressVelocity: minVelocity,
    frequency,
  };

  setCachedStallPattern(cacheKey, result);
  return result;
}

export function getStallPatternCount(): number {
  return stallPatternCount;
}

export function resetStallPatternDetectorForTests(): void {
  stallPatternCount = 0;
}
