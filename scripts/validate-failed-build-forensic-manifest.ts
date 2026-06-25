/**
 * Failed Build Forensic Manifest V1 — validation.
 */

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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
  createEmptyMaterializationTimings,
  extractExecCommandFailure,
  FAILED_BUILD_FORENSIC_MANIFEST_V1_PASS_TOKEN,
  finalizeForensicManifestFailure,
  initializeForensicManifest,
  listManifestPlaceholderFields,
  materializationEvidenceSummaryForChat,
  readForensicManifest,
  updateForensicManifestStage,
} from '../src/materialization-evidence/index.js';
import { buildOnePromptExecutionTraceEvents } from '../src/execution-trace/index.js';
import {
  buildBuildResultStructuredEvidence,
  buildBuildResultConversationalContext,
} from '../src/build-result-conversational-intelligence/index.js';
import { composeOnePromptBuildChatResponse } from '../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';
import type { ForensicBuildStage } from '../src/materialization-evidence/forensic-manifest-types.js';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function initManifestInput(
  workspaceDir: string,
  projectId: string,
  prompt: string,
  buildRunId: string,
) {
  const ranking = rankBuildProfiles(prompt);
  const profile = resolveMaterializationProfile('EXPENSE_TRACKER_WEB_V1', prompt);
  const definition = getProfileFeatureDefinition(profile, prompt);
  initializeForensicManifest({
    workspaceDir,
    workspacePath: `.generated-builder-workspaces/${projectId}`,
    projectId,
    projectName: 'ForensicTest',
    buildRunId,
    prompt,
    selectedProfile: 'EXPENSE_TRACKER_WEB_V1',
    expectedAppType: definition.expectedAppType,
    promptSummary: summarizePrompt(prompt),
    confidence: ranking.confidence,
    featureModules: definition.featureModules,
    routes: definition.routes,
    fallbackUsed: false,
  });
  updateForensicManifestStage(workspaceDir, { stage: 'PROMPT_RECEIVED' });
  updateForensicManifestStage(workspaceDir, { stage: 'PROFILE_SELECTED' });
  return { ranking, definition };
}

function touchStagesThrough(workspaceDir: string, stages: ForensicBuildStage[]): void {
  for (const stage of stages) {
    updateForensicManifestStage(workspaceDir, { stage });
  }
}

function mockExecError(command: string, exitCode: number, stderr: string): unknown {
  const err = new Error(`Command failed: ${command}`) as Error & {
    status: number;
    stderr: string;
    stdout: string;
  };
  err.status = exitCode;
  err.stderr = stderr;
  err.stdout = '';
  return err;
}

function buildFailureResult(
  manifest: NonNullable<ReturnType<typeof readForensicManifest>>,
  prompt: string,
  projectId: string,
  buildRunId: string,
): OnePromptLivePreviewBuildResult {
  return {
    readOnly: true,
    buildId: buildRunId,
    projectId,
    projectName: 'ForensicTest',
    status: 'FAILED',
    prompt,
    requestType: 'BUILD_FROM_PROMPT',
    workspaceId: projectId,
    workspacePath: `.generated-builder-workspaces/${projectId}`,
    generatedProfile: 'EXPENSE_TRACKER_WEB_V1',
    planningProofLevel: 'FULL',
    materializationProofLevel: null,
    buildResult: 'FAIL',
    npmInstallOk: manifest.lastSuccessfulStage === 'NPM_INSTALL' || manifest.lastSuccessfulStage === 'NPM_BUILD' || manifest.lastSuccessfulStage === 'PREVIEW',
    npmBuildOk: manifest.lastSuccessfulStage === 'NPM_BUILD' || manifest.lastSuccessfulStage === 'PREVIEW',
    previewUrl: null,
    livePreviewAvailable: false,
    failureReason: manifest.failureReason,
    featureSignals: null,
    materializationManifest: manifest,
    updatedAt: new Date().toISOString(),
  };
}

