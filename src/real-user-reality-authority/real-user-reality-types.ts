/**
 * Real User Reality Authority — assessment types.
 */

export type RealUserEvidenceType = 'REAL_USER' | 'FOUNDER_USER' | 'SIMULATED_USER' | 'NO_EVIDENCE';

export type RealUserRealityCategory =
  | 'USER_UNDERSTANDING'
  | 'USER_SUCCESS'
  | 'USER_CONFUSION'
  | 'USER_TRUST'
  | 'USER_RETENTION';

export type RealUserRealityReadinessState =
  | 'USERS_PROVE_SUCCESS'
  | 'USERS_MOSTLY_SUCCEED'
  | 'MIXED_RESULTS'
  | 'HIGH_USER_RISK'
  | 'NO_REAL_USER_EVIDENCE'
  | 'BLOCKED';

export interface RealUserRealityScenarioDefinition {
  id: string;
  category: RealUserRealityCategory;
  question: string;
}

export interface RealUserEvidenceItem {
  id: string;
  category: RealUserRealityCategory;
  evidenceType: RealUserEvidenceType;
  summary: string;
  source: string;
}

export interface RealUserRealityAssessment {
  readOnly: true;
  advisoryOnly: true;
  realUserRealityScore: number;
  userEvidenceScore: number;
  userSuccessScore: number;
  userConfusionScore: number;
  userTrustScore: number;
  userRetentionScore: number;
  realUserEvidenceCount: number;
  founderOnlyEvidenceCount: number;
  noRealUserEvidence: boolean;
  blocksLaunchReadiness: boolean;
  readinessState: RealUserRealityReadinessState;
  findings: string[];
  recommendations: string[];
  evidenceItems: RealUserEvidenceItem[];
  cacheKey: string;
}
