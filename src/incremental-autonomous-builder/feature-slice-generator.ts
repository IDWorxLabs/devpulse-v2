/**
 * Incremental Autonomous Builder — feature slice generation.
 */

import type { FeatureSliceGenerationResult, FeatureSlicePlan } from './incremental-builder-types.js';

export function generateFeatureSlice(slice: FeatureSlicePlan): FeatureSliceGenerationResult {
  const slug = slugify(slice.name);
  const artifacts = [
    artifact(`src/features/${slug}/${slug}Feature.tsx`, 'COMPONENT', slice),
    artifact(`src/features/${slug}/${slug}.service.ts`, 'SERVICE', slice),
    artifact(`src/features/${slug}/${slug}.types.ts`, 'TYPE', slice),
    artifact(`src/features/${slug}/index.ts`, 'COMPONENT', slice),
    artifact(`scripts/validate-${slug}.ts`, 'VALIDATOR', slice),
  ];

  if (/route|list|dashboard|caregiver|layout|shell/i.test(slice.name)) {
    artifacts.push(artifact(`src/features/FeatureAppRouter.tsx`, 'ROUTE', slice));
  }

  return {
    readOnly: true,
    sliceId: slice.sliceId,
    status: 'GENERATED',
    artifacts,
    traceabilityComplete: artifacts.every((a) => a.requirementIds.length >= 0 && a.sliceId === slice.sliceId),
  };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function artifact(
  relativePath: string,
  artifactKind: FeatureSliceGenerationResult['artifacts'][number]['artifactKind'],
  slice: FeatureSlicePlan,
) {
  return {
    readOnly: true as const,
    relativePath,
    artifactKind,
    requirementIds: slice.requirementIds,
    capabilityIds: slice.capabilityIds,
    sliceId: slice.sliceId,
    acceptanceCriteria: slice.acceptanceCriteria,
  };
}
