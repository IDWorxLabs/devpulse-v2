/**
 * Autonomous Build Execution Proof — constants and orchestration registry.
 */

import type { ExecutionStageId } from './autonomous-build-execution-proof-types.js';

export const AUTONOMOUS_BUILD_EXECUTION_PROOF_PASS_TOKEN =
  'AUTONOMOUS_BUILD_EXECUTION_PROOF_PASS';
export const AUTONOMOUS_BUILD_EXECUTION_PROOF_OWNER_MODULE =
  'devpulse_autonomous_build_execution_proof';
export const AUTONOMOUS_BUILD_EXECUTION_PROOF_PHASE =
  'Phase 26.6 — Autonomous Build Execution Proof Chain';
export const AUTONOMOUS_BUILD_EXECUTION_PROOF_REPORT_TITLE =
  'AUTONOMOUS_BUILD_EXECUTION_PROOF_REPORT';
export const AUTONOMOUS_BUILD_EXECUTION_PROOF_CACHE_KEY_PREFIX =
  'autonomous-build-execution-proof-v1';
export const MAX_AUTONOMOUS_BUILD_EXECUTION_PROOF_HISTORY = 16;
export const MAX_MISSING_EVIDENCE = 12;
export const MAX_RECOMMENDED_ACTIONS = 10;

export const AUTONOMOUS_BUILD_EXECUTION_PROOF_CORE_QUESTION =
  'Can AiDevEngine prove Idea → Requirements → Plan → Build → Runtime → Preview → Verification → Launch using connected evidence — not theory, roadmap, or future capability?';

export const EXECUTION_CHAIN_STAGE_ORDER: readonly ExecutionStageId[] = [
  'REQUIREMENTS',
  'PLAN',
  'BUILD',
  'RUNTIME',
  'PREVIEW',
  'VERIFY',
  'LAUNCH',
] as const;

export const CORE_CHAIN_STAGES: readonly ExecutionStageId[] = [
  'REQUIREMENTS',
  'PLAN',
  'BUILD',
  'RUNTIME',
  'PREVIEW',
  'VERIFY',
] as const;

export const STAGE_PROOF_LEVELS = ['PROVEN', 'PARTIAL', 'NOT_PROVEN'] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'founder-test-integration',
  'connected-build-execution-foundation',
  'connected-runtime-activation-foundation',
  'connected-live-preview-foundation',
  'connected-verification-foundation',
  'founder-acceptance-gate',
  'founder-execution-proof',
] as const;

export const ORCHESTRATION_FLOW = [
  'RUN FOUNDER TEST',
  'Assess Autonomous Build Execution Proof (before launch verdict)',
  'Gather Requirements → Plan → Build → Runtime → Preview → Verify → Launch evidence',
  'Analyze execution chain links',
  'Detect first broken stage',
  'Block launch readiness when chainConnected=false',
  'Generate execution proof report',
  'Merge into Founder Test Launch Readiness',
] as const;

export const EXECUTION_PROOF_SAFETY_GUARANTEES = [
  'Read-only orchestration — no file mutation or runtime launch',
  'No synthetic execution claims — PROVEN requires connected upstream evidence',
  'No score inflation — PARTIAL and NOT_PROVEN preserved honestly',
  'Launch readiness capped at NOT_LAUNCH_READY when chainConnected=false',
] as const;
