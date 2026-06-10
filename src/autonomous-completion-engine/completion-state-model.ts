/**
 * Autonomous Completion Engine — authoritative completion state model.
 */

import type {
  CompletionDecision,
  CompletionInput,
  CompletionReadiness,
  CompletionState,
} from './autonomous-completion-engine-types.js';
import type { CompletionEvidenceAnalysis } from './autonomous-completion-engine-types.js';
import type { CompletionLoopGuardResult } from './autonomous-completion-engine-types.js';

let stateCounter = 0;

const NEXT_ACTION_MAP: Record<CompletionDecision, string> = {
  COMPLETE: 'Declare task complete and archive completion evidence',
  CONTINUE_TESTING: 'Run additional autonomous testing cycles',
  CONTINUE_FIXING: 'Generate and evaluate further fix plans',
  CONTINUE_VERIFICATION: 'Continue verification analysis until evidence sufficient',
  TRUST_RECOVERY_REQUIRED: 'Enter trust recovery path before completion',
  ESCALATE: 'Escalate to operator or higher authority',
  FOUNDER_REVIEW: 'Request founder review for governance decision',
  BLOCKED: 'Resolve missing dependencies before proceeding',
};

export function buildCompletionState(
  input: CompletionInput,
  decision: CompletionDecision,
  readiness: CompletionReadiness,
  confidence: number,
  trustScore: number,
  riskScore: number,
  evidence: CompletionEvidenceAnalysis,
  loopGuard: CompletionLoopGuardResult,
): CompletionState {
  const unresolvedBlockers: string[] = [...evidence.missingEvidence];

  if (input.unresolvedFailures) {
    unresolvedBlockers.push('unresolved failures');
  }
  if (loopGuard.status === 'LOOP_DETECTED') {
    unresolvedBlockers.push('autonomous loop detected');
  }
  if (input.missingDependencies) {
    unresolvedBlockers.push('missing dependencies');
  }

  const completionScore = Math.round(
    (confidence * 0.4 + trustScore * 0.3 + (100 - riskScore) * 0.3),
  );

  stateCounter += 1;

  return {
    stateId: `completion-state-${stateCounter}`,
    decision,
    readiness,
    confidence,
    trustScore,
    riskScore,
    completionScore: Math.min(100, Math.max(0, completionScore)),
    unresolvedBlockers,
    nextRecommendedAction: NEXT_ACTION_MAP[decision],
    generatedAt: Date.now(),
  };
}

export function resetCompletionStateCounterForTests(): void {
  stateCounter = 0;
}
