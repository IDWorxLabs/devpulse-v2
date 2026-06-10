/**
 * Autonomous Testing — risk analysis.
 */

import type { AutonomousTestPlanInput } from './autonomous-testing-types.js';

export function analyzeAutonomousTestRisk(input: AutonomousTestPlanInput): number {
  let risk = 15;

  const scopePenalty: Record<string, number> = {
    TINY: 0,
    SMALL: 5,
    MEDIUM: 12,
    LARGE: 22,
    MAJOR: 30,
  };
  risk += scopePenalty[input.changeScope ?? 'MEDIUM'] ?? 12;

  risk += Math.max(0, 50 - input.trustScore) * 0.35;
  risk += (input.verificationRiskScore ?? 30) * 0.2;
  risk += (input.historicalFailures ?? 0) * 4;

  const blastPenalty: Record<string, number> = {
    LOCAL: 0,
    MODULE: 8,
    SYSTEM: 18,
    PLATFORM: 28,
  };
  risk += blastPenalty[input.blastRadius ?? 'MODULE'] ?? 8;

  if (input.brainChanged || input.routingChanged) risk += 12;
  if (input.dataModelChanged) risk += 10;
  if (input.cloudRuntimeTouched) risk += 10;
  if (input.world2ExecutionActive) risk += 14;
  if (input.repeatFailuresDetected) risk += 15;
  if (input.verificationDisagreement) risk += 10;
  if (input.verificationReadiness === 'RISK_ESCALATED') risk += 12;
  if (input.verificationReadiness === 'TRUST_RECOVERY_REQUIRED') risk += 10;

  const executionPenalty: Record<string, number> = {
    NONE: -5,
    DRY_RUN: 0,
    LOCAL: 5,
    CLOUD: 15,
    REMOTE: 18,
    API: 18,
    AUTONOMOUS: 22,
    WORLD2: 25,
  };
  risk += executionPenalty[input.executionMode ?? 'LOCAL'] ?? 5;

  return Math.max(0, Math.min(100, Math.round(risk)));
}
