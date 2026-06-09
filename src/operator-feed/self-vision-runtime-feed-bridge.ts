/**
 * Self Vision Runtime — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishSelfVisionRuntimeFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Self Vision Started', 'self_vision_runtime', { query });
  publishOperatorFeedStage('Self Vision Session Created', 'self_vision_runtime', { query });
  publishOperatorFeedStage('Observation Targets Planned', 'self_vision_runtime', { query });
  publishOperatorFeedStage('Capture Plan Prepared', 'self_vision_runtime', { query });
  if (ready) {
    publishOperatorFeedStage('Self Vision Ready', 'self_vision_runtime', { query });
  } else {
    publishOperatorFeedStage('Self Vision Blocked', 'self_vision_runtime', { query });
  }
}
