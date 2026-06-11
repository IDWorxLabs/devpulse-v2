/**
 * Trust Authority — bounded deterministic trust scenarios.
 */

import type { TrustScenarioDefinition } from './trust-authority-types.js';

export const TRUST_SCENARIOS: readonly TrustScenarioDefinition[] = [
  {
    id: 'evidence-trust',
    category: 'EVIDENCE_TRUST',
    question: 'What proof supports this claim?',
  },
  {
    id: 'honesty-trust',
    category: 'HONESTY_TRUST',
    question: 'Does the system admit uncertainty?',
  },
  {
    id: 'readiness-trust',
    category: 'READINESS_TRUST',
    question: 'Are launch claims supported?',
  },
  {
    id: 'intelligence-trust',
    category: 'INTELLIGENCE_TRUST',
    question: 'Should users trust the intelligence output?',
  },
  {
    id: 'transparency-trust',
    category: 'TRANSPARENCY_TRUST',
    question: 'Can users understand why conclusions were reached?',
  },
] as const;
