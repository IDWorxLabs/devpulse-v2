/**
 * Founder Execution Proof — constants and registry.
 */

import type { FounderExecutionState, LaunchRecommendationState } from './founder-execution-proof-types.js';

export const FOUNDER_EXECUTION_PROOF_PASS_TOKEN = 'FOUNDER_EXECUTION_PROOF_PASS';
export const FOUNDER_EXECUTION_PROOF_OWNER_MODULE = 'devpulse_founder_execution_proof';
export const FOUNDER_EXECUTION_PROOF_PHASE = 'Phase 25.31 — Founder Execution Proof';
export const FOUNDER_EXECUTION_PROOF_REPORT_TITLE = 'FOUNDER_EXECUTION_PROOF_REPORT';
export const FOUNDER_EXECUTION_PROOF_CACHE_KEY_PREFIX = 'founder-execution-proof-v1';
export const MAX_FOUNDER_EXECUTION_PROOF_HISTORY = 16;
export const MAX_PROOF_WARNINGS = 16;
export const MAX_PROOF_BLOCKERS = 16;
export const MAX_RECOMMENDED_ACTIONS = 12;
export const MAX_PROOF_ARTIFACTS = 32;
export const MAX_TOP_EVIDENCE = 8;
export const MAX_TOP_BLOCKERS = 8;

export const FOUNDER_EXECUTION_PROOF_CORE_QUESTION =
  'Can AiDevEngine prove to a founder that a generated application has successfully completed the entire execution chain?';

export const FOUNDER_EXECUTION_STATES: readonly FounderExecutionState[] = [
  'FOUNDER_EXECUTION_PROVEN',
  'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS',
  'FOUNDER_EXECUTION_NOT_PROVEN',
  'FOUNDER_EXECUTION_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const LAUNCH_RECOMMENDATION_STATES: readonly LaunchRecommendationState[] = [
  'RECOMMEND_LAUNCH',
  'RECOMMEND_LAUNCH_WITH_WARNINGS',
  'DO_NOT_RECOMMEND_LAUNCH',
  'BLOCK_LAUNCH',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'connected-workspace-creation',
  'connected-build-execution',
  'connected-runtime-execution',
  'connected-live-preview-execution',
  'connected-verification-execution',
  'end-to-end-execution-proof-chain',
  'founder-test-execution-chain-integration',
  'founder-acceptance-gate',
  'execution-proof-evolution',
  'launch-council',
  'founder-test-launch-readiness',
] as const;

export const ORCHESTRATION_FLOW = [
  'Execution Plan',
  'Workspace Created',
  'Build Executed',
  'Runtime Activated',
  'Live Preview Activated',
  'Verification Executed',
  'Founder Execution Proof',
  'Launch Readiness Evidence',
] as const;

export const FOUNDER_EXECUTION_PROOF_SAFETY_GUARANTEES = [
  'Read-only aggregation only — no new execution',
  'No deployment',
  'No runtime launch',
  'No preview launch',
  'No verification execution',
  'Consume existing real evidence only',
  'No synthetic scoring or simulated success',
] as const;

export function isFounderExecutionState(value: string): value is FounderExecutionState {
  return (FOUNDER_EXECUTION_STATES as readonly string[]).includes(value);
}

export function isLaunchRecommendationState(value: string): value is LaunchRecommendationState {
  return (LAUNCH_RECOMMENDATION_STATES as readonly string[]).includes(value);
}
