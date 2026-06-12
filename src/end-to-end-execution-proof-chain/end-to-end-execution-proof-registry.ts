/**
 * End-to-End Execution Proof Chain — constants and registry.
 */

import type { EndToEndProofState } from './end-to-end-execution-proof-types.js';

export const END_TO_END_EXECUTION_PROOF_CHAIN_PASS_TOKEN = 'END_TO_END_EXECUTION_PROOF_CHAIN_PASS';
export const END_TO_END_EXECUTION_PROOF_OWNER_MODULE = 'devpulse_end_to_end_execution_proof_chain';
export const END_TO_END_EXECUTION_PROOF_PHASE = 'Phase 25.24 — End-to-End Execution Proof Chain';
export const END_TO_END_EXECUTION_PROOF_REPORT_TITLE = 'END_TO_END_EXECUTION_PROOF_CHAIN_REPORT';
export const END_TO_END_EXECUTION_PROOF_CACHE_KEY_PREFIX = 'end-to-end-execution-proof-chain-v1';
export const MAX_END_TO_END_EXECUTION_PROOF_HISTORY = 16;
export const MAX_CHAIN_GAPS = 12;
export const MAX_PROOF_ARTIFACTS = 32;
export const MAX_RECOMMENDED_ACTIONS = 12;
export const MAX_CONFIDENCE_FACTORS = 12;

export const END_TO_END_EXECUTION_PROOF_CORE_QUESTION =
  'Can AiDevEngine prove the complete chain from build output through verification readiness?';

export const PROOF_STATES: readonly EndToEndProofState[] = [
  'END_TO_END_PROVEN',
  'END_TO_END_PARTIALLY_PROVEN',
  'END_TO_END_NOT_PROVEN',
  'END_TO_END_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'connected-build-execution-foundation',
  'connected-runtime-activation-foundation',
  'connected-live-preview-foundation',
  'connected-verification-foundation',
  'execution-proof-evolution',
  'founder-test-launch-readiness',
  'founder-acceptance-gate',
  'launch-council',
] as const;

export const ORCHESTRATION_FLOW = [
  'Connected Build Execution',
  'Connected Runtime Activation',
  'Connected Live Preview',
  'Connected Verification',
  'End-to-End Execution Proof Assessment',
] as const;

export const END_TO_END_PROOF_SAFETY_GUARANTEES = [
  'Read-only orchestration only',
  'No execution',
  'No runtime launch',
  'No browser launch',
  'No verification execution',
  'No deployment',
  'No file mutation',
  'realExecutionPerformed always false',
] as const;

export function isEndToEndProofState(value: string): value is EndToEndProofState {
  return (PROOF_STATES as readonly string[]).includes(value);
}
