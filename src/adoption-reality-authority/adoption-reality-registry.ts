/**
 * Adoption Reality Authority — constants and registry.
 */

import type { AdoptionRealityState } from './adoption-reality-types.js';

export const ADOPTION_REALITY_AUTHORITY_PASS_TOKEN = 'ADOPTION_REALITY_AUTHORITY_PASS';
export const ADOPTION_REALITY_AUTHORITY_OWNER_MODULE = 'devpulse_adoption_reality_authority';
export const ADOPTION_REALITY_AUTHORITY_PHASE = 'Phase 26.16 — Adoption Reality Authority';
export const ADOPTION_REALITY_AUTHORITY_REPORT_TITLE = 'ADOPTION_REALITY_AUTHORITY_REPORT';
export const ADOPTION_REALITY_AUTHORITY_CACHE_KEY_PREFIX = 'adoption-reality-authority-v1';
export const MAX_ADOPTION_REALITY_HISTORY = 16;

export const ADOPTION_REALITY_CORE_QUESTION = 'Are users integrating this product into real behavior?';

export const EVIDENCE_SOURCES = [
  'repeat-session-reports',
  'retention-reports',
  'usage-analytics',
  'workflow-reports',
  'feature-usage-reports',
  'active-user-reports',
  'engagement-reports',
  'customer-feedback',
  'support-interactions',
  'user-behavior-metrics',
  'operational-telemetry',
] as const;

export const UPSTREAM_AUTHORITIES = [
  'post-launch-reality-authority',
  'founder-launch-decision-authority',
  'runtime-telemetry',
  'analytics-authorities',
  'retention-authorities',
  'product-usage-authorities',
  'customer-feedback-authorities',
] as const;

export const ORCHESTRATION_FLOW = [
  'Resolve post-launch reality from upstream authorities',
  'Analyze repeat usage, behavioral integration, feature adoption, and dependency',
  'Assess adoption risk and fragility',
  'Apply evidence-only adoption verdict rules',
  'Generate adoption reality report',
] as const;

export const SAFETY_GUARANTEES = [
  'Advisory only — no execution, deployment, or user simulation',
  'No synthetic adoption, estimated users, or inferred dependency',
  'Traffic, signups, and one-time usage are not adoption',
  'Absence of evidence remains absence of evidence',
  'Claims and launch readiness are not adoption evidence',
] as const;

export const FABRICATED_EVIDENCE_SOURCES = ['SYNTHETIC', 'INFERRED', 'ESTIMATED', 'FABRICATED'] as const;

export const STATE_ORDER: readonly AdoptionRealityState[] = [
  'NO_ADOPTION',
  'EARLY_ADOPTION',
  'EMERGING_ADOPTION',
  'ESTABLISHED_ADOPTION',
  'CRITICAL_DEPENDENCY',
] as const;

export const EARLY_ADOPTION_THRESHOLD = 25;
export const EMERGING_ADOPTION_THRESHOLD = 50;
export const ESTABLISHED_ADOPTION_THRESHOLD = 75;
export const CRITICAL_DEPENDENCY_THRESHOLD = 90;
