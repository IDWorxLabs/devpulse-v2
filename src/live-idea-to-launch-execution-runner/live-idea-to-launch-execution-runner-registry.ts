/**
 * Live Idea-To-Launch Execution Runner — constants and registry.
 */

import type { ExecutionLifecycleStage, ExecutionLifecycleState } from './live-idea-to-launch-execution-runner-types.js';

export const LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_PASS_TOKEN =
  'LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_PASS';
export const LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_OWNER_MODULE =
  'devpulse_live_idea_to_launch_execution_runner';
export const LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_PHASE =
  'Phase 26.13 — Live Idea-To-Launch Execution Runner';
export const LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_REPORT_TITLE =
  'LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_REPORT';
export const LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_CACHE_KEY_PREFIX =
  'live-idea-to-launch-execution-runner-v1';
export const MAX_LIVE_EXECUTION_RUNNER_HISTORY = 16;
export const STAGE_CONFIRM_THRESHOLD = 80;
export const STAGE_PARTIAL_THRESHOLD = 55;

export const LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_CORE_QUESTION =
  'Can AiDevEngine prove that a project has moved through the complete execution lifecycle from founder idea to launch readiness using real evidence?';

export const EXECUTION_LIFECYCLE_STAGE_ORDER: readonly ExecutionLifecycleStage[] = [
  'IDEA',
  'PLANNING',
  'BUILD',
  'VALIDATION',
  'RUNTIME',
  'LAUNCH',
] as const;

export const EXECUTION_LIFECYCLE_STATE_ORDER: readonly ExecutionLifecycleState[] = [
  'NOT_STARTED',
  'IDEA_CONFIRMED',
  'PLANNING_CONFIRMED',
  'BUILD_CONFIRMED',
  'VALIDATION_CONFIRMED',
  'RUNTIME_CONFIRMED',
  'LAUNCH_READY',
] as const;

export const STAGE_TO_LIFECYCLE_STATE: Readonly<
  Record<ExecutionLifecycleStage, ExecutionLifecycleState>
> = {
  IDEA: 'IDEA_CONFIRMED',
  PLANNING: 'PLANNING_CONFIRMED',
  BUILD: 'BUILD_CONFIRMED',
  VALIDATION: 'VALIDATION_CONFIRMED',
  RUNTIME: 'RUNTIME_CONFIRMED',
  LAUNCH: 'LAUNCH_READY',
};

export const ORCHESTRATION_FLOW = [
  'Gather Requirements-to-Plan Contract',
  'Assess Founder Test Integration',
  'Assess Autonomous Build Execution Proof',
  'Assess Connected Build / Verify / Runtime / Preview / Launch proofs',
  'Analyze IDEA → PLANNING → BUILD → VALIDATION → RUNTIME → LAUNCH stages',
  'Verify execution chain',
  'Generate live execution runner report',
] as const;

export const SAFETY_GUARANTEES = [
  'Read-only — no code generation, file creation, execution, or deployment',
  'Stage cannot pass without evidence — roadmap ≠ completed stage',
  'Source code ≠ build confirmed; build artifact ≠ runtime confirmed',
  'Missing evidence remains missing — no score inflation',
] as const;
