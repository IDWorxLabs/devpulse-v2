/**
 * Founder Acceptance Framework — authority builder.
 */

import type {
  CategoryRegistry,
  CriteriaRegistry,
  DimensionRegistry,
  FounderAcceptanceEvidenceModel,
  FounderAcceptanceFrameworkAuthority,
  FounderAcceptanceFutureRoadmap,
  FounderAcceptanceReportModel,
  FounderAcceptanceScoreModel,
} from './founder-acceptance-types.js';
import { AUTHORITY_PASS, ROADMAP_PASS } from './founder-acceptance-types.js';
import { getCachedFrameworkAuthority, setCachedFrameworkAuthority, getCachedFutureRoadmap, setCachedFutureRoadmap } from './founder-acceptance-cache.js';

let authorityBuilds = 0;
let authorityCounter = 0;
let roadmapBuilds = 0;

export function buildFounderAcceptanceFutureRoadmap(requestId: string): FounderAcceptanceFutureRoadmap {
  const cacheKey = `roadmap-${requestId}`;
  const cached = getCachedFutureRoadmap(cacheKey);
  if (cached) return cached;

  roadmapBuilds += 1;
  const result: FounderAcceptanceFutureRoadmap = {
    futurePhases: [
      { phaseId: 'FOUNDER_WORKFLOW_VALIDATION', phaseNumber: 24.82, moduleName: 'founder-workflow-validation', integrationTarget: 'WORKFLOW_ACCEPTANCE', description: 'Validate founder daily workflow paths' },
      { phaseId: 'FOUNDER_CONFIDENCE_ENGINE', phaseNumber: 24.83, moduleName: 'founder-confidence-engine', integrationTarget: 'CONFIDENCE_CRITERIA', description: 'Evaluate founder confidence in recommendations' },
      { phaseId: 'FOUNDER_TRUST_VALIDATION', phaseNumber: 24.84, moduleName: 'founder-trust-validation', integrationTarget: 'TRUST_ACCEPTANCE', description: 'Validate founder trust continuity' },
      { phaseId: 'FOUNDER_PRODUCTIVITY_VALIDATION', phaseNumber: 24.85, moduleName: 'founder-productivity-validation', integrationTarget: 'PRODUCTIVITY_ACCEPTANCE', description: 'Validate founder operational productivity' },
      { phaseId: 'FOUNDER_FRICTION_DETECTOR', phaseNumber: 24.86, moduleName: 'founder-friction-detector', integrationTarget: 'FRICTION_EVIDENCE', description: 'Detect and classify founder friction' },
      { phaseId: 'FOUNDER_READINESS_AUTHORITY', phaseNumber: 24.87, moduleName: 'founder-readiness-authority', integrationTarget: 'LAUNCH_ACCEPTANCE', description: 'Founder launch readiness authority' },
      { phaseId: 'FOUNDER_ACCEPTANCE_ORCHESTRATOR', phaseNumber: 24.88, moduleName: 'founder-acceptance-orchestrator', integrationTarget: 'FOUNDER_ACCEPTANCE', description: 'Final founder acceptance orchestration' },
    ],
    passToken: ROADMAP_PASS,
  };
  setCachedFutureRoadmap(cacheKey, result);
  return result;
}

export function buildFounderAcceptanceFrameworkAuthority(
  requestId: string,
  dimensions: DimensionRegistry,
  criteria: CriteriaRegistry,
  categories: CategoryRegistry,
  evidenceModel: FounderAcceptanceEvidenceModel,
  scoreModel: FounderAcceptanceScoreModel,
  reportModel: FounderAcceptanceReportModel,
): FounderAcceptanceFrameworkAuthority {
  const cacheKey = [
    requestId,
    dimensions.dimensions.length,
    criteria.totalCriteria,
    categories.categories.length,
  ].join('|');
  const cached = getCachedFrameworkAuthority(cacheKey);
  if (cached) return cached;

  authorityBuilds += 1;
  authorityCounter += 1;
  const futureRoadmap = buildFounderAcceptanceFutureRoadmap(requestId);

  const authority: FounderAcceptanceFrameworkAuthority = {
    authorityId: `founder-acceptance-authority-${authorityCounter}`,
    dimensions,
    criteria,
    categories,
    evidenceModel,
    scoreModel,
    reportModel,
    futureRoadmap,
    frameworkVersion: '24.8.1',
    createdAt: Date.now(),
    passToken: AUTHORITY_PASS,
  };

  setCachedFrameworkAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuilds(): number {
  return authorityBuilds;
}

export function getRoadmapBuilds(): number {
  return roadmapBuilds;
}

export function resetFounderAcceptanceAuthorityBuilderForTests(): void {
  authorityBuilds = 0;
  authorityCounter = 0;
  roadmapBuilds = 0;
}
