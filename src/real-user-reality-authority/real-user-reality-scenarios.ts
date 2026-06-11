/**
 * Real User Reality Authority — bounded evaluation categories.
 */

import type { RealUserRealityScenarioDefinition } from './real-user-reality-types.js';

export const REAL_USER_REALITY_SCENARIOS: readonly RealUserRealityScenarioDefinition[] = [
  {
    id: 'user-understanding',
    category: 'USER_UNDERSTANDING',
    question: 'Can users explain what the product is, what it does, and why it exists without assistance?',
  },
  {
    id: 'user-success',
    category: 'USER_SUCCESS',
    question: 'Can users complete intended goals such as creating a project or using chat effectively?',
  },
  {
    id: 'user-confusion',
    category: 'USER_CONFUSION',
    question: 'Where do users get lost due to terminology, hidden workflows, or overwhelming information?',
  },
  {
    id: 'user-trust',
    category: 'USER_TRUST',
    question: 'Do users trust launch recommendations, readiness verdicts, and authority conclusions?',
  },
  {
    id: 'user-retention',
    category: 'USER_RETENTION',
    question: 'Would users come back tomorrow based on observed outcomes?',
  },
] as const;

export const MAX_REAL_USER_CATEGORIES = REAL_USER_REALITY_SCENARIOS.length;
