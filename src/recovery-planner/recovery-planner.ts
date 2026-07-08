/**
 * Recovery Planner — evidence-based recovery plan generation.
 */

import type {
  EngineeringRecoveryPlan,
  RecoveryOperationType,
  RecoveryPlannerInput,
  RecoveryPlanCandidate,
} from './recovery-planner-types.js';
import type { RootCauseCategory } from '../recovery-root-cause/index.js';

let planCounter = 0;

export function resetRecoveryPlannerForTests(): void {
  planCounter = 0;
}

export function planEngineeringRecovery(input: RecoveryPlannerInput): EngineeringRecoveryPlan {
  const candidates = rankRecoveryCandidates(input);
  const selected = candidates[0] ?? null;

  planCounter += 1;
  return {
    readOnly: true,
    planId: `recovery-plan-${planCounter}-${Date.now()}`,
    rootCauseAnalysisId: input.rootCause.analysisId,
    failureStage: input.failureStage,
    failureReason: input.failureReason,
    candidates,
    selectedCandidateId: selected?.candidateId ?? null,
    createdAt: Date.now(),
  };
}

function rankRecoveryCandidates(input: RecoveryPlannerInput): RecoveryPlanCandidate[] {
  const strategies = candidatesForCategory(input.rootCause.category, input.failureStage, input.failureReason);
  return strategies
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
      candidateId: `candidate-${index + 1}-${input.rootCause.category.toLowerCase()}`,
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

function candidatesForCategory(
  category: RootCauseCategory,
  stage: string,
  reason: string,
): Omit<RecoveryPlanCandidate, 'rank' | 'candidateId'>[] {
  const base: Omit<RecoveryPlanCandidate, 'rank' | 'candidateId'>[] = [];

  switch (category) {
    case 'VALIDATION':
      base.push(
        mk('REPLAY', 'Replay validation after clearing stale cache.', 0.9),
        mk('RETRY', 'Retry validation with refreshed evidence.', 0.75),
      );
      break;
    case 'PREVIEW':
      base.push(
        mk('RESTART', 'Restart preview server after runtime recovery.', 0.88),
        mk('REPLAY', 'Replay preview gate evaluation.', 0.72),
      );
      break;
    case 'MATERIALIZATION':
      base.push(
        mk('REGENERATE', 'Regenerate missing materialization artifacts.', 0.86),
        mk('REBUILD', 'Rebuild workspace materialization state.', 0.7),
      );
      break;
    case 'WORKSPACE':
      base.push(mk('REBUILD', 'Rebuild workspace from last stable boundary.', 0.84));
      break;
    case 'BUILD':
    case 'DEPENDENCY':
      base.push(
        mk('RETRY', 'Retry build after dependency repair.', 0.8),
        mk('REPAIR', 'Repair build configuration and retry.', 0.68),
      );
      break;
    case 'RUNTIME':
      base.push(mk('RESTART', 'Restart runtime process and replay validation.', 0.82));
      break;
    case 'ARCHITECTURE':
      base.push(mk('REPAIR', 'Route to autonomous debugging for architecture repair.', 0.55));
      break;
    default:
      base.push(mk('RETRY', `Retry stage ${stage} with evidence refresh.`, 0.5));
  }

  if (/timeout/i.test(reason)) {
    base.unshift(mk('REPLAY', 'Replay validator after timeout recovery.', 0.85));
  }

  return base;
}

function mk(
  operation: RecoveryOperationType,
  reason: string,
  confidence: number,
): Omit<RecoveryPlanCandidate, 'rank' | 'candidateId'> {
  return {
    readOnly: true,
    operation,
    reason,
    evidenceRefs: [],
    confidence,
  };
}
