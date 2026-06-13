/**
 * Feedback learning analyzer — user feedback and support response from observed evidence.
 */

import { blockedByNonLearningSignals, hasValidObservedEvidence } from './evidence-validation.js';
import type { FeedbackLearningAnalysis, FeedbackLearningEvidence } from './product-evolution-reality-types.js';

export function analyzeFeedbackLearning(input: {
  evidence: FeedbackLearningEvidence | null;
  productLaunched: boolean;
  featureAdditionsOnly?: boolean;
  roadmapOnly?: boolean;
  rejectFabricated?: boolean;
}): FeedbackLearningAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByNonLearningSignals(input)) {
    const reason = input.featureAdditionsOnly
      ? 'Feature additions alone are not evolution evidence'
      : 'Roadmap updates alone are not evolution evidence';
    missingEvidence.push(reason);
    riskSignals.push(`${reason} — feedback-driven learning required`);
    return {
      readOnly: true,
      userFeedbackProcessed: false,
      featureRequestResponse: false,
      supportSignalResponse: false,
      customerPainResolution: false,
      feedbackLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.productLaunched) {
    missingEvidence.push('Product not launched — post-launch feedback learning not applicable');
    return {
      readOnly: true,
      userFeedbackProcessed: false,
      featureRequestResponse: false,
      supportSignalResponse: false,
      customerPainResolution: false,
      feedbackLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No user feedback or support learning report observed');
    return {
      readOnly: true,
      userFeedbackProcessed: false,
      featureRequestResponse: false,
      supportSignalResponse: false,
      customerPainResolution: false,
      feedbackLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Feedback learning metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated customer feedback rejected');
    return {
      readOnly: true,
      userFeedbackProcessed: false,
      featureRequestResponse: false,
      supportSignalResponse: false,
      customerPainResolution: false,
      feedbackLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  let feedbackLearningScore = 0;
  if (input.evidence.userFeedbackProcessedObserved) feedbackLearningScore += 30;
  if (input.evidence.featureRequestResponseObserved) feedbackLearningScore += 25;
  if (input.evidence.supportSignalResponseObserved) feedbackLearningScore += 25;
  if (input.evidence.customerPainResolutionObserved) feedbackLearningScore += 20;

  let confidence: FeedbackLearningAnalysis['confidence'] = 'LOW';
  if (input.evidence.userFeedbackProcessedObserved && input.evidence.supportSignalResponseObserved) {
    confidence = 'MEDIUM';
  }
  if (
    input.evidence.customerPainResolutionObserved &&
    input.evidence.featureRequestResponseObserved
  ) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    userFeedbackProcessed: input.evidence.userFeedbackProcessedObserved,
    featureRequestResponse: input.evidence.featureRequestResponseObserved,
    supportSignalResponse: input.evidence.supportSignalResponseObserved,
    customerPainResolution: input.evidence.customerPainResolutionObserved,
    feedbackLearningScore: Math.min(100, feedbackLearningScore),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
