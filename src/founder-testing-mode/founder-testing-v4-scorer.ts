/**
 * Founder Testing Mode V4 — launch readiness reality and verdicts.
 */

import type {
  FounderTestV4Verdict,
  LaunchReadinessReality,
  PromiseRealityEntry,
  RealityGap,
} from './founder-testing-v4-types.js';
import type { FounderTestV3Report } from './founder-testing-v3-types.js';

export function computeLaunchReadinessReality(input: {
  v3: FounderTestV3Report;
  creationJourneyScore: number;
  ideaToAppScore: number;
  executionReadiness: number;
  promiseMatrix: PromiseRealityEntry[];
}): LaunchReadinessReality {
  const supported = input.promiseMatrix.filter((p) => p.support === 'SUPPORTED').length;
  const partial = input.promiseMatrix.filter((p) => p.support === 'PARTIALLY_SUPPORTED').length;
  const promiseAlignment = clamp(
    (supported * 100 + partial * 55) / Math.max(1, input.promiseMatrix.length),
  );

  const technicalReadiness = input.v3.v2.readinessReality.technicalReadiness;
  const productReadiness = input.v3.v2.readinessReality.productReadiness;
  const humanReadiness = input.v3.launchReadiness.humanSuccessRate;
  const executionReadiness = input.executionReadiness;

  const launchReadinessRealityScore = clamp(
    technicalReadiness * 0.15 +
      productReadiness * 0.15 +
      humanReadiness * 0.15 +
      executionReadiness * 0.25 +
      promiseAlignment * 0.2 +
      input.ideaToAppScore * 0.1,
  );

  return {
    technicalReadiness,
    productReadiness,
    humanReadiness,
    executionReadiness,
    promiseAlignment,
    launchReadinessRealityScore,
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function deriveV4Verdict(input: {
  v3: FounderTestV3Report;
  launch: LaunchReadinessReality;
  gaps: RealityGap[];
  creationJourneyScore: number;
  ideaToAppScore: number;
}): FounderTestV4Verdict {
  const executionGaps = input.gaps.filter((g) => g.gapType === 'EXECUTION_GAP').length;
  const lr = input.launch.launchReadinessRealityScore;

  if (input.creationJourneyScore < 35 || input.v3.verdict === 'NOT_READY_FOR_USERS') {
    return 'FOUNDATION_ONLY';
  }

  if (executionGaps >= 2 && input.launch.executionReadiness < 45) {
    return 'EXECUTION_GAPS_PRESENT';
  }

  const identityAligned =
    input.v3.v2.readinessReality.visionAlignment >= 70 &&
    input.v3.v2.architectureLeakageSummary !== 'CRITICAL' &&
    input.v3.v2.architectureLeakageSummary !== 'HIGH';

  if (identityAligned && input.ideaToAppScore >= 75) {
    if (lr < 55) return 'PRODUCT_DIRECTION_VALID';
  } else if (input.v3.v2.readinessReality.visionAlignment >= 50 && input.ideaToAppScore >= 45) {
    if (lr < 50) return 'PRODUCT_DIRECTION_VALID';
  } else if (input.ideaToAppScore >= 40) {
    return 'PRODUCT_DIRECTION_VALID';
  }

  if (lr < 55 || input.launch.executionReadiness < 50) {
    return 'READY_FOR_INTERNAL_PRODUCT_USE';
  }

  if (lr < 68 || (input.v3.trustScore < 50 && !identityAligned)) {
    return 'READY_FOR_LIMITED_CUSTOMERS';
  }

  if (lr < 82 || (input.v3.v2.architectureLeakageSummary === 'CRITICAL' && !identityAligned)) {
    return 'READY_FOR_PUBLIC_BETA';
  }

  return 'READY_FOR_LAUNCH';
}
