/**
 * Project Resume State — derive build state from registry + persistent project evidence.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { hashString } from '../build-history-integrity/build-history-hash.js';
import { readProjectRegistryState } from '../project-registry-v1/project-registry-v1-store.js';
import { persistentProjectPaths } from '../persistent-project-reality/persistent-project-reality-paths.js';
import type {
  ProjectBuildState,
  ProjectBuildStateEvidence,
  ProjectBuildStateResult,
  ProjectResumePrimaryAction,
} from './project-resume-state-types.js';

function readJsonFile<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

function countFeatureModules(sourceRoot: string): number | null {
  const featuresDir = `${sourceRoot.replace(/\\/g, '/')}/src/features`;
  if (!existsSync(featuresDir)) return null;
  try {
    return readdirSync(featuresDir, { withFileTypes: true }).filter(
      (entry) => entry.isDirectory() && !['registry', 'routes'].includes(entry.name),
    ).length;
  } catch {
    return null;
  }
}

function deriveStateFromEvidence(evidence: ProjectBuildStateEvidence): ProjectBuildState {
  if (evidence.workspaceRealityStatus === 'FAIL' || evidence.featureContractRealityStatus === 'FAIL') {
    return evidence.lastSuccessfulBuildRunId ? 'REPAIRABLE' : 'FAILED';
  }
  if (evidence.materializationQualityVerdict === 'NEEDS_WORK') return 'NEEDS_WORK';
  if (evidence.materializationQualityVerdict === 'LAUNCH_READY') return 'LAUNCH_READY';
  if (evidence.materializationQualityVerdict === 'ACCEPTABLE' && evidence.lastSuccessfulBuildRunId) {
    return 'COMPLETE';
  }
  if (evidence.lastFailedBuildRunId && !evidence.lastSuccessfulBuildRunId) return 'FAILED';
  if (evidence.lastFailedBuildRunId && evidence.lastSuccessfulBuildRunId) return 'PARTIAL';
  if (evidence.lastSuccessfulBuildRunId) return 'RESUMABLE';
  if (evidence.hasOriginalPrompt) return 'PARTIAL';
  return 'NEEDS_WORK';
}

function primaryActionsForState(state: ProjectBuildState): ProjectResumePrimaryAction[] {
  switch (state) {
    case 'LAUNCH_READY':
    case 'COMPLETE':
      return ['CONTINUE_FROM_PROMPT'];
    case 'REPAIRABLE':
      return ['REPAIR_BUILD', 'RESUME_BUILD', 'CONTINUE_FROM_PROMPT', 'ARCHIVE_FAILED_ATTEMPT'];
    case 'RESUMABLE':
    case 'PARTIAL':
    case 'NEEDS_WORK':
      return ['RESUME_BUILD', 'REPAIR_BUILD', 'CONTINUE_FROM_PROMPT', 'START_FRESH_COPY'];
    case 'FAILED':
      return ['REPAIR_BUILD', 'RESUME_BUILD', 'START_FRESH_COPY', 'ARCHIVE_FAILED_ATTEMPT'];
    case 'STALE':
    case 'DUPLICATE_RISK':
      return ['RESUME_BUILD', 'START_FRESH_COPY', 'ARCHIVE_FAILED_ATTEMPT'];
    default:
      return ['RESUME_BUILD', 'CONTINUE_FROM_PROMPT'];
  }
}

function bannerForState(state: ProjectBuildState, projectName: string): string {
  switch (state) {
    case 'COMPLETE':
    case 'LAUNCH_READY':
      return `${projectName} is ready for review and launch verification.`;
    case 'REPAIRABLE':
    case 'RESUMABLE':
    case 'PARTIAL':
    case 'NEEDS_WORK':
      return `This project is incomplete. AiDevEngine can resume and repair it from the last valid build state.`;
    case 'FAILED':
      return `${projectName} failed during the last build. AiDevEngine can repair or resume from forensic evidence.`;
    case 'STALE':
      return `${projectName} has stale build artifacts. Resume or start a fresh copy.`;
    case 'DUPLICATE_RISK':
      return `A similar ${projectName} project already exists. Resume the existing project instead of creating a duplicate.`;
    default:
      return `Project status: ${state}.`;
  }
}

export function deriveProjectBuildState(
  projectId: string,
  rootDir?: string,
): ProjectBuildStateResult | null {
  const registry = readProjectRegistryState(rootDir);
  const record =
    registry.projects.find((project) => project.projectId === projectId && project.status === 'ACTIVE') ??
    null;
  if (!record) return null;

  const paths = persistentProjectPaths(rootDir ?? process.cwd(), projectId);
  const projectJson = readJsonFile<{
    originalPrompt?: string;
    lastBuildRunId?: string;
    lastSuccessfulBuildRunId?: string;
    lastFailedBuildRunId?: string;
    status?: string;
  }>(paths.projectJson);

  const manifest = readJsonFile<{
    failureReason?: string;
    failureStage?: string;
    generatedFeatureModulesCount?: number;
    generatedFilesCount?: number;
  }>(paths.manifest);

  const quality = readJsonFile<{ verdict?: string; overallScore?: number }>(
    paths.materializationQualityScore,
  );
  const workspaceReality = readJsonFile<{ status?: string }>(paths.workspaceRealityAudit);
  const featureReality = readJsonFile<{ status?: string }>(paths.featureContractReality);

  const originalPrompt = projectJson?.originalPrompt?.trim() || null;
  const evidence: ProjectBuildStateEvidence = {
    readOnly: true,
    materializationQualityVerdict: quality?.verdict ?? record.materializationQualityVerdict ?? null,
    materializationQualityScore: quality?.overallScore ?? record.materializationQualityScore ?? null,
    workspaceRealityStatus: workspaceReality?.status ?? record.workspaceRealityAuditStatus ?? null,
    featureContractRealityStatus:
      featureReality?.status ?? record.featureContractRealityStatus ?? null,
    lastSuccessfulBuildRunId:
      projectJson?.lastSuccessfulBuildRunId ?? record.lastSuccessfulBuildRunId ?? null,
    lastFailedBuildRunId: projectJson?.lastFailedBuildRunId ?? null,
    failureReason: manifest?.failureReason ?? null,
    featureModuleCount:
      manifest?.generatedFeatureModulesCount ?? countFeatureModules(paths.source),
    generatedFileCount: manifest?.generatedFilesCount ?? null,
    hasOriginalPrompt: Boolean(originalPrompt),
    lastStableBuildBoundary: manifest?.failureStage ?? null,
  };

  const buildState = deriveStateFromEvidence(evidence);
  const resumable = ['REPAIRABLE', 'RESUMABLE', 'PARTIAL', 'NEEDS_WORK', 'FAILED'].includes(
    buildState,
  );
  const repairable = ['REPAIRABLE', 'FAILED', 'PARTIAL', 'NEEDS_WORK'].includes(buildState);

  return {
    readOnly: true,
    projectId,
    projectName: record.name,
    buildState,
    resumable,
    repairable,
    duplicateRisk: buildState === 'DUPLICATE_RISK',
    bannerMessage: bannerForState(buildState, record.name),
    primaryActions: primaryActionsForState(buildState),
    evidence,
    originalPrompt,
    promptHash: originalPrompt ? hashString(originalPrompt) : null,
  };
}

export function listProjectBuildStates(rootDir?: string): ProjectBuildStateResult[] {
  const registry = readProjectRegistryState(rootDir);
  return registry.projects
    .filter((project) => project.status === 'ACTIVE')
    .map((project) => deriveProjectBuildState(project.projectId, rootDir))
    .filter((result): result is ProjectBuildStateResult => result !== null);
}
