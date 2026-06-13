/**
 * Customer support scalability analyzer — support capacity and customer success readiness.
 */

import { blockedByUpstreamOnlySignals, hasValidObservedEvidence } from './evidence-validation.js';
import type {
  CustomerSupportScalabilityAnalysis,
  CustomerSupportScalabilityEvidence,
} from './scale-readiness-types.js';

export function analyzeCustomerSupportScalability(input: {
  evidence: CustomerSupportScalabilityEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  infrastructureOnly?: boolean;
  rejectFabricated?: boolean;
}): CustomerSupportScalabilityAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByUpstreamOnlySignals(input)) {
    missingEvidence.push('Upstream metrics alone are not support scale readiness');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!input.productLaunched) {
    missingEvidence.push('Product not launched — support scalability not yet applicable');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No customer support scalability report observed');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Support scalability metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated support readiness rejected');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.supportCapacityObserved) score += 30;
  if (input.evidence.supportResponseSignalsObserved) score += 25;
  if (input.evidence.customerSuccessReadinessObserved) score += 25;
  if (input.evidence.supportBottlenecksAssessed) score += 20;

  let confidence: CustomerSupportScalabilityAnalysis['confidence'] = 'LOW';
  if (input.evidence.supportCapacityObserved && input.evidence.supportResponseSignalsObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.customerSuccessReadinessObserved && input.evidence.supportBottlenecksAssessed) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    supportCapacity: input.evidence.supportCapacityObserved,
    supportResponseSignals: input.evidence.supportResponseSignalsObserved,
    customerSuccessReadiness: input.evidence.customerSuccessReadinessObserved,
    supportBottlenecks: input.evidence.supportBottlenecksAssessed,
    supportScalabilityScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}

function emptyAnalysis(
  missingEvidence: string[],
  riskSignals: string[],
): CustomerSupportScalabilityAnalysis {
  return {
    readOnly: true,
    supportCapacity: false,
    supportResponseSignals: false,
    customerSuccessReadiness: false,
    supportBottlenecks: false,
    supportScalabilityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}
