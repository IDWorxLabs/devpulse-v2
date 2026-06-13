/**
 * Founder Launch Decision Authority — constants and registry.
 */

import type { FounderLaunchDecision } from './founder-launch-decision-authority-types.js';

export const FOUNDER_LAUNCH_DECISION_AUTHORITY_PASS_TOKEN =
  'FOUNDER_LAUNCH_DECISION_AUTHORITY_PASS';
export const FOUNDER_LAUNCH_DECISION_AUTHORITY_OWNER_MODULE =
  'devpulse_founder_launch_decision_authority';
export const FOUNDER_LAUNCH_DECISION_AUTHORITY_PHASE =
  'Phase 26.14 — Founder Launch Decision Authority';
export const FOUNDER_LAUNCH_DECISION_AUTHORITY_REPORT_TITLE =
  'FOUNDER_LAUNCH_DECISION_AUTHORITY_REPORT';
export const FOUNDER_LAUNCH_DECISION_AUTHORITY_CACHE_KEY_PREFIX =
  'founder-launch-decision-authority-v1';
export const MAX_FOUNDER_LAUNCH_DECISION_HISTORY = 16;
export const LAUNCH_CONFIDENCE_THRESHOLD = 80;
export const HIGH_RISK_SCORE_THRESHOLD = 75;

export const FOUNDER_LAUNCH_DECISION_CORE_QUESTION =
  'Should I launch this project right now?';

export const INPUT_SIGNAL_AUTHORITIES = [
  'live-idea-to-launch-execution-runner',
  'connected-launch-readiness-proof',
  'connected-runtime-activation-proof',
  'connected-preview-experience-proof',
  'connected-build-execution',
  'connected-verification-execution-proof',
  'founder-test-launch-readiness',
  'founder-test-reality-sweep',
  'launch-council',
  'requirements-to-plan-execution-contract',
  'autonomous-build-execution-proof',
  'founder-test-integration',
  'project-vault',
] as const;

export const ORCHESTRATION_FLOW = [
  'Gather proof-chain signals from existing authorities',
  'Analyze launch risk and blocker priority',
  'Apply founder decision verdict rules',
  'Generate founder launch decision report',
] as const;

export const SAFETY_GUARANTEES = [
  'Advisory only — founder remains final human decision-maker',
  'No deploy, execute, or project mutation',
  'LAUNCH requires runtime proof, launch readiness, and no critical blockers',
  'Source code or artifacts alone cannot trigger LAUNCH',
  'Missing evidence reported honestly',
] as const;

export const DECISION_PRIORITY: readonly FounderLaunchDecision[] = [
  'REJECT_LAUNCH',
  'RUN_MORE_PROOF',
  'FIX_BLOCKERS',
  'WAIT',
  'LAUNCH',
] as const;
