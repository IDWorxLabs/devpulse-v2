/** Monetization readiness — disabled by default. Marker: data-blueprint="monetization" */
export const BLUEPRINT_MONETIZATION_MARKER = 'data-blueprint="monetization"';
export const PLANS = ['free', 'pro', 'enterprise'] as const;
export type PlanId = (typeof PLANS)[number];

export const MONETIZATION_ENABLED = false;

export interface SubscriptionPlaceholder {
  plan: PlanId;
  billingHistory: unknown[];
}

export const DEFAULT_SUBSCRIPTION: SubscriptionPlaceholder = {
  plan: 'free',
  billingHistory: [],
};
