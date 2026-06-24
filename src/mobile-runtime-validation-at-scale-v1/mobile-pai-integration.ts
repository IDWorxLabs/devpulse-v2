/**
 * Mobile Runtime Validation at Scale V1 — Product Architect mobile coverage.
 */

import type { MobileCategoryResult, MobileProductCoverage } from './mobile-runtime-validation-v1-types.js';

export function buildMobileProductCoverage(
  categoryResults: readonly MobileCategoryResult[],
): MobileProductCoverage {
  const desktopOnlyAssumptions: string[] = [];
  const navigationIssues: string[] = [];
  const workflowAccessibilityIssues: string[] = [];

  let scoreSum = 0;
  for (const cat of categoryResults) {
    if (!cat.mobileRuntimeProven) {
      desktopOnlyAssumptions.push(`${cat.productName}: mobile runtime proof incomplete`);
    }
    const phoneProof = cat.proofs.find((p) => p.runtimeProfile === 'ANDROID_PHONE');
    if (phoneProof && !phoneProof.navigationProof) {
      navigationIssues.push(`${cat.productName}: mobile navigation not proven`);
    }
    if (phoneProof && !phoneProof.workflowProof) {
      workflowAccessibilityIssues.push(`${cat.productName}: mobile workflow not visible`);
    }
    if (phoneProof) {
      scoreSum +=
        (phoneProof.navigationProof ? 25 : 0) +
        (phoneProof.workflowProof ? 25 : 0) +
        (phoneProof.interactionProof ? 25 : 0) +
        (phoneProof.applicationLoads ? 25 : 0);
    }
  }

  const denom = categoryResults.length > 0 ? categoryResults.length : 1;

  return {
    readOnly: true,
    desktopOnlyAssumptions,
    navigationIssues,
    workflowAccessibilityIssues,
    mobileProductReadinessScore: Math.round(scoreSum / denom),
  };
}
