/**
 * Incremental Autonomous Builder — build history.
 */

import type { IncrementalBuildPipelineResult } from './incremental-builder-types.js';
import { DEFAULT_MAX_INCREMENTAL_BUILD_HISTORY } from './incremental-builder-types.js';

const history: Array<{ pipelineId: string; completedAt: number; verdict: string }> = [];

export function resetIncrementalBuildHistoryForTests(): void {
  history.length = 0;
}

export function recordIncrementalBuildHistory(result: IncrementalBuildPipelineResult): void {
  history.push({
    pipelineId: result.pipelineId,
    completedAt: result.completedAt,
    verdict: result.permissionVerdict,
  });
  while (history.length > DEFAULT_MAX_INCREMENTAL_BUILD_HISTORY) {
    history.shift();
  }
}

export function getIncrementalBuildHistorySize(): number {
  return history.length;
}
