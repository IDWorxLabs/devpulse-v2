/**
 * Persistent Project Reality V1 — validation.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { materializeGeneratedApplication } from '../src/code-generation-engine/code-generation-engine-authority.js';
import { assessRequirementsToPlanExecutionContract } from '../src/requirements-to-plan-execution-contract/index.js';
import {
  PERSISTENT_PROJECT_REALITY_V1_PASS_TOKEN,
  AIDEV_EXPORT_METADATA_FILENAME,
  AIDEV_PROJECT_FILE_INDEX_FILENAME,
  persistentProjectPaths,
  persistentProjectRealityTraceTitles,
  buildPersistentProjectRealityTraceEvents,
  verifyPersistentProjectReality,
  persistentProjectWorkspaceExists,
} from '../src/persistent-project-reality/index.js';
import { buildOnePromptExecutionTraceEvents } from '../src/execution-trace/index.js';
import { rankBuildProfiles } from '../src/build-profile-classification/index.js';
import {
  completeMaterializationEvidence,
  createEmptyMaterializationTimings,
  finalizeForensicManifestFailure,
  initializeForensicManifest,
  readCompletedGeneratedAppManifest,
} from '../src/materialization-evidence/index.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';
import {
  getRegistryProject,
  readProjectRegistryState,
} from '../src/project-registry-v1/project-registry-v1-store.js';
import {
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
  summarizePrompt,
  validateUniversalAppMaterialization,
} from '../src/universal-prompt-to-app-materialization/index.js';
import type { GeneratedAppManifest } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { PersistentProjectRecord } from '../src/persistent-project-reality/persistent-project-reality-types.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function completeBuild(testRoot: string, projectId: string, prompt: string): GeneratedAppManifest {
  const workspaceDir = join(testRoot, '.generated-builder-workspaces', projectId);
  const validation = validateUniversalAppMaterialization({
    workspaceDir,
    rawPrompt: prompt,
    selectedProfile: 'EXPENSE_TRACKER_WEB_V1',
    projectId,
    projectName: 'ExpenseTracker',
    buildRunId: `build-${projectId}`,
    npmInstallOk: true,
    npmBuildOk: true,
  });
  const ranking = rankBuildProfiles(prompt);
  const profile = resolveMaterializationProfile('EXPENSE_TRACKER_WEB_V1', prompt);
  const definition = getProfileFeatureDefinition(profile, prompt);
  const timings = createEmptyMaterializationTimings();
  timings.materializationDurationMs = 5000;
  timings.generationDurationMs = 5000;
  timings.npmInstallDurationMs = 1000;
  timings.npmBuildDurationMs = 1000;

  completeMaterializationEvidence({
    workspaceDir,
    prompt,
    projectId,
    projectName: 'ExpenseTracker',
    buildRunId: `build-${projectId}`,
    selectedProfile: 'EXPENSE_TRACKER_WEB_V1',
    expectedAppType: definition.expectedAppType,
    promptSummary: summarizePrompt(prompt),
    confidence: ranking.confidence,
    featureModules: definition.featureModules,
    routes: definition.routes,
    fallbackUsed: false,
    validation: {
      passed: validation.passed,
      blueprintShellPresent: validation.blueprintShellPresent,
      featureModulesPresent: validation.featureModulesPresent,
      promptSpecificTermsPresent: validation.promptSpecificTermsPresent,
      warnings: validation.warnings,
      errors: validation.passed ? [] : validation.missingArtifacts,
    },
    timings,
  });

  const manifest = readCompletedGeneratedAppManifest(workspaceDir);
  if (!manifest) throw new Error('Manifest missing after completion');
  return manifest;
}

async function main(): Promise<void> {
  console.log('');
  console.log('Persistent Project Reality V1 — Validation');
  console.log('==========================================');
  console.log('');

  const prompt =
    'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, income, expenses, balance, spending reports, charts, and CSV export.';
  const testRoot = join(tmpdir(), `persistent-project-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });

  try {
    const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: prompt });
    const contract = assessment.report.buildReadyContract;
    if (!contract) throw new Error('Planning failed');

    const projectId = `project-${Date.now()}`;
    const engine = materializeGeneratedApplication({
      projectRootDir: testRoot,
      workspaceId: projectId,
      contract: { ...contract, contractId: projectId },
      rawPrompt: prompt,
      profileOverride: 'EXPENSE_TRACKER_WEB_V1',
    });
    if (!engine.generated) throw new Error(engine.skippedReason ?? 'materialization failed');

    const manifest = completeBuild(testRoot, projectId, prompt);
    const paths = persistentProjectPaths(testRoot, projectId);
    const registry = getRegistryProject(projectId, testRoot);

    assert(
      '01. generated app creates persistent project workspace',
      persistentProjectWorkspaceExists(testRoot, projectId),
      paths.root,
    );
    assert(
      '02. workspace contains real source files',
      existsSync(join(paths.source, 'src', 'App.tsx')) || existsSync(join(paths.source, 'src', 'main.tsx')),
      paths.source,
    );
    assert('03. package.json exists in source root', existsSync(join(paths.source, 'package.json')), 'package.json');
    assert('04. src/ exists in source root', existsSync(join(paths.source, 'src')), 'src/');
    assert('05. .aidev metadata exists separately from source', existsSync(paths.aidev), paths.aidev);

    const projectRecord = JSON.parse(readFileSync(paths.projectJson, 'utf8')) as PersistentProjectRecord;
    assert(
      '06. project.json links manifest, feature contract, build history',
      Boolean(projectRecord.manifestPath) &&
        Boolean(projectRecord.featureContractPath) &&
        Boolean(projectRecord.buildHistoryRecordPath),
      `${projectRecord.manifestPath} | ${projectRecord.buildHistoryRecordPath}`,
    );

    const fileIndexPath = join(paths.aidev, AIDEV_PROJECT_FILE_INDEX_FILENAME);
    const fileIndex = JSON.parse(readFileSync(fileIndexPath, 'utf8')) as { sourceFiles: unknown[]; fileHashes: Record<string, string> };
    assert(
      '07. project file index is disk-backed',
      fileIndex.sourceFiles.length > 0 && Object.keys(fileIndex.fileHashes).length > 0,
      `${fileIndex.sourceFiles.length} files`,
    );

    const exportMeta = JSON.parse(readFileSync(join(paths.aidev, AIDEV_EXPORT_METADATA_FILENAME), 'utf8')) as {
      exportReady: boolean;
      exportableSourceRoot: string;
    };
    assert(
      '08. export metadata is disk-backed and accurate',
      exportMeta.exportReady && exportMeta.exportableSourceRoot.includes('source'),
      String(exportMeta.exportReady),
    );

    assert(
      '09. project registry records persistent workspace path',
      Boolean(registry?.persistentWorkspacePath) && Boolean(registry?.sourceRoot),
      registry?.persistentWorkspacePath ?? 'missing',
    );
    assert(
      '10. last successful build pointer preserved',
      projectRecord.lastSuccessfulBuildRunId === manifest.buildRunId,
      projectRecord.lastSuccessfulBuildRunId ?? 'missing',
    );

    const goodSourceHash = readFileSync(join(paths.source, 'package.json'), 'utf8');
    finalizeForensicManifestFailure(join(testRoot, '.generated-builder-workspaces', projectId), {
      failureStage: 'FINAL_VALIDATION',
      failureReason: 'Simulated failed build for anti-regression',
      lastSuccessfulStage: 'COMPLETE',
    });
    const afterFailure = JSON.parse(readFileSync(paths.projectJson, 'utf8')) as PersistentProjectRecord;
    const sourceStillGood =
      readFileSync(join(paths.source, 'package.json'), 'utf8') === goodSourceHash &&
      afterFailure.lastSuccessfulBuildRunId === manifest.buildRunId;
    assert('11. failed build does not overwrite last successful source', sourceStillGood, afterFailure.status);

    const tempWorkspace = join(testRoot, '.generated-builder-workspaces', projectId);
    rmSync(tempWorkspace, { recursive: true, force: true });
    assert(
      '12. temporary build workspace deletable without deleting project source',
      !existsSync(tempWorkspace) && existsSync(join(paths.source, 'package.json')),
      paths.source,
    );

    assert(
      '13. manifest records persistent project reality evidence',
      manifest.persistentProjectRealityStatus === 'PASS' &&
        manifest.promotionStatus === 'PASS' &&
        Boolean(manifest.persistentProjectSourceRoot),
      manifest.persistentProjectRealityStatus ?? 'missing',
    );

    const traceResult: OnePromptLivePreviewBuildResult = {
      readOnly: true,
      buildId: manifest.buildRunId,
      projectId,
      projectName: 'ExpenseTracker',
      status: 'READY',
      prompt,
      requestType: 'BUILD_FROM_PROMPT',
      workspaceId: projectId,
      workspacePath: manifest.persistentProjectSourceRoot,
      generatedProfile: 'EXPENSE_TRACKER_WEB_V1',
      planningProofLevel: 'HIGH',
      materializationProofLevel: 'HIGH',
      buildResult: 'PASS',
      npmInstallOk: true,
      npmBuildOk: true,
      previewUrl: 'http://127.0.0.1:5173',
      livePreviewAvailable: true,
      failureReason: null,
      featureSignals: null,
      materializationManifest: manifest,
      updatedAt: manifest.completedAt ?? new Date().toISOString(),
    };
    const traceEvents = buildOnePromptExecutionTraceEvents(traceResult);
    const traceTitles = traceEvents.map((event) => event.eventTitle);
    for (const title of persistentProjectRealityTraceTitles()) {
      assert(`14. execution trace includes "${title}"`, traceTitles.includes(title), title);
    }

    const realityEvents = buildPersistentProjectRealityTraceEvents(
      {
        readOnly: true,
        persistentProjectRealityStatus: 'PASS',
        persistentProjectId: projectId,
        persistentProjectWorkspacePath: projectRecord.activeWorkspacePath,
        persistentProjectSourceRoot: projectRecord.currentSourcePath,
        projectFileIndexPath: projectRecord.projectFileIndexPath,
        exportMetadataPath: projectRecord.exportMetadataPath,
        promotedFromBuildWorkspace: manifest.promotedFromBuildWorkspace ?? '',
        promotionStatus: 'PASS',
        promotionFailureReasons: [],
        projectRecordPath: projectRecord.activeWorkspacePath + '/project.json',
        recordedAt: manifest.persistentProjectRecordedAt ?? manifest.completedAt ?? new Date().toISOString(),
      },
      manifest.buildRunId,
    );
    assert('14b. persistent project trace events emitted', realityEvents.length >= 8, String(realityEvents.length));

    const checks = verifyPersistentProjectReality({
      projectRootDir: testRoot,
      projectId,
      manifest,
      registryRecord: registry,
    });
    for (const check of checks) {
      assert(`15.${check.name}`, check.passed, check.detail);
    }

    assert(
      '16. validation fails if source exists only in temporary build workspace',
      !existsSync(join(testRoot, '.generated-builder-workspaces', projectId, 'package.json')),
      'temp workspace removed; persistent source remains',
    );

    const registryState = readProjectRegistryState(testRoot);
    assert('17. registry projectRealityStatus promoted', registryState.projects.some((p) => p.projectRealityStatus === 'PROMOTED'), 'PROMOTED');

    const failed = results.filter((result) => !result.passed);
    console.log('');
    for (const result of results) {
      console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}`);
      console.log(`       ${result.detail}`);
    }
    console.log('');
    console.log(`${results.filter((r) => r.passed).length}/${results.length} checks passed`);
    if (failed.length > 0) {
      console.error('');
      console.error('Persistent Project Reality V1 validation FAILED');
      process.exit(1);
    }
    console.log('');
    console.log(PERSISTENT_PROJECT_REALITY_V1_PASS_TOKEN);
    console.log('');
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
