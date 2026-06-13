/**
 * Strategic Defensibility Reality Authority — constants and registry.
 */

import type { StrategicDefensibilityState } from './strategic-defensibility-types.js';

export const STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_PASS_TOKEN =
  'STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_PASS';
export const STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_OWNER_MODULE =
  'devpulse_strategic_defensibility_reality_authority';
export const STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_PHASE =
  'Phase 26.22 — Strategic Defensibility Reality Authority';
export const STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_REPORT_TITLE =
  'STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_REPORT';
export const STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_CACHE_KEY_PREFIX =
  'strategic-defensibility-reality-authority-v1';
export const MAX_STRATEGIC_DEFENSIBILITY_REALITY_HISTORY = 16;

export const STRATEGIC_DEFENSIBILITY_REALITY_CORE_QUESTION =
  'If a well-funded competitor appeared tomorrow, how defensible is this product?';

export const EVIDENCE_SOURCES = [
  'adoption-reports',
  'retention-reports',
  'revenue-reports',
  'customer-dependency-reports',
  'market-expansion-reports',
  'product-evolution-reports',
  'customer-feedback',
  'support-reports',
  'usage-reports',
  'growth-reports',
  'operational-reports',
  'founder-reports',
] as const;

export const UPSTREAM_AUTHORITIES = [
  'market-expansion-reality-authority',
  'scale-readiness-reality-authority',
  'product-lifecycle-reality-orchestrator',
  'product-evolution-reality-authority',
  'revenue-reality-authority',
  'adoption-reality-authority',
  'customer-dependency-authorities',
  'growth-authorities',
  'retention-authorities',
] as const;

export const ORCHESTRATION_FLOW = [
  'Resolve market expansion and upstream lifecycle authorities',
  'Analyze network effects, data, switching costs, brand, distribution, and execution advantages',
  'Assess defensibility risks across competitive dimensions',
  'Apply evidence-only strategic defensibility verdict rules',
  'Generate strategic defensibility reality report',
] as const;

export const SAFETY_GUARANTEES = [
  'Advisory only — evaluates strategic position; does not create strategic position',
  'No market actions, pricing actions, strategic changes, or project mutation',
  'No fabricated moats, assumed network effects, or invented brand strength',
  'Revenue, growth, adoption, funding, and brand claims alone are not defensibility',
  'Absence of evidence remains absence of evidence',
] as const;

export const FABRICATED_EVIDENCE_SOURCES = ['SYNTHETIC', 'INFERRED', 'ESTIMATED', 'FABRICATED'] as const;

export const STATE_ORDER: readonly StrategicDefensibilityState[] = [
  'EASILY_REPLACED',
  'WEAKLY_DEFENSIBLE',
  'MODERATELY_DEFENSIBLE',
  'STRONGLY_DEFENSIBLE',
  'CATEGORY_DEFENSIBLE',
] as const;

export const WEAKLY_DEFENSIBLE_THRESHOLD = 25;
export const MODERATELY_DEFENSIBLE_THRESHOLD = 45;
export const STRONGLY_DEFENSIBLE_THRESHOLD = 70;
export const CATEGORY_DEFENSIBLE_THRESHOLD = 88;
export const MIN_MOAT_DIMENSIONS_FOR_STRONGLY_DEFENSIBLE = 3;
