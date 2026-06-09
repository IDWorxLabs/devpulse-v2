/**
 * Live Preview Runtime — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishLivePreviewRuntimeFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Preview Target Discovered', 'live_preview_runtime', { query });
  publishOperatorFeedStage('Preview Session Created', 'live_preview_runtime', { query });
  publishOperatorFeedStage('Preview Session Validated', 'live_preview_runtime', { query });
  if (ready) {
    publishOperatorFeedStage('Preview Runtime Ready', 'live_preview_runtime', { query });
  } else {
    publishOperatorFeedStage('Preview Runtime Blocked', 'live_preview_runtime', { query });
  }
}
