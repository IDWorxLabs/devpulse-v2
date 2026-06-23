/**
 * Phase 26.93 — Authority Recursion Guard registry (V1).
 */

import type { AuthorityGuardName, AuthorityRecursionRuleId } from './authority-recursion-guard-types.js';

export const AUTHORITY_RECURSION_GUARD_PASS = 'AUTHORITY_RECURSION_GUARD_PASS';

export const AUTHORITY_RECURSION_GUARD_CORE_QUESTION =
  'Can authority validation and reconciliation paths run without recursive orchestration loops?';

export const DEFAULT_AUTHORITY_MAX_DEPTH = 6;

export const AUTHORITY_RECURSION_RECOMMENDED_FIX =
  'Avoid nested authority orchestration; pass precomputed evidence into this path';

export const TESTING_INFRASTRUCTURE_DEFECT = 'TESTING_INFRASTRUCTURE_DEFECT';

export const GUARDED_AUTHORITIES: readonly AuthorityGuardName[] = [
  'FOUNDER_EXECUTION_PROOF_BUNDLE',
  'FOUNDER_EXECUTION_PROOF',
  'AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT',
  'EVIDENCE_PROPAGATION_RECONCILIATION',
  'FOUNDER_TRUTH_MATRIX_LAUNCH_RECONCILIATION',
  'AUTONOMOUS_BUILD_EXECUTION_PROOF',
  'FOUNDER_TEST_INTEGRATION',
  'AUTONOMOUS_REPAIR_LOOP',
] as const;

export const HEAVY_ORCHESTRATION_AUTHORITIES: readonly AuthorityGuardName[] = [
  'FOUNDER_TEST_INTEGRATION',
  'AUTONOMOUS_BUILD_EXECUTION_PROOF',
  'AUTONOMOUS_REPAIR_LOOP',
] as const;

export const FORBIDDEN_AUTHORITY_CHAINS: readonly {
  readOnly: true;
  ruleId: AuthorityRecursionRuleId;
  from: AuthorityGuardName;
  to: AuthorityGuardName;
  reason: string;
}[] = [
  {
    readOnly: true,
    ruleId: 'FOUNDER_TEST_FROM_RECONCILIATION',
    from: 'EVIDENCE_PROPAGATION_RECONCILIATION',
    to: 'FOUNDER_TEST_INTEGRATION',
    reason: 'Founder Test Integration must not run from evidence propagation reconciliation sync',
  },
  {
    readOnly: true,
    ruleId: 'AUTONOMOUS_BUILD_FROM_REALIGNMENT',
    from: 'AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT',
    to: 'AUTONOMOUS_BUILD_EXECUTION_PROOF',
    reason: 'Autonomous Build Execution Proof must not run from authority realignment validation',
  },
  {
    readOnly: true,
    ruleId: 'EVIDENCE_PROPAGATION_CYCLE',
    from: 'AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT',
    to: 'EVIDENCE_PROPAGATION_RECONCILIATION',
    reason: 'Evidence propagation and realignment must not call each other recursively',
  },
  {
    readOnly: true,
    ruleId: 'FOUNDER_TEST_FROM_RECONCILIATION',
    from: 'AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT',
    to: 'FOUNDER_TEST_INTEGRATION',
    reason: 'Founder Test Integration must not run from authority evidence source realignment',
  },
  {
    readOnly: true,
    ruleId: 'FOUNDER_TEST_FROM_RECONCILIATION',
    from: 'FOUNDER_TRUTH_MATRIX_LAUNCH_RECONCILIATION',
    to: 'FOUNDER_TEST_INTEGRATION',
    reason: 'Founder Test Integration must not run from truth matrix reconciliation sync',
  },
] as const;

export const RECURSION_GUARD_SAFETY_GUARANTEES = [
  'Proof is not weakened — recursion returns bounded PARTIAL/UNKNOWN with explicit reason',
  'Recursion is classified as TESTING_INFRASTRUCTURE_DEFECT, not product failure',
  'Full Founder Test orchestration remains available outside guarded validator mode',
  'No silent evidence skipping — skippedHeavyOrchestration and callerStack are always recorded',
] as const;
