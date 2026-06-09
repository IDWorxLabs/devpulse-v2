/**
 * Preview observation planner — future observation plan only, no actual observation.
 */

import type { PreviewContextAnalysis } from './preview-context-analyzer.js';
import type { PreviewObservationPlanItem, PreviewReadinessLevel } from './types.js';
import { ALL_OBSERVATION_ITEMS } from './types.js';

export function planPreviewObservations(
  context: PreviewContextAnalysis,
  readinessLevel: PreviewReadinessLevel,
): PreviewObservationPlanItem[] {
  if (readinessLevel === 'BLOCKED' || !context.hasSession) {
    return [];
  }

  const deferred = readinessLevel === 'NOT_READY' || readinessLevel === 'UNKNOWN';
  const plan: PreviewObservationPlanItem[] = [];

  const add = (observation: (typeof ALL_OBSERVATION_ITEMS)[number], priority: number, rationale: string) => {
    plan.push({ observation, priority, rationale, deferred });
  };

  if (context.isNonVisualTarget) {
    add('OBSERVE_ERROR_BOUNDARIES', 1, 'Monitor API/runtime error surfaces when non-visual target');
    add('OBSERVE_LOADING_STATE', 2, 'Track health/loading signals for non-visual preview');
    return plan;
  }

  if (context.targetType === 'UNKNOWN_TARGET') {
    return [];
  }

  add('OBSERVE_RENDER_STATE', 1, 'Future render state check when live view connects');
  add('OBSERVE_LAYOUT_STABILITY', 2, 'Future layout stability observation for visual targets');
  add('OBSERVE_LOADING_STATE', 3, 'Future loading state observation');
  add('OBSERVE_ERROR_BOUNDARIES', 4, 'Future error boundary observation');

  if (context.isVisualTarget && context.previewUrl) {
    add('OBSERVE_NAVIGATION_STATE', 5, 'Future navigation state tracking when URL is available');
    add('OBSERVE_VISUAL_REGRESSION_RISK', 6, 'Future visual regression risk assessment');
  }

  if (context.isVisualTarget) {
    add('OBSERVE_INTERACTION_SURFACE', 7, 'Future interaction surface mapping — no interaction testing in 16.2');
  }

  if (context.requiresDesktopPath) {
    add(
      'OBSERVE_MOBILE_DESKTOP_COMPATIBILITY',
      8,
      'Future mobile/desktop compatibility observation before Self Vision',
    );
  }

  if (readinessLevel === 'READY_FOR_FUTURE_SELF_VISION') {
    for (const item of plan) {
      if (item.observation === 'OBSERVE_RENDER_STATE' || item.observation === 'OBSERVE_LAYOUT_STABILITY') {
        item.deferred = false;
      }
    }
  }

  return plan.sort((a, b) => a.priority - b.priority);
}
