/**
 * Founder Acceptance Framework — founder acceptance dimensions.
 */

import type { DimensionRegistry, FounderAcceptanceDimension } from './founder-acceptance-types.js';
import { DIMENSION_REGISTRY_PASS } from './founder-acceptance-types.js';
import { getCachedDimensionRegistry, setCachedDimensionRegistry } from './founder-acceptance-cache.js';

const DIMENSION_DEFINITIONS: FounderAcceptanceDimension[] = [
  {
    dimensionId: 'FOUNDER_CLARITY',
    dimensionName: 'Founder Clarity',
    description: 'Whether the founder can clearly understand product state, progress, and next actions',
    evaluationIntent: 'Assess clarity of signals, labels, and operational state across DevPulse surfaces',
    futureDependencies: ['Founder Workflow Validation', 'Founder Friction Detector', 'Product Reality Verification'],
  },
  {
    dimensionId: 'FOUNDER_CONFIDENCE',
    dimensionName: 'Founder Confidence',
    description: 'Whether the founder can trust recommendations, readiness claims, and intelligence output',
    evaluationIntent: 'Assess confidence earned through honest signals and consistent authority',
    futureDependencies: ['Founder Confidence Engine', 'Founder Trust Validation'],
  },
  {
    dimensionId: 'FOUNDER_PRODUCTIVITY',
    dimensionName: 'Founder Productivity',
    description: 'Whether DevPulse helps the founder direct work efficiently without friction',
    evaluationIntent: 'Assess operational productivity through chat, feed, and workflow continuity',
    futureDependencies: ['Founder Productivity Validation', 'Founder Workflow Validation'],
  },
  {
    dimensionId: 'FOUNDER_TRUST',
    dimensionName: 'Founder Trust',
    description: 'Whether DevPulse maintains honesty, evidence visibility, and completion clarity',
    evaluationIntent: 'Assess trust continuity across verification, preview, and reporting surfaces',
    futureDependencies: ['Founder Trust Validation', 'Product Reality Verification'],
  },
  {
    dimensionId: 'FOUNDER_CONTROL',
    dimensionName: 'Founder Control',
    description: 'Whether the founder retains meaningful control over decisions, escalation, and direction',
    evaluationIntent: 'Assess control surfaces for accept, fix, escalate, and next-action decisions',
    futureDependencies: ['Founder Workflow Validation', 'Founder Readiness Authority'],
  },
  {
    dimensionId: 'FOUNDER_VISIBILITY',
    dimensionName: 'Founder Visibility',
    description: 'Whether intelligence, risks, reasoning, and system status remain visible to the founder',
    evaluationIntent: 'Assess visibility of recommendations, operator feed, and verification evidence',
    futureDependencies: ['Founder Productivity Validation', 'Product Reality Verification'],
  },
  {
    dimensionId: 'FOUNDER_UNDERSTANDING',
    dimensionName: 'Founder Understanding',
    description: 'Whether the founder can understand what DevPulse is doing and why',
    evaluationIntent: 'Assess comprehensibility of intelligence output, reports, and product identity',
    futureDependencies: ['Founder Confidence Engine', 'Founder Friction Detector'],
  },
  {
    dimensionId: 'FOUNDER_RELIABILITY',
    dimensionName: 'Founder Reliability',
    description: 'Whether DevPulse behaves consistently and predictably during daily founder use',
    evaluationIntent: 'Assess reliability of workflows, state signals, and verification outcomes',
    futureDependencies: ['Founder Readiness Authority', 'Founder Trust Validation'],
  },
  {
    dimensionId: 'FOUNDER_CONTINUITY',
    dimensionName: 'Founder Continuity',
    description: 'Whether the founder experience remains continuous across chat, feed, reports, and verification',
    evaluationIntent: 'Assess end-to-end continuity without context loss or journey fragmentation',
    futureDependencies: ['Founder Workflow Validation', 'Product Experience Verification Engine'],
  },
  {
    dimensionId: 'FOUNDER_ACCEPTANCE',
    dimensionName: 'Founder Acceptance',
    description: 'Whether the complete founder operational experience is genuinely acceptable for daily use',
    evaluationIntent: 'Assess holistic founder acceptance as the culminating dimension',
    futureDependencies: ['Founder Acceptance Orchestrator', 'All 24.8.x validation modules'],
  },
];

let dimensionRegistryBuilds = 0;

export function buildDimensionRegistry(requestId: string): DimensionRegistry {
  const cacheKey = `dimensions-${requestId}`;
  const cached = getCachedDimensionRegistry(cacheKey);
  if (cached) return cached;

  dimensionRegistryBuilds += 1;
  const result: DimensionRegistry = {
    dimensions: [...DIMENSION_DEFINITIONS],
    passToken: DIMENSION_REGISTRY_PASS,
  };
  setCachedDimensionRegistry(cacheKey, result);
  return result;
}

export function listFounderAcceptanceDimensionIds(): readonly FounderAcceptanceDimension['dimensionId'][] {
  return DIMENSION_DEFINITIONS.map((d) => d.dimensionId);
}

export function getDimensionRegistryBuilds(): number {
  return dimensionRegistryBuilds;
}

export function resetFounderAcceptanceDimensionsForTests(): void {
  dimensionRegistryBuilds = 0;
}
