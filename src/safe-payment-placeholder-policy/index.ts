/**
 * Safe Payment Placeholder Policy V1 — public API.
 */

export {
  SAFE_PAYMENT_PLACEHOLDER_POLICY_V1_PASS_TOKEN,
  SAFE_PAYMENT_PLACEHOLDER_OWNER_MODULE,
  SAFE_PAYMENT_PLACEHOLDER_NOTICE,
  SAFE_PAYMENT_SIMULATED_GAP,
} from './safe-payment-placeholder-types.js';

export type {
  PaymentCapabilityClassification,
  PaymentIntentAssessment,
  SafePaymentPlaceholderReportSection,
} from './safe-payment-placeholder-types.js';

export {
  SAFE_PAYMENT_PLACEHOLDER_CAPABILITY_NAME,
  REAL_PAYMENT_PROCESSING_CAPABILITY_NAME,
  classifyPaymentIntent,
  promptRequestsCheckoutOrPayment,
  promptRequiresRealPaymentIntegration,
  isSafePaymentPlaceholderCapabilityName,
  isRealPaymentProcessingCapabilityName,
  resolvePaymentCapabilityName,
  buildSafePaymentPlaceholderReportSection,
} from './safe-payment-classifier.js';

export {
  isSafePaymentPlaceholderModule,
  buildSafePaymentPlaceholderComponentTsx,
  containsRealPaymentExecutionSource,
} from './safe-payment-module-generator.js';

import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import {
  buildSafePaymentPlaceholderReportSection,
  classifyPaymentIntent,
} from './safe-payment-classifier.js';

export function applySafePaymentPlaceholderPolicyToDefinition(
  definition: ProfileFeatureDefinition,
  rawPrompt: string,
): ProfileFeatureDefinition {
  const assessment = classifyPaymentIntent(rawPrompt);
  if (assessment.classification !== 'SAFE_PAYMENT_PLACEHOLDER') {
    return definition;
  }

  const modules = [...new Set([...definition.featureModules, ...assessment.requiredPlaceholderModules])];
  const routes = modules.map((moduleId) => (moduleId === 'auth' ? '/' : `/${moduleId}`));

  return {
    ...definition,
    featureModules: modules,
    routes,
    safePaymentPlaceholderActive: true,
    paymentCapabilityClassification: 'SAFE_PAYMENT_PLACEHOLDER',
  };
}

export function getDevPulseV2SafePaymentPlaceholderPolicy(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_safe_payment_placeholder_policy',
    passToken: 'SAFE_PAYMENT_PLACEHOLDER_POLICY_V1_PASS',
    phase: 13,
  };
}

export function resetSafePaymentPlaceholderPolicyForTests(): void {
  /* stateless module */
}
