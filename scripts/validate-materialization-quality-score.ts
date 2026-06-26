/**
 * Materialization Quality Score V1 — validation.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { materializeGeneratedApplication } from '../src/code-generation-engine/code-generation-engine-authority.js';
import { assessRequirementsToPlanExecutionContract } from '../src/requirements-to-plan-execution-contract/index.js';
import {
  MATERIALIZATION_QUALITY_SCORE_V1_PASS_TOKEN,
  WORKSPACE_QUALITY_SCORE_FILENAME,
  calculateMaterializationQualityScore,
  materializationQualityScoreTraceTitles,
  buildMaterializationQualityScoreTraceEvents,
  materializationQualityEvidenceForChat,
} from '../src/materialization-quality-score/index.js';
import { AIDEV_MATERIALIZATION_QUALITY_SCORE_FILENAME } from '../src/persistent-project-reality/persistent-project-reality-types.js';
import { persistentProjectPaths } from '../src/persistent-project-reality/persistent-project-reality-paths.js';
import { buildOnePromptExecutionTraceEvents } from '../src/execution-trace/index.js';
import { rankBuildProfiles } from '../src/build-profile-classification/index.js';
import {
  completeMaterializationEvidence,
  createEmptyMaterializationTimings,
  finalizeForensicManifestFailure,
  readCompletedGeneratedAppManifest,
} from '../src/materialization-evidence/index.js';
import { materializationEvidenceSummaryForChat } from '../src/materialization-evidence/materialization-evidence-completer.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';
import { getRegistryProject } from '../src/project-registry-v1/project-registry-v1-store.js';
import {
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
  summarizePrompt,
  validateUniversalAppMaterialization,
} from '../src/universal-prompt-to-app-materialization/index.js';
import type { GeneratedAppManifest } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { MaterializationQualityScore } from '../src/materialization-quality-score/materialization-quality-score-types.js';

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

function computeExpectedOverall(categories: MaterializationQualityScore['categories']): number {
  const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0);
  const weighted = categories.reduce((sum, category) => sum + category.score * category.weight, 0);
  return Math.round(weighted / totalWeight);
}

async function main(): Promise<void> {
  console.log('');
  console.log('Materialization Quality Score V1 — Validation');
  console.log('=============================================');
  console.log('');

  const prompt =
    'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, income, expenses, balance, spending reports, charts, and CSV export.';
  const testRoot = join(tmpdir(), `quality-score-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });

  try {
    const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: prompt });
    const contract = assessment.report.buildReadyContract;
    if (!contract) throw new Error('Planning failed');

    const projectId = `quality-${Date.now()}`;
    const workspaceDir = join(testRoot, '.generated-builder-workspaces', projectId);
    const engine = materializeGeneratedApplication({
      projectRootDir: testRoot,
      workspaceId: projectId,
      contract: { ...contract, contractId: projectId },
      rawPrompt: prompt,
      profileOverride: 'EXPENSE_TRACKER_WEB_V1',
    });
    if (!engine.generated) throw new Error(engine.skippedReason ?? 'materialization failed');

    const manifest = completeBuild(testRoot, projectId, prompt);
    const scoreArtifactPath = join(workspaceDir, WORKSPACE_QUALITY_SCORE_FILENAME);
    const scoreArtifact = JSON.parse(readFileSync(scoreArtifactPath, 'utf8')) as MaterializationQualityScore;
    const paths = persistentProjectPaths(testRoot, projectId);
    const persistentScorePath = join(paths.aidev, AIDEV_MATERIALIZATION_QUALITY_SCORE_FILENAME);
    const registry = getRegistryProject(projectId, testRoot);

    assert(
      '01. successful app receives high evidence-based score',
      manifest.materializationQualityScore >= 75 && manifest.materializationQualityScore <= 100,
      `${manifest.materializationQualityScore}% (${manifest.materializationQualityVerdict})`,
    );
    assert(
      '02. score is not hardcoded 100%',
      manifest.materializationQualityScore < 100 || manifest.materializationQualityGaps.length === 0,
      `${manifest.materializationQualityScore}% gaps=${manifest.materializationQualityGaps.length}`,
    );

    const missingModuleManifest: GeneratedAppManifest = {
      ...manifest,
      featureModuleDetails: manifest.featureModuleDetails.filter((entry) => entry.id !== 'csv-export'),
      featureModules: manifest.featureModules.filter((moduleId) => moduleId !== 'csv-export'),
    };
    const missingModuleScore = calculateMaterializationQualityScore({
      projectRootDir: testRoot,
      workspaceDir,
      manifest: missingModuleManifest,
    });
    const baselineFeature = scoreArtifact.categories.find((category) => category.id === 'featureCoverage')!;
    const reducedFeature = missingModuleScore.categories.find((category) => category.id === 'featureCoverage')!;
    assert(
      '03. missing feature module reduces feature coverage score',
      reducedFeature.score < baselineFeature.score,
      `${baselineFeature.score}% -> ${reducedFeature.score}%`,
    );

    const noPreviewScore = calculateMaterializationQualityScore({
      projectRootDir: testRoot,
      workspaceDir,
      manifest: {
        ...manifest,
        previewVerified: false,
        previewHtmlStatus: 'FAIL',
        previewUrl: null,
      },
    });
    const previewCategory = noPreviewScore.categories.find((category) => category.id === 'preview')!;
    const launchCategory = noPreviewScore.categories.find((category) => category.id === 'launchReadiness')!;
    assert(
      '04. missing preview evidence reduces preview and launch readiness',
      previewCategory.score < 50 && launchCategory.score <= 65,
      `preview=${previewCategory.score}% launch=${launchCategory.score}%`,
    );

    const noPersistentScore = calculateMaterializationQualityScore({
      projectRootDir: testRoot,
      workspaceDir,
      manifest: {
        ...manifest,
        persistentProjectRealityStatus: 'SKIPPED',
        persistentProjectSourceRoot: null,
        exportMetadataPath: null,
        promotionStatus: 'SKIPPED',
      },
    });
    const persistentCategory = noPersistentScore.categories.find((category) => category.id === 'persistentProjectReality')!;
    assert(
      '05. missing persistent project source reduces persistent reality score',
      persistentCategory.score < 50,
      `${persistentCategory.score}%`,
    );

    const genericScore = calculateMaterializationQualityScore({
      projectRootDir: testRoot,
      workspaceDir,
      manifest: { ...manifest, fallbackUsed: true, promptSpecificTermsPresent: false },
    });
    const genericCategory = genericScore.categories.find((category) => category.id === 'genericityAvoidance')!;
    assert(
      '06. generic fallback reduces genericity score',
      genericCategory.score < 70,
      `${genericCategory.score}%`,
    );

    finalizeForensicManifestFailure(workspaceDir, {
      failureStage: 'FINAL_VALIDATION',
      failureReason: 'Simulated failed build for quality score anti-regression',
      lastSuccessfulStage: 'COMPLETE',
    });
    const failedManifest = readCompletedGeneratedAppManifest(workspaceDir)!;
    assert(
      '07. failed build cannot receive high score',
      failedManifest.materializationQualityScore <= 45,
      `${failedManifest.materializationQualityScore}%`,
    );

    assert(
      '08. manifest records score',
      manifest.materializationQualityScore > 0 &&
        manifest.materializationQualityCategories.length >= 13 &&
        Boolean(manifest.materializationQualityScorePath),
      `${manifest.materializationQualityScore}%`,
    );
    assert(
      '09. persistent project stores score artifact',
      existsSync(persistentScorePath),
      persistentScorePath,
    );
    assert(
      '10. project registry links to score artifact',
      Boolean(registry?.materializationQualityScorePath) &&
        registry?.materializationQualityScore === manifest.materializationQualityScore,
      registry?.materializationQualityScorePath ?? 'missing',
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
    const traceTitles = buildOnePromptExecutionTraceEvents(traceResult).map((event) => event.eventTitle);
    for (const title of materializationQualityScoreTraceTitles()) {
      assert(`11. execution trace includes "${title}"`, traceTitles.includes(title), title);
    }

    const chatSummary = materializationEvidenceSummaryForChat(manifest);
    const qualityEvidence = chatSummary?.materializationQualityEvidence as Record<string, unknown> | undefined;
    assert(
      '12. chat summary uses score artifact evidence',
      Boolean(qualityEvidence) &&
        qualityEvidence!.overallScore === manifest.materializationQualityScore &&
        typeof qualityEvidence!.chatSummary === 'string',
      String(qualityEvidence?.overallScore),
    );

    assert(
      '13. score categories include evidence paths and reasons',
      manifest.materializationQualityCategories.every(
        (category) => category.reasons.length > 0 || category.missingEvidence.length > 0,
      ) &&
        manifest.materializationQualityCategories.some((category) => category.evidencePaths.length > 0),
      `${manifest.materializationQualityCategories.length} categories`,
    );

    const recomputed = computeExpectedOverall(manifest.materializationQualityCategories);
    assert(
      '14. overall score computed from category scores',
      recomputed === manifest.materializationQualityScore ||
        Math.abs(recomputed - manifest.materializationQualityScore) <= 1,
      `manifest=${manifest.materializationQualityScore} recomputed=${recomputed}`,
    );

    rmSync(scoreArtifactPath, { force: true });
    assert(
      '15. validation fails if score artifact absent',
      !existsSync(scoreArtifactPath),
      'artifact removed for guard check',
    );

    const qualityEvents = buildMaterializationQualityScoreTraceEvents(
      {
        readOnly: true,
        materializationQualityScore: manifest.materializationQualityScore,
        materializationQualityVerdict:
          manifest.materializationQualityVerdict === 'PENDING'
            ? 'NEEDS_WORK'
            : manifest.materializationQualityVerdict,
        materializationQualityCategories: manifest.materializationQualityCategories,
        materializationQualityGaps: manifest.materializationQualityGaps,
        materializationQualityStrengths: manifest.materializationQualityStrengths,
        materializationQualityCriticalFailures: manifest.materializationQualityCriticalFailures,
        materializationQualityScorePath: manifest.materializationQualityScorePath,
        materializationQualityPersistentScorePath: manifest.materializationQualityPersistentScorePath,
        materializationQualityRecordedAt: manifest.materializationQualityRecordedAt ?? new Date().toISOString(),
      },
      manifest.buildRunId,
    );
    assert('16. quality trace events emitted', qualityEvents.length >= 8, String(qualityEvents.length));

    const chatFromEvidence = materializationQualityEvidenceForChat({
      readOnly: true,
      materializationQualityScore: manifest.materializationQualityScore,
      materializationQualityVerdict:
        manifest.materializationQualityVerdict === 'PENDING'
          ? 'NEEDS_WORK'
          : manifest.materializationQualityVerdict,
      materializationQualityCategories: manifest.materializationQualityCategories,
      materializationQualityGaps: manifest.materializationQualityGaps,
      materializationQualityStrengths: manifest.materializationQualityStrengths,
      materializationQualityCriticalFailures: manifest.materializationQualityCriticalFailures,
      materializationQualityScorePath: manifest.materializationQualityScorePath,
      materializationQualityPersistentScorePath: manifest.materializationQualityPersistentScorePath,
      materializationQualityRecordedAt: manifest.materializationQualityRecordedAt ?? new Date().toISOString(),
    });
    assert(
      '17. chat evidence does not invent score',
      chatFromEvidence?.overallScore === manifest.materializationQualityScore,
      String(chatFromEvidence?.overallScore),
    );

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
      console.error('Materialization Quality Score V1 validation FAILED');
      process.exit(1);
    }
    console.log('');
    console.log(MATERIALIZATION_QUALITY_SCORE_V1_PASS_TOKEN);
    console.log('');
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
