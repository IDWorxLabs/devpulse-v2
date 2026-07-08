/**
 * Extracts validation expectations from engineering artifacts — no app-specific logic.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GENERATED_APP_MANIFEST_FILENAME } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { parseUniversalFeatureContract } from '../universal-feature-contract-intelligence/universal-feature-contract-builder.js';
import type { UniversalFeatureContract } from '../universal-feature-contract-intelligence/universal-feature-contract-types.js';
import type { E2EContractExpectationBundle, E2EContractFeatureModule } from './e2e-build-reality-types.js';

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

function hashWorkspace(workspaceDir: string, manifest: GeneratedAppManifest | null): string | null {
  if (manifest?.workspaceHash) return manifest.workspaceHash;
  if (!existsSync(workspaceDir)) return null;
  return createHash('sha256').update(workspaceDir).digest('hex');
}

function parseFeatureRegistry(workspaceDir: string): E2EContractFeatureModule[] {
  const registryPath = join(workspaceDir, 'src/features/registry.ts');
  if (!existsSync(registryPath)) return [];
  const source = readFileSync(registryPath, 'utf8');
  const modules: E2EContractFeatureModule[] = [];
  const entryPattern =
    /id:\s*['"]([^'"]+)['"][\s\S]*?route:\s*['"]([^'"]+)['"][\s\S]*?sourcePath:\s*['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = entryPattern.exec(source)) !== null) {
    const id = match[1]!;
    const nameMatch = source
      .slice(match.index, match.index + 400)
      .match(/name:\s*['"]([^'"]+)['"]/);
    modules.push({
      readOnly: true,
      id,
      route: match[2]!,
      componentPath: match[3]!,
      navLabel: nameMatch?.[1] ?? null,
    });
  }
  return modules;
}

function detectMountMode(workspaceDir: string): E2EContractExpectationBundle['mountMode'] {
  const appPath = join(workspaceDir, 'src/App.tsx');
  if (!existsSync(appPath)) return 'unknown';
  const source = readFileSync(appPath, 'utf8');
  if (source.includes('data-simple-utility-app') || source.includes('data-direct-feature-app')) {
    return 'direct-feature';
  }
  if (source.includes('data-root-feature')) return 'direct-feature';
  if (source.includes('AppShell') || source.includes('WelcomeScreen')) return 'blueprint-shell';
  return 'unknown';
}

function entityMatchesFeatureModules(
  entitySlug: string,
  featureModules: E2EContractFeatureModule[],
): boolean {
  if (featureModules.length === 0) return true;
  const moduleIds = new Set(featureModules.map((module) => module.id));
  const moduleSlugs = new Set(featureModules.map((module) => module.id.replace(/-/g, '')));
  return moduleIds.has(entitySlug) || moduleSlugs.has(entitySlug.replace(/-/g, ''));
}

function filterContractActionVerbs(
  contract: UniversalFeatureContract | null,
  featureModules: E2EContractFeatureModule[],
): string[] {
  if (!contract) return [];
  return contract.actions
    .filter((action) => {
      if (!action.required) return false;
      const entity = contract.entities.find((entry) => entry.id === action.entityId);
      if (!entity) return featureModules.length === 0;
      return entityMatchesFeatureModules(entity.slug, featureModules);
    })
    .map((action) => action.verb);
}

function mergeUiTerms(
  contract: UniversalFeatureContract | null,
  manifest: GeneratedAppManifest | null,
  featureModules: E2EContractFeatureModule[],
  workspaceDir: string,
): string[] {
  const terms = new Set<string>();
  if (manifest?.promptDerivedInteractions) {
    for (const hint of manifest.promptDerivedInteractions) terms.add(hint);
  }
  for (const module of featureModules) {
    terms.add(module.id.replace(/-/g, ' '));
    if (module.navLabel) terms.add(module.navLabel);
    const featurePath = join(workspaceDir, module.componentPath);
    if (existsSync(featurePath)) {
      const source = readFileSync(featurePath, 'utf8');
      const promptTerms = source.match(/data-prompt-terms=["']([^"']+)["']/);
      if (promptTerms) {
        for (const term of promptTerms[1]!.split(',').map((t) => t.trim())) {
          if (term) terms.add(term);
        }
      }
    }
  }
  if (contract) {
    for (const entity of contract.entities) {
      if (!entityMatchesFeatureModules(entity.slug, featureModules)) continue;
      terms.add(entity.label.toLowerCase());
      terms.add(entity.pluralLabel.toLowerCase());
    }
    for (const action of contract.actions.filter((action) => action.required)) {
      const entity = contract.entities.find((entry) => entry.id === action.entityId);
      if (entity && !entityMatchesFeatureModules(entity.slug, featureModules)) continue;
      for (const word of action.label.toLowerCase().split(/\s+/)) {
        if (word.length >= 3) terms.add(word);
      }
    }
  }
  return [...terms].filter(Boolean);
}

export function extractContractExpectations(input: {
  workspaceDir: string;
  prompt: string;
  buildReady?: boolean;
}): E2EContractExpectationBundle {
  const manifest = readJson<GeneratedAppManifest>(
    join(input.workspaceDir, GENERATED_APP_MANIFEST_FILENAME),
  );
  const contract =
    readJson<UniversalFeatureContract>(join(input.workspaceDir, 'universal-feature-contract.json')) ??
    (existsSync(join(input.workspaceDir, 'feature-contract.json'))
      ? parseUniversalFeatureContract(readFileSync(join(input.workspaceDir, 'feature-contract.json'), 'utf8'))
      : null);

  const featureModules = parseFeatureRegistry(input.workspaceDir);
  const routes =
    featureModules.length > 0
      ? featureModules.map((m) => m.route)
      : manifest?.routes ?? contract?.entities.map((e) => `/${e.slug}`) ?? [];

  const primaryModuleId =
    featureModules[0]?.id ?? manifest?.featureModules?.[0] ?? manifest?.promptDerivedModules?.[0] ?? null;

  return {
    readOnly: true,
    prompt: input.prompt,
    contractId: contract?.contractId ?? manifest?.projectId ?? 'unknown',
    productName: contract?.productName ?? manifest?.projectName ?? null,
    productProfile: contract?.productProfile ?? String(manifest?.selectedProfile ?? ''),
    featureModules,
    routes,
    requiredUiTerms: mergeUiTerms(contract, manifest, featureModules, input.workspaceDir),
    requiredActionVerbs: filterContractActionVerbs(contract, featureModules),
    outcomeLabels: (contract?.outcomes ?? []).filter((o) => o.required).map((o) => o.label),
    workflowLabels: (contract?.workflows ?? []).filter((w) => w.required).map((w) => w.label),
    mountMode: detectMountMode(input.workspaceDir),
    primaryModuleId,
    interactionHints: manifest?.promptDerivedInteractions ?? [],
    workspaceHash: hashWorkspace(input.workspaceDir, manifest),
    buildReady: input.buildReady === true,
  };
}
