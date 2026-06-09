/**
 * Mobile Command Runtime Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishMobileCommandFeedStages(
  query: string,
  ready: boolean,
  mobileCommandId?: string | null,
): void {
  const meta = { query, mobileCommandId: mobileCommandId ?? undefined };
  publishOperatorFeedStage('Mobile Command Session Created', 'mobile_command_runtime_foundation', meta);
  if (ready) {
    publishOperatorFeedStage('Mobile Command Connected To Cloud', 'mobile_command_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Command Connected To Workspace', 'mobile_command_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Command Connected To Build', 'mobile_command_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Command Connected To Verification', 'mobile_command_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Command Connected To Recovery', 'mobile_command_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Command Connected To Monitoring', 'mobile_command_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Command Action Allowed', 'mobile_command_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Command Completed', 'mobile_command_runtime_foundation', meta);
  } else {
    publishOperatorFeedStage('Mobile Command Action Blocked', 'mobile_command_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Command Failed', 'mobile_command_runtime_foundation', meta);
  }
}

export function publishMobileCommandLifecycleStage(
  stage:
    | 'Mobile Command Requires Approval'
    | 'Mobile Command Desktop Recommended'
    | 'Mobile Command Archived',
  query: string,
): void {
  publishOperatorFeedStage(stage, 'mobile_command_runtime_foundation', { query });
}
