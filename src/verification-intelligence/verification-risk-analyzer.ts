/**
 * Verification Intelligence — risk analysis.
 */

import type { VerificationPlanInput, VerificationRiskAnalysis } from './verification-plan-types.js';

export function analyzeVerificationRisk(input: VerificationPlanInput): VerificationRiskAnalysis {
  let riskScore = 20;
  const factors: string[] = [];

  const criticalityPenalty: Record<string, number> = {
    LOW: 0,
    MEDIUM: 10,
    HIGH: 22,
    CRITICAL: 35,
  };
  const crit = input.subsystemCriticality ?? 'MEDIUM';
  riskScore += criticalityPenalty[crit] ?? 10;
  factors.push(`Subsystem criticality: ${crit}`);

  riskScore += Math.max(0, 50 - input.trustScore) * 0.4;
  factors.push(`Trust score influence: ${input.trustScore}`);

  const changePenalty: Record<string, number> = {
    small: 0,
    medium: 8,
    large: 18,
  };
  riskScore += changePenalty[input.changeSize ?? 'medium'] ?? 8;
  factors.push(`Change size: ${input.changeSize ?? 'medium'}`);

  const blastPenalty: Record<string, number> = {
    LOCAL: 0,
    MODULE: 8,
    SYSTEM: 18,
    PLATFORM: 28,
  };
  const blast = input.blastRadius ?? 'MODULE';
  riskScore += blastPenalty[blast] ?? 8;
  factors.push(`Blast radius: ${blast}`);

  const failures = input.historicalFailures ?? 0;
  riskScore += Math.min(25, failures * 4);
  if (failures > 0) factors.push(`Historical failures: ${failures}`);

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
  riskScore += executionPenalty[input.executionMode] ?? 5;
  factors.push(`Execution mode: ${input.executionMode}`);

  if (input.criticalSubsystemModified) {
    riskScore += 15;
    factors.push('Critical subsystem modified');
  }
  if (input.repeatFailuresDetected) {
    riskScore += 12;
    factors.push('Repeat failures detected');
  }
  if (input.brainChanged || input.routingChanged) {
    riskScore += 10;
    factors.push('Brain or routing surface changed');
  }
  if (input.world2ExecutionActive) {
    riskScore += 12;
    factors.push('World 2 execution active');
  }
  if (input.cloudRuntimeTouched) {
    riskScore += 10;
    factors.push('Cloud runtime touched');
  }

  return {
    riskScore: Math.max(0, Math.min(100, Math.round(riskScore))),
    factors,
  };
}
