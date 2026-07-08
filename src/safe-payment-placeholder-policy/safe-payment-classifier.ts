/**
 * Safe Payment Placeholder Policy V1 — payment intent classifier.
 */

import type { PaymentCapabilityClassification, PaymentIntentAssessment } from './safe-payment-placeholder-types.js';
import {
  SAFE_PAYMENT_PLACEHOLDER_NOTICE,
  SAFE_PAYMENT_SIMULATED_GAP,
} from './safe-payment-placeholder-types.js';

export const SAFE_PAYMENT_PLACEHOLDER_CAPABILITY_NAME = 'Safe Payment Placeholder' as const;
export const REAL_PAYMENT_PROCESSING_CAPABILITY_NAME = 'Payment Processing' as const;

const CHECKOUT_PAYMENT_PROMPT_PATTERN =
  /\b(checkout|shopping\s+cart|\bcart\b|payment|billing|order\s+history|e[\s-]?commerce|online\s+store)\b/i;

const REAL_TRANSACTION_PATTERNS: Array<{ pattern: RegExp; evidence: string }> = [
  { pattern: /\bcharge\s+(real|actual|live)\b/i, evidence: 'explicit real charge request' },
  { pattern: /\bprocess\s+(real|live|actual)\s+payments?\b/i, evidence: 'process real payments' },
  { pattern: /\b(real|live)\s+(credit\s+card|debit\s+card|payment)\s+(charges?|processing)\b/i, evidence: 'real card charges' },
  { pattern: /\bproduction\s+payment\s+integration\b/i, evidence: 'production payment integration' },
  { pattern: /\b(stripe|paypal|braintree|square|adyen)\s+(live|production)\b/i, evidence: 'live payment provider integration' },
  { pattern: /\b(sk_live|pk_live|rk_live|whsec_live)\b/i, evidence: 'live payment provider credential' },
  { pattern: /\bpayment\s+provider\s+credentials?\b/i, evidence: 'payment provider credentials' },
  { pattern: /\bmerchant\s+account\s+(credentials?|api)\b/i, evidence: 'merchant account credentials' },
  { pattern: /\bauthorize\.net\b.*\b(live|production)\b/i, evidence: 'Authorize.net production integration' },
  { pattern: /\bprocess\s+credit\s+card\s+transactions?\b/i, evidence: 'process credit card transactions' },
  { pattern: /\bwithout\s+provider\s+isolation\b/i, evidence: 'missing provider isolation' },
];

const PLACEHOLDER_EXPLICIT_PATTERN =
  /\b(payment\s+placeholder|placeholder\s+checkout|mock\s+payment|simulated\s+payment|no\s+real\s+charges?)\b/i;

export function promptRequestsCheckoutOrPayment(rawPrompt: string): boolean {
  return CHECKOUT_PAYMENT_PROMPT_PATTERN.test(rawPrompt);
}

export function promptRequiresRealPaymentIntegration(rawPrompt: string): boolean {
  return REAL_TRANSACTION_PATTERNS.some((entry) => entry.pattern.test(rawPrompt));
}

export function isSafePaymentPlaceholderCapabilityName(name: string): boolean {
  return /safe payment placeholder/i.test(name);
}

export function isRealPaymentProcessingCapabilityName(name: string): boolean {
  return /^payment processing$/i.test(name.trim());
}

export function classifyPaymentIntent(rawPrompt: string): PaymentIntentAssessment {
  const checkoutRequested = /\b(checkout|shopping\s+cart|\bcart\b|order\s+review)\b/i.test(rawPrompt);
  const paymentRequested = /\b(payment|billing|pay\s+now)\b/i.test(rawPrompt);
  const commerceContext = /\b(e[\s-]?commerce|online\s+store|storefront)\b/i.test(rawPrompt);

  if (!promptRequestsCheckoutOrPayment(rawPrompt)) {
    return {
      readOnly: true,
      classification: 'NOT_APPLICABLE',
      checkoutRequested: false,
      paymentRequested: false,
      allowsPlaceholder: false,
      requiresRealIntegration: false,
      blockedReason: null,
      evidence: ['No checkout or payment capability requested.'],
      requiredPlaceholderModules: [],
    };
  }

  const realEvidence = REAL_TRANSACTION_PATTERNS.filter((entry) => entry.pattern.test(rawPrompt)).map(
    (entry) => entry.evidence,
  );

  if (realEvidence.length > 0) {
    return {
      readOnly: true,
      classification: 'FINANCIAL_TRANSACTION_EXECUTION',
      checkoutRequested,
      paymentRequested,
      allowsPlaceholder: false,
      requiresRealIntegration: true,
      blockedReason: `Real payment integration required — ${realEvidence.join('; ')}`,
      evidence: realEvidence,
      requiredPlaceholderModules: [],
    };
  }

  const modules: string[] = [];
  if (checkoutRequested || commerceContext || /\bcart\b/i.test(rawPrompt)) modules.push('cart');
  if (/\bcheckout\b/i.test(rawPrompt) || commerceContext) modules.push('checkout');
  if (paymentRequested || /\bcheckout\b/i.test(rawPrompt)) modules.push('payments');
  if (/\border\b/i.test(rawPrompt)) modules.push('orders');

  return {
    readOnly: true,
    classification: 'SAFE_PAYMENT_PLACEHOLDER',
    checkoutRequested,
    paymentRequested,
    allowsPlaceholder: true,
    requiresRealIntegration: false,
    blockedReason: null,
    evidence: PLACEHOLDER_EXPLICIT_PATTERN.test(rawPrompt)
      ? ['Explicit placeholder payment language in prompt', ...realEvidence]
      : ['Checkout/payment requested without real provider credentials or production integration.'],
    requiredPlaceholderModules: [...new Set(modules)],
  };
}

export function resolvePaymentCapabilityName(rawPrompt: string): {
  name: string;
  description: string;
  classification: PaymentCapabilityClassification;
} {
  const assessment = classifyPaymentIntent(rawPrompt);
  if (assessment.classification === 'SAFE_PAYMENT_PLACEHOLDER') {
    return {
      name: SAFE_PAYMENT_PLACEHOLDER_CAPABILITY_NAME,
      description:
        'UI-only checkout flow with order review, placebo payment status, and order confirmation mock — no real charges processed.',
      classification: 'SAFE_PAYMENT_PLACEHOLDER',
    };
  }
  if (assessment.classification === 'FINANCIAL_TRANSACTION_EXECUTION') {
    return {
      name: REAL_PAYMENT_PROCESSING_CAPABILITY_NAME,
      description: 'Real payment processing — requires provider isolation and human review.',
      classification: 'FINANCIAL_TRANSACTION_EXECUTION',
    };
  }
  return {
    name: REAL_PAYMENT_PROCESSING_CAPABILITY_NAME,
    description: 'Real payment processing',
    classification: 'NOT_APPLICABLE',
  };
}

export function buildSafePaymentPlaceholderReportSection(
  rawPrompt: string,
): import('./safe-payment-placeholder-types.js').SafePaymentPlaceholderReportSection {
  const assessment = classifyPaymentIntent(rawPrompt);
  const placeholderActive = assessment.classification === 'SAFE_PAYMENT_PLACEHOLDER';
  return {
    readOnly: true,
    classification: assessment.classification,
    placeholderActive,
    placeholderNotice: placeholderActive ? SAFE_PAYMENT_PLACEHOLDER_NOTICE : null,
    remainingIntegrationGaps: placeholderActive ? [SAFE_PAYMENT_SIMULATED_GAP] : [],
    materializationAllowed: placeholderActive || assessment.classification === 'NOT_APPLICABLE',
  };
}
