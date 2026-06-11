/**
 * Gap Detection Authority — bounded gap category definitions.
 */

import type { GapCategoryDefinition } from './gap-detection-types.js';

export const GAP_DETECTION_CATEGORIES: readonly GapCategoryDefinition[] = [
  {
    id: 'capability-gaps',
    category: 'CAPABILITY_GAPS',
    question: 'What capability is missing?',
  },
  {
    id: 'trust-gaps',
    category: 'TRUST_GAPS',
    question: 'What trust-related capability is missing?',
  },
  {
    id: 'intelligence-gaps',
    category: 'INTELLIGENCE_GAPS',
    question: 'What intelligence capability is missing?',
  },
  {
    id: 'readiness-gaps',
    category: 'READINESS_GAPS',
    question: 'What prevents launch readiness?',
  },
  {
    id: 'product-gaps',
    category: 'PRODUCT_GAPS',
    question: 'What prevents product success?',
  },
  {
    id: 'dependency-gaps',
    category: 'DEPENDENCY_GAPS',
    question: 'What dependency is missing or weak?',
  },
] as const;
