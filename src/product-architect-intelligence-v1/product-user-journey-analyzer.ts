/**
 * Product Architect Intelligence V1 — user journey review.
 */

import { matchesAnyPattern, resolveProductPattern } from './product-pattern-registry.js';
import type { ProductArchitectDomain, UserJourneyFinding } from './product-architect-intelligence-types.js';

export function analyzeUserJourneys(input: {
  evidenceText: string;
  domain: ProductArchitectDomain;
}): UserJourneyFinding[] {
  const pattern = resolveProductPattern(input.domain);
  if (!pattern) return [];

  return pattern.expectedJourneys.map((journeyDef) => {
    const missingActions = journeyDef.requiredActions
      .filter((action) => !matchesAnyPattern(input.evidenceText, action.detectionPatterns))
      .map((action) => action.label);

    const deadEnds: string[] = [];
    const confusingNavigation: string[] = [];

    if (missingActions.length > 0 && !/\b(nav|navigation|menu|sidebar|route)\b/i.test(input.evidenceText)) {
      confusingNavigation.push('Navigation structure not evidenced — journey may be hard to discover.');
    }

    if (missingActions.length === journeyDef.requiredActions.length) {
      deadEnds.push(`${journeyDef.journeyType} has no evidenced entry actions.`);
    }

    const complete = missingActions.length === 0;
    return {
      readOnly: true,
      journeyType: journeyDef.journeyType,
      complete,
      deadEnds,
      missingActions,
      confusingNavigation,
      broken: missingActions.length === journeyDef.requiredActions.length,
    };
  });
}
