/**
 * Verification Intelligence — plan type selection.
 */

import type { VerificationStrategy } from '../verification-strategy-core/verification-strategy-types.js';
import type { VerificationPlanInput, VerificationPlanType } from './verification-plan-types.js';

function strategyToPlanType(strategy: VerificationStrategy): VerificationPlanType {
  const map: Record<VerificationStrategy, VerificationPlanType> = {
    MINIMAL: 'QUICK',
    STANDARD: 'STANDARD',
    DEEP: 'DEEP',
    RELEASE: 'RELEASE',
    CLOUD: 'CLOUD',
    WORLD2: 'WORLD2',
    TRUST_RECOVERY: 'TRUST_RECOVERY',
  };
  return map[strategy];
}

function isRiskEscalatedCandidate(input: VerificationPlanInput, riskScore: number): boolean {
  return (
    riskScore >= 75 ||
    input.criticalSubsystemModified === true ||
    input.subsystemCriticality === 'CRITICAL' ||
    input.blastRadius === 'PLATFORM'
  );
}

export function pickVerificationPlanType(
  input: VerificationPlanInput,
  riskScore: number,
): { planType: VerificationPlanType; reasoning: string[] } {
  const reasoning: string[] = [];

  if (
    input.repeatFailuresDetected ||
    input.verificationDisagreement ||
    input.strategy === 'TRUST_RECOVERY'
  ) {
    reasoning.push('Trust recovery conditions detected');
    return { planType: 'TRUST_RECOVERY', reasoning };
  }

  if (
    input.strategy === 'WORLD2' ||
    input.world2ExecutionActive ||
    input.executionMode === 'WORLD2' ||
    input.executionMode === 'AUTONOMOUS'
  ) {
    reasoning.push('World 2 or autonomous execution requires WORLD2 plan');
    return { planType: 'WORLD2', reasoning };
  }

  if (
    input.strategy === 'CLOUD' ||
    input.cloudRuntimeTouched ||
    input.executionMode === 'CLOUD' ||
    input.executionMode === 'REMOTE' ||
    input.executionMode === 'API'
  ) {
    reasoning.push('Cloud or remote execution requires CLOUD plan');
    return { planType: 'CLOUD', reasoning };
  }

  if (isRiskEscalatedCandidate(input, riskScore)) {
    reasoning.push('Critical subsystem or severe blast radius requires RISK_ESCALATED plan');
    return { planType: 'RISK_ESCALATED', reasoning };
  }

  const planType = strategyToPlanType(input.strategy);
  reasoning.push(`Mapped strategy ${input.strategy} to plan type ${planType}`);
  return { planType, reasoning };
}

export function selectVerificationPlan(
  input: VerificationPlanInput,
  riskScore: number,
  confidence: number,
  cost: { estimatedCost: number; estimatedDurationMs: number },
  requiredValidators: string[],
  optionalValidators: string[],
  executionOrder: string[],
): import('./verification-plan-types.js').VerificationPlan {
  const { planType, reasoning } = pickVerificationPlanType(input, riskScore);

  return {
    id: `vplan-${Date.now()}-${planType.toLowerCase()}`,
    type: planType,
    strategy: input.strategy,
    confidence,
    riskScore,
    estimatedCost: cost.estimatedCost,
    estimatedDurationMs: cost.estimatedDurationMs,
    requiredValidators,
    optionalValidators,
    executionOrder,
    reasoning,
    generatedAt: Date.now(),
  };
}
