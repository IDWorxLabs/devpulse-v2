/**
 * Revenue evidence analyzer — transactions and recurring revenue from observed reports.
 */

import { blockedByNonRevenueSignals, hasValidObservedEvidence } from './evidence-validation.js';
import type { RevenueEvidence, RevenueEvidenceAnalysis } from './revenue-reality-types.js';

export function analyzeRevenueEvidence(input: {
  evidence: RevenueEvidence | null;
  adoptionObserved: boolean;
  usersOnly?: boolean;
  adoptionOnly?: boolean;
  rejectFabricated?: boolean;
}): RevenueEvidenceAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByNonRevenueSignals(input)) {
    const reason = input.usersOnly
      ? 'Users alone are not revenue evidence'
      : 'Adoption alone is not revenue evidence';
    missingEvidence.push(reason);
    riskSignals.push(`${reason} — payment or transaction evidence required`);
    return {
      readOnly: true,
      revenueObserved: false,
      transactionEvidence: false,
      recurringRevenue: false,
      revenueGrowth: false,
      revenueAmountCents: null,
      recurringRevenueAmountCents: null,
      trend: 'UNKNOWN',
      revenueConfidence: 'UNKNOWN',
      revenueScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No payment, billing, or transaction report observed');
    return {
      readOnly: true,
      revenueObserved: false,
      transactionEvidence: false,
      recurringRevenue: false,
      revenueGrowth: false,
      revenueAmountCents: null,
      recurringRevenueAmountCents: null,
      trend: 'UNKNOWN',
      revenueConfidence: 'UNKNOWN',
      revenueScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Revenue metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated or unverifiable revenue metrics rejected');
    return {
      readOnly: true,
      revenueObserved: false,
      transactionEvidence: false,
      recurringRevenue: false,
      revenueGrowth: false,
      revenueAmountCents: null,
      recurringRevenueAmountCents: null,
      trend: 'UNKNOWN',
      revenueConfidence: 'UNKNOWN',
      revenueScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  const revenueObserved =
    input.evidence.revenueObserved &&
    input.evidence.transactionEvidenceObserved &&
    (input.evidence.revenueAmountCents ?? 0) > 0;

  let revenueScore = 0;
  if (revenueObserved) revenueScore += 35;
  if (input.evidence.recurringRevenueObserved) revenueScore += 25;
  if (input.evidence.revenueGrowthObserved) revenueScore += 15;
  if (input.evidence.trend === 'UP') revenueScore += 10;
  if ((input.evidence.recurringRevenueAmountCents ?? 0) > 0) revenueScore += 15;

  if (!input.adoptionObserved && revenueObserved) {
    riskSignals.push('Revenue reported without adoption evidence — verify value exchange');
  }

  let revenueConfidence: RevenueEvidenceAnalysis['revenueConfidence'] = 'LOW';
  if (revenueObserved && input.evidence.evidencePaths.length >= 1) revenueConfidence = 'MEDIUM';
  if (revenueObserved && input.evidence.recurringRevenueObserved && input.evidence.evidencePaths.length >= 2) {
    revenueConfidence = 'HIGH';
  }

  return {
    readOnly: true,
    revenueObserved,
    transactionEvidence: input.evidence.transactionEvidenceObserved,
    recurringRevenue: input.evidence.recurringRevenueObserved,
    revenueGrowth: input.evidence.revenueGrowthObserved,
    revenueAmountCents: input.evidence.revenueAmountCents,
    recurringRevenueAmountCents: input.evidence.recurringRevenueAmountCents,
    trend: input.evidence.trend,
    revenueConfidence,
    revenueScore: Math.min(100, revenueScore),
    missingEvidence,
    riskSignals,
  };
}
