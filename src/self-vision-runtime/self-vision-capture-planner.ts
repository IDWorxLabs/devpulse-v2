/**
 * Self Vision capture planner — capture plan only, no capture occurs.
 */

import type { CapturePlanItem, CapturePlanType } from './types.js';
import type { PreviewTargetType } from '../live-preview-runtime/types.js';

export function planCaptureSequence(targetType: PreviewTargetType): CapturePlanItem[] {
  const plan: CapturePlanItem[] = [];
  const add = (captureType: CapturePlanType, priority: number, rationale: string) => {
    plan.push({ captureType, priority, rationale, deferred: true });
  };

  add('INITIAL_RENDER_CAPTURE', 1, 'Future initial render capture when observation runtime connects');
  add('LOADING_STATE_CAPTURE', 2, 'Future loading state capture for observation lifecycle');
  add('ERROR_STATE_CAPTURE', 3, 'Future error state capture for failure surface observation');

  if (targetType === 'WEB_APP' || targetType === 'STATIC_PAGE' || targetType === 'MOBILE_APP') {
    add('POST_ACTION_CAPTURE', 4, 'Future post-action capture — no interaction testing in Phase 16.3');
    add('MANUAL_CAPTURE', 5, 'Future manual capture slot for founder-directed observation');
  }

  if (targetType !== 'API_SERVICE' && targetType !== 'BACKGROUND_RUNTIME') {
    add('TIMELINE_CAPTURE', 6, 'Future timeline capture for session replay linkage');
  }

  return plan.sort((a, b) => a.priority - b.priority);
}
