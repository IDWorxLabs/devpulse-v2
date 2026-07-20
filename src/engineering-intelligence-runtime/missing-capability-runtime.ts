/**
 * Engineering Intelligence Runtime V1 — missing capability repair runtime.
 * Wires Missing Capability Evolution Engine into the real one-prompt build path.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { runMissingCapabilityEvolutionPipeline } from '../missing-capability-evolution-engine/index.js';
import { createRealFileOperation } from '../real-file-workspace-execution/real-file-operation-model.js';
import { executeRealFileOperation } from '../real-file-workspace-execution/real-file-operation-executor.js';
import {
  buildFeatureAppRouterTsx,
  buildModularFeatureModuleFiles,
  buildModularFeatureRegistryTs,
  buildModularFeatureRoutesTs,
  type GeneratedFeatureModuleManifestEntry,
} from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import { checkPromptToFeatureFidelity } from './prompt-to-feature-fidelity-checker.js';
import { planFeatureGapRepair } from './feature-gap-repair-planner.js';
import type {
  EngineeringFeatureContract,
  MissingCapabilityRepairAttempt,
  MissingCapabilityRuntimeInput,
  MissingCapabilityRuntimeResult,
  PromptToFeatureFidelityResult,
} from './engineering-intelligence-types.js';
import { MAX_MISSING_CAPABILITY_REPAIR_ATTEMPTS } from './engineering-intelligence-types.js';
import { dedupeModuleIds } from '../prompt-faithful-generation/prompt-module-name-normalizer.js';
import { extractPromptAppTitle } from '../universal-prompt-to-app-materialization/prompt-app-metadata.js';

function writeWorkspaceFile(input: {
  projectRootDir: string;
  workspaceId: string;
  relativePath: string;
  content: string;
}): boolean {
  const operation = createRealFileOperation({
    workspaceId: input.workspaceId,
    relativePath: input.relativePath,
    operationType: 'CREATE_FILE',
    requestedBy: 'engineering-intelligence-runtime-v1',
    sourceActionId: 'missing-capability-repair',
    payload: input.content,
  });
  const executed = executeRealFileOperation({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    operation,
  });
  return Boolean(executed.result?.success);
}

function listExistingFeatureModuleIds(workspaceDir: string): string[] {
  const featuresDir = join(workspaceDir, 'src', 'features');
  if (!existsSync(featuresDir)) return [];
  return readdirSync(featuresDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !['registry', 'routes'].includes(name));
}

function loadExistingManifestEntries(
  workspaceDir: string,
  definition: ProfileFeatureDefinition,
): GeneratedFeatureModuleManifestEntry[] {
  const registryPath = join(workspaceDir, 'src', 'features', 'registry.ts');
  if (!existsSync(registryPath)) return [];
  const moduleIds = listExistingFeatureModuleIds(workspaceDir);
  const appTitle = extractPromptAppTitle('');
  return moduleIds.map((moduleId) => {
    const built = buildModularFeatureModuleFiles(moduleId, appTitle, definition);
    return built.manifestEntry;
  });
}

function rebuildFeatureInfrastructure(input: {
  workspaceDir: string;
  projectRootDir: string;
  workspaceId: string;
  definition: ProfileFeatureDefinition;
  moduleIds: readonly string[];
  appTitle: string;
}): void {
  const updatedDefinition: ProfileFeatureDefinition = {
    ...input.definition,
    featureModules: dedupeModuleIds([...input.moduleIds, ...input.definition.featureModules]),
    routes: dedupeModuleIds([...input.moduleIds, ...input.definition.featureModules]).map(
      (moduleId) => (moduleId === 'auth' ? '/' : `/${moduleId}`),
    ),
  };

  const manifestEntries: GeneratedFeatureModuleManifestEntry[] = [];
  for (const moduleId of dedupeModuleIds([...input.moduleIds])) {
    if (!existsSync(join(input.workspaceDir, 'src', 'features', moduleId))) continue;
    const built = buildModularFeatureModuleFiles(moduleId, input.appTitle, updatedDefinition);
    manifestEntries.push(built.manifestEntry);
  }

  const registryContent = buildModularFeatureRegistryTs(manifestEntries);
  const routesContent = buildModularFeatureRoutesTs();
  const routerContent = buildFeatureAppRouterTsx(updatedDefinition);

  writeWorkspaceFile({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    relativePath: 'src/features/registry.ts',
    content: registryContent,
  });
  writeWorkspaceFile({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    relativePath: 'src/features/routes.ts',
    content: routesContent,
  });
  writeWorkspaceFile({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    relativePath: 'src/features/feature-app-router.tsx',
    content: routerContent,
  });

  const appPath = join(input.workspaceDir, 'src', 'App.tsx');
  if (existsSync(appPath)) {
    const appContent = readFileSync(appPath, 'utf8');
    const hasDirectMount =
      /data-simple-utility-app|data-direct-feature-app|data-root-feature/.test(appContent);
    if (!hasDirectMount && !/FeatureAppRouter|feature-app-router/i.test(appContent)) {
      writeFileSync(
        appPath,
        `import FeatureAppRouter from './features/feature-app-router';\n\nexport default function App() {\n  return <FeatureAppRouter />;\n}\n`,
        'utf8',
      );
    }
  }
}

function generateMissingModuleFiles(input: {
  workspaceDir: string;
  projectRootDir: string;
  workspaceId: string;
  moduleIds: readonly string[];
  definition: ProfileFeatureDefinition;
  appTitle: string;
}): string[] {
  const generated: string[] = [];
  for (const moduleId of input.moduleIds) {
    const moduleDir = join(input.workspaceDir, 'src', 'features', moduleId);
    if (existsSync(moduleDir)) continue;

    const built = buildModularFeatureModuleFiles(moduleId, input.appTitle, input.definition);
    for (const file of built.files) {
      writeWorkspaceFile({
        projectRootDir: input.projectRootDir,
        workspaceId: input.workspaceId,
        relativePath: file.relativePath,
        content: file.content,
      });
    }
    generated.push(moduleId);
  }
  return generated;
}

function defaultRerunBuild(workspaceDir: string): { ok: boolean; output: string } {
  try {
    execSync('npm run build', {
      cwd: workspaceDir,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 180_000,
    });
    return { ok: true, output: '' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, output: message };
  }
}

export async function runMissingCapabilityRepairLoop(
  input: MissingCapabilityRuntimeInput,
): Promise<MissingCapabilityRuntimeResult> {
  const appTitle = extractPromptAppTitle(input.rawPrompt);
  const rerunBuild = input.rerunBuild ?? (() => defaultRerunBuild(input.workspaceDir));
  const attempts: MissingCapabilityRepairAttempt[] = [];
  let mceExecuted = false;
  let npmBuildOk = true;

  let fidelity = checkPromptToFeatureFidelity({
    rawPrompt: input.rawPrompt,
    workspaceDir: input.workspaceDir,
    generatedModules: listExistingFeatureModuleIds(input.workspaceDir),
    approvedModuleIds: input.approvedModuleIds,
    selectedProfile: input.selectedProfile,
    contract: input.contract,
  });

  for (let attempt = 1; attempt <= MAX_MISSING_CAPABILITY_REPAIR_ATTEMPTS; attempt++) {
    if (fidelity.passed) break;

    const repairPlan = planFeatureGapRepair({
      rawPrompt: input.rawPrompt,
      contract: input.contract,
      fidelity,
      existingModuleIds: listExistingFeatureModuleIds(input.workspaceDir),
      approvedModuleIds: input.approvedModuleIds,
    });

    if (!repairPlan) break;

    runMissingCapabilityEvolutionPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: input.productIntelligenceModel,
      promptFaithfulness: input.promptFaithfulness,
      capabilityPlanning: input.capabilityPlanning,
      promptFaithfulnessBlocked: !input.promptFaithfulness.readyForGeneration,
    });
    mceExecuted = true;

    const modulesGenerated = generateMissingModuleFiles({
      workspaceDir: input.workspaceDir,
      projectRootDir: input.projectRootDir,
      workspaceId: input.workspaceId,
      moduleIds: repairPlan.missingModules,
      definition: input.buildPlanDefinition,
      appTitle,
    });

    const allModules = dedupeModuleIds([
      ...listExistingFeatureModuleIds(input.workspaceDir),
      ...modulesGenerated,
    ]);

    if (repairPlan.updateRegistry || repairPlan.updateRoutes || repairPlan.updateAppWiring) {
      rebuildFeatureInfrastructure({
        workspaceDir: input.workspaceDir,
        projectRootDir: input.projectRootDir,
        workspaceId: input.workspaceId,
        definition: input.buildPlanDefinition,
        moduleIds: allModules,
        appTitle,
      });
    }

    if (repairPlan.rerunNpmBuild) {
      const buildResult = rerunBuild();
      npmBuildOk = buildResult.ok;
    }

    fidelity = checkPromptToFeatureFidelity({
      rawPrompt: input.rawPrompt,
      workspaceDir: input.workspaceDir,
      generatedModules: listExistingFeatureModuleIds(input.workspaceDir),
      approvedModuleIds: dedupeModuleIds([...input.approvedModuleIds, ...modulesGenerated]),
      selectedProfile: input.selectedProfile,
      contract: input.contract,
    });

    attempts.push({
      readOnly: true,
      attemptNumber: attempt,
      repairPlan,
      modulesGenerated,
      npmBuildOk,
      fidelityAfterRepair: fidelity,
      mcePipelineExecuted: true,
    });

    if (fidelity.passed) break;
  }

  return {
    readOnly: true,
    repairAttempts: attempts,
    repairsExhausted: !fidelity.passed && attempts.length >= MAX_MISSING_CAPABILITY_REPAIR_ATTEMPTS,
    finalFidelity: fidelity,
    missingCapabilityPipelineExecuted: mceExecuted,
    finalNpmBuildOk: npmBuildOk,
  };
}

export function shouldRunMissingCapabilityRuntime(fidelity: PromptToFeatureFidelityResult): boolean {
  return !fidelity.passed && (fidelity.verdict === 'REPAIR' || fidelity.missingModules.length > 0);
}
