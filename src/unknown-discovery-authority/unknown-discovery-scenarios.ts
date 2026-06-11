/**
 * Unknown Discovery Authority — bounded discovery category definitions.
 */

import type { UnknownDiscoveryCategoryDefinition } from './unknown-discovery-types.js';

export const UNKNOWN_DISCOVERY_CATEGORIES: readonly UnknownDiscoveryCategoryDefinition[] = [
  {
    id: 'untested-user-behavior',
    category: 'UNTESTED_USER_BEHAVIOR',
    question: 'What might a real user do that we are not testing?',
  },
  {
    id: 'edge-case-discovery',
    category: 'EDGE_CASE',
    question: 'What edge cases may break confidence?',
  },
  {
    id: 'contradiction-discovery',
    category: 'CONTRADICTION',
    question: 'What contradictions may exist between authorities?',
  },
  {
    id: 'coverage-gap-discovery',
    category: 'COVERAGE_GAP',
    question: 'What important areas are not yet covered by an authority?',
  },
  {
    id: 'assumption-risk-discovery',
    category: 'ASSUMPTION_RISK',
    question: 'What assumptions are being treated as facts?',
  },
  {
    id: 'launch-blind-spot-discovery',
    category: 'LAUNCH_BLIND_SPOT',
    question: 'What could still damage launch confidence?',
  },
] as const;

/** Bounded evaluation coverage areas not yet represented by Launch Council authorities. */
export const BOUNDED_UNCOVERED_AREAS = [
  {
    id: 'mobile-runtime-readiness',
    title: 'Mobile runtime readiness',
    recommendedTest: 'Add bounded mobile runtime readiness scenarios before mobile launch claims.',
  },
  {
    id: 'deployment-readiness',
    title: 'Deployment readiness',
    recommendedTest: 'Add deployment readiness checks covering publish, rollback, and environment proof.',
  },
  {
    id: 'customer-onboarding-readiness',
    title: 'Customer onboarding readiness',
    recommendedTest: 'Add first-customer onboarding scenarios beyond founder-only paths.',
  },
  {
    id: 'competitive-comparison-coverage',
    title: 'Competitive comparison coverage',
    recommendedTest: 'Add skeptical comparison scenarios for positioning and differentiation claims.',
  },
  {
    id: 'real-user-feedback-coverage',
    title: 'Real user feedback coverage',
    recommendedTest: 'Add bounded real-user feedback replay before public beta confidence.',
  },
] as const;
