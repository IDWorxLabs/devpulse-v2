/**
 * Code Generation Engine V1 — writes generated app files into isolated workspaces.
 * All supported profiles flow through Universal Prompt-to-App Materialization V1.
 */

import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createRealFileOperation } from '../real-file-workspace-execution/real-file-operation-model.js';
import { executeRealFileOperation } from '../real-file-workspace-execution/real-file-operation-executor.js';
import { resolveSafeWorkspaceRoot } from '../real-file-workspace-execution/real-file-workspace-path-authority.js';
import type { MaterializeGeneratedAppInput, CodeGenerationEngineResult, GeneratedAppProfile } from './code-generation-engine-types.js';
import { buildUniversalCrudWorkspaceFiles } from './universal-crud-app-generator.js';
import { guardPromptBoundedMaterialization, applyPromptBoundedPlanToBuildPlan } from '../prompt-bounded-materialization/index.js';
import { resolvePromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import { materializableFeatureModules } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import { enforceDirectFeatureRootMountInWorkspace } from '../simple-utility-app/direct-feature-root-mount.js';

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
    requestedBy: 'code-generation-engine-v1',
    sourceActionId: 'universal-modular-app-generation',
    payload: input.content,
  });

  const executed = executeRealFileOperation({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    operation,
  });

  return Boolean(executed.result?.success);
}

function pruneStaleFeatureModuleDirectories(input: {
  projectRootDir: string;
  workspaceId: string;
  expectedModuleIds: string[];
}): void {
  const rootVerdict = resolveSafeWorkspaceRoot(input.projectRootDir, input.workspaceId);
  if (rootVerdict.result !== 'REAL_FILE_WORKSPACE_PATH_PASS') return;

  const featuresDir = join(rootVerdict.workspaceRoot, 'src', 'features');
  if (!existsSync(featuresDir)) return;

  const keep = new Set([...input.expectedModuleIds, 'registry', 'routes']);
  for (const entry of readdirSync(featuresDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || keep.has(entry.name)) continue;
    rmSync(join(featuresDir, entry.name), { recursive: true, force: true });
  }
}

export function materializeGeneratedApplication(
  input: MaterializeGeneratedAppInput,
): CodeGenerationEngineResult {
  const workspaceId = input.workspaceId;
  const rootVerdict = resolveSafeWorkspaceRoot(input.projectRootDir, workspaceId);
  if (rootVerdict.result !== 'REAL_FILE_WORKSPACE_PATH_PASS') {
    return {
      readOnly: true,
      generated: false,
      profile: null,
      workspaceId,
      generatedFiles: [],
      skippedReason: rootVerdict.reason,
    };
  }

  const buildPlanInitial =
    input.faithfulBuildPlan ??
    resolvePromptFaithfulBuildPlan(input.rawPrompt, input.profileOverride ?? null);

  const materializationGuard = guardPromptBoundedMaterialization({
    rawPrompt: input.rawPrompt,
    buildPlan: buildPlanInitial,
  });
  if (!materializationGuard.allowed) {
    return {
      readOnly: true,
      generated: false,
      profile: null,
      workspaceId,
      generatedFiles: [],
      skippedReason:
        materializationGuard.blockedReason ??
        'Prompt-Bounded Materialization Guard blocked generation before file writes.',
    };
  }

  const buildPlan = applyPromptBoundedPlanToBuildPlan(buildPlanInitial, materializationGuard.plan);
  const universalProfile = buildPlan.materializationProfile as GeneratedAppProfile;
  const expectedModuleIds = materializableFeatureModules(buildPlan.definition);

  pruneStaleFeatureModuleDirectories({
    projectRootDir: input.projectRootDir,
    workspaceId,
    expectedModuleIds,
  });

  const files = buildUniversalCrudWorkspaceFiles({
    contractId: input.contract.contractId,
    ideaId: input.contract.ideaId,
    buildUnits: input.contract.buildUnits.map((unit) => unit.unitId),
    rawPrompt: input.rawPrompt,
    profile: universalProfile,
    buildRunId: input.contract.contractId,
    faithfulBuildPlan: buildPlan,
  });

  const generatedFiles: string[] = [];
  for (const file of files) {
    const ok = writeWorkspaceFile({
      projectRootDir: input.projectRootDir,
      workspaceId,
      relativePath: file.relativePath,
      content: file.content,
    });
    if (ok) generatedFiles.push(file.relativePath);
  }

  const directMountResult = enforceDirectFeatureRootMountInWorkspace({
    workspaceDir: rootVerdict.workspaceRoot,
    rawPrompt: input.rawPrompt,
    definition: buildPlan.definition,
    displayName: buildPlan.extraction.appName,
  });
  if (directMountResult.applied && !generatedFiles.includes('src/App.tsx')) {
    generatedFiles.push('src/App.tsx');
  }

  return {
    readOnly: true,
    generated: generatedFiles.length > 0,
    profile: universalProfile,
    workspaceId,
    generatedFiles,
    skippedReason: generatedFiles.length > 0 ? null : 'File writes failed',
  };
}

export function usesViteReactRuntime(packageJsonSource: string): boolean {
  try {
    const parsed = JSON.parse(packageJsonSource) as {
      scripts?: Record<string, string>;
      devDependencies?: Record<string, string>;
      devpulseGeneratedApp?: string;
      devpulseUniversalBlueprint?: string;
      devpulseUniversalFeatureContract?: string;
      devpulseModularFeatureMaterialization?: string;
    };
    return (
      parsed.devpulseModularFeatureMaterialization === 'v1' ||
      parsed.devpulseUniversalFeatureContract === 'v1' ||
      parsed.devpulseUniversalBlueprint === 'v1' ||
      (typeof parsed.scripts?.dev === 'string' && parsed.scripts.dev.includes('vite')) ||
      Boolean(parsed.devDependencies?.vite)
    );
  } catch {
    return false;
  }
}
