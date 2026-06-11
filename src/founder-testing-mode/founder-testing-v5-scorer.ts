/**
 * Founder Testing V5 — launch recommendation from V4 verdict and readiness.
 */

import type { CustomerJourneySimulationAssessment } from '../customer-journey-simulation/customer-journey-simulation-types.js';
import type { PromiseRealityEngineAssessment } from '../promise-reality-engine/promise-reality-engine-types.js';
import type { VisualQualityAuthorityAssessment } from '../visual-quality-authority/visual-quality-authority-types.js';
import type { LaunchDaySimulationAssessment } from '../launch-day-simulation-engine/launch-day-simulation-engine-types.js';
import type { AdoptionPredictionAssessment } from '../adoption-prediction-engine/adoption-prediction-engine-types.js';
import type { FounderTestV4Verdict } from './founder-testing-v4-types.js';
import type { FounderLaunchRecommendation } from './founder-testing-v5-types.js';

export function deriveLaunchRecommendation(
  v4Verdict: FounderTestV4Verdict,
  launchReadinessScore: number,
  customerJourney?: Pick<
    CustomerJourneySimulationAssessment,
    'notReadyForCustomers' | 'customerJourneyScore' | 'topAdoptionBlocker'
  >,
  promiseReality?: Pick<
    PromiseRealityEngineAssessment,
    'majorClaimsUnsupported' | 'promiseRealityPass' | 'executionGapScore' | 'contradictedClaims'
  >,
  visualQuality?: Pick<
    VisualQualityAuthorityAssessment,
    'majorVisualRisks' | 'visualQualityPass' | 'notLaunchReadyAppearance' | 'visualQualityScore'
  >,
  launchDay?: Pick<
    LaunchDaySimulationAssessment,
    'majorLaunchRisks' | 'launchDayPass' | 'launchConfidence' | 'topLaunchBlockers'
  >,
  adoption?: Pick<
    AdoptionPredictionAssessment,
    'majorAdoptionRisks' | 'adoptionPredictionPass' | 'adoptionConfidence' | 'adoptionBlockers'
  >,
): FounderLaunchRecommendation {
  if (launchDay?.majorLaunchRisks) {
    return 'NOT_READY_FOR_LAUNCH_DAY';
  }

  if (adoption?.majorAdoptionRisks) {
    return 'NOT_READY_FOR_ADOPTION';
  }

  if (visualQuality?.majorVisualRisks || visualQuality?.notLaunchReadyAppearance) {
    return 'NOT_READY_FOR_VISUAL_QUALITY';
  }

  if (promiseReality?.majorClaimsUnsupported) {
    return 'NOT_READY_FOR_PROMISE_REALITY';
  }

  if (customerJourney?.notReadyForCustomers) {
    return 'NOT_READY_FOR_CUSTOMERS';
  }

  if (v4Verdict === 'READY_FOR_LAUNCH' && launchReadinessScore >= 80) {
    if (launchDay && !launchDay.launchDayPass) {
      return 'NOT_READY_FOR_LAUNCH_DAY';
    }
    if (adoption && !adoption.adoptionPredictionPass) {
      return 'NOT_READY_FOR_ADOPTION';
    }
    if (visualQuality && !visualQuality.visualQualityPass) {
      return 'NOT_READY_FOR_VISUAL_QUALITY';
    }
    if (promiseReality && !promiseReality.promiseRealityPass) {
      return 'NOT_READY_FOR_PROMISE_REALITY';
    }
    if (customerJourney && customerJourney.customerJourneyScore < 55) {
      return 'NOT_READY_FOR_CUSTOMERS';
    }
    return 'LAUNCH_READY';
  }
  if (v4Verdict === 'READY_FOR_PUBLIC_BETA' || launchReadinessScore >= 70) {
    if (customerJourney && customerJourney.customerJourneyScore < 50) {
      return 'NOT_READY_FOR_CUSTOMERS';
    }
    return 'PUBLIC_BETA';
  }
  if (v4Verdict === 'READY_FOR_LIMITED_CUSTOMERS') return 'PRIVATE_ALPHA';
  if (
    v4Verdict === 'READY_FOR_INTERNAL_PRODUCT_USE' ||
    v4Verdict === 'PRODUCT_DIRECTION_VALID' ||
    v4Verdict === 'EXECUTION_GAPS_PRESENT'
  ) {
    return 'INTERNAL_TESTING';
  }
  return 'NOT_READY';
}

export function buildFinalRecommendation(
  recommendation: FounderLaunchRecommendation,
  launchBlockers: string[],
): string {
  const blockerNote =
    launchBlockers.length > 0
      ? ` Address launch blockers first: ${launchBlockers.slice(0, 3).join('; ')}.`
      : '';
  switch (recommendation) {
    case 'LAUNCH_READY':
      return `AiDevEngine is ready for launch evaluation.${blockerNote}`;
    case 'PUBLIC_BETA':
      return `Proceed with public beta when founders can complete core workflows without manual engineering support.${blockerNote}`;
    case 'PRIVATE_ALPHA':
      return `Limit to private alpha with close founder feedback loops before widening access.${blockerNote}`;
    case 'INTERNAL_TESTING':
      return `Continue internal founder testing — product direction is promising but execution or trust gaps remain.${blockerNote}`;
    case 'NOT_READY_FOR_CUSTOMERS':
      return `Not ready for customers — customer journey quality is too weak for adoption despite technical progress.${blockerNote}`;
    case 'NOT_READY_FOR_PROMISE_REALITY':
      return `Not ready for launch — major product claims lack reality proof or are contradicted by evidence.${blockerNote}`;
    case 'NOT_READY_FOR_VISUAL_QUALITY':
      return `Not ready for launch — visual quality and launch appearance do not yet support a strong founder recommendation.${blockerNote}`;
    case 'NOT_READY_FOR_LAUNCH_DAY':
      return `Not ready for launch — launch day simulation detected major operational risks before real users arrive.${blockerNote}`;
    case 'NOT_READY_FOR_ADOPTION':
      return `Not ready for launch — adoption prediction detected major barriers to value, retention, or recommendation.${blockerNote}`;
    default:
      return `Not ready for external users — strengthen foundation, verification evidence, and founder comprehension.${blockerNote}`;
  }
}
