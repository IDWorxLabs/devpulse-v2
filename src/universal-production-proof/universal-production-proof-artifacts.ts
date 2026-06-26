/**
 * Universal Production Proof V1 — artifact writer and manifest patch.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GENERATED_APP_MANIFEST_FILENAME, serializeGeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { buildUniversalProductionProofMarkdown } from './universal-production-proof-report.js';
import type {
  UniversalProductionProofEvidence,
  UniversalProductionProofProfileResult,
  UniversalProductionProofReport,
} from './universal-production-proof-types.js';
import {
  UNIVERSAL_PRODUCTION_PROOF_DIR,
  UNIVERSAL_PRODUCTION_PROOF_FILENAME,
  UNIVERSAL_PRODUCTION_PROOF_PROFILE_RESULTS_DIR,
  UNIVERSAL_PRODUCTION_PROOF_REPORT_MD,
} from './universal-production-proof-types.js';

function writeJson(path: string, value: unknown): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(path: string, value: string): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, value, 'utf8');
}

export function universalProductionProofPaths(projectRootDir: string) {
  const root = join(projectRootDir, UNIVERSAL_PRODUCTION_PROOF_DIR);
  return {
    root,
    artifact: join(root, UNIVERSAL_PRODUCTION_PROOF_FILENAME),
    report: join(root, UNIVERSAL_PRODUCTION_PROOF_REPORT_MD),
    profileResults: join(root, UNIVERSAL_PRODUCTION_PROOF_PROFILE_RESULTS_DIR),
  };
}

export function applyUniversalProductionProofToManifest(
  manifest: GeneratedAppManifest,
  evidence: Pick<
    UniversalProductionProofEvidence,
    | 'universalProductionProofRunId'
    | 'universalProductionProofStatus'
    | 'universalProductionProofArtifactPath'
    | 'universalProductionProofRecordedAt'
  >,
  profileVerdict: string,
): GeneratedAppManifest {
  return {
    ...manifest,
    universalProductionProofRunId: evidence.universalProductionProofRunId,
    universalProductionProofStatus: evidence.universalProductionProofStatus,
    universalProductionProofProfileVerdict: profileVerdict,
    universalProductionProofArtifactPath: evidence.universalProductionProofArtifactPath,
    universalProductionProofRecordedAt: evidence.universalProductionProofRecordedAt,
  };
}

export function writeUniversalProductionProofArtifacts(input: {
  projectRootDir: string;
  report: UniversalProductionProofReport;
}): UniversalProductionProofEvidence {
  const paths = universalProductionProofPaths(input.projectRootDir);
  mkdirSync(paths.profileResults, { recursive: true });

  writeJson(paths.artifact, input.report);
  writeText(paths.report, buildUniversalProductionProofMarkdown(input.report));

  for (const result of input.report.profileResults) {
    writeJson(join(paths.profileResults, `${result.profile}.json`), result);
    patchProfileManifest(input.projectRootDir, result, input.report);
  }

  const relativeArtifact = join(UNIVERSAL_PRODUCTION_PROOF_DIR, UNIVERSAL_PRODUCTION_PROOF_FILENAME).replace(/\\/g, '/');
  const relativeReport = join(UNIVERSAL_PRODUCTION_PROOF_DIR, UNIVERSAL_PRODUCTION_PROOF_REPORT_MD).replace(/\\/g, '/');

  const evidence: UniversalProductionProofEvidence = {
    readOnly: true,
    universalProductionProofRunId: input.report.runId,
    universalProductionProofStatus: input.report.overallVerdict,
    universalProductionProofArtifactPath: relativeArtifact,
    universalProductionProofReportPath: relativeReport,
    universalProductionProofRecordedAt: input.report.recordedAt,
    report: {
      ...input.report,
      artifactPath: relativeArtifact,
      reportPath: relativeReport,
    },
  };

  return evidence;
}

function patchProfileManifest(
  projectRootDir: string,
  result: UniversalProductionProofProfileResult,
  report: UniversalProductionProofReport,
): void {
  if (!result.links.manifestPath || !existsSync(result.links.manifestPath)) return;
  const manifest = JSON.parse(readFileSync(result.links.manifestPath, 'utf8')) as GeneratedAppManifest;
  const updated = applyUniversalProductionProofToManifest(
    manifest,
    {
      universalProductionProofRunId: report.runId,
      universalProductionProofStatus: report.overallVerdict,
      universalProductionProofArtifactPath: report.artifactPath,
      universalProductionProofRecordedAt: report.recordedAt,
    },
    result.profileVerdict,
  );
  writeFileSync(result.links.manifestPath, serializeGeneratedAppManifest(updated), 'utf8');

  const workspaceManifest = result.links.workspacePath
    ? join(result.links.workspacePath, GENERATED_APP_MANIFEST_FILENAME)
    : null;
  if (workspaceManifest && existsSync(workspaceManifest) && workspaceManifest !== result.links.manifestPath) {
    writeFileSync(workspaceManifest, serializeGeneratedAppManifest(updated), 'utf8');
  }

  if (result.links.persistentProjectPath) {
    const persistentManifest = join(result.links.persistentProjectPath, '.aidev', 'manifest.json');
    if (existsSync(persistentManifest)) {
      writeFileSync(persistentManifest, serializeGeneratedAppManifest(updated), 'utf8');
    }
  }
}
