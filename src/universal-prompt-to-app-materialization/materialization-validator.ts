/**
 * Universal Prompt-to-App Materialization V1 — materialization validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import { GENERATED_APP_MANIFEST_FILENAME, type GeneratedAppManifest } from './generated-app-manifest.js';
import {
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
  type MaterializationProfile,
} from './profile-feature-map.js';
import { extractPromptAppTitle } from './prompt-app-metadata.js';

export const UNIVERSAL_PROMPT_TO_APP_MATERIALIZATION_V1_PASS_TOKEN =
  'UNIVERSAL_PROMPT_TO_APP_MATERIALIZATION_V1_PASS';

export interface MaterializationValidationResult {
  readOnly: true;
  passed: boolean;
  blueprintShellPresent: boolean;
  featureModulesPresent: boolean;
  promptSpecificTermsPresent: boolean;
  genericFallbackRejected: boolean;
  manifestPresent: boolean;
  npmBuildAloneInsufficient: true;
  matchedUiTerms: string[];
  missingArtifacts: string[];
  missingFeatureModules: string[];
  forbiddenTermsFound: string[];
  warnings: string[];
  manifest: GeneratedAppManifest | null;
}

const REQUIRED_SHELL_ARTIFACTS = [
  'package.json',
  'index.html',
  'src/main.tsx',
  'src/App.tsx',
  'src/blueprint/AppShell.tsx',
  GENERATED_APP_MANIFEST_FILENAME,
];

const REQUIRED_REGISTRY_ARTIFACTS = [
  'src/features/registry.ts',
  'src/features/routes.ts',
  'src/features/domain/DomainAppFeature.tsx',
];

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function collectSourceBundle(workspaceDir: string): string {
  const paths = [
    'src/App.tsx',
    'src/features/domain/DomainAppFeature.tsx',
    'src/features/registry.ts',
    'src/blueprint/AppShell.tsx',
    'src/blueprint/pages/HomePage.tsx',
    'index.html',
  ];
  return paths.map((rel) => readIfExists(join(workspaceDir, rel))).join('\n');
}

export function validateUniversalAppMaterialization(input: {
  workspaceDir: string;
  rawPrompt: string;
  selectedProfile: GeneratedAppProfile | null;
  projectId: string;
  projectName?: string;
  buildRunId?: string;
  npmInstallOk?: boolean;
  npmBuildOk?: boolean;
}): MaterializationValidationResult {
  const materializationProfile = resolveMaterializationProfile(input.selectedProfile, input.rawPrompt);
  const definition = getProfileFeatureDefinition(materializationProfile, input.rawPrompt);
  const appTitle = input.projectName ?? extractPromptAppTitle(input.rawPrompt);
  const sourceBundle = collectSourceBundle(input.workspaceDir).toLowerCase();
  const titleLower = appTitle.toLowerCase();

  const missingArtifacts = REQUIRED_SHELL_ARTIFACTS.filter(
    (rel) => !existsSync(join(input.workspaceDir, rel)),
  );
  missingArtifacts.push(
    ...REQUIRED_REGISTRY_ARTIFACTS.filter((rel) => !existsSync(join(input.workspaceDir, rel))),
  );

  const missingFeatureModules = definition.featureModules.filter(
    (module) => !readIfExists(join(input.workspaceDir, 'src/features/registry.ts')).includes(module),
  );

  const matchedUiTerms = definition.requiredUiTerms.filter((term) => sourceBundle.includes(term.toLowerCase()));
  const titlePresent = titleLower.length > 2 && sourceBundle.includes(titleLower.replace(/\s+/g, '').slice(0, 12))
    ? [appTitle]
    : sourceBundle.includes(titleLower) ? [appTitle] : [];

  const forbiddenTermsFound =
    materializationProfile !== 'PROJECT_MANAGEMENT_WEB_V1'
      ? definition.forbiddenGenericTerms.filter((term) => sourceBundle.includes(term.toLowerCase()))
      : [];

  const blueprintShellPresent =
    existsSync(join(input.workspaceDir, 'src/blueprint/AppShell.tsx')) &&
    existsSync(join(input.workspaceDir, 'src/App.tsx')) &&
    readIfExists(join(input.workspaceDir, 'src/App.tsx')).includes('AppShell');

  const featureModulesPresent =
    missingFeatureModules.length === 0 &&
    existsSync(join(input.workspaceDir, 'src/features/domain/DomainAppFeature.tsx'));

  const promptSpecificTermsPresent =
    matchedUiTerms.length >= Math.min(3, definition.requiredUiTerms.length) ||
    titlePresent.length > 0;

  const genericFallbackRejected = forbiddenTermsFound.length === 0;

  let manifest: GeneratedAppManifest | null = null;
  const manifestPath = join(input.workspaceDir, GENERATED_APP_MANIFEST_FILENAME);
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as GeneratedAppManifest;
    } catch {
      manifest = null;
    }
  }

  const warnings: string[] = [];
  if (input.npmBuildOk && !blueprintShellPresent) {
    warnings.push('npm build succeeded but blueprint shell is missing — build PASS is insufficient.');
  }
  if (input.npmBuildOk && !featureModulesPresent) {
    warnings.push('npm build succeeded but feature modules are missing.');
  }
  if (matchedUiTerms.length < definition.requiredUiTerms.length) {
    warnings.push(
      `Only ${matchedUiTerms.length}/${definition.requiredUiTerms.length} required UI terms detected in generated source.`,
    );
  }

  const passed =
    missingArtifacts.length === 0 &&
    blueprintShellPresent &&
    featureModulesPresent &&
    promptSpecificTermsPresent &&
    genericFallbackRejected;

  return {
    readOnly: true,
    passed,
    blueprintShellPresent,
    featureModulesPresent,
    promptSpecificTermsPresent,
    genericFallbackRejected,
    manifestPresent: manifest != null,
    npmBuildAloneInsufficient: true,
    matchedUiTerms: [...matchedUiTerms, ...titlePresent],
    missingArtifacts,
    missingFeatureModules,
    forbiddenTermsFound,
    warnings,
    manifest,
  };
}
