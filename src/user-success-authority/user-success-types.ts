/**
 * User Success Authority — assessment types.
 */

export type UserSuccessGoalCategory =
  | 'UNDERSTANDING_GOAL'
  | 'PLANNING_GOAL'
  | 'PROBLEM_SOLVING_GOAL'
  | 'BUILD_GOAL'
  | 'LAUNCH_GOAL'
  | 'CONFIDENCE_GOAL';

export type UserSuccessReadinessState = 'USERS_SUCCEED' | 'PARTIAL_SUCCESS' | 'HIGH_FAILURE_RISK' | 'BLOCKED';

export interface UserSuccessScenarioDefinition {
  id: string;
  category: UserSuccessGoalCategory;
  userGoal: string;
  question: string;
}

export interface UserSuccessScenarioResult {
  id: string;
  category: UserSuccessGoalCategory;
  userGoal: string;
  score: number;
  passed: boolean;
  blockers: string[];
  findings: string[];
  recommendations: string[];
}

export interface UserSuccessAssessment {
  readOnly: true;
  userSuccessScore: number;
  outcomeAchievementScore: number;
  failedGoalCount: number;
  criticalSuccessFailures: number;
  blocksLaunchReadiness: boolean;
  readinessState: UserSuccessReadinessState;
  scenarioResults: UserSuccessScenarioResult[];
  criticalSuccessFailureDetails: string[];
  findings: string[];
  blockers: string[];
  recommendations: string[];
  cacheKey: string;
}
