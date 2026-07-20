/**
 * Autonomous Engineering Intelligence V1 — evidence recording.
 */

import type {
  AutonomousEngineeringExecutionResult,
  AutonomousEngineeringPlan,
  SourceMutationRecord,
} from './autonomous-engineering-types.js';
import { fingerprintAutonomousEngineeringResult } from './autonomous-repair-plan-fingerprint.js';
import { AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE } from './autonomous-engineering-types.js';

export interface AutonomousEngineeringEvidence {
  readonly source: typeof AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE;
  readonly planFingerprint: string;
  readonly resultFingerprint: string;
  readonly appliedMutations: readonly SourceMutationRecord[];
  readonly rolledBackMutations: readonly SourceMutationRecord[];
  readonly readinessBefore: string;
  readonly readinessAfter: string;
  readonly resolvedFindingIds: readonly string[];
  readonly unresolvedFindingIds: readonly string[];
  readonly outcome: string;
}

export function buildAutonomousEngineeringEvidence(input: {
  plan: AutonomousEngineeringPlan;
  execution: AutonomousEngineeringExecutionResult;
}): AutonomousEngineeringEvidence {
  return {
    source: AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE,
    planFingerprint: input.plan.fingerprint,
    resultFingerprint: fingerprintAutonomousEngineeringResult({
      planFingerprint: input.plan.fingerprint,
      outcome: input.execution.outcome,
      appliedMutationCount: input.execution.appliedMutations.length,
      resolvedFindingCount: input.execution.resolvedFindingIds.length,
    }),
    appliedMutations: input.execution.appliedMutations,
    rolledBackMutations: input.execution.rolledBackMutations,
    readinessBefore: input.execution.readinessBefore,
    readinessAfter: input.execution.readinessAfter,
    resolvedFindingIds: input.execution.resolvedFindingIds,
    unresolvedFindingIds: input.execution.unresolvedFindingIds,
    outcome: input.execution.outcome,
  };
}
