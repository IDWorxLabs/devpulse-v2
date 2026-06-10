/**
 * Autonomous Fixing — fix readiness evaluation.
 */

import type { FixPlanInput, FixReadiness, FixStrategy } from './autonomous-fixing-types.js';
import type { RepairCandidate } from './autonomous-fixing-types.js';

export function evaluateFixReadiness(
  input: FixPlanInput,
  strategy: FixStrategy,
  confidence: number,
  riskScore: number,
  repairs: RepairCandidate[],
): FixReadiness {
  if (repairs.length === 0 && strategy !== 'RETRY' && strategy !== 'ESCALATE' && strategy !== 'FOUNDER_REVIEW') {
    return 'BLOCKED';
  }

  if (strategy === 'ESCALATE' || (input.repeatFailures ?? 0) >= 3) {
    return 'ESCALATED';
  }

  if (strategy === 'TRUST_RECOVERY' || input.trustScore < 40) {
    return 'TRUST_RECOVERY_REQUIRED';
  }

  if (input.criticalSubsystem && riskScore >= 65) {
    return 'HIGH_RISK';
  }

  if (input.blastRadius === 'PLATFORM' && riskScore >= 55) {
    return 'HIGH_RISK';
  }

  if (confidence < 45 || input.failureSignals.length === 0) {
    return 'NEEDS_MORE_CONTEXT';
  }

  if (confidence >= 55 && riskScore < 60) {
    return 'READY';
  }

  if (riskScore >= 75) {
    return 'HIGH_RISK';
  }

  return 'NEEDS_MORE_CONTEXT';
}
