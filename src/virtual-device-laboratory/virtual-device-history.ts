/**
 * Virtual Device Laboratory — history with resume support.
 */

import { DEFAULT_MAX_DEVICE_HISTORY } from './virtual-device-types.js';
import type { VirtualDevicePipelineResult } from './virtual-device-types.js';

const history: Array<{
  pipelineId: string;
  verdict: string;
  completedAt: number;
  completedProfileIds: string[];
}> = [];

let lastCompletedProfileIds: string[] = [];

export function resetVirtualDeviceHistoryForTests(): void {
  history.length = 0;
  lastCompletedProfileIds = [];
}

export function recordVirtualDeviceHistory(result: VirtualDevicePipelineResult): void {
  const completedProfileIds = result.profileResults
    .filter((r) => r.passed || r.skipJustification)
    .map((r) => r.profileId);
  lastCompletedProfileIds = completedProfileIds;
  history.push({
    pipelineId: result.pipelineId,
    verdict: result.permissionVerdict,
    completedAt: result.completedAt,
    completedProfileIds,
  });
  while (history.length > DEFAULT_MAX_DEVICE_HISTORY) {
    history.shift();
  }
}

export function getVirtualDeviceHistorySize(): number {
  return history.length;
}

export function getLastCompletedDeviceProfileIds(): readonly string[] {
  return lastCompletedProfileIds;
}
