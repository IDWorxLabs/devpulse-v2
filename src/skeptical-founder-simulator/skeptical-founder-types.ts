/**
 * Skeptical Founder Simulator — assessment types.
 */

export type SkepticalFounderScenarioCategory =
  | 'TRUST_CHALLENGE'
  | 'INTELLIGENCE_CHALLENGE'
  | 'PURPOSE_CHALLENGE'
  | 'LAUNCH_CHALLENGE'
  | 'COMPETITIVE_CHALLENGE'
  | 'HONESTY_CHALLENGE';

export type SkepticalFounderReadinessState = 'TRUSTED' | 'CAUTION' | 'HIGH_RISK' | 'BLOCKED';

export interface SkepticalFounderScenarioDefinition {
  id: string;
  category: SkepticalFounderScenarioCategory;
  question: string;
}

export interface SkepticalFounderScenarioResult {
  id: string;
  category: SkepticalFounderScenarioCategory;
  question: string;
  score: number;
  passed: boolean;
  findings: string[];
  objections: string[];
  recommendations: string[];
}

export interface SkepticalFounderAssessment {
  readOnly: true;
  skepticalFounderScore: number;
  launchRiskScore: number;
  objectionCount: number;
  blocksLaunchReadiness: boolean;
  readinessState: SkepticalFounderReadinessState;
  failedScenarios: SkepticalFounderScenarioResult[];
  scenarioResults: SkepticalFounderScenarioResult[];
  objections: string[];
  recommendations: string[];
  criticalTrustObjection: boolean;
  cacheKey: string;
}
