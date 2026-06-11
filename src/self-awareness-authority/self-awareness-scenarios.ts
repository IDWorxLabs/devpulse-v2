/**
 * Self-Awareness Authority — bounded deterministic awareness scenarios.
 */

import type { SelfAwarenessScenarioDefinition } from './self-awareness-types.js';

export const SELF_AWARENESS_SCENARIOS: readonly SelfAwarenessScenarioDefinition[] = [
  {
    id: 'capability-awareness',
    category: 'CAPABILITY_AWARENESS',
    question: 'What can the system actually do?',
  },
  {
    id: 'limitation-awareness',
    category: 'LIMITATION_AWARENESS',
    question: 'What can the system not do?',
  },
  {
    id: 'dependency-awareness',
    category: 'DEPENDENCY_AWARENESS',
    question: 'What does the system depend on?',
  },
  {
    id: 'launch-awareness',
    category: 'LAUNCH_AWARENESS',
    question: 'What currently blocks launch?',
  },
  {
    id: 'evidence-awareness',
    category: 'EVIDENCE_AWARENESS',
    question: 'What is proven and what is not proven?',
  },
  {
    id: 'reality-awareness',
    category: 'REALITY_AWARENESS',
    question: 'What is the actual state of the product?',
  },
] as const;
