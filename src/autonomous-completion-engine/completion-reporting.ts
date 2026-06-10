/**
 * Autonomous Completion Engine — completion report generation.
 */

import type {
  CompletionInput,
  CompletionReport,
  CompletionResult,
  CompletionState,
} from './autonomous-completion-engine-types.js';
import { evaluateCompletionLoopGuard } from './completion-loop-guard.js';

let reportCounter = 0;

export function generateCompletionReport(
  result: CompletionResult,
  state: CompletionState,
  input?: CompletionInput,
): CompletionReport {
  reportCounter += 1;

  const loopGuard = input ? evaluateCompletionLoopGuard(input) : { status: 'OK' as const };

  return {
    reportId: `completion-report-${reportCounter}`,
    resultId: result.id,
    decision: result.decision,
    readiness: result.readiness,
    confidence: result.confidence,
    trustScore: result.trustScore,
    riskScore: result.riskScore,
    completionScore: result.completionScore,
    evidenceSummary: [...result.evidenceSummary],
    unresolvedBlockers: [...state.unresolvedBlockers],
    nextRecommendedAction: state.nextRecommendedAction,
    loopGuardStatus: loopGuard.status,
    reasoning: [...result.reasoning],
    generatedAt: Date.now(),
  };
}

export function resetCompletionReportCounterForTests(): void {
  reportCounter = 0;
}
