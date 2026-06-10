/**
 * Product Reality Orchestrator — roadmap builder.
 */

import type { FounderPriority, ProductRealityRoadmap } from './product-reality-types.js';
import { PRODUCT_REALITY_ROADMAP_PASS } from './product-reality-types.js';
import type { FounderPriorityResult } from './product-reality-types.js';
import { getCachedProductRealityRoadmap, setCachedProductRealityRoadmap } from './product-reality-cache.js';

let roadmapBuildCount = 0;

function takeBounded(list: FounderPriority[], max: number): FounderPriority[] {
  return list.slice(0, max);
}

export function buildProductRealityRoadmap(
  requestId: string,
  priorities: FounderPriorityResult,
): ProductRealityRoadmap {
  const cacheKey = [requestId, priorities.priorities.length].join('|');
  const cached = getCachedProductRealityRoadmap(cacheKey);
  if (cached) return cached;

  roadmapBuildCount += 1;
  const seen = new Set<string>();

  const critical = takeBounded(
    priorities.priorities.filter((p) => p.tier === 'CRITICAL'),
    12,
  );
  for (const p of critical) seen.add(p.priorityId);

  const highPriority = takeBounded(
    priorities.priorities.filter((p) => !seen.has(p.priorityId) && p.tier === 'HIGH'),
    12,
  );
  for (const p of highPriority) seen.add(p.priorityId);

  const mediumPriority = takeBounded(
    priorities.priorities.filter((p) => !seen.has(p.priorityId) && p.tier === 'MEDIUM'),
    12,
  );
  for (const p of mediumPriority) seen.add(p.priorityId);

  const futurePolish = takeBounded(
    priorities.priorities.filter((p) => !seen.has(p.priorityId) && p.tier === 'FUTURE'),
    12,
  );
  for (const p of futurePolish) seen.add(p.priorityId);

  const launchTasks = takeBounded(
    priorities.priorities.filter((p) => !seen.has(p.priorityId) && p.tier === 'LAUNCH'),
    12,
  );

  const result: ProductRealityRoadmap = {
    critical,
    highPriority,
    mediumPriority,
    futurePolish,
    launchTasks,
    passToken: PRODUCT_REALITY_ROADMAP_PASS,
  };
  setCachedProductRealityRoadmap(cacheKey, result);
  return result;
}

export function getRoadmapBuildCount(): number {
  return roadmapBuildCount;
}

export function resetProductRealityRoadmapBuilderForTests(): void {
  roadmapBuildCount = 0;
}
