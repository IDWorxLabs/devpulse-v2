/**
 * UI Reviewer Authority — assessment types.
 */

export type UIReviewerCategory =
  | 'NAVIGATION_REVIEW'
  | 'FEATURE_DISCOVERABILITY'
  | 'LAYOUT_HIERARCHY'
  | 'FIRST_TIME_USER_PERSPECTIVE'
  | 'WORKFLOW_REVIEW'
  | 'MISSING_SCREEN_REVIEW';

export type UIReviewerReadinessState =
  | 'UI_EXCELLENT'
  | 'UI_GOOD'
  | 'UI_CONFUSING'
  | 'UI_HIGH_RISK'
  | 'UI_BLOCKED';

export interface UIReviewerScenarioDefinition {
  id: string;
  category: UIReviewerCategory;
  question: string;
}

export interface UIReviewerScenarioResult {
  id: string;
  category: UIReviewerCategory;
  score: number;
  passed: boolean;
  criticalFailure: boolean;
  findings: string[];
  uiRisks: string[];
  recommendations: string[];
}

export interface UIReviewerAssessment {
  readOnly: true;
  advisoryOnly: true;
  uiReviewScore: number;
  usabilityScore: number;
  navigationScore: number;
  discoverabilityScore: number;
  clarityScore: number;
  hierarchyScore: number;
  firstTimeUserScore: number;
  criticalUiFailures: number;
  uiRisks: string[];
  uiRecommendations: string[];
  blocksLaunchReadiness: boolean;
  readinessState: UIReviewerReadinessState;
  scenarioResults: UIReviewerScenarioResult[];
  cacheKey: string;
}
