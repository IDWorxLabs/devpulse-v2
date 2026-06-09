/**
 * Preview Intelligence — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishPreviewIntelligenceFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Preview Intelligence Started', 'preview_intelligence', { query });
  publishOperatorFeedStage('Preview Context Analyzed', 'preview_intelligence', { query });
  publishOperatorFeedStage('Preview Readiness Evaluated', 'preview_intelligence', { query });
  publishOperatorFeedStage('Preview Capabilities Analyzed', 'preview_intelligence', { query });
  publishOperatorFeedStage('Preview Limitations Identified', 'preview_intelligence', { query });
  publishOperatorFeedStage('Preview Observation Plan Prepared', 'preview_intelligence', { query });
  if (ready) {
    publishOperatorFeedStage('Preview Intelligence Ready', 'preview_intelligence', { query });
  } else {
    publishOperatorFeedStage('Preview Intelligence Blocked', 'preview_intelligence', { query });
  }
}
