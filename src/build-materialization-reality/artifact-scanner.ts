/**
 * Artifact Reality Scanner — read-only filesystem scan under .generated-builder-workspaces/.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { materializeBuildContractExpectations } from '../connected-build-execution/build-contract-materializer.js';
import type { BuildReadyExecutionContract } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import { WORKSPACE_ROOT_DIR, MAX_WORKSPACES_DEEP_SCAN } from './build-materialization-reality-registry.js';
import type { ArtifactFileReality, ArtifactRealityScanSummary, WorkspaceReality } from './build-materialization-reality-types.js';

const MAX_SCAN_DEPTH = 6;
const MAX_SCAN_FILES = 512;

function scanDirectory(rootDir: string, relativeDir: string, depth: number, acc: string[]): void {
  if (depth > MAX_SCAN_DEPTH || acc.length >= MAX_SCAN_FILES) return;
  const abs = join(rootDir, relativeDir);
  if (!existsSync(abs)) return;

  let entries: string[];
  try {
    entries = readdirSync(abs);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (acc.length >= MAX_SCAN_FILES) break;
    const rel = join(relativeDir, entry).replace(/\\/g, '/');
    const full = join(rootDir, rel);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        scanDirectory(rootDir, rel, depth + 1, acc);
      }
    } else if (stat.isFile()) {
      acc.push(rel);
    }
  }
}

export function listGeneratedWorkspaceIds(rootDir: string): string[] {
  const workspaceRoot = join(rootDir, WORKSPACE_ROOT_DIR);
  if (!existsSync(workspaceRoot)) return [];
  try {
    return readdirSync(workspaceRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function fileStat(rootDir: string, relativePath: string): { exists: boolean; sizeBytes: number } {
  const abs = join(rootDir, relativePath);
  try {
    const stat = statSync(abs);
    if (stat.isFile()) {
      return { exists: true, sizeBytes: stat.size };
    }
  } catch {
    /* not found */
  }
  return { exists: false, sizeBytes: 0 };
}

function buildArtifactFileReality(input: {
  rootDir: string;
  relativePath: string;
  expected: boolean;
  linked: boolean;
  counted: boolean;
  propagated: boolean;
}): ArtifactFileReality {
  const stat = fileStat(input.rootDir, input.relativePath);
  return {
    readOnly: true,
    relativePath: input.relativePath.replace(/\\/g, '/'),
    absolutePath: join(input.rootDir, input.relativePath).replace(/\\/g, '/'),
    exists: stat.exists,
    expected: input.expected,
    generated: stat.exists && stat.sizeBytes > 0,
    linked: input.linked && stat.exists,
    counted: input.counted && stat.exists,
    propagated: input.propagated && stat.exists,
    sizeBytes: stat.sizeBytes,
  };
}

export function scanWorkspaceArtifactReality(input: {
  rootDir: string;
  workspaceId: string;
  contract: BuildReadyExecutionContract | null;
  connectedBuildReport: ConnectedBuildExecutionReport | null;
}): WorkspaceReality {
  const workspacePath = `${WORKSPACE_ROOT_DIR}/${input.workspaceId}`.replace(/\\/g, '/');
  const absWorkspace = join(input.rootDir, workspacePath);
  const workspaceExists = existsSync(absWorkspace);

  const observedPaths: string[] = [];
  if (workspaceExists) {
    scanDirectory(input.rootDir, workspacePath, 0, observedPaths);
  }
  const observedSet = new Set(observedPaths.map((p) => p.replace(/\\/g, '/')));

  const materialization =
    input.contract && input.contract.contractId === input.workspaceId
      ? materializeBuildContractExpectations(input.contract)
      : null;

  const expectedPaths = materialization?.expectedFiles ?? [];
  const linkedSet = new Set(
    input.connectedBuildReport?.buildManifest.linkedArtifacts.map((a) => a.expectedPath) ?? [],
  );
  const generatedSet = new Set(
    input.connectedBuildReport?.generatedFileEvidence.generatedPaths ?? [],
  );
  const missingSet = new Set(
    input.connectedBuildReport?.generatedFileEvidence.missingPaths ?? [],
  );

  const allPaths = new Set([
    ...expectedPaths,
    ...observedPaths.filter((p) => p.startsWith(workspacePath)),
  ]);

  const artifactFiles: ArtifactFileReality[] = [...allPaths].map((relativePath) => {
    const norm = relativePath.replace(/\\/g, '/');
    const expected = expectedPaths.includes(norm);
    const exists = observedSet.has(norm) || fileStat(input.rootDir, norm).exists;
    const linked =
      linkedSet.has(norm) ||
      (expected && exists && !missingSet.has(norm) && generatedSet.has(norm));
    const counted = generatedSet.has(norm) || (expected && exists);
    const propagated =
      input.connectedBuildReport !== null &&
      generatedSet.has(norm) &&
      input.connectedBuildReport.generatedFileEvidence.proofLevel !== 'NOT_PROVEN';

    return buildArtifactFileReality({
      rootDir: input.rootDir,
      relativePath: norm,
      expected,
      linked,
      counted,
      propagated,
    });
  });

  const structureMarkers = ['src', 'package.json', 'build-manifest.json', 'runtime', 'verification'];
  const structureMarkersFound: string[] = [];
  const structureMarkersMissing: string[] = [];
  for (const marker of structureMarkers) {
    const found =
      observedSet.has(`${workspacePath}/${marker}`) ||
      [...observedSet].some((p) => p.includes(`/${marker}/`) || p.endsWith(`/${marker}`));
    if (found) structureMarkersFound.push(marker);
    else structureMarkersMissing.push(marker);
  }

  const manifestPath = `${workspacePath}/build-manifest.json`;
  const linkedToManifest = fileStat(input.rootDir, manifestPath).exists;

  return {
    readOnly: true,
    workspaceId: input.workspaceId,
    workspacePath,
    workspaceExists,
    workspacePopulated: observedPaths.length > 0,
    fileCount: observedPaths.length,
    linkedToManifest,
    linkedToExecutionProof:
      input.connectedBuildReport?.linkageAnalysis.linkageConnected === true &&
      input.connectedBuildReport.buildMaterialization.contractId === input.workspaceId,
    linkedToRuntimeProof: observedSet.has(`${workspacePath}/runtime/dev-server.mjs`.replace(/\\/g, '/')),
    structureMarkersFound,
    structureMarkersMissing,
    artifactFiles,
  };
}

