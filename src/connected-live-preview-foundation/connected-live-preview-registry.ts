/**
 * Connected Live Preview Foundation — constants and registry.
 */

import type { PreviewState } from './connected-live-preview-types.js';

export const CONNECTED_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN = 'CONNECTED_LIVE_PREVIEW_FOUNDATION_PASS';
export const CONNECTED_LIVE_PREVIEW_OWNER_MODULE = 'devpulse_connected_live_preview_foundation';
export const CONNECTED_LIVE_PREVIEW_PHASE = 'Phase 25.22 — Connected Live Preview Foundation';
export const CONNECTED_LIVE_PREVIEW_REPORT_TITLE = 'CONNECTED_LIVE_PREVIEW_FOUNDATION_REPORT';
export const CONNECTED_LIVE_PREVIEW_CACHE_KEY_PREFIX = 'connected-live-preview-foundation-v1';
export const MAX_CONNECTED_LIVE_PREVIEW_HISTORY = 16;
export const MAX_PREVIEW_ENTRIES = 32;
export const MAX_RECOMMENDED_ACTIONS = 12;
export const MAX_MISSING_COMPONENTS = 12;

export const CONNECTED_LIVE_PREVIEW_CORE_QUESTION =
  'Can AiDevEngine prove that a generated application is capable of becoming founder-viewable?';

export const PREVIEW_STATES: readonly PreviewState[] = [
  'PREVIEW_READY',
  'PREVIEW_READY_WITH_WARNINGS',
  'PREVIEW_NOT_READY',
  'PREVIEW_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'connected-runtime-activation-foundation',
  'connected-build-execution-foundation',
  'live-preview-reality',
  'world2-execution-engine',
  'world2-repository-snapshot-materializer',
  'world2-change-set-materializer',
  'world2-dry-run-execution-composer',
  'world2-dry-run-execution-verifier',
  'execution-package-runtime',
  'execution-verification-loop',
] as const;

export const ORCHESTRATION_FLOW = [
  'Build Output Manifest',
  'Runtime Activation Contract',
  'Preview Candidate',
  'Preview Readiness Contract',
  'Preview Readiness Assessment',
] as const;

export const PREVIEW_READINESS_SAFETY_GUARANTEES = [
  'Read-only orchestration only',
  'No preview launch',
  'No browser startup',
  'No runtime startup',
  'No deployment',
  'No file mutation',
  'No workspace creation',
  'No network access',
  'realPreviewLaunchPerformed always false',
] as const;

export function isPreviewState(value: string): value is PreviewState {
  return (PREVIEW_STATES as readonly string[]).includes(value);
}
