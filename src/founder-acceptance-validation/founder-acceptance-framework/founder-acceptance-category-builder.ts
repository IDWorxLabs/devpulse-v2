/**
 * Founder Acceptance Framework — founder acceptance category builder.
 */

import type { CategoryRegistry, FounderAcceptanceCategory } from './founder-acceptance-types.js';
import { CATEGORY_REGISTRY_PASS } from './founder-acceptance-types.js';
import type { CriteriaRegistry } from './founder-acceptance-types.js';
import { getCachedCategoryRegistry, setCachedCategoryRegistry } from './founder-acceptance-cache.js';

const CATEGORY_DEFINITIONS: Omit<FounderAcceptanceCategory, 'acceptanceCriteria'>[] = [
  {
    categoryId: 'WORKFLOW_ACCEPTANCE',
    categoryName: 'Workflow Acceptance',
    relatedDimensions: ['FOUNDER_CONTINUITY', 'FOUNDER_PRODUCTIVITY', 'FOUNDER_CONTROL'],
  },
  {
    categoryId: 'TRUST_ACCEPTANCE',
    categoryName: 'Trust Acceptance',
    relatedDimensions: ['FOUNDER_TRUST', 'FOUNDER_CONFIDENCE', 'FOUNDER_RELIABILITY'],
  },
  {
    categoryId: 'PRODUCT_ACCEPTANCE',
    categoryName: 'Product Acceptance',
    relatedDimensions: ['FOUNDER_UNDERSTANDING', 'FOUNDER_ACCEPTANCE', 'FOUNDER_CLARITY'],
  },
  {
    categoryId: 'PRODUCTIVITY_ACCEPTANCE',
    categoryName: 'Productivity Acceptance',
    relatedDimensions: ['FOUNDER_PRODUCTIVITY', 'FOUNDER_CONTROL', 'FOUNDER_VISIBILITY'],
  },
  {
    categoryId: 'RELIABILITY_ACCEPTANCE',
    categoryName: 'Reliability Acceptance',
    relatedDimensions: ['FOUNDER_RELIABILITY', 'FOUNDER_TRUST', 'FOUNDER_CONTINUITY'],
  },
  {
    categoryId: 'VISIBILITY_ACCEPTANCE',
    categoryName: 'Visibility Acceptance',
    relatedDimensions: ['FOUNDER_VISIBILITY', 'FOUNDER_CLARITY', 'FOUNDER_UNDERSTANDING'],
  },
  {
    categoryId: 'LAUNCH_ACCEPTANCE',
    categoryName: 'Launch Acceptance',
    relatedDimensions: ['FOUNDER_ACCEPTANCE', 'FOUNDER_CONFIDENCE', 'FOUNDER_RELIABILITY'],
  },
];

let categoryBuilds = 0;

function mapCriteriaToCategory(
  categoryId: FounderAcceptanceCategory['categoryId'],
  criteria: CriteriaRegistry,
): string[] {
  const groupMap: Record<FounderAcceptanceCategory['categoryId'], string[]> = {
    WORKFLOW_ACCEPTANCE: ['CONTINUITY_CRITERIA', 'PRODUCTIVITY_CRITERIA', 'CONTROL_CRITERIA'],
    TRUST_ACCEPTANCE: ['TRUST_CRITERIA', 'CONFIDENCE_CRITERIA', 'RELIABILITY_CRITERIA'],
    PRODUCT_ACCEPTANCE: ['UNDERSTANDING_CRITERIA', 'CLARITY_CRITERIA'],
    PRODUCTIVITY_ACCEPTANCE: ['PRODUCTIVITY_CRITERIA', 'CONTROL_CRITERIA'],
    RELIABILITY_ACCEPTANCE: ['RELIABILITY_CRITERIA', 'TRUST_CRITERIA'],
    VISIBILITY_ACCEPTANCE: ['VISIBILITY_CRITERIA', 'CLARITY_CRITERIA'],
    LAUNCH_ACCEPTANCE: ['CONFIDENCE_CRITERIA', 'RELIABILITY_CRITERIA', 'CLARITY_CRITERIA'],
  };
  const groupIds = groupMap[categoryId];
  const ids: string[] = [];
  for (const group of criteria.groups) {
    if (groupIds.includes(group.groupId)) {
      for (const c of group.criteria) {
        ids.push(c.criterionId);
      }
    }
  }
  return ids.slice(0, 12);
}

export function buildCategoryRegistry(requestId: string, criteria: CriteriaRegistry): CategoryRegistry {
  const cacheKey = `categories-${requestId}-${criteria.totalCriteria}`;
  const cached = getCachedCategoryRegistry(cacheKey);
  if (cached) return cached;

  categoryBuilds += 1;
  const categories: FounderAcceptanceCategory[] = CATEGORY_DEFINITIONS.map((def) => ({
    ...def,
    acceptanceCriteria: mapCriteriaToCategory(def.categoryId, criteria),
  }));

  const result: CategoryRegistry = {
    categories,
    passToken: CATEGORY_REGISTRY_PASS,
  };
  setCachedCategoryRegistry(cacheKey, result);
  return result;
}

export function getCategoryBuilds(): number {
  return categoryBuilds;
}

export function resetFounderAcceptanceCategoryBuilderForTests(): void {
  categoryBuilds = 0;
}
