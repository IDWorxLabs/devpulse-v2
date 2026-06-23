/**
 * Phase 26.71 — Founder Truth Matrix Integration registry (V1).
 */

import type { AuditedClaimId } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';

export const FOUNDER_TRUTH_MATRIX_INTEGRATION_PASS = 'FOUNDER_TRUTH_MATRIX_INTEGRATION_PASS';
export const FOUNDER_TRUTH_MATRIX_INTEGRATION_OWNER_MODULE = 'devpulse_founder_truth_matrix_integration';
export const FOUNDER_TRUTH_MATRIX_INTEGRATION_PHASE =
  'Phase 26.71 — Founder Truth Matrix Integration Authority V1';
export const FOUNDER_TRUTH_MATRIX_INTEGRATION_REPORT_TITLE = 'FOUNDER_TRUTH_MATRIX_INTEGRATION_REPORT';
export const FOUNDER_TRUTH_MATRIX_LAUNCH_RECONCILIATION_REPORT_TITLE =
  'FOUNDER_TRUTH_MATRIX_LAUNCH_RECONCILIATION_REPORT';
export const FOUNDER_TRUTH_MATRIX_INTEGRATION_CORE_QUESTION =
  'What is actually true, what is actually broken, and which authority is wrong when authorities disagree?';
export const FOUNDER_TRUTH_MATRIX_RECONCILIATION_OPERATION = 'FOUNDER_TRUTH_MATRIX_RECONCILIATION';
export const FOUNDER_TRUTH_MATRIX_INTEGRATION_CACHE_KEY_PREFIX = 'founder-truth-matrix-integration-v1';
export const MAX_TRUTH_MATRIX_INTEGRATION_HISTORY = 16;

export const TRUTH_MATRIX_INTEGRATION_SAFETY_GUARANTEES = [
  'Read-only — no score inflation',
  'No mutation of upstream authority verdicts',
  'Truth matrix consulted before launch verdict emission',
  'Scoring defects recorded as TESTING_SYSTEM_DEFECT — do not block launch',
  'Real product gaps still block launch readiness',
] as const;

export const ORCHESTRATION_FLOW = [
  'collect-consistency-audit',
  'reconcile-truth-claims',
  'apply-launch-verdict-override-rules',
  'categorize-launch-blockers',
  'build-founder-truth-summary',
  'emit-reconciled-launch-verdict',
] as const;

export const INTEGRATION_TARGET_AUTHORITIES = [
  'founder-test-consistency-audit',
  'founder-test-launch-readiness',
  'build-materialization-truth-bridge',
  'runtime-materialization-truth-bridge',
  'promise-reality-engine',
  'founder-execution-proof',
  'launch-council',
  'launch-readiness-authority',
  'founder-acceptance-gate',
  'chat-intelligence-reality',
] as const;

export interface FounderTruthQuestionDefinition {
  readOnly: true;
  question: string;
  claimId: AuditedClaimId;
}

export const FOUNDER_TRUTH_QUESTIONS: readonly FounderTruthQuestionDefinition[] = [
  {
    readOnly: true,
    question: 'Can AiDevEngine build applications?',
    claimId: 'AIDEVENGINE_BUILDS_APPLICATIONS',
  },
  {
    readOnly: true,
    question: 'Can AiDevEngine execute plans?',
    claimId: 'WORLD2_EXECUTES_PLANS',
  },
  {
    readOnly: true,
    question: 'Can AiDevEngine run applications?',
    claimId: 'LIVE_PREVIEW_RUNS_APPLICATIONS',
  },
  {
    readOnly: true,
    question: 'Can AiDevEngine verify applications?',
    claimId: 'VERIFICATION_PROVES_READINESS',
  },
  {
    readOnly: true,
    question: 'Can founders reach launch?',
    claimId: 'IDEA_TO_LAUNCH',
  },
  {
    readOnly: true,
    question: 'Is launch blocked by the product?',
    claimId: 'LAUNCH_READINESS_VERDICT',
  },
  {
    readOnly: true,
    question: 'Or by testing infrastructure?',
    claimId: 'CHAT_INTELLIGENCE_READINESS',
  },
] as const;
