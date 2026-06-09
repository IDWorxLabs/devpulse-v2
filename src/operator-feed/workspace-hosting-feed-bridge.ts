/**
 * Workspace Hosting Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishWorkspaceHostingFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Workspace Created', 'workspace_hosting_foundation', { query });
  publishOperatorFeedStage('Workspace Initialized', 'workspace_hosting_foundation', { query });
  publishOperatorFeedStage('Workspace Linked To Runtime', 'workspace_hosting_foundation', { query });
  if (ready) {
    publishOperatorFeedStage('Workspace Activated', 'workspace_hosting_foundation', { query });
    publishOperatorFeedStage('Workspace Completed', 'workspace_hosting_foundation', { query });
    publishOperatorFeedStage('Workspace Hosting Ready', 'workspace_hosting_foundation', { query });
  } else {
    publishOperatorFeedStage('Workspace Failed', 'workspace_hosting_foundation', { query });
    publishOperatorFeedStage('Workspace Hosting Blocked', 'workspace_hosting_foundation', { query });
  }
}

export function publishWorkspaceHostingLifecycleStage(
  stage: 'Workspace Isolated' | 'Workspace Paused' | 'Workspace Resumed' | 'Workspace Archived',
  query: string,
): void {
  publishOperatorFeedStage(stage, 'workspace_hosting_foundation', { query });
}
