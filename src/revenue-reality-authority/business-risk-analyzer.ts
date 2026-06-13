/**
 * Business risk analyzer — churn, fragility, and sustainability risks.
 */

import type {
  BusinessRiskAnalysis,
  ConversionAnalysis,
  CustomerValueAnalysis,
  RevenueEvidenceAnalysis,
  RevenueStabilityAnalysis,
} from './revenue-reality-types.js';

export function analyzeBusinessRisk(input: {
  revenue: RevenueEvidenceAnalysis;
  customerValue: CustomerValueAnalysis;
  conversion: ConversionAnalysis;
  revenueStability: RevenueStabilityAnalysis;
  adoptionObserved: boolean;
  usersOnly?: boolean;
  adoptionOnly?: boolean;
}): BusinessRiskAnalysis {
  const riskSignals: string[] = [];
  let businessRiskScore = 0;

  if (input.usersOnly) {
    businessRiskScore += 40;
    riskSignals.push('Users-only signal — no economic value exchange observed');
  }

  if (input.adoptionOnly) {
    businessRiskScore += 35;
    riskSignals.push('Adoption-only signal — commercial value not proven');
  }

  if (!input.revenue.revenueObserved) {
    businessRiskScore += 30;
    riskSignals.push('No revenue evidence — business sustainability unknown');
  }

  if (!input.customerValue.payingCustomers) {
    businessRiskScore += 20;
    riskSignals.push('No paying customers observed — revenue fragility elevated');
  }

  if (!input.revenue.recurringRevenue) {
    businessRiskScore += 15;
    riskSignals.push('No recurring revenue — sustainability risk');
  }

  if (input.revenueStability.revenueConcentrationRisk) {
    businessRiskScore += 20;
    riskSignals.push('Single-customer or concentration risk detected');
  }

  if (!input.adoptionObserved && input.revenue.revenueObserved) {
    businessRiskScore += 10;
    riskSignals.push('Revenue without adoption backing — dependency risk');
  }

  if (!input.customerValue.customerRetention) {
    businessRiskScore += 10;
    riskSignals.push('Customer churn risk — retention not proven');
  }

  if (!input.conversion.purchaseCompletion) {
    businessRiskScore += 8;
    riskSignals.push('Purchase completion not evidenced — conversion fragility');
  }

  businessRiskScore = Math.min(100, Math.max(0, businessRiskScore));

  return {
    readOnly: true,
    customerChurnRisk: !input.customerValue.customerRetention,
    revenueFragility: !input.revenue.recurringRevenue || input.revenueStability.revenueConcentrationRisk,
    dependencyRisk: !input.adoptionObserved && input.revenue.revenueObserved,
    singleCustomerRisk: input.revenueStability.revenueConcentrationRisk,
    revenueSustainabilityRisk: businessRiskScore >= 50,
    businessRiskScore,
    riskSignals: [...new Set(riskSignals)].slice(0, 10),
  };
}
