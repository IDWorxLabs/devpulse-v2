/**
 * Workspace Creation Executor — real disposable workspace directory creation (Phase 25.26).
 * Creates directories only under .generated-builder-workspaces/{workspaceId}.
 */

import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { createRealFileOperation } from '../real-file-workspace-execution/real-file-operation-model.js';
import { executeRealFileOperation } from '../real-file-workspace-execution/real-file-operation-executor.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { resolveSafeWorkspaceRoot } from '../real-file-workspace-execution/real-file-workspace-path-authority.js';
import { MAX_CREATED_ARTIFACTS, MAX_CREATED_DIRECTORIES, WORLD2_DISPOSABLE_LOGICAL_ROOT_PREFIX } from './connected-workspace-creation-registry.js';
import type {
  ExecuteWorkspaceCreationInput,
  ExecuteWorkspaceCreationResult,
  WorkspaceCreationArtifact,
  WorkspaceCreationEvidenceEntry,
  WorkspaceCreationFilesystemEvidence,
} from './connected-workspace-creation-types.js';

let evidenceCounter = 0;

export function resetWorkspaceCreationExecutorForTests(): void {
  evidenceCounter = 0;
}

function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `workspace-creation-evidence-${evidenceCounter}`;
}

export function mapLogicalPathToRelative(logicalPath: string, workspaceId: string): string {
  const normalized = logicalPath.replace(/\\/g, '/');
  const prefix = `${WORLD2_DISPOSABLE_LOGICAL_ROOT_PREFIX}${workspaceId}`;
  const prefixWithSlash = `${prefix}/`;

  if (normalized.startsWith(prefixWithSlash)) {
    return normalized.slice(prefixWithSlash.length);
  }
  if (normalized === prefix) {
    return '.';
  }
  return normalized.replace(/^\/+/, '');
}

function buildEvidence(
  evidenceType: string,
  summary: string,
  source: string,
): WorkspaceCreationEvidenceEntry {
  return {
    readOnly: true,
    evidenceId: nextEvidenceId(),
    evidenceType,
    summary,
    source,
    inspectedAt: new Date().toISOString(),
  };
}

export function inspectWorkspaceFilesystem(
  projectRootDir: string,
  workspaceId: string,
  creationDurationMs: number,
): WorkspaceCreationFilesystemEvidence {
  const rootVerdict = resolveSafeWorkspaceRoot(projectRootDir, workspaceId);
  const workspaceRoot = rootVerdict.workspaceRoot;
  const inspectedAt = new Date().toISOString();

  if (rootVerdict.result !== 'REAL_FILE_WORKSPACE_PATH_PASS' || !workspaceRoot) {
    return {
      readOnly: true,
      workspaceExists: false,
      workspaceRootExists: false,
      directoryCount: 0,
      artifactCount: 0,
      creationDurationMs,
      creationSuccessful: false,
      inspectedAt,
      inspectionSource: 'real-filesystem-inspection',
    };
  }

  const workspaceRootExists = existsSync(workspaceRoot);
  let directoryCount = 0;
  let artifactCount = 0;

  if (workspaceRootExists) {
    try {
      const entries = readdirSync(workspaceRoot, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) directoryCount += 1;
        if (entry.isFile()) artifactCount += 1;
      }
      const markerPath = join(workspaceRoot, '.workspace-created.json');
      if (existsSync(markerPath)) {
        artifactCount += 1;
      }
    } catch {
      // Count remains zero — inspection still reports root existence.
    }
  }

  return {
    readOnly: true,
    workspaceExists: workspaceRootExists,
    workspaceRootExists,
    directoryCount,
    artifactCount,
    creationDurationMs,
    creationSuccessful: workspaceRootExists && directoryCount > 0,
    inspectedAt,
    inspectionSource: 'real-filesystem-inspection',
  };
}

export function cleanupDisposableWorkspace(projectRootDir: string, workspaceId: string): boolean {
  if (!workspaceId || workspaceId.includes('..')) {
    return false;
  }
  const workspaceRoot = resolve(projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR, workspaceId);
  const generatedRoot = resolve(projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR);
  if (!workspaceRoot.startsWith(generatedRoot + sep) && workspaceRoot !== generatedRoot) {
    return false;
  }
  if (!existsSync(workspaceRoot)) {
    return true;
  }
  try {
    rmSync(workspaceRoot, { recursive: true, force: true });
    return !existsSync(workspaceRoot);
  } catch {
    return false;
  }
}

