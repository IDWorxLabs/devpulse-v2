/**
 * Materialization Quality Score V1 — overall score calculator and recorder.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { persistentProjectPaths, relativeFromProjectRoot } from '../persistent-project-reality/persistent-project-reality-paths.js';
import {
  AIDEV_MATERIALIZATION_QUALITY_SCORE_FILENAME,
  AIDEV_WORKSPACE_REALITY_AUDIT_FILENAME,
} from '../persistent-project-reality/persistent-project-reality-types.js';
import { readProjectRegistryState, writeProjectRegistryV1ForTests } from '../project-registry-v1/project-registry-v1-store.js';
import {
  buildMaterializationQualityCategoryScores,
  loadMaterializationQualityEvidence,
} from './materialization-quality-score-breakdown.js';
import {
  detectMaterializationQualityGaps,
  deriveMaterializationStrengths,
} from './materialization-quality-score-gaps.js';
import type {
  MaterializationQualityScore,
  MaterializationQualityScoreEvidence,
  MaterializationQualityScoreRecordingResult,
  MaterializationQualityVerdict,
} from './materialization-quality-score-types.js';
import { WORKSPACE_QUALITY_SCORE_FILENAME } from './materialization-quality-score-types.js';

function writeJson(path: string, value: unknown): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function computeOverallScore(categories: MaterializationQualityScore['categories']): number {
  const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0);
  if (totalWeight <= 0) return 0;
  const weighted = categories.reduce((sum, category) => sum + category.score * category.weight, 0);
  return Math.round(weighted / totalWeight);
}

function resolveVerdict(manifest: GeneratedAppManifest, overallScore: number): MaterializationQualityVerdict {
  if (
    manifest.status === 'FAIL' ||
    manifest.status === 'ABORTED' ||
    manifest.generatedFilesCount <= 0
  ) {
    return 'NOT_MATERIALIZED';
  }
  if (overallScore >= 80) return 'HIGH_QUALITY';
  if (overallScore >= 60) return 'ACCEPTABLE';
  return 'NEEDS_WORK';
}

function capScoreForFailedBuild(manifest: GeneratedAppManifest, overallScore: number): number {
  if (manifest.status === 'FAIL' || manifest.status === 'ABORTED' || manifest.validationStatus === 'FAIL') {
    return Math.min(overallScore, 45);
  }
  if (manifest.status === 'PARTIAL') {
    return Math.min(overallScore, 65);
  }
  return overallScore;
}

export function calculateMaterializationQualityScore(input: {
  projectRootDir: string;
  workspaceDir: string;
  manifest: GeneratedAppManifest;
}): MaterializationQualityScore {
  const bundle = loadMaterializationQualityEvidence(input);
  const categories = buildMaterializationQualityCategoryScores(bundle);
  let overallScore = computeOverallScore(categories);
  overallScore = capScoreForFailedBuild(input.manifest, overallScore);

  if (input.manifest.workspaceRealityAuditStatus === 'FAIL') {
    overallScore = Math.min(overallScore, 55);
  } else if (input.manifest.workspaceRealityAuditStatus === 'WARN') {
    overallScore = Math.min(overallScore, 75);
  }

  const gapReport = detectMaterializationQualityGaps({
    manifest: input.manifest,
    workspaceDir: input.workspaceDir,
    matchedUiTerms: bundle.validation.matchedUiTerms,
    missingFeatureModules: bundle.validation.missingFeatureModules,
    shellSource: bundle.shellSource,
  });

  const strengths = deriveMaterializationStrengths(categories);
  const now = new Date().toISOString();
  const workspaceArtifact = join(input.workspaceDir, WORKSPACE_QUALITY_SCORE_FILENAME);
  let persistentArtifact: string | null = null;
  if (input.manifest.persistentProjectId) {
    persistentArtifact = join(
      persistentProjectPaths(input.projectRootDir, input.manifest.persistentProjectId).aidev,
      AIDEV_MATERIALIZATION_QUALITY_SCORE_FILENAME,
    );
  }

  return {
    readOnly: true,
    overallScore,
    verdict: resolveVerdict(input.manifest, overallScore),
    categories,
    strengths,
    gaps: gapReport.gaps,
    criticalFailures: gapReport.criticalFailures,
    recommendedNextActions: gapReport.recommendedNextActions,
    computedFromCategories: true,
    recordedAt: now,
    buildRunId: input.manifest.buildRunId,
    projectId: input.manifest.projectId,
    scoreArtifactPath: workspaceArtifact.replace(/\\/g, '/'),
    persistentScoreArtifactPath: persistentArtifact?.replace(/\\/g, '/').replace(
      input.projectRootDir.replace(/\\/g, '/'),
      '',
    ).replace(/^\//, '') ?? null,
  };
}

export function recordMaterializationQualityScore(input: {
  projectRootDir: string;
  workspaceDir: string;
  manifest: GeneratedAppManifest;
}): MaterializationQualityScoreRecordingResult {
  const score = calculateMaterializationQualityScore(input);
  const workspaceArtifactPath = join(input.workspaceDir, WORKSPACE_QUALITY_SCORE_FILENAME);

  let persistentRelativePath: string | null = null;
  let workspaceRealityPersistentPath: string | null = null;
  if (input.manifest.persistentProjectId && input.manifest.promotionStatus === 'PASS') {
    const paths = persistentProjectPaths(input.projectRootDir, input.manifest.persistentProjectId);
    persistentRelativePath = relativeFromProjectRoot(
      input.projectRootDir,
      join(paths.aidev, AIDEV_MATERIALIZATION_QUALITY_SCORE_FILENAME),
    );
    workspaceRealityPersistentPath = relativeFromProjectRoot(
      input.projectRootDir,
      join(paths.aidev, AIDEV_WORKSPACE_REALITY_AUDIT_FILENAME),
    );
  }

  const scoreArtifactPayload: Record<string, unknown> = {
    ...score,
    featureContractRealityPath: input.manifest.featureContractRealityPersistentArtifactPath,
    featureContractRealityScore: input.manifest.featureContractRealityScore,
    featureContractRealityStatus: input.manifest.featureContractRealityStatus,
    workspaceRealityAuditPath: workspaceRealityPersistentPath ?? input.manifest.workspaceRealityAuditArtifactPath,
    workspaceRealityAuditScore: input.manifest.workspaceRealityAuditScore,
    workspaceRealityAuditStatus: input.manifest.workspaceRealityAuditStatus,
  };

  writeJson(workspaceArtifactPath, scoreArtifactPayload);
  if (persistentRelativePath) {
    const paths = persistentProjectPaths(input.projectRootDir, input.manifest.persistentProjectId!);
    writeJson(join(paths.aidev, AIDEV_MATERIALIZATION_QUALITY_SCORE_FILENAME), scoreArtifactPayload);

    if (existsSync(paths.projectJson)) {
      const projectRecord = JSON.parse(readFileSync(paths.projectJson, 'utf8')) as Record<string, unknown>;
      projectRecord.materializationQualityScorePath = persistentRelativePath;
      projectRecord.updatedAt = score.recordedAt;
      writeJson(paths.projectJson, projectRecord);
    }

    if (existsSync(paths.exportMetadata)) {
      const exportMetadata = JSON.parse(readFileSync(paths.exportMetadata, 'utf8')) as Record<string, unknown>;
      exportMetadata.materializationQualityScorePath = persistentRelativePath;
      exportMetadata.materializationQualityScore = score.overallScore;
      exportMetadata.materializationQualityVerdict = score.verdict;
      writeJson(paths.exportMetadata, exportMetadata);
    }

    const registry = readProjectRegistryState(input.projectRootDir);
    const index = registry.projects.findIndex((project) => project.projectId === input.manifest.projectId);
    if (index >= 0) {
      registry.projects[index] = {
        ...registry.projects[index]!,
        materializationQualityScorePath: persistentRelativePath,
        materializationQualityScore: score.overallScore,
        materializationQualityVerdict: score.verdict,
        updatedAt: score.recordedAt,
        lastActivityAt: score.recordedAt,
      };
      writeProjectRegistryV1ForTests(registry, input.projectRootDir);
    }
  }

  const evidence: MaterializationQualityScoreEvidence = {
    readOnly: true,
    materializationQualityScore: score.overallScore,
    materializationQualityVerdict: score.verdict,
    materializationQualityCategories: score.categories,
    materializationQualityGaps: score.gaps,
    materializationQualityStrengths: score.strengths,
    materializationQualityCriticalFailures: score.criticalFailures,
    materializationQualityScorePath: relativeFromProjectRoot(input.projectRootDir, workspaceArtifactPath),
    materializationQualityPersistentScorePath: persistentRelativePath,
    materializationQualityRecordedAt: score.recordedAt,
  };

  return { readOnly: true, score, evidence };
}
