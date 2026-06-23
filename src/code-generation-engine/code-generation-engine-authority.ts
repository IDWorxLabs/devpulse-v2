/**
 * Code Generation Engine V1 — writes generated app files into isolated workspaces.
 */

import { createRealFileOperation } from '../real-file-workspace-execution/real-file-operation-model.js';
import { executeRealFileOperation } from '../real-file-workspace-execution/real-file-operation-executor.js';
import { resolveSafeWorkspaceRoot } from '../real-file-workspace-execution/real-file-workspace-path-authority.js';
import type { MaterializeGeneratedAppInput, CodeGenerationEngineResult, GeneratedAppProfile } from './code-generation-engine-types.js';
import { detectTaskTrackerIdea } from './task-tracker-detector.js';
import { buildTaskTrackerWorkspaceFiles } from './task-tracker-generator.js';
import { buildUniversalCrudWorkspaceFiles } from './universal-crud-app-generator.js';
import { detectUniversalAppProfile } from '../universal-feature-contract-intelligence/universal-feature-contract-builder.js';

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
    sourceActionId: 'task-tracker-app-generation',
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

  if (!detectTaskTrackerIdea(input.rawPrompt)) {
    const universalProfile = detectUniversalAppProfile(input.rawPrompt);
    if (!universalProfile) {
      return {
        readOnly: true,
        generated: false,
        profile: null,
        workspaceId,
        generatedFiles: [],
        skippedReason: 'No supported application profile detected for prompt',
      };
    }

    if (universalProfile !== 'TASK_TRACKER_WEB_V1') {
      const files = buildUniversalCrudWorkspaceFiles({
        contractId: input.contract.contractId,
        ideaId: input.contract.ideaId,
        buildUnits: input.contract.buildUnits.map((unit) => unit.unitId),
        rawPrompt: input.rawPrompt,
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
        profile: universalProfile as GeneratedAppProfile,
        workspaceId,
        generatedFiles,
        skippedReason: generatedFiles.length > 0 ? null : 'File writes failed',
      };
    }
  }

  if (!detectTaskTrackerIdea(input.rawPrompt)) {
    return {
      readOnly: true,
      generated: false,
      profile: null,
      workspaceId,
      generatedFiles: [],
      skippedReason: 'No supported application profile detected for prompt',
    };
  }

  const files = buildTaskTrackerWorkspaceFiles({
    contractId: input.contract.contractId,
    ideaId: input.contract.ideaId,
    buildUnits: input.contract.buildUnits.map((unit) => unit.unitId),
    rawPrompt: input.rawPrompt,
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
    profile: 'TASK_TRACKER_WEB_V1',
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
    };
    return (
      parsed.devpulseGeneratedApp === 'task-tracker-v1' ||
      parsed.devpulseGeneratedApp === 'crm-v1' ||
      parsed.devpulseGeneratedApp === 'inventory-v1' ||
      parsed.devpulseGeneratedApp === 'school-management-v1' ||
      parsed.devpulseGeneratedApp === 'project-management-v1' ||
      parsed.devpulseUniversalFeatureContract === 'v1' ||
      parsed.devpulseUniversalBlueprint === 'v1' ||
      (typeof parsed.scripts?.dev === 'string' && parsed.scripts.dev.includes('vite')) ||
      Boolean(parsed.devDependencies?.vite)
    );
  } catch {
    return false;
  }
}