export function executeWorkspaceCreation(
  input: ExecuteWorkspaceCreationInput,
): ExecuteWorkspaceCreationResult {
  const startMs = Date.now();
  const creationEvidence: WorkspaceCreationEvidenceEntry[] = [];
  const creationWarnings: string[] = [];
  const blockingReasons: string[] = [];
  const createdDirectories: string[] = [];
  const createdArtifacts: WorkspaceCreationArtifact[] = [];

  if (input.creationMode === 'BLOCKED' || input.creationMode === 'DRY_RUN') {
    const filesystemEvidence = inspectWorkspaceFilesystem(input.projectRootDir, input.workspaceId, 0);
    return {
      success: false,
      workspaceRoot: '',
      logicalRoot: input.logicalRoot,
      createdDirectories,
      createdArtifacts,
      creationWarnings: [`Creation mode ${input.creationMode} — no real directories created.`],
      creationEvidence,
      filesystemEvidence,
      realFileMutationPerformed: false,
      blockingReasons:
        input.creationMode === 'BLOCKED' ? ['Workspace creation blocked by upstream gates.'] : [],
    };
  }

  const rootVerdict = resolveSafeWorkspaceRoot(input.projectRootDir, input.workspaceId);
  if (rootVerdict.result !== 'REAL_FILE_WORKSPACE_PATH_PASS') {
    blockingReasons.push(rootVerdict.reason);
    return {
      success: false,
      workspaceRoot: '',
      logicalRoot: input.logicalRoot,
      createdDirectories,
      createdArtifacts,
      creationWarnings,
      creationEvidence: [
        buildEvidence('PATH_BLOCKED', rootVerdict.reason, 'workspace-creation-executor'),
      ],
      filesystemEvidence: inspectWorkspaceFilesystem(
        input.projectRootDir,
        input.workspaceId,
        Date.now() - startMs,
      ),
      realFileMutationPerformed: false,
      blockingReasons,
    };
  }

  creationEvidence.push(
    buildEvidence(
      'WORKSPACE_ROOT_RESOLVED',
      `Workspace root resolved: ${rootVerdict.workspaceRoot}`,
      'real-file-workspace-path-authority',
    ),
  );

  const relativeDirs = input.directoriesToCreate
    .map((dir) => mapLogicalPathToRelative(dir, input.workspaceId))
    .filter((dir) => dir.length > 0 && dir !== '.')
    .slice(0, MAX_CREATED_DIRECTORIES);

  if (relativeDirs.length === 0) {
    relativeDirs.push('src', 'architecture', 'audit', 'validation', 'rollback');
  }

  for (const relativeDir of relativeDirs) {
    const operation = createRealFileOperation({
      workspaceId: input.workspaceId,
      relativePath: relativeDir,
      operationType: 'CREATE_FOLDER',
      requestedBy: 'connected-workspace-creation',
      sourceActionId: `create-dir-${relativeDir}`,
    });
    const result = executeRealFileOperation({
      projectRootDir: input.projectRootDir,
      workspaceId: input.workspaceId,
      operation,
    });
    if (result.result?.success) {
      createdDirectories.push(relativeDir);
      creationEvidence.push(
        buildEvidence('DIRECTORY_CREATED', result.result.summary, 'real-file-operation-executor'),
      );
    } else {
      blockingReasons.push(result.result?.blockReason ?? `Failed to create directory: ${relativeDir}`);
    }
  }

  const markerRelativePath = '.workspace-created.json';
  const markerPayload = JSON.stringify(
    {
      workspaceId: input.workspaceId,
      logicalRoot: input.logicalRoot,
      createdAt: new Date().toISOString(),
      createdDirectories,
      phase: '25.26',
    },
    null,
    2,
  );
  const markerOp = createRealFileOperation({
    workspaceId: input.workspaceId,
    relativePath: markerRelativePath,
    operationType: 'CREATE_FILE',
    requestedBy: 'connected-workspace-creation',
    sourceActionId: 'workspace-created-marker',
    payload: markerPayload,
  });
  const markerResult = executeRealFileOperation({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    operation: markerOp,
  });
  if (markerResult.result?.success) {
    createdArtifacts.push({
      readOnly: true,
      path: markerRelativePath,
      category: 'CREATION_MARKER',
      sourceAuthority: 'connected-workspace-creation',
    });
    creationEvidence.push(
      buildEvidence('ARTIFACT_CREATED', markerResult.result.summary, 'real-file-operation-executor'),
    );
  }

  for (const artifact of input.artifactsToCreate.slice(0, MAX_CREATED_ARTIFACTS)) {
    const relativePath = mapLogicalPathToRelative(artifact.path, input.workspaceId);
    if (!relativePath || relativePath === markerRelativePath) continue;
    const fileOp = createRealFileOperation({
      workspaceId: input.workspaceId,
      relativePath,
      operationType: 'CREATE_FILE',
      requestedBy: 'connected-workspace-creation',
      sourceActionId: `create-artifact-${relativePath}`,
      payload: `# ${artifact.category}\n# Source: ${artifact.sourceAuthority}\n`,
    });
    const fileResult = executeRealFileOperation({
      projectRootDir: input.projectRootDir,
      workspaceId: input.workspaceId,
      operation: fileOp,
    });
    if (fileResult.result?.success) {
      createdArtifacts.push(artifact);
      creationEvidence.push(
        buildEvidence('ARTIFACT_CREATED', fileResult.result.summary, 'real-file-operation-executor'),
      );
    } else {
      creationWarnings.push(`Artifact not created: ${relativePath}`);
    }
  }

  const creationDurationMs = Date.now() - startMs;
  const filesystemEvidence = inspectWorkspaceFilesystem(
    input.projectRootDir,
    input.workspaceId,
    creationDurationMs,
  );

  creationEvidence.push(
    buildEvidence(
      'FILESYSTEM_INSPECTION',
      `workspaceExists=${filesystemEvidence.workspaceExists} directoryCount=${filesystemEvidence.directoryCount} artifactCount=${filesystemEvidence.artifactCount}`,
      'real-filesystem-inspection',
    ),
  );

  const success =
    blockingReasons.length === 0 &&
    filesystemEvidence.creationSuccessful &&
    createdDirectories.length > 0;

  if (!filesystemEvidence.workspaceRootExists) {
    try {
      statSync(rootVerdict.workspaceRoot);
    } catch {
      blockingReasons.push('Workspace root does not exist after creation attempt.');
    }
  }

  return {
    success,
    workspaceRoot: rootVerdict.workspaceRoot,
    logicalRoot: input.logicalRoot,
    createdDirectories,
    createdArtifacts,
    creationWarnings,
    creationEvidence,
    filesystemEvidence,
    realFileMutationPerformed: success,
    blockingReasons,
  };
}
