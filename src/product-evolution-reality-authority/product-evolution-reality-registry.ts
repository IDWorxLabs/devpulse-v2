/**
 * Product Evolution Reality Authority — constants and registry.
 */

import type { ProductEvolutionState } from './product-evolution-reality-types.js';

export const PRODUCT_EVOLUTION_REALITY_AUTHORITY_PASS_TOKEN =
  'PRODUCT_EVOLUTION_REALITY_AUTHORITY_PASS';
export const PRODUCT_EVOLUTION_REALITY_AUTHORITY_OWNER_MODULE =
  'devpulse_product_evolution_reality_authority';
export const PRODUCT_EVOLUTION_REALITY_AUTHORITY_PHASE =
  'Phase 26.18 — Product Evolution Reality Authority';
export const PRODUCT_EVOLUTION_REALITY_AUTHORITY_REPORT_TITLE =
  'PRODUCT_EVOLUTION_REALITY_AUTHORITY_REPORT';
export const PRODUCT_EVOLUTION_REALITY_AUTHORITY_CACHE_KEY_PREFIX =
  'product-evolution-reality-authority-v1';
export const MAX_PRODUCT_EVOLUTION_REALITY_HISTORY = 16;

export const PRODUCT_EVOLUTION_REALITY_CORE_QUESTION =
  'Is the product learning and improving from reality?';

export const EVIDENCE_SOURCES = [
  'user-feedback-reports',
  'support-reports',
  'issue-trackers',
  'bug-reports',
  'feature-requests',
  'release-notes',
  'changelogs',
  'roadmap-updates',
  'usage-analytics',
  'adoption-reports',
  'revenue-reports',
  'retention-reports',
  'founder-review-reports',
] as const;

export const UPSTREAM_AUTHORITIES = [
  'revenue-reality-authority',
  'adoption-reality-authority',
  'post-launch-reality-authority',
  'founder-launch-decision-authority',
  'issue-tracking-authorities',
  'feedback-authorities',
  'release-authorities',
  'analytics-authorities',
] as const;

export const ORCHESTRATION_FLOW = [
  'Resolve revenue, adoption, and post-launch reality from upstream authorities',
  'Analyze feedback, failure, usage, and revenue learning evidence',
  'Assess improvement velocity and evolution risk',
  'Apply evidence-only evolution verdict rules',
  'Generate product evolution reality report',
] as const;

export const SAFETY_GUARANTEES = [
  'Advisory only — observes evolution; does not perform evolution',
  'No code generation, autonomous modification, or self-editing',
  'No synthetic learning, invented improvements, or fabricated feedback',
  'Changes, updates, feature additions, and roadmaps alone are not evolution',
  'Absence of evidence remains absence of evidence',
] as const;

export const FABRICATED_EVIDENCE_SOURCES = ['SYNTHETIC', 'INFERRED', 'ESTIMATED', 'FABRICATED'] as const;

export const STATE_ORDER: readonly ProductEvolutionState[] = [
  'STATIC_PRODUCT',
  'REACTIVE_PRODUCT',
  'LEARNING_PRODUCT',
  'EVOLVING_PRODUCT',
  'ADAPTIVE_PRODUCT',
] as const;

export const REACTIVE_PRODUCT_THRESHOLD = 25;
export const LEARNING_PRODUCT_THRESHOLD = 45;
export const EVOLVING_PRODUCT_THRESHOLD = 70;
export const ADAPTIVE_PRODUCT_THRESHOLD = 88;
