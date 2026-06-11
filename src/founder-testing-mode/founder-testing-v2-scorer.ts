/**
 * Founder Testing Mode V2 — product readiness reality and verdicts.
 */

import { leakageLevelSeverity, type ArchitectureLeakageLevel } from './founder-proxy-architecture-leakage.js';
import type {
  FounderApprovalPrediction,
  FounderTestV2Verdict,
  ProductReadinessReality,
  PromptVisionResult,
  ScreenPurposeResult,
} from './founder-testing-v2-types.js';

export function deriveV2Verdict(input: {
  readiness: ProductReadinessReality;
  founderApproval: FounderApprovalPrediction;
  architectureLevel: ArchitectureLeakageLevel;
  promptVisionResults: PromptVisionResult[];
}): FounderTestV2Verdict {
  const criticalLeak = input.architectureLevel === 'CRITICAL';
  const highLeak = input.architectureLevel === 'HIGH';
  const visionLow = input.readiness.visionAlignment < 55;
  const identityPromptBad = input.promptVisionResults.some(
    (p) => /what is aidevengine/i.test(p.prompt) && !p.passed,
  );
  const mandatoryIdentityFails = input.promptVisionResults.filter(
    (p) =>
      /what is aidevengine|what can aidevengine|help me build|build a crm|project memory|live preview/i.test(
        p.prompt,
      ) && !p.passed,
  ).length;

  if (criticalLeak || (visionLow && identityPromptBad)) return 'VISION_MISALIGNED';
  if (highLeak && input.readiness.visionAlignment < 65 && mandatoryIdentityFails >= 2) {
    return 'VISION_MISALIGNED';
  }

  if (
    input.readiness.technicalReadiness >= 75 &&
    (input.readiness.productReadiness < 60 || input.readiness.visionAlignment < 60)
  ) {
    return 'TECHNICALLY_READY_PRODUCT_NOT_READY';
  }

  if (
    input.founderApproval.likelihood >= 82 &&
    input.readiness.customerReadiness >= 75 &&
    input.readiness.visionAlignment >= 72 &&
    leakageLevelSeverity(input.architectureLevel) <= leakageLevelSeverity('LOW')
  ) {
    return 'LAUNCH_CANDIDATE';
  }

  if (input.founderApproval.likelihood >= 68 && input.readiness.visionAlignment >= 58) {
    return 'FOUNDER_APPROVAL_RECOMMENDED';
  }

  return 'PRODUCT_USABLE_NEEDS_POLISH';
}
