/**
 * Skeptical Founder Simulator — bounded adversarial scenarios.
 */

import type { SkepticalFounderScenarioDefinition } from './skeptical-founder-types.js';

export const SKEPTICAL_FOUNDER_SCENARIOS: readonly SkepticalFounderScenarioDefinition[] = [
  {
    id: 'trust-challenge',
    category: 'TRUST_CHALLENGE',
    question: 'Why should I trust this? What proof exists? What evidence supports the claims?',
  },
  {
    id: 'intelligence-challenge',
    category: 'INTELLIGENCE_CHALLENGE',
    question: 'Is the intelligence genuinely useful? Does it answer correctly? Does it understand intent?',
  },
  {
    id: 'purpose-challenge',
    category: 'PURPOSE_CHALLENGE',
    question: 'Why does this product exist? What problem does it solve? Who is it for?',
  },
  {
    id: 'launch-challenge',
    category: 'LAUNCH_CHALLENGE',
    question: 'Why is this ready? What would fail after launch? What risks remain?',
  },
  {
    id: 'competitive-challenge',
    category: 'COMPETITIVE_CHALLENGE',
    question: 'Why would someone choose this? What is unique? What advantage exists?',
  },
  {
    id: 'honesty-challenge',
    category: 'HONESTY_CHALLENGE',
    question: 'What does the system not know? What cannot be verified? What assumptions exist?',
  },
] as const;
