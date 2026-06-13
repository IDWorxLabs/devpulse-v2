/**
 * Connected Live Preview Execution — constants and registry.
 */

import type { PreviewExecutionState } from './connected-live-preview-execution-types.js';

export const CONNECTED_LIVE_PREVIEW_EXECUTION_PASS_TOKEN = 'CONNECTED_LIVE_PREVIEW_EXECUTION_PASS';
export const CONNECTED_LIVE_PREVIEW_EXECUTION_OWNER_MODULE = 'devpulse_connected_live_preview_execution';
export const CONNECTED_LIVE_PREVIEW_EXECUTION_PHASE = 'Phase 25.29 — Connected Live Preview Execution';
export const CONNECTED_LIVE_PREVIEW_EXECUTION_REPORT_TITLE = 'CONNECTED_LIVE_PREVIEW_EXECUTION_REPORT';
export const CONNECTED_LIVE_PREVIEW_EXECUTION_CACHE_KEY_PREFIX = 'connected-live-preview-execution-v1';
export const MAX_CONNECTED_LIVE_PREVIEW_EXECUTION_HISTORY = 16;
export const MAX_PREVIEW_WARNINGS = 12;
export const MAX_PREVIEW_BLOCKERS = 12;
export const MAX_RECOMMENDED_ACTIONS = 12;
export const MAX_PREVIEW_ARTIFACTS = 16;
export const MAX_PREVIEW_EVIDENCE = 32;
export const MAX_PREVIEW_DIAGNOSTICS = 16;
export const DEFAULT_PREVIEW_PORT = 9876;
export const PREVIEW_PROBE_TIMEOUT_MS = 8_000;

export const CONNECTED_LIVE_PREVIEW_EXECUTION_CORE_QUESTION =
  'Can AiDevEngine expose a generated application through a founder-viewable preview?';

export const PREVIEW_EXECUTION_STATES: readonly PreviewExecutionState[] = [
  'PREVIEW_ACTIVATED',
  'PREVIEW_ACTIVATED_WITH_WARNINGS',
  'PREVIEW_ACTIVATION_FAILED',
  'PREVIEW_ACTIVATION_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'connected-runtime-execution',
  'connected-live-preview-foundation',
  'live-preview-reality',
  'execution-verification-loop',
  'founder-acceptance-gate',
  'execution-proof-evolution',
  'connected-workspace-creation',
  'connected-build-execution',
] as const;

export const ORCHESTRATION_FLOW = [
  'Execution Plan',
  'Workspace Created',
  'Build Executed',
  'Runtime Activated',
  'Live Preview Foundation',
  'Real Preview Activation',
  'Preview Evidence',
] as const;

export const PREVIEW_EXECUTION_SAFETY_GUARANTEES = [
  'Bounded execution only — max 1 preview per validation run',
  'Automatic preview and runtime cleanup after validation',
  'No World 1 mutation',
  'No production deployment',
  'No external infrastructure mutation',
  'No verification execution',
  'No customer traffic',
  'Preview endpoints only inside generated builder workspaces root',
] as const;

export function isPreviewExecutionState(value: string): value is PreviewExecutionState {
  return (PREVIEW_EXECUTION_STATES as readonly string[]).includes(value);
}
