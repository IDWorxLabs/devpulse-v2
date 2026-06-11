/**
 * Customer Value Authority — assessment types.
 */

export type CustomerValueScenarioCategory =
  | 'PROBLEM_VALUE'
  | 'OUTCOME_VALUE'
  | 'TIME_VALUE'
  | 'TRUST_VALUE'
  | 'REPEAT_USAGE_VALUE'
  | 'DIFFERENTIATION_VALUE';

export type CustomerValueReadinessState = 'HIGH_VALUE' | 'MODERATE_VALUE' | 'LOW_VALUE' | 'BLOCKED';

export interface CustomerValueScenarioDefinition {
  id: string;
  category: CustomerValueScenarioCategory;
  question: string;
}

export interface CustomerValueScenarioResult {
  id: string;
  category: CustomerValueScenarioCategory;
  score: number;
  passed: boolean;
  valueSignals: string[];
  valueRisks: string[];
  findings: string[];
  recommendations: string[];
}

export interface CustomerValueAssessment {
  readOnly: true;
  advisoryOnly: true;
  customerValueScore: number;
  retentionValueScore: number;
  valueRiskScore: number;
  criticalValueFailures: number;
  blocksLaunchReadiness: boolean;
  readinessState: CustomerValueReadinessState;
  scenarioResults: CustomerValueScenarioResult[];
  findings: string[];
  valueSignals: string[];
  valueRisks: string[];
  recommendations: string[];
  cacheKey: string;
}
