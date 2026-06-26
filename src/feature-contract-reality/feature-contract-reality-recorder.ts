/**
 * Feature Contract Reality V1 — recorder and manifest evidence.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { persistentProjectPaths, relativeFromProjectRoot } from '../persistent-project-reality/persistent-project-reality-paths.js';
import { AIDEV_FEATURE_CONTRACT_REALITY_FILENAME } from '../persistent-project-reality/persistent-project-reality-types.js';
import { readProjectRegistryState, writeProjectRegistryV1ForTests } from '../project-registry-v1/project-registry-v1-store.js';
import { buildFeatureContractRealityReport } from './feature-contract-reality-report.js';
import type {
  FeatureContractRealityEvidence,
  FeatureContractRealityRecordingResult,
} from './feature-contract-reality-types.js';
import { WORKSPACE_FEATURE_CONTRACT_REALITY_FILENAME } from './feature-contract-reality-types.js';

function writeJson(path: string, value: unknown): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function recordFeatureContractReality(input: {
  projectRootDir: string;
  workspaceDir: string;
  manifest: GeneratedAppManifest;
}): FeatureContractRealityRecordingResult {
  const workspaceArtifactPath = join(input.workspaceDir, WORKSPACE_FEATURE_CONTRACT_REALITY_FILENAME);
  const contractPath = join(input.workspaceDir, 'universal-feature-contract.json').replace(/\\/g, '/');

  let persistentRelativePath: string | null = null;
  let persistentArtifactPath: string | null = null;

  const preliminary = buildFeatureContractRealityReport({
    workspaceDir: input.workspaceDir,
    manifest: input.manifest,
    artifactPath: relativeFromProjectRoot(input.projectRootDir, workspaceArtifactPath),
  });
  const report = {
    ...preliminary,
    contractPath: existsSync(join(input.workspaceDir, 'universal-feature-contract.json'))
      ? relativeFromProjectRoot(input.projectRootDir, join(input.workspaceDir, 'universal-feature-contract.json'))
      : null,
    artifactPath: relativeFromProjectRoot(input.projectRootDir, workspaceArtifactPath),
  };

  writeJson(workspaceArtifactPath, report);

  if (input.manifest.persistentProjectId && input.manifest.promotionStatus === 'PASS') {
    const paths = persistentProjectPaths(input.projectRootDir, input.manifest.persistentProjectId);
    persistentArtifactPath = join(paths.aidev, AIDEV_FEATURE_CONTRACT_REALITY_FILENAME);
    writeJson(persistentArtifactPath, report);
    persistentRelativePath = relativeFromProjectRoot(input.projectRootDir, persistentArtifactPath);

    if (existsSync(paths.projectJson)) {
      const projectRecord = JSON.parse(readFileSync(paths.projectJson, 'utf8')) as Record<string, unknown>;
      projectRecord.featureContractRealityPath = persistentRelativePath;
      projectRecord.updatedAt = report.recordedAt;
      writeJson(paths.projectJson, projectRecord);
    }

    const qualityScorePath = join(paths.aidev, 'materialization-quality-score.json');
    if (existsSync(qualityScorePath)) {
      const qualityScore = JSON.parse(readFileSync(qualityScorePath, 'utf8')) as Record<string, unknown>;
      qualityScore.featureContractRealityPath = persistentRelativePath;
      qualityScore.featureContractRealityScore = report.overallScore;
      qualityScore.featureContractRealityStatus = report.status;
      writeJson(qualityScorePath, qualityScore);
    }

    const registry = readProjectRegistryState(input.projectRootDir);
    const index = registry.projects.findIndex((project) => project.projectId === input.manifest.projectId);
    if (index >= 0) {
      registry.projects[index] = {
        ...registry.projects[index]!,
        featureContractRealityPath: persistentRelativePath,
        featureContractRealityScore: report.overallScore,
        featureContractRealityStatus: report.status,
        updatedAt: report.recordedAt,
        lastActivityAt: report.recordedAt,
      };
      writeProjectRegistryV1ForTests(registry, input.projectRootDir);
    }
  }

  const evidence: FeatureContractRealityEvidence = {
    readOnly: true,
    featureContractRealityStatus: report.status,
    featureContractRealityScore: report.overallScore,
    featureRealityRecords: report.featureRealityRecords,
    featureRealityFailureReasons: report.failureReasons,
    featureContractRealityArtifactPath: report.artifactPath,
    featureContractRealityPersistentArtifactPath: persistentRelativePath,
    featureContractRealityRecordedAt: report.recordedAt,
  };

  return { readOnly: true, report: { ...report, persistentArtifactPath: persistentRelativePath }, evidence };
}
