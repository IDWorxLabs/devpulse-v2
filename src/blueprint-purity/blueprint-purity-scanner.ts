/**
 * Blueprint Purity V1 — scan universal shell sources for domain leakage.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  findBlueprintPurityViolations,
} from './blueprint-purity-banned-terms.js';
import type { BlueprintPurityEvidence, BlueprintPurityFileScanResult } from './blueprint-purity-types.js';
import { getProfileFeatureDefinition, materializableFeatureModules } from '../universal-prompt-to-app-materialization/index.js';
import type { MaterializationProfile } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import { validateUniversalAppMaterialization } from '../universal-prompt-to-app-materialization/materialization-validator.js';

function scanFile(relativePath: string, absolutePath: string): BlueprintPurityFileScanResult {
  const source = readFileSync(absolutePath, 'utf8');
  const violations = findBlueprintPurityViolations(source);
  return {
    readOnly: true,
    relativePath,
    violations,
    passed: violations.length === 0,
  };
}

export function scanBlueprintSourceFiles(projectRootDir: string): BlueprintPurityFileScanResult[] {
  const results: BlueprintPurityFileScanResult[] = [];
  for (const rel of [
    'src/universal-app-blueprint/universal-app-blueprint-generator.ts',
    'src/universal-app-blueprint/universal-app-blueprint-authority.ts',
    'src/universal-app-blueprint/universal-app-blueprint-inspector.ts',
    'src/universal-app-blueprint/universal-app-blueprint-registry.ts',
    'src/universal-app-blueprint/universal-app-blueprint-types.ts',
    'src/universal-app-blueprint/universal-app-blueprint-planning-rule.ts',
  ]) {
    const absolutePath = join(projectRootDir, rel);
    if (existsSync(absolutePath)) {
      results.push(scanFile(rel, absolutePath));
    }
  }
  return results;
}

export function scanGeneratedWorkspaceShell(
  workspaceDir: string,
): { shellResults: BlueprintPurityFileScanResult[]; allowedDomainSources: string[] } {
  const shellResults: BlueprintPurityFileScanResult[] = [];
  const allowedDomainSources: string[] = [];

  const blueprintDir = join(workspaceDir, 'src/blueprint');
  if (existsSync(blueprintDir)) {
    function walk(dir: string, prefix: string): void {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const rel = `${prefix}/${entry.name}`.replace(/^\//, '');
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full, rel);
        else if (/\.(tsx?|css|jsx?)$/.test(entry.name)) {
          const normalized = rel.replace(/\\/g, '/');
          if (normalized === 'src/blueprint/app-metadata.ts') return;
          shellResults.push(scanFile(normalized, full));
        }
      }
    }
    walk(blueprintDir, 'src/blueprint');
  }

  if (existsSync(join(workspaceDir, 'src/features'))) {
    allowedDomainSources.push('src/features/');
  }
  for (const rel of [
    'src/features/registry.ts',
    'src/features/routes.ts',
    'src/blueprint/app-metadata.ts',
    'universal-feature-contract.json',
  ]) {
    if (existsSync(join(workspaceDir, rel))) allowedDomainSources.push(rel);
  }

  return { shellResults, allowedDomainSources };
}

export function verifyGeneratedAppDomainBoundary(input: {
  workspaceDir: string;
  profile: MaterializationProfile;
  prompt: string;
}): { passed: boolean; detail: string } {
  const definition = getProfileFeatureDefinition(input.profile, input.prompt);
  const modules = materializableFeatureModules(definition);
  const registryPath = join(input.workspaceDir, 'src/features/registry.ts');
  if (!existsSync(registryPath)) {
    return { passed: false, detail: 'registry.ts missing' };
  }
  const registrySource = readFileSync(registryPath, 'utf8');
  const missingInRegistry = modules.filter((moduleId) => !registrySource.includes(`'${moduleId}'`));
  if (missingInRegistry.length > 0) {
    return { passed: false, detail: `registry missing modules: ${missingInRegistry.join(', ')}` };
  }

  const featureBundle = modules
    .map((moduleId) => {
      const featurePath = join(input.workspaceDir, 'src/features', moduleId);
      if (!existsSync(featurePath)) return '';
      return readdirSync(featurePath)
        .map((name) => readFileSync(join(featurePath, name), 'utf8'))
        .join('\n');
    })
    .join('\n');

  const domainTermsInFeatures = findBlueprintPurityViolations(featureBundle);
  if (domainTermsInFeatures.length === 0 && input.profile !== 'GENERIC_CUSTOM_APP_V1') {
    return { passed: false, detail: 'feature modules lack expected domain-specific language' };
  }

  const materialization = validateUniversalAppMaterialization({
    workspaceDir: input.workspaceDir,
    rawPrompt: input.prompt,
    selectedProfile: input.profile,
    projectId: 'purity-check',
    projectName: 'purity-check',
    buildRunId: 'purity-check',
    npmBuildOk: true,
  });

  if (!materialization.promptSpecificTermsPresent || !materialization.passed) {
    return {
      passed: false,
      detail: `prompt alignment failed without blueprint leakage: ${materialization.warnings.join('; ').slice(0, 120)}`,
    };
  }

  return {
    passed: true,
    detail: `modules=${modules.length}, domainTermsInFeatures=${domainTermsInFeatures.join(', ')}`,
  };
}

export function buildBlueprintPurityEvidence(input: {
  projectRootDir: string;
  workspaceDir?: string;
  workspaceShellResults?: BlueprintPurityFileScanResult[];
  allowedDomainSources?: string[];
  domainBoundaryDetail?: string;
  domainBoundaryPassed?: boolean;
}): BlueprintPurityEvidence {
  const sourceResults = scanBlueprintSourceFiles(input.projectRootDir);
  const shellResults = input.workspaceShellResults ?? [];
  const fileResults = [...sourceResults, ...shellResults];
  const violationCount = fileResults.reduce((sum, result) => sum + result.violations.length, 0);
  const failureReasons = fileResults
    .filter((result) => !result.passed)
    .map((result) => `${result.relativePath}: ${result.violations.join(', ')}`);

  if (input.domainBoundaryPassed === false) {
    failureReasons.push(input.domainBoundaryDetail ?? 'domain language boundary failed');
  }

  const shellPurityVerified = shellResults.every((result) => result.passed);
  const sourcePurityVerified = sourceResults.every((result) => result.passed);
  const domainLanguageBoundaryVerified = input.domainBoundaryPassed ?? true;
  const passed =
    sourcePurityVerified && shellPurityVerified && domainLanguageBoundaryVerified && violationCount === 0;

  return {
    readOnly: true,
    blueprintPurityStatus: passed ? 'PASS' : 'FAIL',
    blueprintPurityCheckedFiles: fileResults.map((result) => result.relativePath),
    blueprintPurityViolationCount: violationCount,
    blueprintPurityAllowedDomainSources: input.allowedDomainSources ?? [
      'src/features/',
      'src/features/registry.ts',
      'src/features/routes.ts',
      'src/blueprint/app-metadata.ts',
      'profile-feature-map.ts',
      'profile-feature-ui-generator.ts',
      'prompt-app-metadata.ts',
    ],
    blueprintPurityFailureReasons: failureReasons,
    fileResults,
    shellPurityVerified,
    domainLanguageBoundaryVerified,
    scannedAt: new Date().toISOString(),
  };
}

export {
  GENERATED_BLUEPRINT_SHELL_GLOBS,
  isBlueprintPurityAllowedDomainPath,
  isGeneratedBlueprintShellPath,
} from './blueprint-purity-banned-terms.js';
