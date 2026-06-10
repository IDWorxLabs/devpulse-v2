/**
 * Founder Acceptance Framework — founder acceptance report model.
 */

import type { FounderAcceptanceReportModel } from './founder-acceptance-types.js';
import { REPORT_MODEL_PASS } from './founder-acceptance-types.js';
import { getCachedReportModel, setCachedReportModel } from './founder-acceptance-cache.js';

let reportModelBuilds = 0;

export function buildFounderAcceptanceReportModel(requestId: string): FounderAcceptanceReportModel {
  const cacheKey = `report-model-${requestId}`;
  const cached = getCachedReportModel(cacheKey);
  if (cached) return cached;

  reportModelBuilds += 1;
  const result: FounderAcceptanceReportModel = {
    supportsSummary: true,
    supportsDimensions: true,
    supportsCriteria: true,
    supportsCategories: true,
    supportsEvidence: true,
    supportsScores: true,
    supportsRecommendations: true,
    supportsFutureVerdicts: true,
    futureVerdictPlaceholders: [
      'FOUNDER_ACCEPTABLE',
      'FOUNDER_ACCEPTABLE_WITH_WARNINGS',
      'FOUNDER_NOT_ACCEPTABLE',
      'FOUNDER_LAUNCH_ACCEPTABLE',
    ],
    sectionOrder: [
      'summary',
      'dimensions',
      'criteria',
      'categories',
      'evidence',
      'scores',
      'recommendations',
      'futureVerdict',
    ],
    passToken: REPORT_MODEL_PASS,
  };
  setCachedReportModel(cacheKey, result);
  return result;
}

export function getReportModelBuilds(): number {
  return reportModelBuilds;
}

export function resetFounderAcceptanceReportModelForTests(): void {
  reportModelBuilds = 0;
}
