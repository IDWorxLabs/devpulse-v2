/**
 * Market Expansion Reality Authority — constants and registry.
 */

import type { MarketExpansionState } from './market-expansion-reality-types.js';

export const MARKET_EXPANSION_REALITY_AUTHORITY_PASS_TOKEN = 'MARKET_EXPANSION_REALITY_AUTHORITY_PASS';
export const MARKET_EXPANSION_REALITY_AUTHORITY_OWNER_MODULE = 'devpulse_market_expansion_reality_authority';
export const MARKET_EXPANSION_REALITY_AUTHORITY_PHASE = 'Phase 26.21 — Market Expansion Reality Authority';
export const MARKET_EXPANSION_REALITY_AUTHORITY_REPORT_TITLE = 'MARKET_EXPANSION_REALITY_AUTHORITY_REPORT';
export const MARKET_EXPANSION_REALITY_AUTHORITY_CACHE_KEY_PREFIX = 'market-expansion-reality-authority-v1';
export const MAX_MARKET_EXPANSION_REALITY_HISTORY = 16;

export const MARKET_EXPANSION_REALITY_CORE_QUESTION =
  'Can the product expand without breaking product-market fit?';

export const EVIDENCE_SOURCES = [
  'adoption-reports',
  'revenue-reports',
  'customer-feedback',
  'retention-reports',
  'support-reports',
  'regional-usage-reports',
  'customer-segment-reports',
  'product-market-fit-reports',
  'growth-reports',
  'lifecycle-reports',
  'scale-readiness-reports',
] as const;

export const UPSTREAM_AUTHORITIES = [
  'scale-readiness-reality-authority',
  'product-lifecycle-reality-orchestrator',
  'product-evolution-reality-authority',
  'revenue-reality-authority',
  'adoption-reality-authority',
  'post-launch-reality-authority',
  'customer-analytics-authorities',
  'growth-authorities',
  'retention-authorities',
] as const;

export const ORCHESTRATION_FLOW = [
  'Resolve scale readiness and upstream lifecycle authorities',
  'Analyze segment, industry, regional, channel, and PMF resilience evidence',
  'Assess expansion risks across market dimensions',
  'Apply evidence-only market expansion verdict rules',
  'Generate market expansion reality report',
] as const;

export const SAFETY_GUARANTEES = [
  'Advisory only — evaluates expansion readiness; does not perform expansion',
  'No expansion execution, market entry, pricing changes, or marketing launches',
  'No synthetic markets, estimated customers, or fabricated expansion evidence',
  'Revenue, scale readiness, adoption, growth, and funding alone are not expansion readiness',
  'Absence of evidence remains absence of evidence',
] as const;

export const FABRICATED_EVIDENCE_SOURCES = ['SYNTHETIC', 'INFERRED', 'ESTIMATED', 'FABRICATED'] as const;

export const STATE_ORDER: readonly MarketExpansionState[] = [
  'NOT_READY',
  'LOCAL_SUCCESS',
  'SEGMENT_READY',
  'MULTI_MARKET_READY',
  'EXPANSION_RESILIENT',
] as const;

export const LOCAL_SUCCESS_THRESHOLD = 25;
export const SEGMENT_READY_THRESHOLD = 45;
export const MULTI_MARKET_READY_THRESHOLD = 70;
export const EXPANSION_RESILIENT_THRESHOLD = 88;
export const MIN_READY_DIMENSIONS_FOR_MULTI_MARKET = 3;