function assertFailureManifest(
  label: string,
  workspaceDir: string,
  expectedStage: ForensicBuildStage,
  options?: {
    expectFiles?: boolean;
    expectCommand?: boolean;
    expectPartialHash?: boolean;
    expectStatus?: 'FAIL' | 'PARTIAL' | 'ABORTED';
  },
): NonNullable<ReturnType<typeof readForensicManifest>> {
  const manifest = readForensicManifest(workspaceDir);
  assert(
    `${label}: manifest exists`,
    manifest !== null && existsSync(join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME)),
    join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME),
  );
  if (!manifest) throw new Error(`${label}: manifest missing`);

  assert(
    `${label}: failureStage correct`,
    manifest.failureStage === expectedStage,
    `expected=${expectedStage} actual=${manifest.failureStage}`,
  );
  assert(
    `${label}: validationStatus FAIL or PARTIAL`,
    manifest.validationStatus === 'FAIL' || manifest.validationStatus === 'PARTIAL',
    manifest.validationStatus,
  );
  assert(
    `${label}: completedAt present`,
    Boolean(manifest.completedAt),
    manifest.completedAt ?? 'missing',
  );
  assert(
    `${label}: failureReason present`,
    Boolean(manifest.failureReason),
    manifest.failureReason ?? 'missing',
  );
  assert(
    `${label}: lastSuccessfulStage present`,
    Boolean(manifest.lastSuccessfulStage),
    manifest.lastSuccessfulStage ?? 'missing',
  );
  assert(
    `${label}: no placeholder-only manifest`,
    listManifestPlaceholderFields(manifest).length === 0,
    listManifestPlaceholderFields(manifest).join(', ') || 'none',
  );
  assert(
    `${label}: stage history recorded`,
    manifest.stageHistory.length >= 2,
    String(manifest.stageHistory.length),
  );

  if (options?.expectFiles) {
    assert(
      `${label}: partial files recorded`,
      manifest.generatedFilesCount > 0,
      String(manifest.generatedFilesCount),
    );
  }
  if (options?.expectCommand) {
    assert(
      `${label}: command failure captured`,
      Boolean(manifest.failedCommand) && manifest.exitCode !== null,
      `${manifest.failedCommand} exit=${manifest.exitCode}`,
    );
    assert(
      `${label}: stderr preview captured`,
      Boolean(manifest.stderrPreview),
      manifest.stderrPreview?.slice(0, 80) ?? 'missing',
    );
  }
  if (options?.expectPartialHash) {
    assert(
      `${label}: partial workspace hash present`,
      Boolean(manifest.partialWorkspaceHash && manifest.partialWorkspaceHash.length === 64),
      manifest.partialWorkspaceHash?.slice(0, 16) ?? 'missing',
    );
  }
  if (options?.expectStatus) {
    assert(
      `${label}: status matches`,
      manifest.status === options.expectStatus,
      manifest.status,
    );
  }

  return manifest;
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

  const projectId = `forensic-${Date.now()}`;
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
  const tempRoot = join(tmpdir(), `forensic-manifest-${Date.now()}`);
  mkdirSync(tempRoot, { recursive: true });

  const prompt =
    'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, income, expenses, balance, spending reports, charts, and CSV export.';

  try {
    // 1. Planning failure
    {
      const projectId = `plan-fail-${Date.now()}`;
      const workspaceDir = join(tempRoot, 'plan-fail', projectId);
      mkdirSync(workspaceDir, { recursive: true });
      const buildRunId = `build-${projectId}`;
      initManifestInput(workspaceDir, projectId, prompt, buildRunId);
      updateForensicManifestStage(workspaceDir, {
        stage: 'PLANNING',
        errors: ['Planning did not produce a build-ready contract'],
      });
      finalizeForensicManifestFailure(workspaceDir, {
        failureStage: 'PLANNING',
        failureReason: 'Planning did not produce a build-ready contract',
        lastSuccessfulStage: 'PROFILE_SELECTED',
      });
      const manifest = assertFailureManifest('planning failure', workspaceDir, 'PLANNING');
      const result = buildFailureResult(manifest, prompt, projectId, buildRunId);
      const traceText = buildOnePromptExecutionTraceEvents(result, prompt)
        .map((e) => e.eventTitle)
        .join('\n');
      assert(
        'planning failure: Execution Trace receives failure manifest events',
        traceText.includes('Forensic manifest initialized') &&
          traceText.includes('Build failed at PLANNING') &&
          traceText.includes('Failed build forensic manifest written'),
        traceText.slice(0, 200),
      );
      const chatSummary = materializationEvidenceSummaryForChat(manifest);
      assert(
        'planning failure: chat evidence includes failure data',
        chatSummary !== null &&
          chatSummary.buildFailed === true &&
          chatSummary.failureStage === 'PLANNING',
        JSON.stringify(chatSummary).slice(0, 120),
      );
    }

    // 2. Materialization failure with partial workspace
    {
      const projectId = `mat-fail-${Date.now()}`;
      const workspaceDir = join(tempRoot, 'mat-fail', projectId);
      mkdirSync(join(workspaceDir, 'src'), { recursive: true });
      writeFileSync(join(workspaceDir, 'package.json'), '{"name":"partial-app"}', 'utf8');
      writeFileSync(join(workspaceDir, 'src/App.tsx'), 'export default function App() { return null; }', 'utf8');
      const buildRunId = `build-${projectId}`;
      initManifestInput(workspaceDir, projectId, prompt, buildRunId);
      touchStagesThrough(workspaceDir, ['PLANNING', 'WORKSPACE_CREATED']);
      updateForensicManifestStage(workspaceDir, {
        stage: 'MATERIALIZATION',
        errors: ['Code Generation Engine V1 did not materialize application files'],
      });
      finalizeForensicManifestFailure(workspaceDir, {
        failureStage: 'MATERIALIZATION',
        failureReason: 'Code Generation Engine V1 did not materialize application files',
        lastSuccessfulStage: 'WORKSPACE_CREATED',
      });
      assertFailureManifest('materialization failure', workspaceDir, 'MATERIALIZATION', {
        expectFiles: true,
        expectPartialHash: true,
      });
    }

    // 3–5. npm install / build / preview failures on real materialized workspace
    const { workspaceDir: baseWorkspace, projectId: baseProjectId } =
      materializeExpenseWorkspace(tempRoot);

    // 3. npm install failure
    {
      const workspaceDir = join(tempRoot, 'npm-install-fail', baseProjectId);
      mkdirSync(workspaceDir, { recursive: true });
      cpSync(baseWorkspace, workspaceDir, { recursive: true });
      const buildRunId = `build-npm-install-${Date.now()}`;
      initManifestInput(workspaceDir, baseProjectId, prompt, buildRunId);
      touchStagesThrough(workspaceDir, [
        'PLANNING',
        'WORKSPACE_CREATED',
        'MATERIALIZATION',
        'MATERIALIZATION_VALIDATION',
      ]);
      updateForensicManifestStage(workspaceDir, { stage: 'NPM_INSTALL' });
      const commandFailure = extractExecCommandFailure(
        mockExecError('npm install --ignore-scripts', 1, 'npm ERR! ERESOLVE unable to resolve dependency tree'),
        'npm install --ignore-scripts',
      );
      finalizeForensicManifestFailure(workspaceDir, {
        failureStage: 'NPM_INSTALL',
        failureReason: `npm install failed: ${commandFailure.failureMessage}`,
        failureMessage: commandFailure.failureMessage,
        lastSuccessfulStage: 'MATERIALIZATION_VALIDATION',
        commandFailure,
      });
      assertFailureManifest('npm install failure', workspaceDir, 'NPM_INSTALL', {
        expectFiles: true,
        expectCommand: true,
        expectPartialHash: true,
      });
    }

    // 4. npm build failure
    {
      const workspaceDir = join(tempRoot, 'npm-build-fail', baseProjectId);
      mkdirSync(workspaceDir, { recursive: true });
      cpSync(baseWorkspace, workspaceDir, { recursive: true });
      const buildRunId = `build-npm-build-${Date.now()}`;
      initManifestInput(workspaceDir, baseProjectId, prompt, buildRunId);
      touchStagesThrough(workspaceDir, [
        'PLANNING',
        'WORKSPACE_CREATED',
        'MATERIALIZATION',
        'MATERIALIZATION_VALIDATION',
        'NPM_INSTALL',
      ]);
      updateForensicManifestStage(workspaceDir, { stage: 'NPM_BUILD' });
      const commandFailure = extractExecCommandFailure(
        mockExecError('npm run build', 2, 'TS2304: Cannot find name React'),
        'npm run build',
      );
      finalizeForensicManifestFailure(workspaceDir, {
        failureStage: 'NPM_BUILD',
        failureReason: `npm run build failed: ${commandFailure.failureMessage}`,
        failureMessage: commandFailure.failureMessage,
        lastSuccessfulStage: 'NPM_INSTALL',
        commandFailure,
      });
      assertFailureManifest('npm build failure', workspaceDir, 'NPM_BUILD', {
        expectFiles: true,
        expectCommand: true,
        expectPartialHash: true,
      });
    }

    // 5. preview failure (PARTIAL)
    {
      const workspaceDir = join(tempRoot, 'preview-fail', baseProjectId);
      mkdirSync(workspaceDir, { recursive: true });
      cpSync(baseWorkspace, workspaceDir, { recursive: true });
      const buildRunId = `build-preview-${Date.now()}`;
      initManifestInput(workspaceDir, baseProjectId, prompt, buildRunId);
      touchStagesThrough(workspaceDir, [
        'PLANNING',
        'WORKSPACE_CREATED',
        'MATERIALIZATION',
        'MATERIALIZATION_VALIDATION',
        'NPM_INSTALL',
        'NPM_BUILD',
      ]);
      updateForensicManifestStage(workspaceDir, {
        stage: 'PREVIEW',
        errors: ['Dev server failed to start'],
      });
      finalizeForensicManifestFailure(workspaceDir, {
        failureStage: 'PREVIEW',
        failureReason: 'Dev server failed to start',
        lastSuccessfulStage: 'NPM_BUILD',
        status: 'PARTIAL',
      });
      const manifest = assertFailureManifest('preview failure', workspaceDir, 'PREVIEW', {
        expectFiles: true,
        expectPartialHash: true,
        expectStatus: 'PARTIAL',
      });
      const result = buildFailureResult(manifest, prompt, baseProjectId, buildRunId);
      const context = buildBuildResultConversationalContext({
        message: prompt,
        buildResult: result,
        templateFallback: composeOnePromptBuildChatResponse(result),
      });
      const structured = buildBuildResultStructuredEvidence(context, result);
      assert(
        'preview failure: structured chat evidence receives failed manifest data',
        structured.materializationEvidence !== null &&
          structured.materializationEvidence.lastSuccessfulStage === 'NPM_BUILD' &&
          structured.materializationEvidence.generatedFilesCount === manifest.generatedFilesCount,
        JSON.stringify(structured.materializationEvidence).slice(0, 160),
      );
      const traceText = buildOnePromptExecutionTraceEvents(result, prompt)
        .map((e) => e.eventTitle)
        .join('\n');
      assert(
        'preview failure: Execution Trace partial workspace scanned',
        traceText.includes('Partial workspace scanned') &&
          traceText.includes('Build failed at PREVIEW'),
        traceText.slice(0, 200),
      );
    }

    // 6. Successful build still writes PASS manifest
    {
      const { workspaceDir, projectId } = materializeExpenseWorkspace(
        join(tempRoot, 'success'),
      );
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
      timings.npmBuildDurationMs = 2000;
      timings.previewDurationMs = 500;
      timings.validationDurationMs = 300;

      initializeForensicManifest({
        workspaceDir,
        workspacePath: `.generated-builder-workspaces/${projectId}`,
        projectId,
        projectName: 'ExpenseTracker',
        buildRunId: `build-${projectId}`,
        prompt,
        selectedProfile: 'EXPENSE_TRACKER_WEB_V1',
        expectedAppType: definition.expectedAppType,
        promptSummary: summarizePrompt(prompt),
        confidence: ranking.confidence,
        featureModules: definition.featureModules,
        routes: definition.routes,
        fallbackUsed: false,
      });
      for (const stage of [
        'PROMPT_RECEIVED',
        'PROFILE_SELECTED',
        'PLANNING',
        'WORKSPACE_CREATED',
        'MATERIALIZATION',
        'MATERIALIZATION_VALIDATION',
        'NPM_INSTALL',
        'NPM_BUILD',
        'PREVIEW',
        'FINAL_VALIDATION',
      ] as const) {
        updateForensicManifestStage(workspaceDir, { stage });
      }

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

      const manifest = completion.manifest;
      assert(
        'success build: PASS manifest written',
        manifest.status === 'PASS' && manifest.validationStatus === 'PASS',
        `${manifest.status}/${manifest.validationStatus}`,
      );
      assert(
        'success build: hashes present',
        manifest.workspaceHash.length === 64 && manifest.materializationHash.length === 64,
        `${manifest.workspaceHash.slice(0, 12)}…`,
      );
      assert(
        'success build: no placeholder fields',
        listManifestPlaceholderFields(manifest).length === 0,
        listManifestPlaceholderFields(manifest).join(', ') || 'none',
      );
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }

  const failed = results.filter((r) => !r.passed);
  if (failed.length) {
    console.error('FAILED_BUILD_FORENSIC_MANIFEST_V1_FAIL');
    for (const f of failed) {
      console.error(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  console.log(FAILED_BUILD_FORENSIC_MANIFEST_V1_PASS_TOKEN);
  for (const r of results) {
    console.log(`  ✓ ${r.name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
