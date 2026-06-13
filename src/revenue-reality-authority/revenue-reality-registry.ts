/**
 * Revenue Reality Authority — constants and registry.
 */

import type { RevenueRealityState } from './revenue-reality-types.js';

export const REVENUE_REALITY_AUTHORITY_PASS_TOKEN = 'REVENUE_REALITY_AUTHORITY_PASS';
export const REVENUE_REALITY_AUTHORITY_OWNER_MODULE = 'devpulse_revenue_reality_authority';
export const REVENUE_REALITY_AUTHORITY_PHASE = 'Phase 26.17 — Revenue Reality Authority';
export const REVENUE_REALITY_AUTHORITY_REPORT_TITLE = 'REVENUE_REALITY_AUTHORITY_REPORT';
export const REVENUE_REALITY_AUTHORITY_CACHE_KEY_PREFIX = 'revenue-reality-authority-v1';
export const MAX_REVENUE_REALITY_HISTORY = 16;

export const REVENUE_REALITY_CORE_QUESTION = 'Is this product creating measurable business value?';

export const EVIDENCE_SOURCES = [
  'payment-reports',
  'billing-reports',
  'subscription-reports',
  'purchase-reports',
  'invoices',
  'accounting-exports',
  'transaction-summaries',
  'customer-contract-reports',
  'revenue-dashboards',
  'business-metric-reports',
] as const;

export const UPSTREAM_AUTHORITIES = [
  'adoption-reality-authority',
  'post-launch-reality-authority',
  'founder-launch-decision-authority',
  'analytics-authorities',
  'billing-authorities',
  'subscription-authorities',
  'accounting-authorities',
  'business-dashboard-authorities',
] as const;

export const ORCHESTRATION_FLOW = [
  'Resolve adoption and post-launch reality from upstream authorities',
  'Analyze revenue, customer value, conversion, and stability evidence',
  'Assess business risk and revenue fragility',
  'Apply evidence-only revenue verdict rules',
  'Generate revenue reality report',
] as const;

export const SAFETY_GUARANTEES = [
  'Advisory only — no billing, payment processing, or revenue creation',
  'No synthetic revenue, estimated revenue, or invented customers',
  'Users, adoption, traffic, and signups are not revenue evidence',
  'Absence of evidence remains absence of evidence',
  'Claims and intent are not economic value',
] as const;

export const FABRICATED_EVIDENCE_SOURCES = ['SYNTHETIC', 'INFERRED', 'ESTIMATED', 'FABRICATED'] as const;

export const STATE_ORDER: readonly RevenueRealityState[] = [
  'NO_REVENUE',
  'EARLY_REVENUE',
  'REPEAT_REVENUE',
  'SUSTAINABLE_REVENUE',
  'BUSINESS_ENGINE',
] as const;

export const EARLY_REVENUE_THRESHOLD = 25;
export const REPEAT_REVENUE_THRESHOLD = 50;
export const SUSTAINABLE_REVENUE_THRESHOLD = 75;
export const BUSINESS_ENGINE_THRESHOLD = 90;
