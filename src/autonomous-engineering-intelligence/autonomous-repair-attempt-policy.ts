/**
 * Autonomous Engineering Intelligence V1 — repair attempt limits.
 */

export interface RepairAttemptRecord {
  readonly findingId: string;
  readonly strategyId: string;
  readonly inputFingerprint: string;
  readonly resultFingerprint: string;
  readonly failed: boolean;
}

const MAX_ATTEMPTS_PER_FINDING = 1;
const MAX_ATTEMPTS_PER_STRATEGY = 1;
const MAX_REPAIR_CYCLES = 1;

export function shouldAllowRepairAttempt(
  history: readonly RepairAttemptRecord[],
  input: { findingId: string; strategyId: string; inputFingerprint: string },
): { allowed: boolean; reason?: string } {
  const findingAttempts = history.filter((h) => h.findingId === input.findingId);
  if (findingAttempts.length >= MAX_ATTEMPTS_PER_FINDING) {
    return { allowed: false, reason: 'repair_attempt_limit_reached' };
  }
  const strategyAttempts = history.filter((h) => h.strategyId === input.strategyId);
  if (strategyAttempts.length >= MAX_ATTEMPTS_PER_STRATEGY) {
    return { allowed: false, reason: 'repair_attempt_limit_reached' };
  }
  const identical = history.find(
    (h) =>
      h.findingId === input.findingId &&
      h.strategyId === input.strategyId &&
      h.inputFingerprint === input.inputFingerprint &&
      h.failed,
  );
  if (identical) {
    return { allowed: false, reason: 'repair_attempt_limit_reached' };
  }
  return { allowed: true };
}

export function maxRepairCyclesReached(cycleCount: number): boolean {
  return cycleCount >= MAX_REPAIR_CYCLES;
}
