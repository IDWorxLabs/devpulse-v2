/**
 * Build History Integrity V1 — replay metadata builder.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { UNIVERSAL_APP_BLUEPRINT_VERSION } from '../universal-app-blueprint/universal-app-blueprint-types.js';
import type { BuildHistoryReplayMetadata } from './build-history-types.js';

export const PROFILE_FEATURE_MAP_VERSION = 'materialization-v1';

export function buildReplayMetadata(
  manifest: GeneratedAppManifest,
  workspaceDir: string,
): BuildHistoryReplayMetadata {
  const packageJsonPath = join(workspaceDir, 'package.json');
  let runtime = 'vite-react';
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;
      if (typeof pkg.devpulseGeneratedApp === 'string') {
        runtime = `vite-react:${pkg.devpulseGeneratedApp}`;
      }
    } catch {
      /* keep default */
    }
  }

  const contractPath = join(workspaceDir, 'universal-feature-contract.json');
  const hasContract = existsSync(contractPath);

  return {
    readOnly: true,
    originalPrompt: manifest.prompt,
    selectedProfile: String(manifest.selectedProfile),
    generationInputs: {
      projectId: manifest.projectId,
      buildRunId: manifest.buildRunId,
      expectedAppType: manifest.expectedAppType,
      featureModules: manifest.featureModules,
      routes: manifest.routes,
      fallbackUsed: manifest.fallbackUsed,
    },
    featureContractSummary: {
      featureModuleCount: manifest.generatedFeatureModulesCount,
      featureModuleIds: manifest.featureModules,
      routes: manifest.routes,
    },
    profileFeatureMapVersion: PROFILE_FEATURE_MAP_VERSION,
    blueprintVersion: UNIVERSAL_APP_BLUEPRINT_VERSION,
    generatorVersion: 'universal-prompt-to-app-materialization-v1',
    dependencySnapshot: {
      runtime,
      packageManager: 'npm',
      note: 'Captured from generated workspace package.json when present',
    },
    validationCommands: [
      'npm install',
      'npm run build',
      'npm run preview',
      'npm run validate:blueprint-purity',
      'npm run validate:production-validation',
    ],
    expectedArtifacts: [
      '.generated-app-manifest.json',
      'src/features/registry.ts',
      'src/features/routes.ts',
      'src/features/FeatureAppRouter.tsx',
      'src/blueprint/AppShell.tsx',
      ...(hasContract ? ['universal-feature-contract.json'] : []),
    ],
    replayInstructions: [
      'Use originalPrompt and selectedProfile with Universal Prompt-to-App Materialization engine.',
      'Regenerate workspace with the same contractId/projectId when possible.',
      'Run validationCommands in the generated workspace to reproduce validation evidence.',
      'Compare manifestHash and workspaceHash against build-record.json for regression tracking.',
    ],
  };
}
