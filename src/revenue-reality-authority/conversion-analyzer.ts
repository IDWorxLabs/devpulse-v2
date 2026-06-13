/**
 * Conversion analyzer — free-to-paid and purchase completion from observed evidence.
 */

import { blockedByNonRevenueSignals, hasValidObservedEvidence } from './evidence-validation.js';
import type { ConversionAnalysis, ConversionEvidence } from './revenue-reality-types.js';

export function analyzeConversion(input: {
  evidence: ConversionEvidence | null;
  revenueObserved: boolean;
  payingCustomersObserved: boolean;
  usersOnly?: boolean;
  adoptionOnly?: boolean;
  rejectFabricated?: boolean;
}): ConversionAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByNonRevenueSignals(input)) {
    missingEvidence.push('Conversion cannot be inferred from users or adoption alone');
    return {
      readOnly: true,
      conversionEvidence: false,
      freeToPaidSignals: false,
      purchaseCompletion: false,
      customerAcquisitionEfficiency: false,
      conversionRatePercent: null,
      conversionScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No conversion or purchase completion report observed');
    return {
      readOnly: true,
      conversionEvidence: false,
      freeToPaidSignals: false,
      purchaseCompletion: false,
      customerAcquisitionEfficiency: false,
      conversionRatePercent: null,
      conversionScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Conversion metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated conversion metrics rejected');
    return {
      readOnly: true,
      conversionEvidence: false,
      freeToPaidSignals: false,
      purchaseCompletion: false,
      customerAcquisitionEfficiency: false,
      conversionRatePercent: null,
      conversionScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.revenueObserved) {
    riskSignals.push('Conversion signals without revenue evidence may reflect intent only');
  }

  let conversionScore = 0;
  if (input.evidence.conversionEvidenceObserved) conversionScore += 30;
  if (input.evidence.freeToPaidSignalsObserved) conversionScore += 25;
  if (input.evidence.purchaseCompletionObserved) conversionScore += 25;
  if (input.evidence.customerAcquisitionEfficiencyObserved) conversionScore += 20;

  const conversionEvidence =
    input.evidence.conversionEvidenceObserved &&
    input.evidence.purchaseCompletionObserved &&
    input.payingCustomersObserved;

  let confidence: ConversionAnalysis['confidence'] = 'LOW';
  if (conversionEvidence) confidence = 'MEDIUM';
  if (conversionEvidence && input.evidence.freeToPaidSignalsObserved) confidence = 'HIGH';

  return {
    readOnly: true,
    conversionEvidence: input.evidence.conversionEvidenceObserved,
    freeToPaidSignals: input.evidence.freeToPaidSignalsObserved,
    purchaseCompletion: input.evidence.purchaseCompletionObserved,
    customerAcquisitionEfficiency: input.evidence.customerAcquisitionEfficiencyObserved,
    conversionRatePercent: input.evidence.conversionRatePercent,
    conversionScore: Math.min(100, conversionScore),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
