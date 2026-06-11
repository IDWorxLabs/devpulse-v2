/**
 * First-Time User Reality Authority — bounded scenario definitions.
 */

import type { FirstTimeUserScenarioDefinition } from './first-time-user-reality-types.js';

export const FIRST_TIME_USER_REALITY_SCENARIOS: readonly FirstTimeUserScenarioDefinition[] = [
  {
    id: 'product-understanding',
    category: 'PRODUCT_UNDERSTANDING',
    question: 'Can a new user understand what this product is?',
  },
  {
    id: 'capability-understanding',
    category: 'CAPABILITY_UNDERSTANDING',
    question: 'Can a new user understand what it can do?',
  },
  {
    id: 'workflow-understanding',
    category: 'WORKFLOW_UNDERSTANDING',
    question: 'Can a new user understand what to do next?',
  },
  {
    id: 'confidence-understanding',
    category: 'CONFIDENCE_UNDERSTANDING',
    question: 'Would a new user feel confident using it?',
  },
  {
    id: 'success-understanding',
    category: 'SUCCESS_UNDERSTANDING',
    question: 'Can a new user understand how success is achieved?',
  },
  {
    id: 'launch-impression',
    category: 'LAUNCH_IMPRESSION',
    question: 'What impression would the first five minutes create?',
  },
] as const;
