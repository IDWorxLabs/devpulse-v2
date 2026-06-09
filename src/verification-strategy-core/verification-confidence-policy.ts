/**
 * Verification Strategy Core — confidence calculation policy.
 */

import type { VerificationStrategyInput } from './verification-strategy-types.js';

export function calculateVerificationConfidence(input: VerificationStrategyInput): number {
  let confidence = 50;

  confidence += Math.min(30, Math.max(0, input.trustScore * 0.3));

  const failures = input.historicalFailures ?? 0;
  confidence -= Math.min(25, failures * 5);

  const passRate = input.validationHistoryPassRate ?? 0.8;
  confidence += Math.round((passRate - 0.5) * 20);

  const changeSizePenalty: Record<string, number> = {
    small: 0,
    medium: -5,
    large: -12,
  };
  confidence += changeSizePenalty[input.changeSize ?? 'medium'] ?? -5;

  const scopePenalty: Record<string, number> = {
    TINY: 5,
    SMALL: 0,
    MEDIUM: -5,
    LARGE: -10,
    MAJOR: -15,
  };
  confidence += scopePenalty[input.changeScope] ?? 0;

  const executionPenalty: Record<string, number> = {
    NONE: 10,
    DRY_RUN: 5,
    LOCAL: 0,
    CLOUD: -8,
    REMOTE: -10,
    API: -10,
    AUTONOMOUS: -15,
    WORLD2: -18,
  };
  confidence += executionPenalty[input.executionMode] ?? 0;

  const riskPenalty: Record<string, number> = {
    NONE: 5,
    LOW: 0,
    MEDIUM: -5,
    HIGH: -12,
    CRITICAL: -20,
  };
  confidence += riskPenalty[input.riskLevel] ?? 0;

  if (input.repeatFailuresDetected) confidence -= 15;
  if (input.verificationDisagreement) confidence -= 10;
  if (input.criticalSubsystemModified) confidence -= 8;

  return Math.max(0, Math.min(100, Math.round(confidence)));
}
