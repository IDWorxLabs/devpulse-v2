/**
 * Mobile Chat Runtime Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishMobileChatFeedStages(
  query: string,
  ready: boolean,
  mobileChatId?: string | null,
): void {
  const meta = { query, mobileChatId: mobileChatId ?? undefined };
  publishOperatorFeedStage('Mobile Chat Session Created', 'mobile_chat_runtime_foundation', meta);
  if (ready) {
    publishOperatorFeedStage('Mobile Chat Prompt Received', 'mobile_chat_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Chat Context Ready', 'mobile_chat_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Chat Routed To Command', 'mobile_chat_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Chat Action Allowed', 'mobile_chat_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Chat Response Pending', 'mobile_chat_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Chat Response Ready', 'mobile_chat_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Chat Completed', 'mobile_chat_runtime_foundation', meta);
  } else {
    publishOperatorFeedStage('Mobile Chat Action Blocked', 'mobile_chat_runtime_foundation', meta);
    publishOperatorFeedStage('Mobile Chat Failed', 'mobile_chat_runtime_foundation', meta);
  }
}

export function publishMobileChatLifecycleStage(
  stage: 'Mobile Chat Requires Approval' | 'Mobile Chat Desktop Recommended' | 'Mobile Chat Archived',
  query: string,
): void {
  publishOperatorFeedStage(stage, 'mobile_chat_runtime_foundation', { query });
}
