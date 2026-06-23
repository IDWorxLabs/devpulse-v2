/**
 * Phase 26.70 — Founder Test Consistency Audit registry (V1).
 */

import type { AuditedClaimId } from './founder-test-consistency-audit-types.js';

export const FOUNDER_TEST_CONSISTENCY_AUDIT_PASS = 'FOUNDER_TEST_CONSISTENCY_AUDIT_PASS';
export const CONSISTENCY_AUDIT_AUTHORITATIVE_EVIDENCE_REPOINT_PASS =
  'CONSISTENCY_AUDIT_AUTHORITATIVE_EVIDENCE_REPOINT_PASS';
export const FOUNDER_TEST_CONSISTENCY_AUDIT_OWNER_MODULE = 'devpulse_founder_test_consistency_audit';
export const FOUNDER_TEST_CONSISTENCY_AUDIT_PHASE = 'Phase 26.70 — Founder Test Consistency Audit Authority V1';
export const FOUNDER_TEST_CONSISTENCY_AUDIT_REPORT_TITLE = 'FOUNDER_TEST_CONSISTENCY_AUDIT_REPORT';
export const FOUNDER_TEST_CONSISTENCY_AUDIT_CORE_QUESTION =
  'When two authorities disagree, who is correct and why?';
export const FOUNDER_TEST_CONSISTENCY_AUDIT_CACHE_KEY_PREFIX = 'founder-test-consistency-audit-v1';
export const MAX_CONSISTENCY_AUDIT_HISTORY = 16;

export const CONSISTENCY_AUDIT_SAFETY_GUARANTEES = [
  'Read-only — no score inflation',
  'No synthetic evidence generation',
  'Advisory-only truth matrix',
  'Does not mutate upstream authority verdicts',
  'Does not bypass launch gates',
] as const;

export const ORCHESTRATION_FLOW = [
  'collect-claim-evidence',
  'analyze-consistency-rules',
  'assign-root-causes',
  'select-final-truth',
  'build-truth-matrix',
  'generate-audit-report',
] as const;

export interface AuditedClaimDefinition {
  readOnly: true;
  claimId: AuditedClaimId;
  claim: string;
  primaryAuthorities: readonly string[];
}

export const AUDITED_CLAIM_DEFINITIONS: readonly AuditedClaimDefinition[] = [
  {
    readOnly: true,
    claimId: 'AIDEVENGINE_BUILDS_APPLICATIONS',
    claim: 'AiDevEngine builds applications',
    primaryAuthorities: ['REQUIREMENT_REALITY', 'connected-build-execution', 'autonomous-build-execution-proof'],
  },
  {
    readOnly: true,
    claimId: 'WORLD2_EXECUTES_PLANS',
    claim: 'World 2 can execute plans',
    primaryAuthorities: ['EXECUTION_PROOF_EVOLUTION', 'connected-execution-chain-truth', 'FOUNDER_REALITY'],
  },
  {
    readOnly: true,
    claimId: 'LIVE_PREVIEW_RUNS_APPLICATIONS',
    claim: 'Live Preview runs applications',
    primaryAuthorities: ['LIVE_PREVIEW_REALITY', 'connected-preview-experience-proof'],
  },
  {
    readOnly: true,
    claimId: 'APPLICATION_WORKS',
    claim: 'Application works',
    primaryAuthorities: ['connected-runtime-activation-proof', 'connected-preview-experience-proof'],
  },
  {
    readOnly: true,
    claimId: 'APPLICATION_RUNS',
    claim: 'Application runs',
    primaryAuthorities: ['connected-runtime-activation-proof', 'autonomous-build-execution-proof'],
  },
  {
    readOnly: true,
    claimId: 'APPLICATION_REACHABLE',
    claim: 'Application is reachable',
    primaryAuthorities: ['connected-runtime-activation-proof', 'connected-preview-experience-proof'],
  },
  {
    readOnly: true,
    claimId: 'FOUNDER_CAN_USE_APPLICATION',
    claim: 'Founder can use application',
    primaryAuthorities: ['founder-test-launch-readiness', 'connected-preview-experience-proof'],
  },
  {
    readOnly: true,
    claimId: 'VERIFICATION_PROVES_READINESS',
    claim: 'Verification proves readiness',
    primaryAuthorities: ['VERIFICATION_REALITY', 'connected-verification-execution-proof'],
  },
  {
    readOnly: true,
    claimId: 'IDEA_TO_LAUNCH',
    claim: 'Founder can go from idea to launch',
    primaryAuthorities: ['founder-execution-proof', 'promise-reality-engine', 'launch-readiness'],
  },
  {
    readOnly: true,
    claimId: 'CHAT_INTELLIGENCE_READINESS',
    claim: 'Chat Intelligence readiness',
    primaryAuthorities: ['chat-intelligence-reality', 'chat-stress-simulation', 'product-readiness'],
  },
  {
    readOnly: true,
    claimId: 'LAUNCH_DAY_READINESS',
    claim: 'Launch Day readiness',
    primaryAuthorities: ['launch-day-simulation', 'product-readiness', 'launch-readiness'],
  },
  {
    readOnly: true,
    claimId: 'AUTONOMOUS_BUILD_EXECUTION_PROOF',
    claim: 'Autonomous Build Execution Proof',
    primaryAuthorities: ['autonomous-build-execution-proof', 'connected-build-execution'],
  },
  {
    readOnly: true,
    claimId: 'LAUNCH_READINESS_VERDICT',
    claim: 'Launch Readiness verdict',
    primaryAuthorities: ['founder-test-launch-readiness', 'launch-council', 'product-readiness'],
  },
] as const;

export const PROVEN_SCORE_THRESHOLD = 70;
export const PARTIAL_SCORE_THRESHOLD = 50;