export function scanArtifactReality(input: {
  rootDir: string;
  contract: BuildReadyExecutionContract | null;
  connectedBuildReport: ConnectedBuildExecutionReport | null;
}): ArtifactRealityScanSummary {
  const workspaceRoot = join(input.rootDir, WORKSPACE_ROOT_DIR);
  const workspaceRootExists = existsSync(workspaceRoot);
  const allWorkspaceIds = listGeneratedWorkspaceIds(input.rootDir);

  const primaryId = input.contract?.contractId ?? allWorkspaceIds[0] ?? null;
  const deepScanIds = new Set<string>();
  if (primaryId) deepScanIds.add(primaryId);

  for (const id of allWorkspaceIds) {
    if (deepScanIds.size >= MAX_WORKSPACES_DEEP_SCAN) break;
    const manifest = join(workspaceRoot, id, 'build-manifest.json');
    if (existsSync(manifest)) deepScanIds.add(id);
  }

  for (const id of allWorkspaceIds) {
    if (deepScanIds.size >= MAX_WORKSPACES_DEEP_SCAN) break;
    deepScanIds.add(id);
  }

  const scanIds = [...deepScanIds];

  const workspaces = scanIds.map((workspaceId) =>
    scanWorkspaceArtifactReality({
      rootDir: input.rootDir,
      workspaceId,
      contract: input.contract?.contractId === workspaceId ? input.contract : null,
      connectedBuildReport:
        input.connectedBuildReport?.buildMaterialization.contractId === workspaceId
          ? input.connectedBuildReport
          : input.contract?.contractId === workspaceId
            ? input.connectedBuildReport
            : null,
    }),
  );

  const primaryWorkspace =
    workspaces.find((w) => w.workspaceId === primaryId) ?? workspaces[0] ?? null;

  const expectedArtifacts =
    input.contract && primaryId === input.contract.contractId
      ? materializeBuildContractExpectations(input.contract).expectedArtifacts.length
      : primaryWorkspace?.artifactFiles.filter((f) => f.expected).length ?? 0;

  const allFiles = workspaces.flatMap((w) => w.artifactFiles);
  const existing = allFiles.filter((f) => f.generated);
  const missing = allFiles.filter((f) => f.expected && !f.generated);
  const linked = allFiles.filter((f) => f.linked);
  const propagated = allFiles.filter((f) => f.propagated);

  return {
    readOnly: true,
    workspaceRootExists,
    workspaceCount: allWorkspaceIds.length,
    totalFilesObserved: workspaces.reduce((sum, w) => sum + w.fileCount, 0),
    totalExpectedArtifacts: expectedArtifacts,
    totalExistingArtifacts: existing.length,
    totalMissingArtifacts: missing.length,
    totalLinkedArtifacts: linked.length,
    totalPropagatedArtifacts: propagated.length,
    workspaces,
  };
}

export function findFirstMissingExpectedFile(
  scan: ArtifactRealityScanSummary,
  contractId: string | null,
): string | null {
  const primary =
    scan.workspaces.find((w) => w.workspaceId === contractId) ?? scan.workspaces[0] ?? null;
  if (!primary) return null;
  const missing = primary.artifactFiles.filter((f) => f.expected && !f.generated);
  return missing[0]?.relativePath ?? null;
}
