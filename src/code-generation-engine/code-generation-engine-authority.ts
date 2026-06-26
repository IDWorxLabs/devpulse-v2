/**
 * Code Generation Engine V1 — writes generated app files into isolated workspaces.
 * All supported profiles flow through Universal Prompt-to-App Materialization V1.
 */

import { createRealFileOperation } from '../real-file-workspace-execution/real-file-operation-model.js';
import { executeRealFileOperation } from '../real-file-workspace-execution/real-file-operation-executor.js';
import { resolveSafeWorkspaceRoot } from '../real-file-workspace-execution/real-file-workspace-path-authority.js';
import type { MaterializeGeneratedAppInput, CodeGenerationEngineResult, GeneratedAppProfile } from './code-generation-engine-types.js';
import { buildUniversalCrudWorkspaceFiles } from './universal-crud-app-generator.js';
import { resolvePromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';

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

  const buildPlan =
    input.faithfulBuildPlan ??
    resolvePromptFaithfulBuildPlan(input.rawPrompt, input.profileOverride ?? null);
  const universalProfile = buildPlan.materializationProfile as GeneratedAppProfile;

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
