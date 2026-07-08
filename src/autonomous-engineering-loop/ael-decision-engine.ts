/**
 * AEL Decision Engine — decides loop continuation, repair, or terminal outcome.
 */

import type { AelDecision, AelEvidenceBundle, AelFinalOutcome } from './ael-types.js';
import {
  AEL_MAX_AUTOFIX_ATTEMPTS,
  AEL_MAX_CAPABILITY_EVOLUTION_ATTEMPTS,
  AEL_MAX_FOUNDER_LOOP_CYCLES,
  AEL_MAX_PREVIEW_RECOVERY_ATTEMPTS,
  AEL_PRODUCT_REALITY_PASS_THRESHOLD,
} from './ael-types.js';

export interface AelDecisionResult {
  readOnly: true;
  decision: AelDecision;
  reasoning: string;
  finalOutcome: AelFinalOutcome | null;
}

export function evaluateAelDecision(
  evidence: AelEvidenceBundle,
  cycle: number,
): AelDecisionResult {
  const {
    npmBuildOk,
    npmInstallOk,
    previewOk,
    previewDegraded,
    productRealityReport,
    founderLoopReport,
    autofixAttempts,
    capabilityEvolutionAttempts,
    previewRecoveryAttempts,
    safetyReviewRequired,
    remainingGaps,
  } = evidence;

  if (safetyReviewRequired || founderLoopReport?.verdict === 'SAFETY_REVIEW') {
    return {
      readOnly: true,
      decision: 'REQUEST_HUMAN_REVIEW',
      reasoning: 'Safety-critical real-world action requested without safe isolation.',
      finalOutcome: 'SAFETY_REVIEW_REQUIRED',
    };
  }

  if (founderLoopReport?.verdict === 'HUMAN_REVIEW') {
    return {
      readOnly: true,
      decision: 'REQUEST_HUMAN_REVIEW',
      reasoning: 'Founder simulation requires human review for unsafe integration.',
      finalOutcome: 'HUMAN_REVIEW_REQUIRED',
    };
  }

  const allPass =
    npmBuildOk &&
    npmInstallOk &&
    productRealityReport.productRealityScore >= AEL_PRODUCT_REALITY_PASS_THRESHOLD &&
    !productRealityReport.genericFallbackDetected &&
    productRealityReport.launchReadinessBlockers.length === 0 &&
    (founderLoopReport?.verdict === 'LAUNCH_READY' || founderLoopReport === null);

  if (allPass) {
    const outcome: AelFinalOutcome = previewOk
      ? 'LAUNCH_READY'
      : previewDegraded
        ? 'BUILD_READY_WITH_DEGRADED_PREVIEW'
        : productRealityReport.missingCapabilities.length > 0
          ? 'BUILD_READY_WITH_FEATURE_GAPS'
          : 'LAUNCH_READY';
    return {
      readOnly: true,
      decision: 'DECLARE_LAUNCH_READY',
      reasoning: 'Product reality, founder simulation, and build spine pass.',
      finalOutcome: outcome,
    };
  }

  if (!npmBuildOk && autofixAttempts < AEL_MAX_AUTOFIX_ATTEMPTS) {
    return {
      readOnly: true,
      decision: 'RUN_AUTOFIX',
      reasoning: 'npm build failed and AutoFix budget remains.',
      finalOutcome: null,
    };
  }

  if (
    productRealityReport.missingCapabilities.length > 0 &&
    capabilityEvolutionAttempts < AEL_MAX_CAPABILITY_EVOLUTION_ATTEMPTS &&
    !safetyReviewRequired
  ) {
    return {
      readOnly: true,
      decision: 'RUN_CAPABILITY_EVOLUTION',
      reasoning: 'Product capability missing and safe to generate via CER.',
      finalOutcome: null,
    };
  }

  if (
    (previewDegraded || !previewOk) &&
    npmBuildOk &&
    previewRecoveryAttempts < AEL_MAX_PREVIEW_RECOVERY_ATTEMPTS
  ) {
    return {
      readOnly: true,
      decision: 'RUN_PREVIEW_RECOVERY',
      reasoning: 'Preview degraded and recovery budget remains.',
      finalOutcome: null,
    };
  }

  if (
    productRealityReport.productRealityScore < AEL_PRODUCT_REALITY_PASS_THRESHOLD &&
    cycle < AEL_MAX_FOUNDER_LOOP_CYCLES &&
    capabilityEvolutionAttempts < AEL_MAX_CAPABILITY_EVOLUTION_ATTEMPTS
  ) {
    return {
      readOnly: true,
      decision: 'CONTINUE_LOOP',
      reasoning: 'Product reality below threshold but repairable within budget.',
      finalOutcome: null,
    };
  }

  const budgetsExhausted =
    autofixAttempts >= AEL_MAX_AUTOFIX_ATTEMPTS ||
    capabilityEvolutionAttempts >= AEL_MAX_CAPABILITY_EVOLUTION_ATTEMPTS ||
    previewRecoveryAttempts >= AEL_MAX_PREVIEW_RECOVERY_ATTEMPTS ||
    cycle >= AEL_MAX_FOUNDER_LOOP_CYCLES;

  if (budgetsExhausted) {
    let outcome: AelFinalOutcome = 'ENGINEERING_LIMIT_REACHED';
    if (npmBuildOk && previewDegraded) outcome = 'BUILD_READY_WITH_DEGRADED_PREVIEW';
    else if (npmBuildOk && productRealityReport.missingCapabilities.length > 0) {
      outcome = 'BUILD_READY_WITH_FEATURE_GAPS';
    }
    if (remainingGaps.some((g) => /beyond current|blocked/i.test(g))) {
      outcome = 'CAPABILITY_BEYOND_CURRENT_SYSTEM';
    }
    return {
      readOnly: true,
      decision: 'STOP_AT_ENGINEERING_LIMIT',
      reasoning: `Bounded engineering limit reached after ${cycle} cycle(s). Remaining: ${remainingGaps.slice(0, 3).join('; ')}`,
      finalOutcome: outcome,
    };
  }

  return {
    readOnly: true,
    decision: 'CONTINUE_LOOP',
    reasoning: 'Continuing autonomous engineering loop.',
    finalOutcome: null,
  };
}
