/**
 * Launch Council Foundation — assessment types.
 */

export type LaunchCouncilAuthorityStatus = 'PASS' | 'WARNING' | 'FAIL' | 'NOT_RUN';

export type LaunchCouncilReadinessState = 'READY' | 'CAUTION' | 'BLOCKED' | 'UNKNOWN';

export type LaunchCouncilAuthorityCategory =
  | 'FOUNDER_TESTING'
  | 'CHAT_INTELLIGENCE'
  | 'REPOSITORY_INTEGRITY'
  | 'SKEPTICAL_FOUNDER'
  | 'PROMISE_FULFILLMENT'
  | 'TRUST_AUTHORITY'
  | 'SELF_AWARENESS'
  | 'USER_SUCCESS'
  | 'GAP_DETECTION'
  | 'SELF_EVOLUTION'
  | 'UNKNOWN_DISCOVERY'
  | 'FIRST_TIME_USER_REALITY'
  | 'CUSTOMER_VALUE'
  | 'COMPETITIVE_REALITY'
  | 'REALITY_PROOF'
  | 'REAL_USER_REALITY'
  | 'ADOPTION_PREDICTION'
  | 'LAUNCH_READINESS'
  | 'LAUNCH_COUNCIL_FINALIZATION'
  | 'LAUNCH_VERDICT_GOVERNANCE'
  | 'UI_REVIEWER'
  | 'CLARIFYING_QUESTION_INTELLIGENCE';

export interface LaunchCouncilAuthorityResult {
  authorityId: string;
  authorityName: string;
  authorityCategory: LaunchCouncilAuthorityCategory;
  score: number;
  confidence: number;
  status: LaunchCouncilAuthorityStatus;
  launchBlocker: boolean;
  findings: string[];
  recommendations: string[];
}

export interface LaunchCouncilAssessment {
  readOnly: true;
  advisoryOnly: true;
  overallScore: number;
  confidenceScore: number;
  launchBlockerCount: number;
  participatingAuthorities: number;
  readinessState: LaunchCouncilReadinessState;
  authorityResults: LaunchCouncilAuthorityResult[];
  findings: string[];
  recommendations: string[];
  cacheKey: string;
}

export interface LaunchCouncilReport {
  generatedAt: number;
  councilVersion: string;
  authorityResults: LaunchCouncilAuthorityResult[];
  launchBlockers: string[];
  readinessState: LaunchCouncilReadinessState;
  confidenceScore: number;
  summary: string;
}

export interface AssessLaunchCouncilInput {
  authorityResults: LaunchCouncilAuthorityResult[];
  generatedAt?: number;
}

export interface LaunchCouncilRegistryEntry {
  authorityId: string;
  authorityName: string;
  authorityCategory: LaunchCouncilAuthorityCategory;
  registrationOrder: number;
}
