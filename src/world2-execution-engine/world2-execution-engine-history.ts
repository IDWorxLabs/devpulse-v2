/**
 * World 2 Execution Engine — bounded run history.
 */

import { MAX_ENGINE_HISTORY } from './world2-execution-engine-registry.js';
import type {
  World2ExecutionEngineAssessment,
  World2ExecutionEngineHistorySummary,
  World2ExecutionMode,
} from './world2-execution-engine-types.js';

const history: World2ExecutionEngineAssessment[] = [];

export function resetWorld2ExecutionEngineHistoryForTests(): void {
  history.length = 0;
}

export function recordWorld2ExecutionEngineAssessment(
  assessment: World2ExecutionEngineAssessment,
): void {
  history.push(assessment);
  while (history.length > MAX_ENGINE_HISTORY) {
    history.shift();
  }
}

export function getWorld2ExecutionEngineHistorySize(): number {
  return history.length;
}

export function getLatestWorld2ExecutionEngineAssessment(): World2ExecutionEngineAssessment | null {
  return history.at(-1) ?? null;
}

export function getWorld2ExecutionEngineHistory(): readonly World2ExecutionEngineAssessment[] {
  return history;
}

export function buildWorld2ExecutionEngineHistorySummary(
  assessments: readonly World2ExecutionEngineAssessment[] = history,
): World2ExecutionEngineHistorySummary {
  const summary: World2ExecutionEngineHistorySummary = {
    totalRuns: assessments.length,
    sandboxEligibleRuns: 0,
    simulatedRuns: 0,
    dryRunRuns: 0,
    blockedRuns: 0,
    insufficientEvidenceRuns: 0,
  };

  for (const item of assessments) {
    switch (item.executionMode) {
      case 'SANDBOX_EXECUTION_ELIGIBLE':
        summary.sandboxEligibleRuns += 1;
        break;
      case 'SIMULATED_EXECUTION':
        summary.simulatedRuns += 1;
        break;
      case 'DRY_RUN':
        summary.dryRunRuns += 1;
        break;
      case 'BLOCKED':
        summary.blockedRuns += 1;
        break;
      default:
        break;
    }
    if (item.finalState === 'INSUFFICIENT_EVIDENCE') {
      summary.insufficientEvidenceRuns += 1;
    }
  }

  return summary;
}

export function countWorld2ExecutionMode(
  mode: World2ExecutionMode,
  assessments: readonly World2ExecutionEngineAssessment[] = history,
): number {
  return assessments.filter((item) => item.executionMode === mode).length;
}
