/**
 * Autonomous Engineering Intelligence V1 — plan fingerprinting.
 */

import { createHash } from 'node:crypto';
import type { AutonomousEngineeringPlan } from './autonomous-engineering-types.js';

export function fingerprintAutonomousEngineeringPlan(
  plan: Pick<
    AutonomousEngineeringPlan,
    | 'planId'
    | 'envelopeFingerprint'
    | 'workspaceFingerprint'
    | 'readinessEvaluationFingerprint'
    | 'sourceFindingIds'
    | 'selectedStrategies'
    | 'executionOrder'
  >,
): string {
  const payload = [
    plan.planId,
    plan.envelopeFingerprint,
    plan.workspaceFingerprint,
    plan.readinessEvaluationFingerprint,
    [...plan.sourceFindingIds].sort().join(','),
    plan.selectedStrategies.map((s) => `${s.findingId}:${s.strategyId}`).sort().join(','),
    [...plan.executionOrder].join(','),
  ].join('|');
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

export function fingerprintAutonomousEngineeringResult(input: {
  planFingerprint: string;
  outcome: string;
  appliedMutationCount: number;
  resolvedFindingCount: number;
}): string {
  const payload = `${input.planFingerprint}|${input.outcome}|${input.appliedMutationCount}|${input.resolvedFindingCount}`;
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}
