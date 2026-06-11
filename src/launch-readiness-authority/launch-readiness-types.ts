/**
 * Launch Readiness Authority — assessment types.
 */

export type LaunchReadinessRecommendation =
  | 'READY_FOR_PUBLIC_LAUNCH'
  | 'READY_FOR_PUBLIC_BETA'
  | 'READY_FOR_PRIVATE_BETA'
  | 'READY_FOR_INTERNAL_USE'
  | 'NOT_READY_FOR_LAUNCH';

export type LaunchReadinessState = 'READY' | 'CAUTION' | 'HIGH_RISK' | 'BLOCKED';

export interface LaunchReadinessDecision {
  recommendation: LaunchReadinessRecommendation;
  confidence: number;
  evidenceCount: number;
  blockingAuthorities: string[];
  supportingAuthorities: string[];
  rationale: string;
}

export interface LaunchReadinessEvidenceBreakdown {
  authorityId: string;
  authorityName: string;
  weightPercent: number;
  score: number;
  status: string;
  launchBlocker: boolean;
}

export interface LaunchReadinessAuthorityAssessment {
  readOnly: true;
  advisoryOnly: true;
  launchReadinessAuthorityScore: number;
  launchConfidenceScore: number;
  blockingAuthorityCount: number;
  supportingAuthorityCount: number;
  recommendation: LaunchReadinessRecommendation;
  readinessState: LaunchReadinessState;
  rationale: string;
  blockers: string[];
  strengths: string[];
  recommendations: string[];
  decision: LaunchReadinessDecision;
  evidenceBreakdown: LaunchReadinessEvidenceBreakdown[];
  cacheKey: string;
}
