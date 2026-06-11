/**
 * User Success Authority — bounded deterministic user goal scenarios.
 */

import type { UserSuccessScenarioDefinition } from './user-success-types.js';

export const USER_SUCCESS_SCENARIOS: readonly UserSuccessScenarioDefinition[] = [
  {
    id: 'understanding-goal',
    category: 'UNDERSTANDING_GOAL',
    userGoal: 'Understand what this product is',
    question: 'Can users understand what this product is?',
  },
  {
    id: 'planning-goal',
    category: 'PLANNING_GOAL',
    userGoal: 'Plan what they want to build',
    question: 'Can users plan what they want to build?',
  },
  {
    id: 'problem-solving-goal',
    category: 'PROBLEM_SOLVING_GOAL',
    userGoal: 'Solve problems with the system',
    question: 'Can users solve problems with the system?',
  },
  {
    id: 'build-goal',
    category: 'BUILD_GOAL',
    userGoal: 'Make progress toward creating software',
    question: 'Can users make progress toward creating software?',
  },
  {
    id: 'launch-goal',
    category: 'LAUNCH_GOAL',
    userGoal: 'Determine launch readiness',
    question: 'Can users determine launch readiness?',
  },
  {
    id: 'confidence-goal',
    category: 'CONFIDENCE_GOAL',
    userGoal: 'Leave with more confidence than they started',
    question: 'Do users leave with more confidence than they started with?',
  },
] as const;
