/**
 * Universal Prompt-to-App Materialization V1 — workspace file materialization engine.
 */

import type { GeneratedWorkspaceFile, GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import { composeGeneratedAppWorkspaceFiles } from '../universal-app-blueprint/universal-app-blueprint-authority.js';
import { mergePackageJsonWithBlueprint } from '../universal-app-blueprint/universal-app-blueprint-generator.js';
import { UNIVERSAL_APP_BLUEPRINT_VERSION } from '../universal-app-blueprint/universal-app-blueprint-types.js';
import {
  buildUniversalFeatureContract,
  buildUniversalFeatureContractJson,
  getPrimaryEntity,
} from '../universal-feature-contract-intelligence/universal-feature-contract-builder.js';
import { buildSharedRuntimeFiles } from '../code-generation-engine/universal-crud-app-generator-shared.js';
import {
  buildInitialGeneratedAppManifest,
  GENERATED_APP_MANIFEST_FILENAME,
  serializeGeneratedAppManifest,
} from './generated-app-manifest.js';
import {
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
  type MaterializationProfile,
} from './profile-feature-map.js';
import { extractPromptAppTitle, summarizePrompt } from './prompt-app-metadata.js';
import {
  buildDemoDataTs,
  buildDomainAppFeatureCss,
  buildDomainAppFeatureTsx,
  buildFeatureRegistryTs,
  buildFeatureRoutesTs,
} from './profile-feature-ui-generator.js';

function profileSlug(profile: MaterializationProfile): string {
  return profile.toLowerCase().replace(/_/g, '-');
}

export function buildUniversalMaterializedWorkspaceFiles(input: {
  contractId: string;
  ideaId: string;
  buildUnits: string[];
  rawPrompt: string;
  profile?: GeneratedAppProfile | null;
  buildRunId?: string;
}): GeneratedWorkspaceFile[] {
  const materializationProfile = resolveMaterializationProfile(input.profile ?? null, input.rawPrompt);
  const definition = getProfileFeatureDefinition(materializationProfile, input.rawPrompt);
  const appTitle = extractPromptAppTitle(input.rawPrompt);
  const contract = buildUniversalFeatureContract({
    contractId: input.contractId,
    rawPrompt: input.rawPrompt,
    profile: materializationProfile as GeneratedAppProfile,
  });
  const primary = getPrimaryEntity(contract);
  const displayName = appTitle !== 'Custom App' ? appTitle : contract.productName;

  const manifest = buildInitialGeneratedAppManifest({
    projectId: input.contractId,
    projectName: displayName,
    buildRunId: input.buildRunId ?? input.contractId,
    prompt: input.rawPrompt,
    selectedProfile: materializationProfile,
    expectedAppType: definition.expectedAppType,
    promptSummary: summarizePrompt(input.rawPrompt),
    confidence: 'MEDIUM',
    featureModules: definition.featureModules,
    routes: definition.routes,
    fallbackUsed: false,
  });

  const sharedFiles: GeneratedWorkspaceFile[] = [
    ...buildSharedRuntimeFiles(input.contractId, displayName),
    {
      relativePath: 'package.json',
      content: mergePackageJsonWithBlueprint(
        JSON.stringify(
          {
            name: input.contractId,
            version: '0.1.0',
            private: true,
            type: 'module',
            description: `Generated ${displayName} — ${materializationProfile}`,
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview',
              verify: 'node verification/run-verify.mjs',
            },
            dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
            devDependencies: {
              '@types/react': '^18.3.12',
              '@types/react-dom': '^18.3.1',
              '@vitejs/plugin-react': '^4.3.4',
              typescript: '~5.6.3',
              vite: '^5.4.11',
            },
            devpulseGeneratedApp: profileSlug(materializationProfile),
            devpulseCodeGenerationEngine: 'v1',
            devpulseUniversalFeatureContract: 'v1',
            devpulseUniversalMaterialization: 'v1',
          },
          null,
          2,
        ) + '\n',
      ),
    },
    {
      relativePath: GENERATED_APP_MANIFEST_FILENAME,
      content: serializeGeneratedAppManifest(manifest),
    },
    {
      relativePath: 'build-manifest.json',
      content: `${JSON.stringify(
        {
          manifestId: `${input.contractId}-manifest`,
          contractId: input.contractId,
          ideaId: input.ideaId,
          generatedAt: new Date().toISOString(),
          materializationSource: 'universal-prompt-to-app-materialization-v1',
          applicationProfile: materializationProfile,
          universalBlueprintVersion: UNIVERSAL_APP_BLUEPRINT_VERSION,
          universalBlueprintEnabled: true,
          buildUnits: input.buildUnits,
          runtime: 'vite-react',
        },
        null,
        2,
      )}\n`,
    },
    {
      relativePath: 'universal-feature-contract.json',
      content: buildUniversalFeatureContractJson({
        contractId: input.contractId,
        rawPrompt: input.rawPrompt,
        profile: input.profile ?? undefined,
      }),
    },
    {
      relativePath: 'feature-contract.json',
      content: buildUniversalFeatureContractJson({
        contractId: input.contractId,
        rawPrompt: input.rawPrompt,
        profile: input.profile ?? undefined,
      }),
    },
    {
      relativePath: 'src/styles/global.css',
      content: `:root { font-family: 'Segoe UI', system-ui, sans-serif; }\nbody { margin: 0; }\n`,
    },
    {
      relativePath: 'src/features/registry.ts',
      content: buildFeatureRegistryTs(definition.featureModules),
    },
    {
      relativePath: 'src/features/routes.ts',
      content: buildFeatureRoutesTs(definition.routes),
    },
    {
      relativePath: 'src/features/domain/DomainAppFeature.tsx',
      content: buildDomainAppFeatureTsx(displayName, definition),
    },
    {
      relativePath: 'src/features/domain/domain-app-feature.css',
      content: buildDomainAppFeatureCss(),
    },
    {
      relativePath: 'src/data/demo-data.ts',
      content: buildDemoDataTs(displayName, definition),
    },
    {
      relativePath: 'src/screens/index.ts',
      content: `export { default as DomainAppFeature } from '../features/domain/DomainAppFeature';\n`,
    },
  ];

  const featureFiles: GeneratedWorkspaceFile[] = [];

  return composeGeneratedAppWorkspaceFiles({
    blueprint: {
      contractId: input.contractId,
      ideaId: input.ideaId,
      buildUnits: input.buildUnits,
      appName: displayName,
      tagline: `${primary.pluralLabel} for ${displayName} — powered by AiDevEngine`,
      coreFeatureLabel: primary.navLabel,
      coreFeatureImportPath: '../features/domain/DomainAppFeature',
      coreFeatureComponentName: 'DomainAppFeature',
    },
    featureFiles,
    sharedFiles,
  });
}
