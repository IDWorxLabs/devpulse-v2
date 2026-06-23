/**
 * Phase 26.93 — Authority Recursion Guard types (V1).
 */

export type AuthorityGuardName =
  | 'FOUNDER_EXECUTION_PROOF_BUNDLE'
  | 'FOUNDER_EXECUTION_PROOF'
  | 'AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT'
  | 'EVIDENCE_PROPAGATION_RECONCILIATION'
  | 'FOUNDER_TRUTH_MATRIX_LAUNCH_RECONCILIATION'
  | 'AUTONOMOUS_BUILD_EXECUTION_PROOF'
  | 'FOUNDER_TEST_INTEGRATION'
  | 'AUTONOMOUS_REPAIR_LOOP';

export type AuthorityRecursionRuleId =
  | 'SAME_AUTHORITY_REENTRY'
  | 'MAX_DEPTH_EXCEEDED'
  | 'HEAVY_ORCHESTRATION_IN_VALIDATOR'
  | 'FOUNDER_TEST_FROM_RECONCILIATION'
  | 'AUTONOMOUS_BUILD_FROM_REALIGNMENT'
  | 'EVIDENCE_PROPAGATION_CYCLE';

export type AuthoritySafeFallbackProofLevel = 'PARTIAL' | 'UNKNOWN';
export type AuthoritySafeFallbackVerdict = 'PARTIAL' | 'UNKNOWN';
export type AuthorityLaunchImpact = 'TESTING_INFRASTRUCTURE_DEFECT';

export interface AuthorityExecutionContextFrame {
  readOnly: true;
  authorityName: AuthorityGuardName;
  invocationId: string;
  parentAuthority: AuthorityGuardName | null;
  depth: number;
  visitedAuthorities: readonly AuthorityGuardName[];
  startedAt: string;
  maxDepth: number;
  allowHeavyOrchestration: boolean;
  validatorMode: boolean;
}

export interface AuthorityExecutionGuardOptions {
  parentAuthority?: AuthorityGuardName | null;
  maxDepth?: number;
  allowHeavyOrchestration?: boolean;
  allowReentry?: boolean;
  requireHeavyOrchestration?: boolean;
}

export interface AuthorityRecursionDetection {
  readOnly: true;
  detected: true;
  recursionDetected: true;
  skippedHeavyOrchestration: true;
  ruleId: AuthorityRecursionRuleId;
  reason: string;
  callerStack: readonly string[];
  authorityName: AuthorityGuardName;
  launchImpact: AuthorityLaunchImpact;
  recommendedFix: string;
}

export interface AuthoritySafeFallbackEvidence {
  readOnly: true;
  proofLevel: AuthoritySafeFallbackProofLevel;
  verdict: AuthoritySafeFallbackVerdict;
  recursionDetected: true;
  skippedHeavyOrchestration: true;
  reason: string;
  callerStack: readonly string[];
  launchImpact: AuthorityLaunchImpact;
  recommendedFix: string;
  ruleId: AuthorityRecursionRuleId;
  authorityName: AuthorityGuardName;
}

export interface AuthorityRecursionGuardReport {
  readOnly: true;
  guardId: string;
  generatedAt: string;
  coreQuestion: string;
  detections: AuthorityRecursionDetection[];
  guardsApplied: readonly AuthorityGuardName[];
  passToken: string | null;
}

export interface AuthorityRecursionGuardAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'AUTHORITY_RECURSION_GUARD_COMPLETE';
  report: AuthorityRecursionGuardReport;
}

export interface RunWithAuthorityGuardInput<T> {
  authorityName: AuthorityGuardName;
  options?: AuthorityExecutionGuardOptions;
  invoke: () => T;
  onRecursion: (detection: AuthorityRecursionDetection) => T;
}

export interface AssessAuthorityRecursionGuardInput {
  skipHistoryRecording?: boolean;
}
