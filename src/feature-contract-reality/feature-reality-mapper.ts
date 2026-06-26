/**
 * Feature Contract Reality V1 — map planned features to reality records.
 */

import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { moduleIdToPascalCase } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import { loadPlannedFeatureContractItems } from './feature-contract-loader.js';
import { checkFeatureFileReality } from './feature-file-reality-checker.js';
import { checkFeatureRegistryReality } from './feature-route-reality-checker.js';
import { checkFeatureRenderReality } from './feature-render-reality-checker.js';
import { checkFeatureValidationReality } from './feature-validation-reality-checker.js';
import {
  checkFeatureInteractionReality,
  isInformationalFeatureModule,
  readFileUtf8,
} from './feature-interaction-reality-checker.js';
import type { FeatureRealityRecord } from './feature-contract-reality-types.js';

function scoreFeatureReality(dimensions: {
  planned: boolean;
  generated: boolean;
  compiled: boolean;
  filesPresent: boolean;
  registryEntryPresent: boolean;
  routePresent: boolean;
  rendered: boolean;
  reachable: boolean;
  interactive: boolean;
  validated: boolean;
}): number {
  const weights = [
    dimensions.planned,
    dimensions.generated,
    dimensions.compiled,
    dimensions.filesPresent,
    dimensions.registryEntryPresent,
    dimensions.routePresent,
    dimensions.rendered,
    dimensions.reachable,
    dimensions.interactive,
    dimensions.validated,
  ];
  const passed = weights.filter(Boolean).length;
  return Math.round((passed / weights.length) * 100);
}

export function buildFeatureRealityRecords(input: {
  workspaceDir: string;
  manifest: GeneratedAppManifest;
}): FeatureRealityRecord[] {
  const planned = loadPlannedFeatureContractItems(input);
  const compiled =
    input.manifest.npmBuildDurationMs > 0 &&
    input.manifest.validationStatus !== 'FAIL' &&
    input.manifest.status !== 'FAIL';

  return planned.map((item) => {
    const manifestEntry = input.manifest.featureModuleDetails.find((entry) => entry.id === item.featureId);
    const files = checkFeatureFileReality({
      workspaceDir: input.workspaceDir,
      featureId: item.featureId,
      manifestEntry,
    });
    const registry = checkFeatureRegistryReality({
      workspaceDir: input.workspaceDir,
      featureId: item.featureId,
      contractId: item.contractId,
      route: item.route,
    });
    const render = checkFeatureRenderReality({
      workspaceDir: input.workspaceDir,
      featureId: item.featureId,
    });
    const validation = checkFeatureValidationReality({
      workspaceDir: input.workspaceDir,
      featureId: item.featureId,
      contractId: item.contractId,
    });
    const renderPath =
      render.componentPath ||
      join(input.workspaceDir, `src/features/${item.featureId}/${moduleIdToPascalCase(item.featureId)}Feature.tsx`);
    const validationFilePath = validation.validationPath || join(input.workspaceDir, `src/features/${item.featureId}/${item.featureId}.validation.ts`);
    const interaction = checkFeatureInteractionReality({
      featureId: item.featureId,
      componentSource: readFileUtf8(renderPath),
      validationSource: readFileUtf8(validationFilePath),
    });

    const failureReasons = [
      ...registry.failureReasons,
      ...validation.failureReasons,
      ...interaction.failureReasons,
    ];
    if (!files.filesPresent) failureReasons.push(`Feature files missing for ${item.featureId}`);
    if (!render.rendered) failureReasons.push(`Feature ${item.featureId} not renderable`);

    const dimensions = {
      planned: true,
      generated: files.generated,
      compiled,
      filesPresent: files.filesPresent,
      registryEntryPresent: registry.registryEntryPresent,
      routePresent: registry.routePresent,
      rendered: render.rendered,
      reachable: registry.reachable,
      interactive: interaction.interactive,
      validated: validation.validated,
    };

    const evidencePaths = [
      ...files.evidencePaths,
      ...registry.evidencePaths,
      ...render.evidencePaths,
      ...validation.evidencePaths,
    ];

    const missingEvidence = [
      ...files.missingEvidence,
      ...registry.missingEvidence,
      ...render.missingEvidence,
      ...validation.missingEvidence,
      ...interaction.missingEvidence,
    ];

    return {
      readOnly: true,
      featureId: item.featureId,
      featureName: item.featureName,
      contractId: item.contractId,
      planned: dimensions.planned,
      generated: dimensions.generated,
      compiled: dimensions.compiled,
      filesPresent: dimensions.filesPresent,
      registryEntryPresent: dimensions.registryEntryPresent,
      routePresent: dimensions.routePresent,
      rendered: dimensions.rendered,
      reachable: dimensions.reachable,
      interactive: dimensions.interactive,
      informationalOnly: interaction.informationalOnly || isInformationalFeatureModule(item.featureId),
      validated: dimensions.validated,
      score: scoreFeatureReality(dimensions),
      evidencePaths: [...new Set(evidencePaths)],
      missingEvidence: [...new Set(missingEvidence)],
      failureReasons: [...new Set(failureReasons)],
    };
  });
}
