/**
 * Reality-Proof Authority — assessment types.
 */

export type RealityEvidenceLevel =
  | 'PROVEN_REALITY'
  | 'OBSERVED_REALITY'
  | 'INFERRED_REALITY'
  | 'ASSUMED_REALITY'
  | 'UNKNOWN_REALITY';

export type RealityProofCategory =
  | 'EXECUTION_PROOF'
  | 'USER_PROOF'
  | 'INTERACTION_PROOF'
  | 'VERIFICATION_PROOF'
  | 'RUNTIME_PROOF'
  | 'LAUNCH_PROOF';

export type RealityProofReadinessState =
  | 'REALITY_PROVEN'
  | 'MOSTLY_PROVEN'
  | 'PARTIALLY_PROVEN'
  | 'ASSUMPTION_HEAVY'
  | 'BLOCKED';

export interface RealityProofFinding {
  id: string;
  category: RealityProofCategory;
  evidenceLevel: RealityEvidenceLevel;
  finding: string;
  evidence: string[];
  risk: string;
  recommendation: string;
}

export interface RealityProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  realityProofScore: number;
  provenRealityCount: number;
  observedRealityCount: number;
  inferredRealityCount: number;
  assumedRealityCount: number;
  unknownRealityCount: number;
  realityRiskScore: number;
  blocksLaunchReadiness: boolean;
  readinessState: RealityProofReadinessState;
  findings: RealityProofFinding[];
  recommendations: string[];
  cacheKey: string;
}
