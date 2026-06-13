/**
 * Post-Launch Reality Authority — constants and registry.
 */

import type { PostLaunchRealityState } from './post-launch-reality-types.js';

export const POST_LAUNCH_REALITY_AUTHORITY_PASS_TOKEN = 'POST_LAUNCH_REALITY_AUTHORITY_PASS';
export const POST_LAUNCH_REALITY_AUTHORITY_OWNER_MODULE = 'devpulse_post_launch_reality_authority';
export const POST_LAUNCH_REALITY_AUTHORITY_PHASE = 'Phase 26.15 — Post-Launch Reality Authority';
export const POST_LAUNCH_REALITY_AUTHORITY_REPORT_TITLE = 'POST_LAUNCH_REALITY_AUTHORITY_REPORT';
export const POST_LAUNCH_REALITY_AUTHORITY_CACHE_KEY_PREFIX = 'post-launch-reality-authority-v1';
export const MAX_POST_LAUNCH_REALITY_HISTORY = 16;

export const POST_LAUNCH_REALITY_CORE_QUESTION = 'Did anything actually happen after launch?';

export const EVIDENCE_SOURCES = [
  'analytics-reports',
  'usage-reports',
  'runtime-telemetry',
  'session-counts',
  'active-user-counts',
  'retention-reports',
  'crash-reports',
  'error-reports',
  'uptime-reports',
  'health-reports',
  'support-tickets',
  'customer-feedback',
  'launch-reports',
  'product-metrics',
  'operational-dashboards',
] as const;

export const UPSTREAM_AUTHORITIES = [
  'founder-launch-decision-authority',
  'live-idea-to-launch-execution-runner',
  'connected-runtime-activation-proof',
  'connected-launch-readiness-proof',
  'launch-council',
] as const;

export const ORCHESTRATION_FLOW = [
  'Resolve launch status from upstream proof chain',
  'Analyze traffic, engagement, retention, error, and business evidence',
  'Apply evidence-only post-launch verdict rules',
  'Generate post-launch reality report',
] as const;

export const SAFETY_GUARANTEES = [
  'Advisory only — no deployment, execution, or traffic generation',
  'Absence of evidence remains absence of evidence',
  'No synthetic metrics, estimated users, or inferred revenue',
  'Launch readiness ≠ launched; runtime activation ≠ adoption',
  'Source code, screenshots, and claims are not post-launch evidence',
] as const;

export const FABRICATED_EVIDENCE_SOURCES = ['SYNTHETIC', 'INFERRED', 'ESTIMATED', 'FABRICATED'] as const;

export const STATE_ORDER: readonly PostLaunchRealityState[] = [
  'NOT_LAUNCHED',
  'LAUNCHED_NO_ACTIVITY',
  'EARLY_ACTIVITY',
  'ACTIVE_USAGE',
  'GROWING_PRODUCT',
  'ESTABLISHED_PRODUCT',
] as const;

export const ACTIVE_USAGE_THRESHOLD = 55;
export const GROWING_PRODUCT_THRESHOLD = 70;
export const ESTABLISHED_PRODUCT_THRESHOLD = 85;
