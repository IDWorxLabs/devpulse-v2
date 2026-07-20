/**
 * Autonomous Engineering Intelligence V1 — traceability chains.
 */

import type {
  AutonomousEngineeringFinding,
  AutonomousEngineeringPlan,
  AutonomousEngineeringExecutionResult,
  EligibilityDecision,
} from './autonomous-engineering-types.js';

export interface AutonomousEngineeringTraceLink {
  readonly findingId: string;
  readonly rootCause: string;
  readonly eligibility: string;
  readonly strategyId: string | null;
  readonly authority: string;
  readonly mutationId: string | null;
  readonly validatorId: string | null;
  readonly outcome: string;
}

export function buildAutonomousEngineeringTraceability(input: {
  findings: readonly AutonomousEngineeringFinding[];
  plan: AutonomousEngineeringPlan;
  execution: AutonomousEngineeringExecutionResult | null;
}): AutonomousEngineeringTraceLink[] {
  const eligibilityByFinding = new Map(input.plan.eligibilityDecisions.map((d) => [d.findingId, d]));
  const strategyByFinding = new Map(input.plan.selectedStrategies.map((s) => [s.findingId, s.strategyId]));
  const mutationByFinding = new Map<string, string>();

  if (input.execution) {
    for (const mutation of input.execution.appliedMutations) {
      for (const findingId of input.plan.sourceFindingIds) {
        if (!mutationByFinding.has(findingId)) mutationByFinding.set(findingId, mutation.mutationId);
      }
    }
  }

  return input.findings.map((finding) => {
    const eligibility: EligibilityDecision | undefined = eligibilityByFinding.get(finding.findingId);
    const strategyId = strategyByFinding.get(finding.findingId) ?? null;
    const resolved = input.execution?.resolvedFindingIds.includes(finding.findingId) ?? false;
    return {
      findingId: finding.findingId,
      rootCause: eligibility?.rootCause ?? 'UNKNOWN_ROOT_CAUSE',
      eligibility: eligibility?.eligibility ?? 'INVALID_FINDING',
      strategyId,
      authority: finding.sourceAuthority,
      mutationId: mutationByFinding.get(finding.findingId) ?? null,
      validatorId: strategyId ? `validate:${strategyId}` : null,
      outcome: resolved ? 'RESOLVED' : input.execution?.outcome ?? 'PENDING',
    };
  });
}

export function isTraceabilityComplete(links: readonly AutonomousEngineeringTraceLink[]): boolean {
  return links.every((l) => l.eligibility !== 'INVALID_FINDING' && l.outcome !== 'PENDING' || l.strategyId === null);
}
