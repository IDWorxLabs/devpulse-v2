/**
 * Customer Value Authority — bounded scenario definitions.
 */

import type { CustomerValueScenarioDefinition } from './customer-value-types.js';

export const CUSTOMER_VALUE_SCENARIOS: readonly CustomerValueScenarioDefinition[] = [
  {
    id: 'problem-value',
    category: 'PROBLEM_VALUE',
    question: 'Does this solve a meaningful problem?',
  },
  {
    id: 'outcome-value',
    category: 'OUTCOME_VALUE',
    question: 'Does the user leave with something valuable?',
  },
  {
    id: 'time-value',
    category: 'TIME_VALUE',
    question: 'Does this save meaningful time?',
  },
  {
    id: 'trust-value',
    category: 'TRUST_VALUE',
    question: 'Does trust increase value?',
  },
  {
    id: 'repeat-usage-value',
    category: 'REPEAT_USAGE_VALUE',
    question: 'Would users return tomorrow?',
  },
  {
    id: 'differentiation-value',
    category: 'DIFFERENTIATION_VALUE',
    question: 'Why use this instead of alternatives?',
  },
] as const;
