/**
 * Self-Awareness Authority — assessment types.
 */

export type SelfAwarenessScenarioCategory =
  | 'CAPABILITY_AWARENESS'
  | 'LIMITATION_AWARENESS'
  | 'DEPENDENCY_AWARENESS'
  | 'LAUNCH_AWARENESS'
  | 'EVIDENCE_AWARENESS'
  | 'REALITY_AWARENESS';

export type SelfAwarenessReadinessState = 'SELF_AWARE' | 'PARTIALLY_AWARE' | 'LIMITED_AWARENESS' | 'BLOCKED';

export interface SelfAwarenessScenarioDefinition {
  id: string;
  category: SelfAwarenessScenarioCategory;
  question: string;
}

export interface SelfAwarenessScenarioResult {
  id: string;
  category: SelfAwarenessScenarioCategory;
  score: number;
  passed: boolean;
  findings: string[];
  limitations: string[];
  recommendations: string[];
}

export interface SelfAwarenessAssessment {
  readOnly: true;
  selfAwarenessScore: number;
  selfAwarenessRiskScore: number;
  criticalAwarenessFailures: number;
  blocksLaunchReadiness: boolean;
  readinessState: SelfAwarenessReadinessState;
  scenarioResults: SelfAwarenessScenarioResult[];
  criticalAwarenessFailureDetails: string[];
  findings: string[];
  limitations: string[];
  recommendations: string[];
  cacheKey: string;
}
