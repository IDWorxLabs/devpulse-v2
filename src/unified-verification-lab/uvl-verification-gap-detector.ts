/**
 * UVL Maturity V1 — verification gap detection.
 */

import type {
  VerificationCoverageRow,
  VerificationGap,
  VerificationGapReport,
  VerificationTimelineEntry,
} from './uvl-maturity-types.js';

export function detectVerificationGaps(input: {
  categoryCoverage: readonly VerificationCoverageRow[];
  timeline: readonly VerificationTimelineEntry[];
}): VerificationGapReport {
  const gaps: VerificationGap[] = [];
  let gapCounter = 0;

  const addGap = (
    category: VerificationGap['category'],
    summary: string,
    severity: VerificationGap['severity'],
    critical: boolean,
  ): void => {
    gapCounter += 1;
    gaps.push({
      readOnly: true,
      gapId: `uvl-gap-${gapCounter}`,
      category,
      summary,
      severity,
      critical,
    });
  };

  for (const row of input.categoryCoverage) {
    if (row.status === 'Complete') continue;

    if (row.category === 'Feature') {
      addGap('Feature', 'Feature not validated', row.status === 'Missing' ? 'CRITICAL' : 'HIGH', row.status === 'Missing');
    }
    if (row.category === 'Engineering') {
      addGap('Engineering', 'Missing engineering assessment', row.status === 'Missing' ? 'CRITICAL' : 'HIGH', row.status === 'Missing');
    }
    if (row.category === 'Visual') {
      addGap('Visual', 'Missing visual proof', row.status === 'Missing' ? 'HIGH' : 'MEDIUM', false);
    }
    if (row.category === 'Requirement') {
      addGap('Requirement', 'Insufficient requirement discovery', row.status === 'Missing' ? 'CRITICAL' : 'HIGH', row.status === 'Missing');
    }
    if (row.category === 'Launch') {
      addGap('Launch', 'Missing founder review', row.status === 'Missing' ? 'CRITICAL' : 'HIGH', row.status === 'Missing');
    }
    if (row.category === 'Structure') {
      addGap('Structure', 'Blueprint structure verification incomplete', row.status === 'Missing' ? 'HIGH' : 'MEDIUM', false);
    }

    for (const area of row.missingAreas) {
      if (!gaps.some((gap) => gap.summary === area)) {
        addGap(row.category, area, 'MEDIUM', false);
      }
    }
  }

  for (const step of input.timeline) {
    if (step.status === 'FAILED') {
      addGap('General', `${step.label} failed: ${step.detail}`, 'HIGH', step.stepId === 'founder-review' || step.stepId === 'feature-reality');
    }
  }

  const criticalGapCount = gaps.filter((gap) => gap.critical || gap.severity === 'CRITICAL').length;
  const missingVerificationAreas = input.categoryCoverage
    .filter((row) => row.status !== 'Complete')
    .map((row) => row.category);

  return {
    readOnly: true,
    gaps,
    gapSummary: gaps.slice(0, 10).map((gap) => `${gap.category}: ${gap.summary}`),
    criticalGapCount,
    missingVerificationAreas,
  };
}
