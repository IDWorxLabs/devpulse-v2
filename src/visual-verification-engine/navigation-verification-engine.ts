/**
 * Navigation verification engine — verifies navigation, route, menu, and tab structures.
 */

import type { UiInspectionReport } from '../ui-inspection-engine/types.js';
import type { VerificationResult, VerificationTarget } from './types.js';

let navCounter = 0;

export function resetNavigationVerificationCounterForTests(): void {
  navCounter = 0;
}

export function verifyNavigationTargets(
  targets: VerificationTarget[],
  inspectionReport: UiInspectionReport | null,
): VerificationResult[] {
  const navTargets = targets.filter((t) => t.targetType === 'NAVIGATION_TARGET');
  if (!inspectionReport || navTargets.length === 0) return [];

  const results: VerificationResult[] = [];

  for (const target of navTargets) {
    navCounter += 1;
    const nav = inspectionReport.navigationStructures.find((n) => n.structureId === target.targetName);
    const issueClassifications: string[] = [];

    if (!nav) {
      issueClassifications.push('missing-navigation-structure');
    } else {
      if (nav.navigationAreas.length === 0) issueClassifications.push('missing-navigation-path');
      if (nav.menuStructures.length === 0) issueClassifications.push('missing-menu-structure');
      if (nav.tabStructures.length === 0) issueClassifications.push('missing-tab-structure');
      if (nav.routeRegions.length === 0) issueClassifications.push('missing-route-structure');
    }

    const status =
      issueClassifications.length === 0
        ? 'VERIFIED'
        : issueClassifications.length <= 2
          ? 'PARTIALLY_VERIFIED'
          : 'FAILED_VERIFICATION';

    results.push({
      resultId: `vnav-${navCounter.toString().padStart(3, '0')}`,
      targetId: target.targetId,
      targetType: 'NAVIGATION_TARGET',
      status,
      observedState: nav
        ? `areas=${nav.navigationAreas.length}, menus=${nav.menuStructures.length}, tabs=${nav.tabStructures.length}, routes=${nav.routeRegions.length}`
        : 'navigation structure not found',
      expectedState: 'navigation, menu, tab, and route structures present',
      issueClassifications,
      verificationOnly: true,
    });
  }

  return results;
}
