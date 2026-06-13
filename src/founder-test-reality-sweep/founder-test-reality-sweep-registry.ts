/**
 * Founder Test Reality Sweep — constants and registry.
 */

import type { FounderLaunchVerdict, LaunchRecommendation, RealitySweepCategory } from './founder-test-reality-sweep-types.js';

export const FOUNDER_TEST_REALITY_SWEEP_PASS_TOKEN = 'FOUNDER_TEST_REALITY_SWEEP_PASS';
export const FOUNDER_TEST_REALITY_SWEEP_TYPE_DRIFT_REPAIR_V1_PASS =
  'FOUNDER_TEST_REALITY_SWEEP_TYPE_DRIFT_REPAIR_V1_PASS';
export const FOUNDER_TEST_REALITY_SWEEP_OWNER_MODULE = 'devpulse_founder_test_reality_sweep';
export const FOUNDER_TEST_REALITY_SWEEP_PHASE = 'Phase 25.32 — Founder Test Reality Sweep V1';
export const FOUNDER_TEST_REALITY_SWEEP_REPORT_TITLE = 'FOUNDER_TEST_REALITY_SWEEP_REPORT';
export const FOUNDER_TEST_REALITY_SWEEP_CACHE_KEY_PREFIX = 'founder-test-reality-sweep-v1';
export const MAX_FOUNDER_TEST_REALITY_SWEEP_HISTORY = 16;
export const MAX_LAUNCH_BLOCKERS = 32;
export const MAX_LAUNCH_WARNINGS = 24;
export const MAX_LAUNCH_STRENGTHS = 24;
export const MAX_MISSING_CAPABILITIES = 20;
export const MAX_COMPETITIVE_GAPS = 16;
export const MAX_LAUNCH_RISKS = 16;
export const MAX_RECOMMENDED_LAUNCH_WORK = 16;
export const MAX_TOP_BLOCKERS = 10;
export const MAX_TOP_STRENGTHS = 10;
export const MAX_TOP_MISSING = 10;
export const MAX_NEXT_BUILD_ITEMS = 10;

export const FOUNDER_TEST_REALITY_SWEEP_CORE_QUESTION =
  'If a founder received DevPulse today, would they launch it? If not, why not, and what exactly blocks launch?';

export const REALITY_SWEEP_CATEGORIES: readonly RealitySweepCategory[] = [
  'EXECUTION_REALITY',
  'FOUNDER_EXPERIENCE',
  'FIRST_TIME_USER_EXPERIENCE',
  'NAVIGATION_REALITY',
  'LIVE_PREVIEW_REALITY',
  'VERIFICATION_REALITY',
  'AI_INTERACTION_REALITY',
  'MISSING_CAPABILITY_REALITY',
  'LAUNCH_RISK_REALITY',
  'COMPETITIVE_REALITY',
] as const;

export const REALITY_SWEEP_CATEGORY_LABELS: Record<RealitySweepCategory, string> = {
  EXECUTION_REALITY: 'Execution Reality',
  FOUNDER_EXPERIENCE: 'Founder Experience',
  FIRST_TIME_USER_EXPERIENCE: 'First-Time User Experience',
  NAVIGATION_REALITY: 'Navigation Reality',
  LIVE_PREVIEW_REALITY: 'Live Preview Reality',
  VERIFICATION_REALITY: 'Verification Reality',
  AI_INTERACTION_REALITY: 'AI Interaction Reality',
  MISSING_CAPABILITY_REALITY: 'Missing Capability Reality',
  LAUNCH_RISK_REALITY: 'Launch Risk Reality',
  COMPETITIVE_REALITY: 'Competitive Reality',
};

export const LAUNCH_BLOCKER_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

export const FOUNDER_LAUNCH_VERDICTS: readonly FounderLaunchVerdict[] = [
  'READY_TO_LAUNCH',
  'READY_WITH_WARNINGS',
  'NOT_READY_TO_LAUNCH',
  'BLOCK_LAUNCH',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const LAUNCH_RECOMMENDATIONS: readonly LaunchRecommendation[] = [
  'RECOMMEND_LAUNCH',
  'RECOMMEND_LAUNCH_WITH_WARNINGS',
  'DO_NOT_RECOMMEND_LAUNCH',
  'BLOCK_LAUNCH',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'founder-execution-proof',
  'founder-test-launch-readiness',
  'founder-acceptance-gate',
  'launch-council',
  'first-time-user-reality',
  'live-preview-reality',
  'verification-reality',
  'interactive-explanations',
  'ui-reviewer-authority',
  'founder-testing-authority',
  'competitive-reality-engine',
] as const;

export const ORCHESTRATION_FLOW = [
  'Founder Execution Proof',
  'Founder Test Launch Readiness',
  'Reality Authority Sweep',
  'Launch Blocker Analysis',
  'Founder Launch Verdict',
] as const;

export const REALITY_SWEEP_SAFETY_GUARANTEES = [
  'Read-only aggregation only — no new execution',
  'Brutally honest scoring — no optimistic inflation',
  'No roadmap credit or future capability credit',
  'Only currently existing capability counts',
  'No deployment or runtime mutation',
] as const;

export const SEVERITY_IMPACT_RANK: Record<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', number> = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

export const SEVERITY_READINESS_PENALTY: Record<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', number> = {
  CRITICAL: 18,
  HIGH: 10,
  MEDIUM: 4,
  LOW: 2,
};

export function isFounderLaunchVerdict(value: string): value is FounderLaunchVerdict {
  return (FOUNDER_LAUNCH_VERDICTS as readonly string[]).includes(value);
}

export function isLaunchRecommendation(value: string): value is LaunchRecommendation {
  return (LAUNCH_RECOMMENDATIONS as readonly string[]).includes(value);
}
