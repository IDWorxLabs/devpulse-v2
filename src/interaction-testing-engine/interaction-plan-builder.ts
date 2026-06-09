/**
 * Interaction plan builder — generates interaction plans without verdicts.
 */

import type { ClassifiedInteractionSurface } from './interaction-surface-classifier.js';
import type { InteractionPlan, InteractionType } from './types.js';
import type { UiInspectionReport } from '../ui-inspection-engine/types.js';

let planCounter = 0;

function nextPlanId(): string {
  planCounter += 1;
  return `iplan-${planCounter.toString().padStart(4, '0')}`;
}

export function resetInteractionPlanCounterForTests(): void {
  planCounter = 0;
}

export function buildInteractionPlans(
  surfaces: ClassifiedInteractionSurface[],
  inspectionReport: UiInspectionReport | null,
): InteractionPlan[] {
  const plans: InteractionPlan[] = [];

  const add = (type: InteractionType, target: string, description: string, priority: number) => {
    plans.push({
      planId: nextPlanId(),
      interactionType: type,
      target,
      description,
      priority,
      planOnly: true,
    });
  };

  add('BUTTON_INTERACTION', 'primary-action-btn', 'Simulate primary button interaction', 1);
  add('BUTTON_INTERACTION', 'secondary-action-btn', 'Simulate secondary button interaction', 2);
  add('MENU_INTERACTION', 'top-menu', 'Simulate menu traversal', 3);
  add('TAB_INTERACTION', 'main-tabs', 'Simulate tab switching', 4);
  add('ROUTE_INTERACTION', 'dashboard-route', 'Simulate route traversal', 5);
  add('NAVIGATION_INTERACTION', 'primary-nav', 'Simulate navigation path execution', 6);
  add('FORM_INTERACTION', 'settings-form', 'Simulate form field interaction and submission attempt', 7);
  add('WORKFLOW_INTERACTION', 'onboarding-workflow', 'Simulate workflow step progression', 8);

  for (const surface of surfaces.slice(0, 4)) {
    add('BUTTON_INTERACTION', surface.regionId, `Simulate interaction on ${surface.regionId}`, 9);
  }

  if (inspectionReport?.navigationStructures.length) {
    for (const nav of inspectionReport.navigationStructures[0]?.routeRegions ?? []) {
      add('ROUTE_INTERACTION', nav, `Simulate route: ${nav}`, 10);
    }
  }

  return plans.sort((a, b) => a.priority - b.priority);
}
