/**
 * Cross Device Runtime Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export type CrossDeviceFeedStage =
  | 'Cross Device Session Created'
  | 'Device Registered'
  | 'Device Linked'
  | 'Device Handoff Available'
  | 'Device Handoff Requested'
  | 'Device Handoff Ready'
  | 'Device Handoff Completed'
  | 'Device Visibility Updated'
  | 'Cross Device Completed'
  | 'Cross Device Failed'
  | 'Cross Device Archived';

export function publishCrossDeviceFeedStage(
  stage: CrossDeviceFeedStage,
  query: string,
  crossDeviceId?: string | null,
): void {
  publishOperatorFeedStage(stage as OperatorFeedStage, 'cross_device_runtime_foundation', {
    query,
    summary: crossDeviceId ? `crossDeviceId=${crossDeviceId}` : undefined,
  });
}

export function publishCrossDeviceFeedStages(
  query: string,
  ready: boolean,
  crossDeviceId?: string | null,
  blocked = false,
): void {
  publishCrossDeviceFeedStage('Cross Device Session Created', query, crossDeviceId);

  if (ready) {
    publishCrossDeviceFeedStage('Device Registered', query, crossDeviceId);
    publishCrossDeviceFeedStage('Device Linked', query, crossDeviceId);
    publishCrossDeviceFeedStage('Device Handoff Available', query, crossDeviceId);
    publishCrossDeviceFeedStage('Device Handoff Requested', query, crossDeviceId);
    publishCrossDeviceFeedStage('Device Handoff Ready', query, crossDeviceId);
    publishCrossDeviceFeedStage('Device Handoff Completed', query, crossDeviceId);
    publishCrossDeviceFeedStage('Device Visibility Updated', query, crossDeviceId);
    publishCrossDeviceFeedStage('Cross Device Completed', query, crossDeviceId);
  } else if (blocked) {
    publishCrossDeviceFeedStage('Cross Device Failed', query, crossDeviceId);
  } else {
    publishCrossDeviceFeedStage('Cross Device Failed', query, crossDeviceId);
  }
}

export function publishCrossDeviceLifecycleStage(
  stage: 'Cross Device Archived',
  query: string,
  crossDeviceId?: string | null,
): void {
  publishCrossDeviceFeedStage(stage, query, crossDeviceId);
}
