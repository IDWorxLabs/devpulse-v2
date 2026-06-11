/**
 * Trust Authority — assessment types.
 */

export type TrustScenarioCategory =
  | 'EVIDENCE_TRUST'
  | 'HONESTY_TRUST'
  | 'READINESS_TRUST'
  | 'INTELLIGENCE_TRUST'
  | 'TRANSPARENCY_TRUST';

export type TrustReadinessState = 'TRUSTED' | 'CAUTION' | 'HIGH_RISK' | 'BLOCKED';

export interface TrustScenarioDefinition {
  id: string;
  category: TrustScenarioCategory;
  question: string;
}

export interface TrustScenarioResult {
  id: string;
  category: TrustScenarioCategory;
  score: number;
  passed: boolean;
  findings: string[];
  trustRisks: string[];
  recommendations: string[];
}

export interface TrustAssessment {
  readOnly: true;
  trustScore: number;
  trustRiskScore: number;
  criticalTrustFailures: number;
  blocksLaunchReadiness: boolean;
  readinessState: TrustReadinessState;
  scenarioResults: TrustScenarioResult[];
  criticalTrustFailureDetails: string[];
  findings: string[];
  trustRisks: string[];
  recommendations: string[];
  cacheKey: string;
}
