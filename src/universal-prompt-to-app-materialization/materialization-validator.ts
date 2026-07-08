/**
 * Universal Prompt-to-App Materialization V1 — materialization validation.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import { GENERATED_APP_MANIFEST_FILENAME, type GeneratedAppManifest } from './generated-app-manifest.js';
import {
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
  type ProfileFeatureDefinition,
} from './profile-feature-map.js';
import { extractPromptAppTitle } from './prompt-app-metadata.js';
import {
  detectSimpleUtilityAppKind,
  isForbiddenSimpleUtilityModule,
  isSimpleUtilityAppPrompt,
  simpleUtilityFeatureModules,
} from '../simple-utility-app/simple-utility-app-registry.js';
import {
  materializableFeatureModules,
  moduleIdToPascalCase,
} from './modular-feature-module-generator.js';

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
  modularFeaturesPresent: boolean;
  npmBuildAloneInsufficient: true;
  matchedUiTerms: string[];
  missingArtifacts: string[];
  missingFeatureModules: string[];
  missingModularModuleFiles: string[];
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

const REQUIRED_MODULAR_ARTIFACTS = [
  'src/features/registry.ts',
  'src/features/routes.ts',
  'src/features/FeatureAppRouter.tsx',
];

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function collectFeatureModuleSource(workspaceDir: string): string {
  const featuresRoot = join(workspaceDir, 'src/features');
  if (!existsSync(featuresRoot)) return '';
  const chunks: string[] = [];
  for (const entry of readdirSync(featuresRoot)) {
    const entryPath = join(featuresRoot, entry);
    if (!statSync(entryPath).isDirectory()) continue;
    for (const fileName of readdirSync(entryPath)) {
      if (!/\.(tsx?|css|jsx)$/.test(fileName)) continue;
      chunks.push(readIfExists(join(entryPath, fileName)));
    }
  }
  return chunks.join('\n');
}

function collectSourceBundle(workspaceDir: string): string {
  const paths = [
    'src/App.tsx',
    'src/features/FeatureAppRouter.tsx',
    'src/features/registry.ts',
    'src/features/routes.ts',
    'src/blueprint/AppShell.tsx',
    'src/blueprint/pages/HomePage.tsx',
    'index.html',
  ];
  return [...paths.map((rel) => readIfExists(join(workspaceDir, rel))), collectFeatureModuleSource(workspaceDir)].join('\n');
}

function isMonolithicDomainFeaturePrimaryRenderer(workspaceDir: string): boolean {
  const appShell = readIfExists(join(workspaceDir, 'src/blueprint/AppShell.tsx'));
  const domainFeaturePath = join(workspaceDir, 'src/features/domain/DomainAppFeature.tsx');
  if (!existsSync(domainFeaturePath)) return false;
  return (
    appShell.includes('DomainAppFeature') &&
    !appShell.includes('FeatureAppRouter')
  );
}

export function validateModularFeatureModules(
  workspaceDir: string,
  definition: ProfileFeatureDefinition,
): { passed: boolean; missingModuleFiles: string[]; missingModules: string[] } {
  const modules = materializableFeatureModules(definition);
  const missingModules: string[] = [];
  const missingModuleFiles: string[] = [];

  for (const moduleId of modules) {
    const folder = join(workspaceDir, 'src/features', moduleId);
    if (!existsSync(folder)) {
      missingModules.push(moduleId);
      continue;
    }

    const pascal = moduleIdToPascalCase(moduleId);
    const required = [
      `${pascal}Feature.tsx`,
      `${moduleId}.types.ts`,
      `${moduleId}.service.ts`,
      `${moduleId}.validation.ts`,
      'index.ts',
    ];
    for (const fileName of required) {
      const filePath = join(folder, fileName);
      if (!existsSync(filePath)) {
        missingModuleFiles.push(`src/features/${moduleId}/${fileName}`);
      }
    }
  }

  const registrySource = readIfExists(join(workspaceDir, 'src/features/registry.ts'));
  for (const moduleId of modules) {
    if (!registrySource.includes(`id: '${moduleId}'`)) {
      missingModules.push(`registry:${moduleId}`);
    }
  }

  const routesSource = readIfExists(join(workspaceDir, 'src/features/routes.ts'));
  if (!routesSource.includes('FEATURE_REGISTRY')) {
    missingModuleFiles.push('src/features/routes.ts:FEATURE_REGISTRY');
  }

  const routerSource = readIfExists(join(workspaceDir, 'src/features/FeatureAppRouter.tsx'));
  if (!routerSource.includes('FEATURE_REGISTRY')) {
    missingModuleFiles.push('src/features/FeatureAppRouter.tsx:FEATURE_REGISTRY');
  }

  return {
    passed: missingModules.length === 0 && missingModuleFiles.length === 0,
    missingModuleFiles,
    missingModules: [...new Set(missingModules)],
  };
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
  definitionOverride?: ProfileFeatureDefinition;
}): MaterializationValidationResult {
  const materializationProfile = resolveMaterializationProfile(input.selectedProfile, input.rawPrompt);
  const definition =
    input.definitionOverride ?? getProfileFeatureDefinition(materializationProfile, input.rawPrompt);
  const appTitle = input.projectName ?? extractPromptAppTitle(input.rawPrompt);
  const sourceBundle = collectSourceBundle(input.workspaceDir).toLowerCase();
  const titleLower = appTitle.toLowerCase();

  const missingArtifacts = REQUIRED_SHELL_ARTIFACTS.filter(
    (rel) => !existsSync(join(input.workspaceDir, rel)),
  );
  missingArtifacts.push(
    ...REQUIRED_MODULAR_ARTIFACTS.filter((rel) => !existsSync(join(input.workspaceDir, rel))),
  );

  const modularValidation = validateModularFeatureModules(input.workspaceDir, definition);

  const modulesForRegistry = materializableFeatureModules(definition);
  const missingFeatureModules = modulesForRegistry.filter(
    (module) => !readIfExists(join(input.workspaceDir, 'src/features/registry.ts')).includes(`'${module}'`),
  );

  const matchedUiTerms = definition.requiredUiTerms.filter((term) => sourceBundle.includes(term.toLowerCase()));
  const titlePresent = titleLower.length > 2 && sourceBundle.includes(titleLower.replace(/\s+/g, '').slice(0, 12))
    ? [appTitle]
    : sourceBundle.includes(titleLower) ? [appTitle] : [];

  const forbiddenTermsFound = isSimpleUtilityAppPrompt(input.rawPrompt)
    ? definition.featureModules
        .filter((moduleId) => isForbiddenSimpleUtilityModule(moduleId))
        .map((moduleId) => `feature-module:${moduleId}`)
    : materializationProfile !== 'PROJECT_MANAGEMENT_WEB_V1'
      ? definition.forbiddenGenericTerms.filter((term) => sourceBundle.includes(term.toLowerCase()))
      : [];

  const appTsxPath = join(input.workspaceDir, 'src/App.tsx');
  const appTsxSource = readIfExists(appTsxPath);
  const simpleUtilityKind = detectSimpleUtilityAppKind(input.rawPrompt);
  const simpleUtilityModuleId =
    simpleUtilityKind !== null ? simpleUtilityFeatureModules(simpleUtilityKind)[0]! : null;
  const simpleUtilityComponentName = simpleUtilityModuleId
    ? `${moduleIdToPascalCase(simpleUtilityModuleId)}Feature`
    : null;
  const simpleUtilityDirectMount =
    simpleUtilityKind !== null &&
    appTsxSource.includes('data-simple-utility-app') &&
    simpleUtilityComponentName !== null &&
    appTsxSource.includes(simpleUtilityComponentName) &&
    appTsxSource.includes(`<${simpleUtilityComponentName}`);

  const blueprintShellPresent = simpleUtilityDirectMount
    ? true
    : existsSync(join(input.workspaceDir, 'src/blueprint/AppShell.tsx')) &&
      existsSync(appTsxPath) &&
      appTsxSource.includes('AppShell');

  const appShellSource = readIfExists(join(input.workspaceDir, 'src/blueprint/AppShell.tsx'));
  const shellUsesModularRouter =
    appShellSource.includes('FeatureAppRouter') || sourceBundle.includes('feature-app-router');

  const featureModulesPresent = simpleUtilityDirectMount
    ? missingFeatureModules.length === 0 && modularValidation.passed
    : missingFeatureModules.length === 0 &&
      modularValidation.passed &&
      shellUsesModularRouter &&
      !isMonolithicDomainFeaturePrimaryRenderer(input.workspaceDir);

  const modularFeaturesPresent = simpleUtilityDirectMount
    ? modularValidation.passed
    : modularValidation.passed && shellUsesModularRouter;

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
    warnings.push('npm build succeeded but modular feature modules are missing.');
  }
  if (isMonolithicDomainFeaturePrimaryRenderer(input.workspaceDir)) {
    warnings.push('DomainAppFeature.tsx is still the primary renderer — modular materialization required.');
  }
  if (matchedUiTerms.length < definition.requiredUiTerms.length) {
    warnings.push(
      `Only ${matchedUiTerms.length}/${definition.requiredUiTerms.length} required UI terms detected in generated source.`,
    );
  }
  if (manifest && manifest.featureModuleDetails.length === 0 && modularValidation.passed) {
    warnings.push('Manifest missing featureModuleDetails despite modular files on disk.');
  }

  const passed =
    missingArtifacts.length === 0 &&
    blueprintShellPresent &&
    featureModulesPresent &&
    modularFeaturesPresent &&
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
    modularFeaturesPresent,
    npmBuildAloneInsufficient: true,
    matchedUiTerms: [...matchedUiTerms, ...titlePresent],
    missingArtifacts,
    missingFeatureModules,
    missingModularModuleFiles: modularValidation.missingModuleFiles,
    forbiddenTermsFound,
    warnings,
    manifest,
  };
}
