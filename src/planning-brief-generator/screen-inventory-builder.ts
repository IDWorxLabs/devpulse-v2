/**
 * Screen Inventory Builder — detected screens for planning brief (V1).
 */

import type { PlanningBriefEvidenceBundle, PlanningBriefScreenItem } from './planning-brief-types.js';

let screenCounter = 0;

export function resetScreenInventoryCounterForTests(): void {
  screenCounter = 0;
}

export function buildScreenInventory(bundle: PlanningBriefEvidenceBundle): PlanningBriefScreenItem[] {
  return bundle.screens.map((name) => {
    screenCounter += 1;
    return {
      readOnly: true,
      screenId: `screen-${screenCounter}`,
      name,
      evidence: [`SCREEN:${name}`, ...bundle.sources.slice(0, 2)],
    };
  });
}
