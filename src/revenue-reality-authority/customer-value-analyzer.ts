/**
 * Customer value analyzer — paying customers and value exchange from observed evidence.
 */

import { blockedByNonRevenueSignals, hasValidObservedEvidence } from './evidence-validation.js';
import type { CustomerValueAnalysis, CustomerValueEvidence } from './revenue-reality-types.js';

export function analyzeCustomerValue(input: {
  evidence: CustomerValueEvidence | null;
  revenueObserved: boolean;
  usersOnly?: boolean;
  adoptionOnly?: boolean;
  rejectFabricated?: boolean;
}): CustomerValueAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByNonRevenueSignals(input)) {
    missingEvidence.push('Customer value cannot be inferred from users or adoption alone');
    return {
      readOnly: true,
      payingCustomers: false,
      payingCustomerCount: null,
      repeatCustomers: false,
      repeatCustomerCount: null,
      customerRetention: false,
      customerSatisfaction: false,
      valueExchange: false,
      customerValueScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No paying customer or value exchange report observed');
    return {
      readOnly: true,
      payingCustomers: false,
      payingCustomerCount: null,
      repeatCustomers: false,
      repeatCustomerCount: null,
      customerRetention: false,
      customerSatisfaction: false,
      valueExchange: false,
      customerValueScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Customer value metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated customer metrics rejected — no invented customers');
    return {
      readOnly: true,
      payingCustomers: false,
      payingCustomerCount: null,
      repeatCustomers: false,
      repeatCustomerCount: null,
      customerRetention: false,
      customerSatisfaction: false,
      valueExchange: false,
      customerValueScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.revenueObserved) {
    riskSignals.push('Paying customers reported without observed revenue — confidence reduced');
    missingEvidence.push('Revenue evidence required before paying customers can be trusted');
  }

  let customerValueScore = 0;
  if (input.evidence.payingCustomersObserved) customerValueScore += 30;
  if (input.evidence.repeatCustomersObserved) customerValueScore += 25;
  if (input.evidence.customerRetentionObserved) customerValueScore += 20;
  if (input.evidence.valueExchangeObserved) customerValueScore += 15;
  if (input.evidence.customerSatisfactionObserved) customerValueScore += 10;
  if ((input.evidence.payingCustomerCount ?? 0) >= 3) customerValueScore = Math.min(100, customerValueScore + 10);

  const payingCustomers =
    input.evidence.payingCustomersObserved &&
    (input.evidence.payingCustomerCount ?? 0) > 0 &&
    input.revenueObserved;

  let confidence: CustomerValueAnalysis['confidence'] = 'LOW';
  if (payingCustomers) confidence = 'MEDIUM';
  if (payingCustomers && input.evidence.repeatCustomersObserved && input.evidence.valueExchangeObserved) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    payingCustomers,
    payingCustomerCount: input.evidence.payingCustomerCount,
    repeatCustomers: input.evidence.repeatCustomersObserved,
    repeatCustomerCount: input.evidence.repeatCustomerCount,
    customerRetention: input.evidence.customerRetentionObserved,
    customerSatisfaction: input.evidence.customerSatisfactionObserved,
    valueExchange: input.evidence.valueExchangeObserved,
    customerValueScore: Math.min(100, customerValueScore),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
