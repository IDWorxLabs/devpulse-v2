/**
 * Adaptive AutoFix Intelligence — capability gap detection.
 */

import type { CapabilityGap, FailureCategory, FailureRecord } from './adaptive-autofix-types.js';

interface CapabilityMapping {
  failureCategory: FailureCategory;
  gapCategory: CapabilityGap['gapCategory'];
  missingCapability: string;
  recommendedAuthority: string;
  recommendedValidator: string;
}

const CAPABILITY_MAPPINGS: readonly CapabilityMapping[] = [
  {
    failureCategory: 'CHAT_FAILURE',
    gapCategory: 'MISSING_CONTEXT_LAYER',
    missingCapability: 'CONTEXT_QUALITY_ANALYZER',
    recommendedAuthority: 'context-quality-analyzer',
    recommendedValidator: 'validate:context-quality-analyzer',
  },
  {
    failureCategory: 'UI_FAILURE',
    gapCategory: 'MISSING_VALIDATOR',
    missingCapability: 'UI_LAYOUT_VALIDATOR',
    recommendedAuthority: 'ui-layout-validator',
    recommendedValidator: 'validate:ui-layout-validator',
  },
  {
    failureCategory: 'TYPECHECK_FAILURE',
    gapCategory: 'MISSING_DIAGNOSTIC',
    missingCapability: 'REPOSITORY_TYPE_RELATIONSHIP_ANALYZER',
    recommendedAuthority: 'repository-type-relationship-analyzer',
    recommendedValidator: 'validate:repository-type-relationship-analyzer',
  },
  {
    failureCategory: 'LAUNCH_FAILURE',
    gapCategory: 'MISSING_AUTHORITY',
    missingCapability: 'NEW_AUTHORITY_REQUIRED',
    recommendedAuthority: 'launch-blocker-resolution-authority',
    recommendedValidator: 'validate:launch-blocker-resolution-authority',
  },
  {
    failureCategory: 'PLANNING_FAILURE',
    gapCategory: 'MISSING_PLANNING_LAYER',
    missingCapability: 'PLANNING_FAILURE_DIAGNOSTIC',
    recommendedAuthority: 'planning-failure-diagnostic',
    recommendedValidator: 'validate:planning-failure-diagnostic',
  },
  {
    failureCategory: 'VERIFICATION_FAILURE',
    gapCategory: 'MISSING_VERIFICATION_LAYER',
    missingCapability: 'EVIDENCE_GAP_RESOLVER',
    recommendedAuthority: 'evidence-gap-resolver',
    recommendedValidator: 'validate:evidence-gap-resolver',
  },
  {
    failureCategory: 'BUILD_FAILURE',
    gapCategory: 'MISSING_RUNTIME_TOOL',
    missingCapability: 'BUILD_FAILURE_ROOT_CAUSE_ANALYZER',
    recommendedAuthority: 'build-failure-root-cause-analyzer',
    recommendedValidator: 'validate:build-failure-root-cause-analyzer',
  },
  {
    failureCategory: 'AUTONOMY_FAILURE',
    gapCategory: 'MISSING_INTELLIGENCE_LAYER',
    missingCapability: 'AUTONOMOUS_REPAIR_EVOLUTION_PLANNER',
    recommendedAuthority: 'autonomous-repair-evolution-planner',
    recommendedValidator: 'validate:autonomous-repair-evolution-planner',
  },
  {
    failureCategory: 'MEMORY_FAILURE',
    gapCategory: 'MISSING_MEMORY_LAYER',
    missingCapability: 'PROJECT_MEMORY_GAP_ANALYZER',
    recommendedAuthority: 'project-memory-gap-analyzer',
    recommendedValidator: 'validate:project-memory-gap-analyzer',
  },
  {
    failureCategory: 'RUNTIME_FAILURE',
    gapCategory: 'MISSING_BRIDGE',
    missingCapability: 'RUNTIME_FAILURE_BRIDGE',
    recommendedAuthority: 'runtime-failure-bridge',
    recommendedValidator: 'validate:runtime-failure-bridge',
  },
  {
    failureCategory: 'UNKNOWN_FAILURE',
    gapCategory: 'MISSING_DIAGNOSTIC',
    missingCapability: 'UNKNOWN_FAILURE_CLASSIFIER',
    recommendedAuthority: 'unknown-failure-classifier',
    recommendedValidator: 'validate:unknown-failure-classifier',
  },
] as const;

export function detectCapabilityGaps(failures: readonly FailureRecord[]): CapabilityGap[] {
  const gaps: CapabilityGap[] = [];
  for (const failure of failures) {
    const mapping =
      CAPABILITY_MAPPINGS.find((entry) => entry.failureCategory === failure.failureCategory) ??
      CAPABILITY_MAPPINGS.find((entry) => entry.failureCategory === 'UNKNOWN_FAILURE');
    if (!mapping) continue;
    gaps.push({
      gapCategory: mapping.gapCategory,
      missingCapability: mapping.missingCapability,
      failureCategory: failure.failureCategory,
      evidence: [
        failure.rootCause,
        ...failure.attemptedFixes.slice(0, 2),
        `Repeated failures: ${failure.repeatedFailureCount}`,
      ],
    });
  }
  return gaps;
}

export function lookupCapabilityMapping(failureCategory: FailureCategory): CapabilityMapping | null {
  return CAPABILITY_MAPPINGS.find((entry) => entry.failureCategory === failureCategory) ?? null;
}

export function getCapabilityMappingCount(): number {
  return CAPABILITY_MAPPINGS.length;
}
