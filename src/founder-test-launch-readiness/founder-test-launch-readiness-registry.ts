/**
 * Founder Test Launch Readiness — constants and orchestration registry.
 */

import type { LaunchReadinessVerdict } from './founder-test-launch-readiness-types.js';

export const FOUNDER_TEST_LAUNCH_READINESS_PASS_TOKEN = 'FOUNDER_TEST_LAUNCH_READINESS_PASS';
export const FOUNDER_TEST_LAUNCH_READINESS_OWNER_MODULE = 'devpulse_founder_test_launch_readiness';
export const FOUNDER_TEST_LAUNCH_READINESS_PHASE =
  'Phase 25.19 — One Button Founder Test Integration';
export const FOUNDER_TEST_LAUNCH_READINESS_REPORT_TITLE = 'FOUNDER_TEST_LAUNCH_READINESS_REPORT';
export const FOUNDER_TEST_LAUNCH_READINESS_CACHE_KEY_PREFIX = 'founder-test-launch-readiness-v1';
export const MAX_FOUNDER_TEST_LAUNCH_READINESS_HISTORY = 16;
export const MAX_TOP_BLOCKERS = 10;
export const MAX_TOP_WARNINGS = 10;
export const MAX_TOP_RECOMMENDED_ACTIONS = 10;
export const MAX_TOP_MISSING_CAPABILITIES = 10;

export const FOUNDER_TEST_LAUNCH_READINESS_CORE_QUESTION =
  'Would a reasonable founder launch DevPulse today?';

export const RUN_FOUNDER_TEST_ACTION = 'RUN FOUNDER TEST';

export const LAUNCH_READINESS_VERDICTS: readonly LaunchReadinessVerdict[] = [
  'LAUNCH_READY',
  'LAUNCH_READY_WITH_WARNINGS',
  'NOT_LAUNCH_READY',
  'BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_ORCHESTRATION_AUTHORITIES = [
  'Founder Reality',
  'Founder Simulation',
  'Founder Test Integration (24F)',
  'Founder Acceptance Gate (24G)',
  'Execution Proof Evolution (24E)',
  'Launch Council',
  'Requirement Reality',
  'Verification Reality',
  'Live Preview Reality',
  'Mobile Runtime Reality',
  'Founder Acceptance Orchestrator (24.8)',
] as const;

export const ORCHESTRATION_FLOW = [
  'RUN FOUNDER TEST',
  'Gather Authority Inputs',
  'Execute Founder Test Integration',
  'Assess Autonomous Build Execution Proof (before launch verdict)',
  'Execute Founder Acceptance',
  'Execute Launch Council',
  'Run Chat Stress Simulation (real chat brain path)',
  'Run Full Product Readiness Simulation (15 user perspectives)',
  'Aggregate Findings',
  'Generate Founder Report',
  'Generate Launch Readiness Verdict',
  'FOUNDER_TEST_COMPLETE',
] as const;

export function isLaunchReadinessVerdict(value: string): value is LaunchReadinessVerdict {
  return (LAUNCH_READINESS_VERDICTS as readonly string[]).includes(value);
}
