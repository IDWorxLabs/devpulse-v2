/**
 * Incremental Autonomous Builder — architecture skeleton builder.
 */

import type { IncrementalBuildPlan } from './incremental-builder-types.js';
import type { ArchitectureSkeletonResult } from './incremental-builder-types.js';

let skeletonCounter = 0;

export function resetArchitectureSkeletonBuilderForTests(): void {
  skeletonCounter = 0;
}

export function buildArchitectureSkeleton(plan: IncrementalBuildPlan): ArchitectureSkeletonResult {
  skeletonCounter += 1;
  const blockedReason =
    plan.featureSlices.length === 0
      ? 'No feature slices planned — skeleton cannot compile.'
      : null;

  return {
    readOnly: true,
    skeletonId: `skeleton-${skeletonCounter}`,
    projectStructure: [
      'src/',
      'src/features/',
      'src/blueprint/',
      'src/data/',
      'runtime/',
      'package.json',
      'index.html',
    ],
    routingShell: ['src/features/FeatureAppRouter.tsx', 'src/blueprint/AppShell.tsx'],
    sharedLayout: ['src/blueprint/AppShell.tsx', 'src/App.tsx'],
    stateContainer: ['src/data/demo-data.ts'],
    serviceBoundaries: plan.featureSlices.map((s) => `src/features/${slugify(s.name)}`),
    dataModelPlaceholders: ['src/data/demo-data.ts', 'src/data/data-management-placeholders.ts'],
    validationHarness: ['scripts/validate-incremental-autonomous-builder.ts'],
    testHarness: ['scripts/validate-feature-slice-validation.ts'],
    accessibilityBaseline: ['src/features/accessibility-settings', 'src/blueprint/components'],
    buildScripts: ['npm run build', 'npm run dev'],
    manifestAnchors: ['generated-app-manifest.json', 'blueprint-manifest.json'],
    compiles: blockedReason === null,
    blockedReason,
  };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
