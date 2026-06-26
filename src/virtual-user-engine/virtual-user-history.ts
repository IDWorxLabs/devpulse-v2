/**
 * Virtual User Engine — history.
 */

import { DEFAULT_MAX_VIRTUAL_USER_HISTORY } from './virtual-user-types.js';
import type { VirtualUserPipelineResult } from './virtual-user-types.js';

const history: Array<{ pipelineId: string; verdict: string; completedAt: number }> = [];

export function resetVirtualUserHistoryForTests(): void {
  history.length = 0;
}

export function recordVirtualUserHistory(result: VirtualUserPipelineResult): void {
  history.push({
    pipelineId: result.pipelineId,
    verdict: result.permissionVerdict,
    completedAt: result.completedAt,
  });
  while (history.length > DEFAULT_MAX_VIRTUAL_USER_HISTORY) {
    history.shift();
  }
}

export function getVirtualUserHistorySize(): number {
  return history.length;
}
