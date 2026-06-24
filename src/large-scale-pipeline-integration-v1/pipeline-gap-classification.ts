/**
 * Large-Scale Pipeline Integration V1 — per-category gap classification.
 */

import type {
  CategoryMappingEntry,
  GapClassificationEntry,
} from './large-scale-pipeline-integration-v1-types.js';

export function buildGapClassification(
  mapping: readonly CategoryMappingEntry[],
): readonly GapClassificationEntry[] {
  return mapping.map((entry) => ({
    readOnly: true,
    profile: entry.profile,
    productName: entry.productName,
    classification: entry.gapClassification,
    flags: entry.flags,
  }));
}

export function summarizeRemainingGaps(
  gapClassification: readonly GapClassificationEntry[],
  options?: { mobileValidationProven?: boolean },
): readonly string[] {
  const gaps: string[] = [];
  const breadthOnly = gapClassification.filter((g) => g.classification === 'BREADTH_ONLY');
  const buildOnly = gapClassification.filter((g) => g.classification === 'BUILD_ONLY');
  const unvalidated = gapClassification.filter((g) => g.classification === 'UNVALIDATED');

  if (breadthOnly.length > 0) {
    gaps.push(
      `${breadthOnly.length} categories broadly validated without real build proof (BREADTH_ONLY)`,
    );
  }
  if (buildOnly.length > 0) {
    gaps.push(
      `${buildOnly.length} categories build-proven without verification proof (BUILD_ONLY)`,
    );
  }
  if (unvalidated.length > 0) {
    gaps.push(`${unvalidated.length} categories not in any validation suite (UNVALIDATED)`);
  }

  if (!options?.mobileValidationProven) {
    gaps.push('Mobile runtime validation at scale — no large-scale mobile harness');
  }

  return gaps;
}
