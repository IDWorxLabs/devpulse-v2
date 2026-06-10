/**
 * Architecture Documentation — boundary analyzer.
 */

import type {
  ArchitectureBoundaryAnalysis,
  ArchitectureDocumentationInput,
} from './architecture-documentation-types.js';
import { getCachedBoundaryAnalysis, setCachedBoundaryAnalysis } from './architecture-documentation-cache.js';

export interface ArchitectureBoundarySnapshot {
  hasReadOnlyBoundaries: boolean;
  hasGovernanceBoundaries: boolean;
  hasWorld2Boundaries: boolean;
  hasMobileBoundaries: boolean;
}

const BASE_BOUNDARIES = [
  'read_only_boundaries',
  'execution_boundaries',
  'governance_boundaries',
  'trust_boundaries',
  'world1_boundaries',
  'world2_boundaries',
  'cloud_boundaries',
  'mobile_boundaries',
] as const;

let boundaryAnalysisCount = 0;

export function analyzeArchitectureBoundaries(
  input: ArchitectureDocumentationInput,
  snapshot: ArchitectureBoundarySnapshot,
): ArchitectureBoundaryAnalysis {
  const cacheKey = [
    snapshot.hasReadOnlyBoundaries,
    snapshot.hasGovernanceBoundaries,
    input.missingReadOnlyBoundaryGuidance,
    input.missingExecutionBoundaryGuidance,
    ...(input.undocumentedBoundaries ?? []),
  ].join('|');

  const cached = getCachedBoundaryAnalysis(cacheKey);
  if (cached) return cached;

  boundaryAnalysisCount += 1;
  const boundaryWarnings: string[] = [];
  const undocumentedBoundaries: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingReadOnlyBoundaryGuidance, 'missing_read_only_boundary_guidance', 'read_only_boundaries'],
    [input.missingExecutionBoundaryGuidance, 'missing_execution_boundary_guidance', 'execution_boundaries'],
    [input.missingGovernanceBoundaryGuidance, 'missing_governance_boundary_guidance', 'governance_boundaries'],
    [input.missingTrustBoundaryGuidance, 'missing_trust_boundary_guidance', 'trust_boundaries'],
    [input.missingWorld1BoundaryGuidance, 'missing_world1_boundary_guidance', 'world1_boundaries'],
    [input.missingWorld2BoundaryGuidance, 'missing_world2_boundary_guidance', 'world2_boundaries'],
    [input.missingCloudBoundaryGuidance, 'missing_cloud_boundary_guidance', 'cloud_boundaries'],
    [input.missingMobileBoundaryGuidance, 'missing_mobile_boundary_guidance', 'mobile_boundaries'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      boundaryWarnings.push(warning);
      undocumentedBoundaries.push(area);
      penalty += 8;
    }
  }

  for (const boundary of input.undocumentedBoundaries ?? []) {
    if (!undocumentedBoundaries.includes(boundary)) {
      undocumentedBoundaries.push(boundary);
      penalty += 5;
    }
  }

  const systemBonus =
    (snapshot.hasReadOnlyBoundaries ? 10 : 0)
    + (snapshot.hasGovernanceBoundaries ? 8 : 0)
    + (snapshot.hasWorld2Boundaries ? 6 : 0)
    + (snapshot.hasMobileBoundaries ? 6 : 0);
  const documented = BASE_BOUNDARIES.length - undocumentedBoundaries.filter(
    (b) => BASE_BOUNDARIES.includes(b as typeof BASE_BOUNDARIES[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_BOUNDARIES.length) * 78 + systemBonus);
  const boundaryCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: ArchitectureBoundaryAnalysis = {
    boundaryCoverageScore,
    undocumentedBoundaries,
    boundaryWarnings,
  };

  setCachedBoundaryAnalysis(cacheKey, result);
  return result;
}

export function getBoundaryAnalysisCount(): number {
  return boundaryAnalysisCount;
}

export function resetArchitectureBoundaryAnalyzerForTests(): void {
  boundaryAnalysisCount = 0;
}

export function listBaseBoundaries(): readonly string[] {
  return BASE_BOUNDARIES;
}
