/**
 * Runtime Banner Truth Reconciliation V1 — types.
 */

import type { BrainHealthPayload } from '../command-center-restart-resilience/restart-resilience-types.js';

export const RUNTIME_BANNER_TRUTH_RECONCILIATION_V1_PASS_TOKEN =
  'RUNTIME_BANNER_TRUTH_RECONCILIATION_V1_PASS' as const;

export const COMMAND_CENTER_RUNTIME_TRUTH_READY_TRACE =
  'COMMAND_CENTER_RUNTIME_TRUTH_READY' as const;

export const RUNTIME_BANNER_DIAGNOSTIC_TRACE = 'RUNTIME_BANNER_TRUTH_DIAGNOSTIC' as const;

/** sessionStorage keys that persist stale runtime UI/errors across reloads */
export const STALE_RUNTIME_SESSION_STORAGE_KEYS = [
  'aidevengine.stale-runtime-error.v1',
] as const;

/** localStorage keys consulted for stale runtime / runtimeId mismatch (runtimeId is updated, not removed on FRESH) */
export const STALE_RUNTIME_LOCAL_STORAGE_KEYS = [
  'aidevengine.runtimeTruth.runtimeId',
] as const;

export const RUNTIME_BANNER_BLOCKED_BODY_CLASS = 'local-runtime-blocked' as const;

export interface RuntimeTruthClientResult {
  ok: boolean;
  stale: boolean;
  freshnessStatus: 'FRESH' | 'STALE' | 'UNKNOWN';
  classifyRouteAvailable: boolean;
  runtimeId: string | null;
  runtimeIdChanged?: boolean;
  staleReasons: string[];
  message: string | null;
}

export interface RuntimeAuthorityClientResult {
  ok: boolean;
  ready: boolean;
  phase: string | null;
  health: string | null;
  bypassed?: boolean;
}

export interface RuntimeBannerReconciliationInput {
  truth: RuntimeTruthClientResult | null;
  healthPayload: BrainHealthPayload | null;
  runtimeAuthority?: RuntimeAuthorityClientResult | null;
  previousLifecycle?: string;
  bannerSourceHint?: string | null;
}

export interface RuntimeBannerReconciliationResult {
  readOnly: true;
  shouldShowBanner: boolean;
  bannerMessage: string | null;
  bannerTone: 'error' | 'neutral' | 'none';
  localRuntimeHealthy: boolean;
  runtimeTruthReady: boolean;
  runtimeTruthClassifyAllowed: boolean;
  lifecycle: 'STARTING' | 'CHECKING_HEALTH' | 'READY' | 'DEGRADED' | 'UNAVAILABLE';
  footerStatus: string;
  bannerSource: string;
  staleReasons: string[];
  runtimeId: string | null;
  truthFresh: boolean;
  healthReady: boolean;
  clearedPersistedStaleState: boolean;
}

export interface PersistedStaleRuntimeState {
  sessionStorage: Record<string, string>;
  localStorage: Record<string, string>;
  bodyBlocked: boolean;
}
