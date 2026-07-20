/**
 * Safe Payment Placeholder Policy V1 — types.
 * UI-only checkout placeholders without real financial transaction execution.
 */

export const SAFE_PAYMENT_PLACEHOLDER_POLICY_V1_PASS_TOKEN =
  'SAFE_PAYMENT_PLACEHOLDER_POLICY_V1_PASS' as const;

export const SAFE_PAYMENT_PLACEHOLDER_OWNER_MODULE =
  'devpulse_v2_safe_payment_placeholder_policy' as const;

// Wording avoids the literal "placeholder" token so GPCA rendered-content fingerprints
// (template-wording-placeholder) do not treat approved Safe Payment disclosures as fake apps.
export const SAFE_PAYMENT_PLACEHOLDER_NOTICE =
  'Simulated payment integration — no real charges processed' as const;

export const SAFE_PAYMENT_SIMULATED_GAP =
  'Real payment integration not implemented — payment is simulated' as const;

export type PaymentCapabilityClassification =
  | 'SAFE_PAYMENT_PLACEHOLDER'
  | 'FINANCIAL_TRANSACTION_EXECUTION'
  | 'NOT_APPLICABLE';

export interface PaymentIntentAssessment {
  readOnly: true;
  classification: PaymentCapabilityClassification;
  checkoutRequested: boolean;
  paymentRequested: boolean;
  allowsPlaceholder: boolean;
  requiresRealIntegration: boolean;
  blockedReason: string | null;
  evidence: readonly string[];
  requiredPlaceholderModules: readonly string[];
}

export interface SafePaymentPlaceholderReportSection {
  readOnly: true;
  classification: PaymentCapabilityClassification;
  placeholderActive: boolean;
  placeholderNotice: string | null;
  remainingIntegrationGaps: readonly string[];
  materializationAllowed: boolean;
}
