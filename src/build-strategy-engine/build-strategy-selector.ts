/**
 * Build Strategy Engine — build strategy selector (category resolution).
 */

import type { BuildStrategyCategory } from './build-strategy-types.js';
import { TRACKED_BUILD_STRATEGY_CATEGORIES } from './build-strategy-types.js';

export function selectBuildStrategyCategory(
  strategyName: string,
  fallback: BuildStrategyCategory = 'GENERAL_BUILD_STRATEGY',
): BuildStrategyCategory {
  const lower = strategyName.toLowerCase();

  const matchers: Array<{ keywords: string[]; category: BuildStrategyCategory }> = [
    { keywords: ['general'], category: 'GENERAL_BUILD_STRATEGY' },
    { keywords: ['project'], category: 'PROJECT_BUILD_STRATEGY' },
    { keywords: ['feature'], category: 'FEATURE_BUILD_STRATEGY' },
    { keywords: ['bugfix', 'fixing', 'fix'], category: 'BUGFIX_BUILD_STRATEGY' },
    { keywords: ['refactor'], category: 'REFACTOR_BUILD_STRATEGY' },
    { keywords: ['ui'], category: 'UI_BUILD_STRATEGY' },
    { keywords: ['backend'], category: 'BACKEND_BUILD_STRATEGY' },
    { keywords: ['full stack', 'fullstack'], category: 'FULL_STACK_BUILD_STRATEGY' },
    { keywords: ['cloud'], category: 'CLOUD_BUILD_STRATEGY' },
    { keywords: ['world 2', 'world2'], category: 'WORLD2_BUILD_STRATEGY' },
    { keywords: ['aidev'], category: 'AIDEV_BUILD_STRATEGY' },
    { keywords: ['autonomous'], category: 'AUTONOMOUS_BUILD_STRATEGY' },
    { keywords: ['founder'], category: 'FOUNDER_GUIDED_BUILD_STRATEGY' },
    { keywords: ['self evolution', 'evolution'], category: 'SELF_EVOLUTION_BUILD_STRATEGY' },
    { keywords: ['verification', 'testing'], category: 'FEATURE_BUILD_STRATEGY' },
  ];

  for (const { keywords, category } of matchers) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }

  return TRACKED_BUILD_STRATEGY_CATEGORIES.includes(fallback) ? fallback : 'GENERAL_BUILD_STRATEGY';
}

export function resolveCategoryFromAutonomousBuildName(buildName: string): BuildStrategyCategory {
  return selectBuildStrategyCategory(buildName.replace('Autonomous Build', 'Build Strategy'));
}
