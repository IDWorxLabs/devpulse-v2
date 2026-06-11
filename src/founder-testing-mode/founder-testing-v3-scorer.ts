/**
 * Founder Testing Mode V3 — launch readiness verdict derivation.
 */

import { leakageLevelSeverity } from './founder-proxy-architecture-leakage.js';
import type { FounderTestV3Verdict, LaunchReadinessSignals } from './founder-testing-v3-types.js';
import type { FounderTestV2Report } from './founder-testing-v2-types.js';

export function deriveV3Verdict(input: {
  v2: FounderTestV2Report;
  launch: LaunchReadinessSignals;
  trustScore: number;
}): FounderTestV3Verdict {
  const { launch, trustScore, v2 } = input;
  const lr = launch.launchReadinessScore;

  const identityPromptsPassing = v2.promptVisionResults.filter((p) => p.passed).length;
  const identityAligned =
    v2.readinessReality.visionAlignment >= 70 &&
    leakageLevelSeverity(v2.architectureLeakageSummary) <= leakageLevelSeverity('LOW');

  if (
    v2.verdict === 'VISION_MISALIGNED' ||
    (trustScore < 35 && !identityAligned) ||
    launch.humanSuccessRate < 40 ||
    (v2.architectureLeakageSummary === 'CRITICAL' && identityPromptsPassing < 8)
  ) {
    return 'NOT_READY_FOR_USERS';
  }

  if (lr < 45 || launch.goalCompletionScore < 40 || v2.readinessReality.technicalReadiness < 50) {
    return 'READY_FOR_INTERNAL_TESTING';
  }

  if (lr < 62 || launch.confusionScore < 55 || trustScore < 55) {
    return 'READY_FOR_LIMITED_BETA';
  }

  if (lr < 78 || launch.founderApprovalScore < 65 || v2.readinessReality.visionAlignment < 60) {
    return 'READY_FOR_PUBLIC_BETA';
  }

  return 'READY_FOR_LAUNCH';
}
