/**
 * First-Time User Reality Authority — assessment types.
 */

export type FirstTimeUserScenarioCategory =
  | 'PRODUCT_UNDERSTANDING'
  | 'CAPABILITY_UNDERSTANDING'
  | 'WORKFLOW_UNDERSTANDING'
  | 'CONFIDENCE_UNDERSTANDING'
  | 'SUCCESS_UNDERSTANDING'
  | 'LAUNCH_IMPRESSION';

export type FirstTimeUserReadinessState =
  | 'CLEAR_AND_USABLE'
  | 'MINOR_CONFUSION'
  | 'HIGH_CONFUSION'
  | 'BLOCKED';

export interface FirstTimeUserScenarioDefinition {
  id: string;
  category: FirstTimeUserScenarioCategory;
  question: string;
}

export interface FirstTimeUserScenarioResult {
  id: string;
  category: FirstTimeUserScenarioCategory;
  score: number;
  passed: boolean;
  confusionPoints: string[];
  blockers: string[];
  findings: string[];
  recommendations: string[];
}

export interface FirstTimeUserRealityAssessment {
  readOnly: true;
  advisoryOnly: true;
  firstTimeUserScore: number;
  confusionScore: number;
  blockerCount: number;
  criticalConfusionCount: number;
  blocksLaunchReadiness: boolean;
  readinessState: FirstTimeUserReadinessState;
  scenarioResults: FirstTimeUserScenarioResult[];
  findings: string[];
  confusionPoints: string[];
  blockers: string[];
  recommendations: string[];
  cacheKey: string;
}
