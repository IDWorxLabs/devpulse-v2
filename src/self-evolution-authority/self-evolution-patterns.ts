/**
 * Self-Evolution Authority — bounded evolution category definitions.
 */

import type { SelfEvolutionPatternDefinition } from './self-evolution-types.js';

export const SELF_EVOLUTION_PATTERNS: readonly SelfEvolutionPatternDefinition[] = [
  {
    id: 'chat-intelligence-evolution',
    category: 'CHAT_INTELLIGENCE',
    question: 'What keeps failing in chat intelligence?',
    recommendedEvolutions: [
      'Improve routing',
      'Improve context access',
      'Improve response evaluation',
      'Improve purpose understanding',
    ],
  },
  {
    id: 'trust-evolution',
    category: 'TRUST',
    question: 'What trust capability must evolve after repeated failure?',
    recommendedEvolutions: [
      'Improve evidence visibility',
      'Improve uncertainty reporting',
      'Improve proof mapping',
    ],
  },
  {
    id: 'user-success-evolution',
    category: 'USER_SUCCESS',
    question: 'What user success path must evolve next?',
    recommendedEvolutions: [
      'Improve onboarding',
      'Improve next-step guidance',
      'Improve goal completion flow',
    ],
  },
  {
    id: 'promise-fulfillment-evolution',
    category: 'PROMISE_FULFILLMENT',
    question: 'What promise path must evolve instead of repeating fixes?',
    recommendedEvolutions: [
      'Build missing capability',
      'Reduce claim',
      'Add proof path',
      'Connect verification source',
    ],
  },
  {
    id: 'gap-detection-evolution',
    category: 'GAP_DETECTION',
    question: 'What missing capability keeps reappearing?',
    recommendedEvolutions: [
      'Create missing authority',
      'Connect missing dependency',
      'Improve validation coverage',
    ],
  },
  {
    id: 'repository-integrity-evolution',
    category: 'REPOSITORY_INTEGRITY',
    question: 'What repository integrity capability must evolve?',
    recommendedEvolutions: [
      'Persist baseline',
      'Improve typecheck bridge',
      'Add compile health visibility',
    ],
  },
  {
    id: 'launch-readiness-evolution',
    category: 'LAUNCH_READINESS',
    question: 'What launch readiness capability must evolve next?',
    recommendedEvolutions: [
      'Add launch decision authority',
      'Improve blocker evidence',
      'Improve readiness synthesis',
    ],
  },
  {
    id: 'self-awareness-evolution',
    category: 'SELF_AWARENESS',
    question: 'What self-awareness capability must evolve?',
    recommendedEvolutions: [
      'Improve state introspection',
      'Improve limitation registry',
      'Improve dependency awareness',
    ],
  },
] as const;
