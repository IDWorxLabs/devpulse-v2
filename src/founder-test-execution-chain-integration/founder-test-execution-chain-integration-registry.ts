/**
 * Founder Test Execution Chain Integration — constants and registry.
 */

import type { ExecutionChainState } from './founder-test-execution-chain-integration-types.js';

export const FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PASS_TOKEN =
  'FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PASS';
export const FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_OWNER_MODULE =
  'devpulse_founder_test_execution_chain_integration';
export const FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PHASE =
  'Phase 25.25 — Founder Test Execution Chain Integration';
export const FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_REPORT_TITLE =
  'FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_REPORT';
export const FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_CACHE_KEY_PREFIX =
  'founder-test-execution-chain-integration-v1';
export const MAX_FOUNDER_TEST_EXECUTION_CHAIN_HISTORY = 16;
export const MAX_EXECUTION_CHAIN_BLOCKERS = 12;
export const MAX_EXECUTION_CHAIN_WARNINGS = 12;
export const MAX_RECOMMENDED_ACTIONS = 12;

export const FOUNDER_TEST_EXECUTION_CHAIN_CORE_QUESTION =
  'Can Founder Test evaluate the real execution chain?';

export const EXECUTION_CHAIN_STATES: readonly ExecutionChainState[] = [
  'EXECUTION_CHAIN_CONNECTED',
  'EXECUTION_CHAIN_PARTIALLY_CONNECTED',
  'EXECUTION_CHAIN_DISCONNECTED',
  'EXECUTION_CHAIN_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'founder-test-launch-readiness',
  'connected-build-execution-foundation',
  'connected-runtime-activation-foundation',
  'connected-live-preview-foundation',
  'connected-verification-foundation',
  'end-to-end-execution-proof-chain',
  'founder-acceptance-gate',
  'execution-proof-evolution',
  'launch-council',
] as const;

export const ORCHESTRATION_FLOW = [
  'Founder Test Launch Readiness',
  'Connected Build Execution',
  'Connected Runtime Activation',
  'Connected Live Preview',
  'Connected Verification',
  'End-to-End Execution Proof',
  'Founder Execution Chain Assessment',
] as const;

export const EXECUTION_CHAIN_SAFETY_GUARANTEES = [
  'Read-only orchestration only',
  'No execution',
  'No runtime launch',
  'No browser launch',
  'No verification execution',
  'No deployment',
  'No file mutation',
  'realExecutionPerformed always false',
] as const;

export function isExecutionChainState(value: string): value is ExecutionChainState {
  return (EXECUTION_CHAIN_STATES as readonly string[]).includes(value);
}
