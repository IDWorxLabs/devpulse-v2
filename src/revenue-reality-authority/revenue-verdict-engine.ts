/**
 * Revenue verdict engine — evidence-only revenue state derivation.
 */

import {
  BUSINESS_ENGINE_THRESHOLD,
  EARLY_REVENUE_THRESHOLD,
  REPEAT_REVENUE_THRESHOLD,
  REVENUE_REALITY_CORE_QUESTION,
  SUSTAINABLE_REVENUE_THRESHOLD,
} from './revenue-reality-registry.js';
import type {
  BusinessRiskAnalysis,
  ConversionAnalysis,
  CustomerValueAnalysis,
  RevenueEvidenceAnalysis,
  RevenueRealityState,
  RevenueStabilityAnalysis,
  RevenueVerdict,
} from './revenue-reality-types.js';

export function computeRevenueVerdict(input: {
  revenue: RevenueEvidenceAnalysis;
  customerValue: CustomerValueAnalysis;
  conversion: ConversionAnalysis;
  revenueStability: RevenueStabilityAnalysis;
  businessRisk: BusinessRiskAnalysis;
  overallRevenueScore: number;
  adoptionObserved: boolean;
  rejectFabricated?: boolean;
  usersOnly?: boolean;
  adoptionOnly?: boolean;
}): RevenueVerdict {
  const missingEvidence = [
    ...input.revenue.missingEvidence,
    ...input.customerValue.missingEvidence,
    ...input.conversion.missingEvidence,
    ...input.revenueStability.missingEvidence,
  ].slice(0, 12);

  const riskSignals = [
    ...input.revenue.riskSignals,
    ...input.customerValue.riskSignals,
    ...input.conversion.riskSignals,
    ...input.revenueStability.riskSignals,
    ...input.businessRisk.riskSignals,
  ];

  const revenueObserved =
    input.revenue.revenueObserved &&
    input.revenue.transactionEvidence &&
    (input.revenue.revenueAmountCents ?? 0) > 0;
  const payingCustomersObserved =
    input.customerValue.payingCustomers && (input.customerValue.payingCustomerCount ?? 0) > 0;
  const repeatRevenueObserved =
    input.revenue.recurringRevenue &&
    input.customerValue.repeatCustomers &&
    revenueObserved;

  let revenueRealityState: RevenueRealityState = 'NO_REVENUE';
  const keyFindings: string[] = [];
  const recommendedActions: string[] = [];

  if (input.rejectFabricated || input.usersOnly || input.adoptionOnly) {
    revenueRealityState = 'NO_REVENUE';
    keyFindings.push('Revenue cannot be claimed from users, adoption, or fabricated metrics alone');
    recommendedActions.push('Provide payment, billing, or transaction reports with verifiable evidence paths');
    if (input.rejectFabricated) {
      keyFindings.unshift('Fabricated transactions rejected — evidence-only verdict enforced');
    }
  } else if (!revenueObserved) {
    revenueRealityState = 'NO_REVENUE';
    keyFindings.push('No observed revenue or transaction evidence');
    recommendedActions.push('Connect billing, payment, or accounting reports');
    missingEvidence.push('Payment or transaction evidence');
  } else if (
    input.overallRevenueScore >= BUSINESS_ENGINE_THRESHOLD &&
    repeatRevenueObserved &&
    input.revenueStability.revenuePredictability &&
    payingCustomersObserved
  ) {
    revenueRealityState = 'BUSINESS_ENGINE';
    keyFindings.push('Sustainable recurring revenue with predictable business engine observed');
    recommendedActions.push('Monitor concentration risk and customer retention');
  } else if (
    input.overallRevenueScore >= SUSTAINABLE_REVENUE_THRESHOLD &&
    repeatRevenueObserved &&
    input.revenueStability.revenueConsistency
  ) {
    revenueRealityState = 'SUSTAINABLE_REVENUE';
    keyFindings.push('Sustainable revenue with recurring and consistent patterns');
    recommendedActions.push('Strengthen customer retention and reduce concentration risk');
  } else if (repeatRevenueObserved || input.overallRevenueScore >= REPEAT_REVENUE_THRESHOLD) {
    revenueRealityState = 'REPEAT_REVENUE';
    keyFindings.push('Repeat revenue or returning paying customers observed');
    recommendedActions.push('Track revenue stability and predictability');
  } else if (revenueObserved && input.overallRevenueScore >= EARLY_REVENUE_THRESHOLD) {
    revenueRealityState = 'EARLY_REVENUE';
    keyFindings.push('Early revenue detected — commercial value exchange beginning');
    recommendedActions.push('Monitor repeat purchases and subscription conversion');
  } else if (revenueObserved) {
    revenueRealityState = 'EARLY_REVENUE';
    keyFindings.push('Initial revenue evidence observed');
    recommendedActions.push('Validate paying customers and repeat revenue signals');
  } else {
    revenueRealityState = 'NO_REVENUE';
  }

  const confidenceBase = Math.round(
    input.overallRevenueScore * 0.35 +
      (revenueObserved ? 25 : 0) +
      (payingCustomersObserved ? 20 : 0) +
      (repeatRevenueObserved ? 20 : 0),
  );
  const confidence = Math.min(100, Math.max(0, confidenceBase));

  const finalVerdict =
    `${REVENUE_REALITY_CORE_QUESTION} → ${revenueRealityState}. ` +
    (revenueObserved
      ? `Revenue observed (${input.revenue.revenueAmountCents ?? 0} cents reported).`
      : 'No economic value exchange evidenced — users and adoption alone are insufficient.');

  return {
    readOnly: true,
    revenueRealityState,
    overallRevenueScore: input.overallRevenueScore,
    confidence,
    revenueObserved,
    payingCustomersObserved,
    repeatRevenueObserved,
    riskSignals: [...new Set(riskSignals)].slice(0, 12),
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    keyFindings: [...new Set(keyFindings)].slice(0, 8),
    recommendedActions: [...new Set(recommendedActions)].slice(0, 8),
    finalVerdict,
  };
}
