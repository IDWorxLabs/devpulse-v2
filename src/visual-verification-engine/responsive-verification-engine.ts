/**
 * Responsive verification engine — verifies mobile, tablet, and desktop regions.
 */

import type { UiInspectionReport } from '../ui-inspection-engine/types.js';
import type { VerificationResult, VerificationTarget } from './types.js';

let responsiveCounter = 0;

export function resetResponsiveVerificationCounterForTests(): void {
  responsiveCounter = 0;
}

export function verifyResponsiveTargets(
  targets: VerificationTarget[],
  inspectionReport: UiInspectionReport | null,
): VerificationResult[] {
  const responsiveTargets = targets.filter((t) => t.targetType === 'RESPONSIVE_TARGET');
  if (!inspectionReport || responsiveTargets.length === 0) return [];

  const results: VerificationResult[] = [];

  for (const target of responsiveTargets) {
    responsiveCounter += 1;
    const responsive = inspectionReport.responsiveStructures.find((r) => r.structureId === target.targetName);
    const issueClassifications: string[] = [];

    if (!responsive) {
      issueClassifications.push('responsive-surface-missing');
    } else {
      if (responsive.mobileSurfaces.length === 0) issueClassifications.push('missing-mobile-region');
      if (responsive.tabletSurfaces.length === 0) issueClassifications.push('missing-tablet-region');
      if (responsive.desktopSurfaces.length === 0) issueClassifications.push('missing-desktop-region');
      if (responsive.responsiveContainers.length === 0) issueClassifications.push('missing-responsive-container');
    }

    const status =
      issueClassifications.length === 0
        ? 'VERIFIED'
        : issueClassifications.length <= 2
          ? 'PARTIALLY_VERIFIED'
          : 'FAILED_VERIFICATION';

    results.push({
      resultId: `vresp-${responsiveCounter.toString().padStart(3, '0')}`,
      targetId: target.targetId,
      targetType: 'RESPONSIVE_TARGET',
      status,
      observedState: responsive
        ? `mobile=${responsive.mobileSurfaces.length}, tablet=${responsive.tabletSurfaces.length}, desktop=${responsive.desktopSurfaces.length}, containers=${responsive.responsiveContainers.length}`
        : 'responsive structure not found',
      expectedState: 'mobile, tablet, and desktop regions with responsive containers',
      issueClassifications,
      verificationOnly: true,
    });
  }

  return results;
}
