/**
 * Scale Readiness Reality Authority — constants and registry.
 */

import type { ScaleReadinessState } from './scale-readiness-types.js';

export const SCALE_READINESS_REALITY_AUTHORITY_PASS_TOKEN = 'SCALE_READINESS_REALITY_AUTHORITY_PASS';
export const SCALE_READINESS_REALITY_AUTHORITY_OWNER_MODULE = 'devpulse_scale_readiness_reality_authority';
export const SCALE_READINESS_REALITY_AUTHORITY_PHASE = 'Phase 26.20 — Scale Readiness Reality Authority';
export const SCALE_READINESS_REALITY_AUTHORITY_REPORT_TITLE = 'SCALE_READINESS_REALITY_AUTHORITY_REPORT';
export const SCALE_READINESS_REALITY_AUTHORITY_CACHE_KEY_PREFIX = 'scale-readiness-reality-authority-v1';
export const MAX_SCALE_READINESS_REALITY_HISTORY = 16;

export const SCALE_READINESS_REALITY_CORE_QUESTION =
  'If usage, adoption, customers, and revenue increased dramatically tomorrow, would the product remain healthy?';

export const EVIDENCE_SOURCES = [
  'architecture-reports',
  'infrastructure-reports',
  'uptime-reports',
  'reliability-reports',
  'operational-reports',
  'customer-support-reports',
  'financial-reports',
  'growth-reports',
  'staffing-reports',
  'revenue-reports',
  'incident-reports',
  'postmortems',
  'launch-readiness-reports',
  'product-lifecycle-reports',
] as const;

export const UPSTREAM_AUTHORITIES = [
  'product-lifecycle-reality-orchestrator',
  'product-evolution-reality-authority',
  'revenue-reality-authority',
  'adoption-reality-authority',
  'post-launch-reality-authority',
  'founder-launch-decision-authority',
  'reliability-authorities',
  'incident-authorities',
  'infrastructure-authorities',
  'operational-authorities',
] as const;

export const ORCHESTRATION_FLOW = [
  'Resolve product lifecycle and upstream reality authorities',
  'Analyze architecture, operational, team, financial, support, and reliability scalability',
  'Assess scale risks across growth dimensions',
  'Apply evidence-only scale readiness verdict rules',
  'Generate scale readiness reality report',
] as const;

export const SAFETY_GUARANTEES = [
  'Advisory only — evaluates scale readiness; does not perform scaling',
  'No deployment, load generation, traffic simulation, or infrastructure modification',
  'No synthetic load tests, fabricated growth, or estimated infrastructure capacity',
  'Revenue, adoption, users, growth, and funding alone are not scale readiness',
  'Absence of evidence remains absence of evidence',
] as const;

export const FABRICATED_EVIDENCE_SOURCES = ['SYNTHETIC', 'INFERRED', 'ESTIMATED', 'FABRICATED'] as const;

export const STATE_ORDER: readonly ScaleReadinessState[] = [
  'NOT_READY',
  'FRAGILE',
  'PARTIALLY_READY',
  'SCALE_READY',
  'SCALE_RESILIENT',
] as const;

export const FRAGILE_THRESHOLD = 25;
export const PARTIALLY_READY_THRESHOLD = 45;
export const SCALE_READY_THRESHOLD = 70;
export const SCALE_RESILIENT_THRESHOLD = 88;

export const MIN_READY_DIMENSIONS_FOR_SCALE_READY = 4;
