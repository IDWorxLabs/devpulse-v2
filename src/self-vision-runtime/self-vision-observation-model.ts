/**
 * Self Vision observation model — future observation target planning only, no analysis.
 */

import type { ObservationTargetItem, ObservationTargetType } from './types.js';
import type { PreviewTargetType } from '../live-preview-runtime/types.js';

export function planObservationTargets(targetType: PreviewTargetType): ObservationTargetItem[] {
  const plan: ObservationTargetItem[] = [];
  const add = (target: ObservationTargetType, priority: number, rationale: string) => {
    plan.push({ target, priority, rationale, plannedOnly: true });
  };

  if (targetType === 'API_SERVICE' || targetType === 'BACKGROUND_RUNTIME') {
    add('ERROR_SURFACE', 1, 'Future error surface observation for non-visual runtime targets');
    add('LOADING_SURFACE', 2, 'Future loading/health surface observation');
    return plan;
  }

  if (targetType === 'UNKNOWN_TARGET') {
    return [];
  }

  add('RENDER_SURFACE', 1, 'Future render surface observation — no screenshot analysis in Phase 16.3');
  add('LAYOUT_SURFACE', 2, 'Future layout surface observation — planning only');
  add('LOADING_SURFACE', 3, 'Future loading surface observation');
  add('ERROR_SURFACE', 4, 'Future error surface observation');
  add('NAVIGATION_SURFACE', 5, 'Future navigation surface observation');

  if (targetType === 'WEB_APP' || targetType === 'MOBILE_APP' || targetType === 'DESKTOP_APP') {
    add('INTERACTION_SURFACE', 6, 'Future interaction surface mapping — no interaction testing');
    add('RESPONSIVE_SURFACE', 7, 'Future responsive surface observation');
  }

  return plan.sort((a, b) => a.priority - b.priority);
}
