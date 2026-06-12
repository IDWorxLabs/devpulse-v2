/**
 * World 2 Controlled Execution Runtime — bounded runtime history.
 */

import { MAX_WORLD2_HISTORY } from './world2-controlled-execution-runtime-registry.js';
import type {
  World2ExecutionState,
  World2RuntimeAssessment,
  World2RuntimeHistorySummary,
} from './world2-controlled-execution-runtime-types.js';

const history: World2RuntimeAssessment[] = [];

export function resetWorld2ControlledExecutionRuntimeHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2RuntimeAssessment(assessment: World2RuntimeAssessment): void {
  history.push(assessment);
  while (history.length > MAX_WORLD2_HISTORY) {
    history.shift();
  }
}

export function getWorld2RuntimeHistorySize(): number {
  return history.length;
}

export function getLatestWorld2RuntimeAssessment(): World2RuntimeAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2RuntimeHistory(): readonly World2RuntimeAssessment[] {
  return history;
}

export function buildWorld2RuntimeHistorySummary(
  assessments: readonly World2RuntimeAssessment[] = history,
): World2RuntimeHistorySummary {
  const summary: World2RuntimeHistorySummary = {
    totalAssessments: assessments.length,
    readyExecutions: 0,
    restrictedExecutions: 0,
    blockedExecutions: 0,
    insufficientEvidenceExecutions: 0,
    notReadyExecutions: 0,
    terminationEvents: 0,
    escalationEvents: 0,
  };

  for (const item of assessments) {
    switch (item.executionState) {
      case 'READY_FOR_WORLD2':
        summary.readyExecutions += 1;
        break;
      case 'READY_WITH_RESTRICTIONS':
        summary.restrictedExecutions += 1;
        break;
      case 'BLOCKED':
        summary.blockedExecutions += 1;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        summary.insufficientEvidenceExecutions += 1;
        break;
      case 'NOT_READY':
        summary.notReadyExecutions += 1;
        break;
      default:
        break;
    }

    const decision = item.terminationAssessment.decision;
    if (decision === 'STOP' || decision === 'PAUSE') {
      summary.terminationEvents += 1;
    }
    if (decision === 'ESCALATE') {
      summary.escalationEvents += 1;
    }
  }

  return summary;
}

export function countWorld2ExecutionState(
  state: World2ExecutionState,
  assessments: readonly World2RuntimeAssessment[] = history,
): number {
  return assessments.filter((item) => item.executionState === state).length;
}
