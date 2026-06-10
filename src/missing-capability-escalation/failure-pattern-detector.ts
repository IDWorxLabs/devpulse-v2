/**
 * Missing Capability Escalation — repeated failure detection.
 */

import type { FailureEvent, FailurePatternResult } from './escalation-types.js';
import { DEFAULT_FAILURE_THRESHOLD } from './escalation-types.js';
import { getCachedFailurePattern, setCachedFailurePattern } from './escalation-cache.js';

let failurePatternCount = 0;

export function detectRepeatedFailures(
  failures: FailureEvent[],
  threshold = DEFAULT_FAILURE_THRESHOLD,
): FailurePatternResult {
  const cacheKey = failures.map((f) => `${f.subsystem}:${f.message}`).join('|');
  const cached = getCachedFailurePattern(cacheKey);
  if (cached) return cached;

  if (failures.length < threshold) {
    const result: FailurePatternResult = {
      detected: false,
      pattern: 'insufficient_failures',
      frequency: failures.length,
      severity: 'LOW',
    };
    setCachedFailurePattern(cacheKey, result);
    return result;
  }

  const byMessage = new Map<string, number>();
  const bySubsystem = new Map<string, number>();

  for (const failure of failures) {
    byMessage.set(failure.message, (byMessage.get(failure.message) ?? 0) + 1);
    bySubsystem.set(failure.subsystem, (bySubsystem.get(failure.subsystem) ?? 0) + 1);
  }

  let pattern = 'repeated_failures';
  let frequency = failures.length;
  let severity: FailurePatternResult['severity'] = 'MEDIUM';

  const maxIdentical = Math.max(...byMessage.values(), 0);
  const maxSubsystem = Math.max(...bySubsystem.values(), 0);

  if (maxIdentical >= threshold) {
    pattern = 'repeated_identical_failures';
    frequency = maxIdentical;
    severity = maxIdentical >= threshold + 2 ? 'CRITICAL' : 'HIGH';
  } else if (maxSubsystem >= threshold) {
    pattern = 'repeated_subsystem_failures';
    frequency = maxSubsystem;
    severity = 'HIGH';
  } else if (failures.some((f) => f.message.includes('recovery'))) {
    pattern = 'repeated_recovery_failures';
    frequency = failures.filter((f) => f.message.includes('recovery')).length;
    severity = 'HIGH';
  }

  const detected = frequency >= threshold || failures.length >= threshold;

  if (detected) failurePatternCount += 1;

  const result: FailurePatternResult = { detected, pattern, frequency, severity };
  setCachedFailurePattern(cacheKey, result);
  return result;
}

export function getFailurePatternCount(): number {
  return failurePatternCount;
}

export function resetFailurePatternDetectorForTests(): void {
  failurePatternCount = 0;
}
