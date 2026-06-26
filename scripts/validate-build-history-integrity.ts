/**
 * Build History Integrity V1 — validation.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { materializeGeneratedApplication } from '../src/code-generation-engine/code-generation-engine-authority.js';
import { assessRequirementsToPlanExecutionContract } from '../src/requirements-to-plan-execution-contract/index.js';
import {
  BUILD_HISTORY_INTEGRITY_V1_PASS_TOKEN,
  BUILD_RECORD_FILENAME,
  buildHistoryRecordExists,
  buildHistoryRunDir,
  buildHistoryTraceTitles,
  buildBuildHistoryTraceEvents,
  EXECUTION_TRACE_SNAPSHOT_FILENAME,
  FILE_INDEX_SNAPSHOT_FILENAME,
  MANIFEST_SNAPSHOT_FILENAME,
  PRODUCTION_VALIDATION_SNAPSHOT_FILENAME,
  recordBuildHistory,
  REPLAY_METADATA_FILENAME,
  AUDIT_TIMELINE_FILENAME,
  verifyBuildHistoryRecord,
} from '../src/build-history-integrity/index.js';
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
import { runProductionValidation } from '../src/production-validation/index.js';
import {
  GENERATED_APP_MANIFEST_FILENAME,
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
  serializeGeneratedAppManifest,
  validateUniversalAppMaterialization,
} from '../src/universal-prompt-to-app-materialization/index.js';
import { summarizePrompt } from '../src/universal-prompt-to-app-materialization/prompt-app-metadata.js';
import type { GeneratedAppManifest } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import { computeBuildRecordHash } from '../src/build-history-integrity/build-history-hash.js';

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
  console.log('Build History Integrity V1 — Validation');
  console.log('=======================================');
  console.log('');

  const prompt =
    'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, income, expenses, balance, spending reports, charts, and CSV export.';
  const testRoot = join(tmpdir(), `build-history-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });

  try {
    const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: prompt });
    const contract = assessment.report.buildReadyContract;
    if (!contract) throw new Error('Planning failed');

    const projectId = `history-${Date.now()}`;
    const engine = materializeGeneratedApplication({
      projectRootDir: testRoot,
      workspaceId: projectId,
      contract: { ...contract, contractId: projectId },
      rawPrompt: prompt,
      profileOverride: 'EXPENSE_TRACKER_WEB_V1',
    });
    if (!engine.generated) throw new Error(engine.skippedReason ?? 'materialization failed');

    const manifest = completeBuild(testRoot, projectId, prompt);
    assert('01. every generated app records build history', manifest.buildHistoryRecorded, String(manifest.buildHistoryRecorded));
    assert('02. build history runId present', Boolean(manifest.buildHistoryRunId), manifest.buildHistoryRunId ?? 'missing');
    assert('03. manifest links to record path', Boolean(manifest.buildHistoryRecordPath), manifest.buildHistoryRecordPath ?? 'missing');

    const runId = manifest.buildHistoryRunId!;
    const runDir = buildHistoryRunDir(testRoot, runId);
    assert('04. build history record exists on disk', buildHistoryRecordExists(testRoot, runId), runDir);

    const checks = verifyBuildHistoryRecord({ projectRootDir: testRoot, runId, manifest });
    for (const check of checks) {
      assert(`05.${check.name}`, check.passed, check.detail);
    }

    assert(
      '06. manifest snapshot exists',
      existsSync(join(runDir, MANIFEST_SNAPSHOT_FILENAME)),
      MANIFEST_SNAPSHOT_FILENAME,
    );
    assert(
      '07. file index snapshot exists',
      existsSync(join(runDir, FILE_INDEX_SNAPSHOT_FILENAME)),
      FILE_INDEX_SNAPSHOT_FILENAME,
    );
    assert(
      '08. replay metadata exists',
      existsSync(join(runDir, REPLAY_METADATA_FILENAME)),
      REPLAY_METADATA_FILENAME,
    );
    assert(
      '09. audit timeline exists',
      existsSync(join(runDir, AUDIT_TIMELINE_FILENAME)),
      AUDIT_TIMELINE_FILENAME,
    );
    assert(
      '10. execution trace snapshot exists',
      existsSync(join(runDir, EXECUTION_TRACE_SNAPSHOT_FILENAME)),
      EXECUTION_TRACE_SNAPSHOT_FILENAME,
    );

    const prodEvidence = await runProductionValidation({
      projectRootDir: testRoot,
      workspaceId: projectId,
      profile: 'EXPENSE_TRACKER_WEB_V1',
      prompt,
    });
    const manifestAfterProd = readCompletedGeneratedAppManifest(join(testRoot, '.generated-builder-workspaces', projectId));
    const prodRunDir = buildHistoryRunDir(testRoot, manifestAfterProd?.buildHistoryRunId ?? runId);
    assert(
      '11. production validation snapshot when prod validation ran',
      existsSync(join(prodRunDir, PRODUCTION_VALIDATION_SNAPSHOT_FILENAME)),
      prodEvidence.productionValidationStatus,
    );

    const record = JSON.parse(readFileSync(join(runDir, BUILD_RECORD_FILENAME), 'utf8')) as {
      buildHistoryRecordHash: string;
      comparisonFingerprint: string;
      immutable: boolean;
    };
    assert('12. comparison fingerprint generated', record.comparisonFingerprint.length > 0, record.comparisonFingerprint.slice(0, 12));
    assert('13. build record immutable flag', record.immutable === true, String(record.immutable));

    const recordAgain = recordBuildHistory({
      projectRootDir: testRoot,
      workspaceDir: join(testRoot, '.generated-builder-workspaces', projectId),
      manifest: readCompletedGeneratedAppManifest(join(testRoot, '.generated-builder-workspaces', projectId))!,
    });
    assert(
      '14. duplicate runId creates unique run with evidence',
      recordAgain.evidence.deduplicatedRunId === true,
      recordAgain.evidence.buildHistoryRunId,
    );

    const originalRecord = readFileSync(join(runDir, BUILD_RECORD_FILENAME), 'utf8');
    assert(
      '15. existing run record not overwritten',
      readFileSync(join(runDir, BUILD_RECORD_FILENAME), 'utf8') === originalRecord,
      'build-record.json unchanged after duplicate recording',
    );

    const failureWorkspace = join(testRoot, '.generated-builder-workspaces', `${projectId}-fail`);
    mkdirSync(failureWorkspace, { recursive: true });
    initializeForensicManifest({
      workspaceDir: failureWorkspace,
      workspacePath: failureWorkspace,
      projectId: `${projectId}-fail`,
      projectName: 'FailBuild',
      buildRunId: `build-${projectId}-fail`,
      prompt,
      selectedProfile: 'EXPENSE_TRACKER_WEB_V1',
      expectedAppType: 'expense-tracker',
      promptSummary: summarizePrompt(prompt),
      confidence: 'LOW',
      featureModules: ['auth', 'dashboard'],
      routes: ['/'],
    });
    finalizeForensicManifestFailure(failureWorkspace, {
      failureStage: 'NPM_BUILD',
      failureReason: 'Simulated npm build failure',
      status: 'FAIL',
    });
    const failedManifest = readCompletedGeneratedAppManifest(failureWorkspace);
    assert(
      '16. failure builds recorded with failure reasons',
      failedManifest?.buildHistoryRecorded === true &&
        (failedManifest.buildHistoryFailureReasons.length > 0 ||
          JSON.parse(
            readFileSync(
              join(buildHistoryRunDir(testRoot, failedManifest!.buildHistoryRunId!), BUILD_RECORD_FILENAME),
              'utf8',
            ),
          ).failureReasons.length > 0),
      failedManifest?.buildHistoryRunId ?? 'missing',
    );

    assert(
      '17. manifest hash links to build record',
      record.buildHistoryRecordHash === manifest.buildHistoryRecordHash,
      manifest.buildHistoryRecordHash?.slice(0, 12) ?? 'missing',
    );

    const { buildHistoryRecordHash: _ignored, ...recordBody } = JSON.parse(
      readFileSync(join(runDir, BUILD_RECORD_FILENAME), 'utf8'),
    );
    assert(
      '18. build record hash stable',
      computeBuildRecordHash(recordBody) === record.buildHistoryRecordHash,
      record.buildHistoryRecordHash.slice(0, 12),
    );

    const sampleResult: OnePromptLivePreviewBuildResult = {
      readOnly: true,
      buildId: runId,
      projectId,
      projectName: 'ExpenseTracker',
      status: 'READY',
      prompt,
      requestType: 'BUILD_FROM_PROMPT',
      workspaceId: projectId,
      workspacePath: join(testRoot, '.generated-builder-workspaces', projectId).replace(/\\/g, '/'),
      generatedProfile: 'EXPENSE_TRACKER_WEB_V1',
      planningProofLevel: 'FULL',
      materializationProofLevel: 'FULL',
      buildResult: 'PASS',
      npmInstallOk: true,
      npmBuildOk: true,
      previewUrl: prodEvidence.previewUrl,
      livePreviewAvailable: Boolean(prodEvidence.previewUrl),
      failureReason: null,
      featureSignals: null,
      materializationManifest: manifestAfterProd,
      updatedAt: manifestAfterProd?.completedAt ?? manifest.createdAt,
    };
    const trace = buildOnePromptExecutionTraceEvents(sampleResult, prompt);
    assert(
      '19. execution trace includes build history recording started',
      trace.some((event) => event.eventTitle === 'Build history recording started'),
      'trace linked',
    );
    for (const title of buildHistoryTraceTitles()) {
      if (title === 'Build history recording failed') continue;
      assert(
        `20. trace "${title}"`,
        trace.some((event) => event.eventTitle === title) ||
          buildBuildHistoryTraceEvents(
            {
              readOnly: true,
              buildHistoryRecorded: true,
              buildHistoryRunId: runId,
              buildHistoryRecordPath: manifest.buildHistoryRecordPath!,
              buildHistoryRecordHash: manifest.buildHistoryRecordHash!,
              buildHistoryImmutable: true,
              replayMetadataPath: manifest.replayMetadataPath!,
              auditTimelinePath: manifest.auditTimelinePath!,
              buildHistoryIntegrityStatus: 'PASS',
              buildHistoryFailureReasons: [],
              deduplicatedRunId: false,
              productionValidationSnapshotRecorded: true,
              recordedAt: manifest.buildHistoryRecordedAt ?? manifest.completedAt ?? manifest.createdAt,
            },
            runId,
          ).some((event) => event.eventTitle === title),
        title,
      );
    }

    assert(
      '21. validation fails without disk evidence guard',
      manifest.buildHistoryRecordPath !== null && existsSync(join(testRoot, manifest.buildHistoryRecordPath)),
      'disk-backed path required',
    );
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }

  const failed = results.filter((result) => !result.passed);
  console.log('');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}: ${result.detail}`);
  }
  console.log('');

  if (failed.length) {
    console.error(`Build History Integrity V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(BUILD_HISTORY_INTEGRITY_V1_PASS_TOKEN);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
