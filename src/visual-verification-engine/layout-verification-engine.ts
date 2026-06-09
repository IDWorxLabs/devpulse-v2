/**
 * Layout verification engine — compares expected vs observed layout structures.
 */

import type { UiInspectionReport } from '../ui-inspection-engine/types.js';
import type { VerificationResult, VerificationTarget } from './types.js';

let layoutCounter = 0;

export function resetLayoutVerificationCounterForTests(): void {
  layoutCounter = 0;
}

export function verifyLayoutTargets(
  targets: VerificationTarget[],
  inspectionReport: UiInspectionReport | null,
): VerificationResult[] {
  const layoutTargets = targets.filter((t) => t.targetType === 'LAYOUT_TARGET');
  if (!inspectionReport || layoutTargets.length === 0) return [];

  const results: VerificationResult[] = [];

  for (const target of layoutTargets) {
    layoutCounter += 1;
    const layout = inspectionReport.layoutStructures.find((l) => l.structureId === target.targetName);
    const missingRegions: string[] = [];
    const unexpectedRegions: string[] = [];

    if (layout) {
      if (!layout.headerPresent) missingRegions.push('header');
      if (!layout.mainContentPresent) missingRegions.push('main-content');
      if (layout.panelCount < 1) missingRegions.push('panels');
      if (layout.hierarchy.length > 10) unexpectedRegions.push('deep-hierarchy');
    } else {
      missingRegions.push('layout-structure');
    }

    const issueClassifications: string[] = [];
    if (missingRegions.length > 0) issueClassifications.push('missing-required-layout-region');
    if (unexpectedRegions.length > 0) issueClassifications.push('unexpected-layout-region');

    const status =
      missingRegions.length === 0
        ? 'VERIFIED'
        : missingRegions.length <= 1
          ? 'PARTIALLY_VERIFIED'
          : 'FAILED_VERIFICATION';

    results.push({
      resultId: `vlay-${layoutCounter.toString().padStart(3, '0')}`,
      targetId: target.targetId,
      targetType: 'LAYOUT_TARGET',
      status,
      observedState: layout
        ? `header=${layout.headerPresent}, main=${layout.mainContentPresent}, panels=${layout.panelCount}`
        : 'layout not found',
      expectedState: 'required layout regions present with valid hierarchy',
      issueClassifications,
      verificationOnly: true,
    });
  }

  return results;
}
