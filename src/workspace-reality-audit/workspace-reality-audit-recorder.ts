/**
 * Workspace Reality Audit V1 — recorder and manifest evidence.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { persistentProjectPaths, relativeFromProjectRoot } from '../persistent-project-reality/persistent-project-reality-paths.js';
import { AIDEV_WORKSPACE_REALITY_AUDIT_FILENAME } from '../persistent-project-reality/persistent-project-reality-types.js';
import { readProjectRegistryState, writeProjectRegistryV1ForTests } from '../project-registry-v1/project-registry-v1-store.js';
import {
  buildWorkspaceRealityAuditMarkdown,
  buildWorkspaceRealityAuditReport,
} from './workspace-reality-audit-report.js';
import type {
  WorkspaceRealityAuditEvidence,
  WorkspaceRealityAuditRecordingResult,
} from './workspace-reality-audit-types.js';
import {
  WORKSPACE_REALITY_AUDIT_REPORT_MD,
  WORKSPACE_REALITY_AUDIT_WORKSPACE_FILENAME,
} from './workspace-reality-audit-types.js';

function writeJson(path: string, value: unknown): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(path: string, value: string): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, value, 'utf8');
}

export function recordWorkspaceRealityAudit(input: {
  projectRootDir: string;
  workspaceDir: string;
  manifest: GeneratedAppManifest;
}): WorkspaceRealityAuditRecordingResult {
  const workspaceArtifactPath = join(input.workspaceDir, WORKSPACE_REALITY_AUDIT_WORKSPACE_FILENAME);
  const workspaceReportPath = join(input.workspaceDir, WORKSPACE_REALITY_AUDIT_REPORT_MD);

  let persistentRelativePath: string | null = null;
  let persistentReportRelativePath: string | null = null;
  let persistentArtifactPath: string | null = null;
  let persistentReportPath: string | null = null;

  const preliminary = buildWorkspaceRealityAuditReport({
    projectRootDir: input.projectRootDir,
    workspaceDir: input.workspaceDir,
    manifest: input.manifest,
    artifactPath: relativeFromProjectRoot(input.projectRootDir, workspaceArtifactPath),
    reportPath: relativeFromProjectRoot(input.projectRootDir, workspaceReportPath),
  });

  const result = {
    ...preliminary,
    artifactPath: relativeFromProjectRoot(input.projectRootDir, workspaceArtifactPath),
    reportPath: relativeFromProjectRoot(input.projectRootDir, workspaceReportPath),
  };

  writeJson(workspaceArtifactPath, result);
  writeText(workspaceReportPath, buildWorkspaceRealityAuditMarkdown(result));

  if (input.manifest.persistentProjectId && input.manifest.promotionStatus === 'PASS') {
    const paths = persistentProjectPaths(input.projectRootDir, input.manifest.persistentProjectId);
    persistentArtifactPath = join(paths.aidev, AIDEV_WORKSPACE_REALITY_AUDIT_FILENAME);
    persistentReportPath = join(paths.aidev, WORKSPACE_REALITY_AUDIT_REPORT_MD);
    writeJson(persistentArtifactPath, result);
    writeText(persistentReportPath, buildWorkspaceRealityAuditMarkdown(result));
    persistentRelativePath = relativeFromProjectRoot(input.projectRootDir, persistentArtifactPath);
    persistentReportRelativePath = relativeFromProjectRoot(input.projectRootDir, persistentReportPath);

    if (existsSync(paths.projectJson)) {
      const projectRecord = JSON.parse(readFileSync(paths.projectJson, 'utf8')) as Record<string, unknown>;
      projectRecord.workspaceRealityAuditPath = persistentRelativePath;
      projectRecord.workspaceRealityReportPath = persistentReportRelativePath;
      projectRecord.updatedAt = result.recordedAt;
      writeJson(paths.projectJson, projectRecord);
    }

    const qualityScorePath = join(paths.aidev, 'materialization-quality-score.json');
    if (existsSync(qualityScorePath)) {
      const qualityScore = JSON.parse(readFileSync(qualityScorePath, 'utf8')) as Record<string, unknown>;
      qualityScore.workspaceRealityAuditPath = persistentRelativePath;
      qualityScore.workspaceRealityAuditScore = result.score;
      qualityScore.workspaceRealityAuditStatus = result.status;
      writeJson(qualityScorePath, qualityScore);
    }

    const registry = readProjectRegistryState(input.projectRootDir);
    const index = registry.projects.findIndex((project) => project.projectId === input.manifest.projectId);
    if (index >= 0) {
      registry.projects[index] = {
        ...registry.projects[index]!,
        workspaceRealityAuditPath: persistentRelativePath,
        workspaceRealityAuditScore: result.score,
        workspaceRealityAuditStatus: result.status,
        updatedAt: result.recordedAt,
        lastActivityAt: result.recordedAt,
      };
      writeProjectRegistryV1ForTests(registry, input.projectRootDir);
    }

    result.persistentArtifactPath = persistentRelativePath;
    result.persistentReportPath = persistentReportRelativePath;
  }

  const evidence: WorkspaceRealityAuditEvidence = {
    readOnly: true,
    workspaceRealityAuditStatus: result.status,
    workspaceRealityAuditScore: result.score,
    workspaceRealityAuditArtifactPath: result.artifactPath,
    workspaceRealityReportPath: result.reportPath,
    workspaceRealityFailureReasons: result.failureReasons,
    workspaceRealityRecordedAt: result.recordedAt,
    workspaceRealityAuditResult: result,
  };

  return { readOnly: true, result, evidence };
}
