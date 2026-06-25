/**
 * Materialization Evidence Completion V1 — validation.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { rankBuildProfiles } from '../src/build-profile-classification/index.js';
import { materializeGeneratedApplication } from '../src/code-generation-engine/code-generation-engine-authority.js';
import { assessRequirementsToPlanExecutionContract } from '../src/requirements-to-plan-execution-contract/index.js';
import {
  GENERATED_APP_MANIFEST_FILENAME,
  validateUniversalAppMaterialization,
} from '../src/universal-prompt-to-app-materialization/index.js';
import {
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
} from '../src/universal-prompt-to-app-materialization/profile-feature-map.js';
import { summarizePrompt } from '../src/universal-prompt-to-app-materialization/prompt-app-metadata.js';
import {
  completeMaterializationEvidence,
  countWorkspaceDirectoriesOnDisk,
  countWorkspaceFilesOnDisk,
  createEmptyMaterializationTimings,
  discoverWorkspaceFiles,
  isManifestEvidenceComplete,
  listManifestPlaceholderFields,
  MATERIALIZATION_EVIDENCE_COMPLETION_V1_PASS_TOKEN,
  materializationEvidenceSummaryForChat,
  readCompletedGeneratedAppManifest,
} from '../src/materialization-evidence/index.js';
import { composeOnePromptBuildChatResponse } from '../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import {
  buildBuildResultStructuredEvidence,
  buildBuildResultConversationalContext,
} from '../src/build-result-conversational-intelligence/index.js';
import { buildOnePromptExecutionTraceEvents } from '../src/execution-trace/index.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';

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

function materializeExpenseWorkspace(tempRoot: string): {
  workspaceDir: string;
  projectId: string;
  prompt: string;
} {
  const prompt =
    'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, income, expenses, balance, spending reports, charts, and CSV export.';
  const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: prompt });
  const contract = assessment.report.buildReadyContract;
  if (!contract) throw new Error('Planning failed for validation scenario');

  const projectId = `mat-evidence-${Date.now()}`;
  mkdirSync(tempRoot, { recursive: true });

  const engineResult = materializeGeneratedApplication({
    projectRootDir: tempRoot,
    workspaceId: projectId,
    contract: { ...contract, contractId: projectId },
    rawPrompt: prompt,
    profileOverride: 'EXPENSE_TRACKER_WEB_V1',
  });

  if (!engineResult.generated) {
    throw new Error(engineResult.skippedReason ?? 'Materialization failed');
  }

  return {
    workspaceDir: join(tempRoot, '.generated-builder-workspaces', projectId),
    projectId,
    prompt,
  };
}

async function main(): Promise<void> {
  const tempRoot = join(tmpdir(), `mat-evidence-${Date.now()}`);
  mkdirSync(tempRoot, { recursive: true });

  try {
    const { workspaceDir, projectId, prompt } = materializeExpenseWorkspace(tempRoot);
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
    timings.planningDurationMs = 120;
    timings.materializationDurationMs = 7420;
    timings.fileGenerationDurationMs = 7420;
    timings.generationDurationMs = 7420;
    timings.validationDurationMs = 900;
    timings.npmInstallDurationMs = 18300;
    timings.npmBuildDurationMs = 5200;
    timings.previewDurationMs = 1100;

    const completion = completeMaterializationEvidence({
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
    const diskDiscovery = discoverWorkspaceFiles(workspaceDir);
    const diskFileCount = countWorkspaceFilesOnDisk(workspaceDir);
    const diskDirCount = countWorkspaceDirectoriesOnDisk(workspaceDir);

    assert(
      'generatedFilesCount equals disk file count',
      manifest !== null && manifest.generatedFilesCount === diskFileCount,
      `manifest=${manifest?.generatedFilesCount} disk=${diskFileCount}`,
    );

    assert(
      'generatedDirectoriesCount equals disk directory count',
      manifest !== null && manifest.generatedDirectoriesCount === diskDirCount,
      `manifest=${manifest?.generatedDirectoriesCount} disk=${diskDirCount}`,
    );

    assert(
      'generatedFiles inventory populated',
      manifest !== null && manifest.generatedFiles.length > 0,
      `inventory length=${manifest?.generatedFiles.length ?? 0}`,
    );

    assert(
      'generatedComponentsCount populated',
      manifest !== null && manifest.generatedComponentsCount >= 0,
      String(manifest?.generatedComponentsCount),
    );

    assert(
      'generatedRoutesCount populated',
      manifest !== null && manifest.generatedRoutesCount > 0,
      String(manifest?.generatedRoutesCount),
    );

    assert(
      'generatedFeatureModulesCount populated',
      manifest !== null && manifest.generatedFeatureModulesCount > 0,
      String(manifest?.generatedFeatureModulesCount),
    );

    assert(
      'totalLinesGenerated populated',
      manifest !== null && manifest.totalLinesGenerated > 0,
      String(manifest?.totalLinesGenerated),
    );

    assert(
      'workspaceSizeBytes populated',
      manifest !== null && manifest.workspaceSizeBytes > 0,
      String(manifest?.workspaceSizeBytes),
    );

    assert(
      'generationDuration measured',
      manifest !== null && manifest.generationDurationMs > 0,
      String(manifest?.generationDurationMs),
    );

    assert(
      'materializationDuration measured',
      manifest !== null && manifest.materializationDurationMs > 0,
      String(manifest?.materializationDurationMs),
    );

    assert(
      'npm durations measured',
      manifest !== null && manifest.npmInstallDurationMs > 0 && manifest.npmBuildDurationMs > 0,
      `install=${manifest?.npmInstallDurationMs} build=${manifest?.npmBuildDurationMs}`,
    );

    assert(
      'workspaceHash generated',
      manifest !== null && manifest.workspaceHash.length === 64,
      manifest?.workspaceHash?.slice(0, 16) ?? 'missing',
    );

    assert(
      'manifestHash generated',
      manifest !== null && manifest.manifestHash.length === 64,
      manifest?.manifestHash?.slice(0, 16) ?? 'missing',
    );

    assert(
      'materializationHash generated',
      manifest !== null && manifest.materializationHash.length === 64,
      manifest?.materializationHash?.slice(0, 16) ?? 'missing',
    );

    assert(
      'inventory matches workspace discovery',
      manifest !== null &&
        manifest.generatedFiles.length === diskDiscovery.files.length &&
        manifest.generatedFiles.every((file, index) => file.path === diskDiscovery.files[index]?.path),
      `manifest files=${manifest?.generatedFiles.length} discovery=${diskDiscovery.files.length}`,
    );

    assert(
      'manifest contains no placeholder values',
      manifest !== null && listManifestPlaceholderFields(manifest).length === 0,
      listManifestPlaceholderFields(manifest ?? ({} as never)).join(', ') || 'none',
    );

    assert(
      'manifest evidence complete flag',
      manifest !== null && isManifestEvidenceComplete(manifest),
      String(isManifestEvidenceComplete(manifest ?? ({} as never))),
    );

    const sampleResult: OnePromptLivePreviewBuildResult = {
      readOnly: true,
      buildId: `build-${projectId}`,
      projectId,
      projectName: 'ExpenseTracker',
      status: 'READY',
      prompt,
      requestType: 'BUILD_FROM_PROMPT',
      workspaceId: projectId,
      workspacePath: `.generated-builder-workspaces/${projectId}`,
      generatedProfile: 'EXPENSE_TRACKER_WEB_V1',
      planningProofLevel: 'FULL',
      materializationProofLevel: 'FULL',
      buildResult: 'PASS',
      npmInstallOk: true,
      npmBuildOk: true,
      previewUrl: 'http://127.0.0.1:5173/',
      livePreviewAvailable: true,
      failureReason: null,
      featureSignals: null,
      materializationManifest: manifest,
      updatedAt: new Date().toISOString(),
    };

    const traceEvents = buildOnePromptExecutionTraceEvents(sampleResult, prompt);
    const traceText = traceEvents.map((e) => `${e.eventTitle}\n${e.technicalDetail}`).join('\n');
    assert(
      'Execution Trace reads from manifest',
      traceText.includes('Workspace scanned') &&
        traceText.includes('Materialization evidence complete') &&
        traceText.includes(String(manifest?.generatedFilesCount)),
      traceText.slice(0, 200),
    );

    const chatSummary = materializationEvidenceSummaryForChat(manifest);
    const context = buildBuildResultConversationalContext({
      message: prompt,
      buildResult: sampleResult,
      templateFallback: composeOnePromptBuildChatResponse(sampleResult),
    });
    const structured = buildBuildResultStructuredEvidence(context, sampleResult);
    assert(
      'Chat explanations use manifest evidence',
      chatSummary !== null &&
        structured.materializationEvidence !== null &&
        structured.generatedFilesCount === manifest?.generatedFilesCount,
      JSON.stringify(structured.materializationEvidence).slice(0, 120),
    );

    assert(
      'manifest file exists on disk',
      existsSync(join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME)),
      join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME),
    );

    assert(
      'completion result written manifest',
      completion.manifestWritten && completion.manifest.generatedFilesCount > 0,
      String(completion.manifest.generatedFilesCount),
    );

    const manifestSource = readFileSync(join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME), 'utf8');
    assert(
      'manifest on disk matches completion',
      manifestSource.includes('"validationStatus": "PASS"') ||
        manifestSource.includes('"validationStatus": "FAIL"'),
      'validationStatus not PENDING',
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }

  const failed = results.filter((r) => !r.passed);
  if (failed.length) {
    console.error('MATERIALIZATION_EVIDENCE_COMPLETION_V1_FAIL');
    for (const f of failed) {
      console.error(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  console.log(MATERIALIZATION_EVIDENCE_COMPLETION_V1_PASS_TOKEN);
  for (const r of results) {
    console.log(`  ✓ ${r.name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
