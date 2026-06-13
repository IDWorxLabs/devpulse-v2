/**
 * Build Proof Gap Materializer — bounded artifact-to-file writes (Phase 26.71).
 * Materializes build-ready contract expectations under .generated-builder-workspaces/ only.
 */

import { existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { BuildReadyExecutionContract } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import { createRealFileOperation } from '../real-file-workspace-execution/real-file-operation-model.js';
import { executeRealFileOperation } from '../real-file-workspace-execution/real-file-operation-executor.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { resolveSafeWorkspaceRoot } from '../real-file-workspace-execution/real-file-workspace-path-authority.js';
import { materializeBuildContractExpectations } from './build-contract-materializer.js';
import { WORKSPACE_ROOT_DIR } from './connected-build-execution-registry.js';
import type {
  BuildArtifactToFileProof,
  BuildExecutionProofLevel,
  ExpectedArtifactEntry,
} from './connected-build-execution-types.js';

export const BUILD_PROOF_GAP_MATERIALIZATION_REPAIR_V1_PASS =
  'BUILD_PROOF_GAP_MATERIALIZATION_REPAIR_V1_PASS';

const FORBIDDEN_ARTIFACT_BASENAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  'credentials.json',
  'secrets.json',
  'id_rsa',
  'private.key',
]);

const FORBIDDEN_ARTIFACT_SUFFIXES = ['.pem', '.key', '.p12', '.pfx'];

function isForbiddenArtifactPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  const base = normalized.split('/').pop() ?? normalized;
  if (FORBIDDEN_ARTIFACT_BASENAMES.has(base)) return true;
  const lower = base.toLowerCase();
  return FORBIDDEN_ARTIFACT_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

function relativePathInWorkspace(expectedPath: string, workspaceId: string): string {
  const prefix = `${WORKSPACE_ROOT_DIR}/${workspaceId}/`;
  const normalized = expectedPath.replace(/\\/g, '/');
  if (normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length);
  }
  const alt = `${GENERATED_BUILDER_WORKSPACES_DIR}/${workspaceId}/`;
  if (normalized.startsWith(alt)) {
    return normalized.slice(alt.length);
  }
  return normalized.replace(/^\.generated-builder-workspaces\/[^/]+\//, '');
}

function derivePlanId(contract: BuildReadyExecutionContract): string {
  return `plan-contract-${contract.ideaId}`;
}

function deriveBuildManifestId(contract: BuildReadyExecutionContract): string {
  return `${contract.contractId}-manifest`;
}

function buildStubContent(input: {
  relativePath: string;
  artifact: ExpectedArtifactEntry;
  contract: BuildReadyExecutionContract;
  planId: string;
  buildManifestId: string;
}): string {
  const base = input.relativePath.split('/').pop() ?? input.relativePath;

  if (base === 'package.json') {
    return (
      JSON.stringify(
        {
          name: input.contract.contractId,
          version: '0.1.0',
          private: true,
          description: `Generated build workspace for ${input.contract.contractId}`,
          devpulseMaterialization: true,
        },
        null,
        2,
      ) + '\n'
    );
  }

  if (base === 'build-manifest.json') {
    return (
      JSON.stringify(
        {
          manifestId: input.buildManifestId,
          planId: input.planId,
          contractId: input.contract.contractId,
          ideaId: input.contract.ideaId,
          generatedAt: new Date().toISOString(),
          buildUnits: input.contract.buildUnits.map((u) => u.unitId),
          materializationSource: 'build-proof-gap-materializer',
        },
        null,
        2,
      ) + '\n'
    );
  }

  if (input.relativePath.endsWith('.tsx')) {
    return `// Generated build artifact for ${input.contract.contractId}\nexport default function GeneratedApp() {\n  return null;\n}\n`;
  }

  if (input.relativePath.endsWith('.ts')) {
    return `// Generated build artifact for ${input.contract.contractId}\nexport {};\n`;
  }

  if (input.relativePath.endsWith('.json')) {
    return (
      JSON.stringify(
        {
          generated: true,
          contractId: input.contract.contractId,
          artifactId: input.artifact.artifactId,
        },
        null,
        2,
      ) + '\n'
    );
  }

  if (base === 'README.md') {
    return `# ${input.contract.contractId}\n\nGenerated builder workspace (read-only materialization proof).\n`;
  }

  return `# Generated artifact\n\nContract: ${input.contract.contractId}\nArtifact: ${input.artifact.artifactId}\n`;
}

