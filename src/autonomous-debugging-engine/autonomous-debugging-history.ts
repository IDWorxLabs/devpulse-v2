/**
 * Autonomous Debugging Engine — bounded repair history.
 */

import { DEFAULT_MAX_DEBUGGING_HISTORY } from './autonomous-debugging-types.js';
import type { AutonomousDebuggingPipelineResult } from './autonomous-debugging-types.js';

const history: Array<{
  pipelineId: string;
  verdict: string;
  failureCount: number;
  repairedCount: number;
  completedAt: number;
}> = [];

export function resetAutonomousDebuggingHistoryForTests(): void {
  history.length = 0;
}

export function recordAutonomousDebuggingHistory(result: AutonomousDebuggingPipelineResult): void {
  history.push({
    pipelineId: result.pipelineId,
    verdict: result.permissionVerdict,
    failureCount: result.normalizedFailures.length,
    repairedCount: result.repairLoops.filter((l) => l.resolved).length,
    completedAt: result.completedAt,
  });
  while (history.length > DEFAULT_MAX_DEBUGGING_HISTORY) {
    history.shift();
  }
}

export function getAutonomousDebuggingHistorySize(): number {
  return history.length;
}
