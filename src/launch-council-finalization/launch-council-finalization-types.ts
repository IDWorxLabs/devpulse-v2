/**
 * Launch Council Finalization — assessment types.
 */

export type LaunchCouncilFinalizationPosition =
  | 'READY'
  | 'READY_WITH_CAUTION'
  | 'NOT_READY'
  | 'BLOCKED'
  | 'UNKNOWN';

export type LaunchCouncilAuthorityRole = 'LAUNCH_GATE' | 'ADVISORY';

export interface LaunchCouncilAuthorityClassification {
  authorityId: string;
  authorityName: string;
  role: LaunchCouncilAuthorityRole;
}

export interface LaunchCouncilAgreementAnalysis {
  agreementScore: number;
  contradictionCount: number;
  conflictingAuthorities: string[];
}

export interface LaunchCouncilFinalizationAssessment {
  readOnly: true;
  advisoryOnly: true;
  councilScore: number;
  councilConfidence: number;
  authorityCount: number;
  blockingAuthorityCount: number;
  advisoryAuthorityCount: number;
  launchGateAuthorityCount: number;
  agreementScore: number;
  contradictionCount: number;
  conflictingAuthorities: string[];
  highestRiskAuthorities: string[];
  strongestAuthorities: string[];
  councilPosition: LaunchCouncilFinalizationPosition;
  councilReasoning: string[];
  launchBlockers: string[];
  recommendations: string[];
  authorityClassifications: LaunchCouncilAuthorityClassification[];
  cacheKey: string;
}
