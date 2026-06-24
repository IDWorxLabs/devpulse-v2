/**
 * AiDevEngine Capability Audit V3 — recommended roadmap (recalculated from evidence).
 */

import type { RoadmapPriority } from './capability-audit-types.js';
import { buildRoadmapFromEvidence } from './gap-priority-calculator.js';
import { buildMissingCapabilitiesReport } from './missing-capabilities.js';
import { loadUvlEvidenceSnapshot } from './uvl-evidence-loader.js';

export function buildRecommendedRoadmap(input?: {
  projectRootDir?: string;
  productionReadinessScore?: number;
  codeGenerationMaturityScore?: number;
}): {
  priorities: readonly RoadmapPriority[];
  world2IsNextPhase: boolean;
  nextPriority: string;
  highestPriorityGap: string;
} {
  const uvlEvidence = loadUvlEvidenceSnapshot(input?.projectRootDir);
  const missingReport = buildMissingCapabilitiesReport(input);

  const roadmap = buildRoadmapFromEvidence({
    missingEntries: missingReport.entries,
    productionReadinessScore: input?.productionReadinessScore ?? 33,
    codeGenerationMaturityScore: input?.codeGenerationMaturityScore ?? 58,
    uvlEvidence,
    projectRootDir: input?.projectRootDir,
  });

  return {
    ...roadmap,
    highestPriorityGap: missingReport.highestPriorityGap,
  };
}

/** @deprecated Use buildRecommendedRoadmap() for evidence-driven ranking. */
export const RECOMMENDED_ROADMAP_V3: readonly RoadmapPriority[] = buildRecommendedRoadmap().priorities;