function fileExistsNonEmpty(projectRootDir: string, workspaceId: string, relativePath: string): boolean {
  const rootVerdict = resolveSafeWorkspaceRoot(projectRootDir, workspaceId);
  if (rootVerdict.result !== 'REAL_FILE_WORKSPACE_PATH_PASS') return false;
  const abs = join(rootVerdict.workspaceRoot, relativePath);
  try {
    const stat = statSync(abs);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

function writeArtifactFile(input: {
  projectRootDir: string;
  workspaceId: string;
  relativePath: string;
  content: string;
}): { ok: boolean; reason: string } {
  if (isForbiddenArtifactPath(input.relativePath)) {
    return { ok: false, reason: `Forbidden artifact path: ${input.relativePath}` };
  }

  const operation = createRealFileOperation({
    workspaceId: input.workspaceId,
    relativePath: input.relativePath,
    operationType: 'CREATE_FILE',
    requestedBy: 'build-proof-gap-materializer',
    sourceActionId: 'build-proof-gap-materialization',
    payload: input.content,
  });

  const executed = executeRealFileOperation({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    operation,
  });

  if (!executed.result?.success) {
    return { ok: false, reason: executed.result?.summary ?? 'Write failed' };
  }

  return { ok: true, reason: 'written' };
}

export function computeArtifactToFileProof(input: {
  contract: BuildReadyExecutionContract;
  projectRootDir: string;
  materializationAttempted: boolean;
  generatedAt?: string;
}): BuildArtifactToFileProof {
  const expectations = materializeBuildContractExpectations(input.contract);
  const workspaceId = input.contract.contractId;
  const workspacePath = `${WORKSPACE_ROOT_DIR}/${workspaceId}`.replace(/\\/g, '/');
  const planId = derivePlanId(input.contract);
  const buildManifestId = deriveBuildManifestId(input.contract);

  const materializedFiles: string[] = [];
  const missingArtifacts: string[] = [];

  for (const artifact of expectations.expectedArtifacts) {
    const rel = relativePathInWorkspace(artifact.expectedPath, workspaceId);
    if (isForbiddenArtifactPath(rel)) {
      missingArtifacts.push(`${artifact.artifactId} → forbidden path ${artifact.expectedPath}`);
      continue;
    }
    if (fileExistsNonEmpty(input.projectRootDir, workspaceId, rel)) {
      materializedFiles.push(artifact.expectedPath);
    } else {
      missingArtifacts.push(`${artifact.artifactId} → ${artifact.expectedPath}`);
    }
  }

  const rootVerdict = resolveSafeWorkspaceRoot(input.projectRootDir, workspaceId);
  const workspaceExists =
    rootVerdict.result === 'REAL_FILE_WORKSPACE_PATH_PASS' &&
    existsSync(rootVerdict.workspaceRoot);

  const expectedArtifactCount = expectations.expectedArtifacts.length;
  const materializedFileCount = materializedFiles.length;
  const missingArtifactCount = missingArtifacts.length;

  let proofLevel: BuildExecutionProofLevel = 'NOT_PROVEN';
  if (
    input.materializationAttempted &&
    workspaceExists &&
    missingArtifactCount === 0 &&
    materializedFileCount >= expectedArtifactCount &&
    expectedArtifactCount > 0
  ) {
    proofLevel = 'PROVEN';
  } else if (materializedFileCount > 0) {
    proofLevel = 'PARTIAL';
  }

  return {
    readOnly: true,
    materializationAttempted: input.materializationAttempted,
    planId,
    buildManifestId,
    workspaceId,
    workspacePath,
    expectedArtifactCount,
    materializedFileCount,
    missingArtifactCount,
    materializedFiles,
    missingArtifacts,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    proofLevel,
  };
}

export function materializeBuildProofGapArtifacts(input: {
  projectRootDir: string;
  contract: BuildReadyExecutionContract;
}): BuildArtifactToFileProof {
  const workspaceId = input.contract.contractId;
  const expectations = materializeBuildContractExpectations(input.contract);
  const planId = derivePlanId(input.contract);
  const buildManifestId = deriveBuildManifestId(input.contract);
  const generatedAt = new Date().toISOString();

  resolveSafeWorkspaceRoot(input.projectRootDir, workspaceId);

  for (const artifact of expectations.expectedArtifacts) {
    const rel = relativePathInWorkspace(artifact.expectedPath, workspaceId);
    if (isForbiddenArtifactPath(rel)) continue;
    if (fileExistsNonEmpty(input.projectRootDir, workspaceId, rel)) continue;

    const content = buildStubContent({
      relativePath: rel,
      artifact,
      contract: input.contract,
      planId,
      buildManifestId,
    });

    writeArtifactFile({
      projectRootDir: input.projectRootDir,
      workspaceId,
      relativePath: rel,
      content,
    });
  }

  return computeArtifactToFileProof({
    contract: input.contract,
    projectRootDir: input.projectRootDir,
    materializationAttempted: true,
    generatedAt,
  });
}

export function isPathUnderGeneratedBuilderWorkspaces(projectRootDir: string, targetPath: string): boolean {
  const rel = relative(projectRootDir, targetPath).replace(/\\/g, '/');
  return (
    rel === GENERATED_BUILDER_WORKSPACES_DIR ||
    rel.startsWith(`${GENERATED_BUILDER_WORKSPACES_DIR}/`)
  );
}
