/**
 * Launch Verdict Governance — assessment types.
 */

export type FinalLaunchVerdict =
  | 'NOT_READY'
  | 'READY_FOR_INTERNAL_USE'
  | 'READY_FOR_PRIVATE_BETA'
  | 'READY_FOR_PUBLIC_BETA'
  | 'READY_FOR_PUBLIC_LAUNCH'
  | 'BLOCKED'
  | 'UNKNOWN';

export type GovernanceRuleGroup = 'REALITY' | 'TRUST' | 'USER' | 'READINESS';

export type GovernanceRuleOutcome = 'SATISFIED' | 'FAILED' | 'SKIPPED';

export interface GovernanceRuleEvaluation {
  ruleId: string;
  group: GovernanceRuleGroup;
  description: string;
  outcome: GovernanceRuleOutcome;
  detail: string;
}

export interface LaunchVerdictGovernanceAssessment {
  readOnly: true;
  advisoryOnly: true;
  governanceScore: number;
  governanceConfidence: number;
  finalLaunchVerdict: FinalLaunchVerdict;
  verdictEligibility: FinalLaunchVerdict;
  blockingRuleCount: number;
  satisfiedRuleCount: number;
  failedRuleCount: number;
  requiredEvidenceMissing: string[];
  blockingAuthorities: string[];
  governanceReasoning: string[];
  recommendations: string[];
  ruleEvaluations: GovernanceRuleEvaluation[];
  satisfiedRules: string[];
  failedRules: string[];
  cacheKey: string;
}
