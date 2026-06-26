/**
 * Feature Contract Reality V1 — validation.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { materializeGeneratedApplication } from '../src/code-generation-engine/code-generation-engine-authority.js';
import { assessRequirementsToPlanExecutionContract } from '../src/requirements-to-plan-execution-contract/index.js';
import {
  FEATURE_CONTRACT_REALITY_V1_PASS_TOKEN,
  WORKSPACE_FEATURE_CONTRACT_REALITY_FILENAME,
  buildFeatureContractRealityChatSummary,
  buildFeatureRealityRecords,
  featureContractRealityTraceTitles,
  buildFeatureContractRealityTraceEvents,
} from '../src/feature-contract-reality/index.js';
import { AIDEV_FEATURE_CONTRACT_REALITY_FILENAME } from '../src/persistent-project-reality/persistent-project-reality-types.js';
import { persistentProjectPaths } from '../src/persistent-project-reality/persistent-project-reality-paths.js';
import { buildOnePromptExecutionTraceEvents } from '../src/execution-trace/index.js';
import { rankBuildProfiles } from '../src/build-profile-classification/index.js';
import {
  completeMaterializationEvidence,
  createEmptyMaterializationTimings,
  readCompletedGeneratedAppManifest,
} from '../src/materialization-evidence/index.js';
import { materializationEvidenceSummaryForChat } from '../src/materialization-evidence/materialization-evidence-completer.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';
import { getRegistryProject } from '../src/project-registry-v1/project-registry-v1-store.js';
import {
  getProfileFeatureDefinition,
  materializableFeatureModules,
  resolveMaterializationProfile,
  summarizePrompt,
  validateUniversalAppMaterialization,
} from '../src/universal-prompt-to-app-materialization/index.js';
import type { GeneratedAppManifest } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { FeatureContractRealityReport } from '../src/feature-contract-reality/feature-contract-reality-types.js';

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

function completeBuild(
  testRoot: string,
  projectId: string,
  prompt: string,
  profile: string,
  projectName: string,
): GeneratedAppManifest {
  const workspaceDir = join(testRoot, '.generated-builder-workspaces', projectId);
  const validation = validateUniversalAppMaterialization({
    workspaceDir,
    rawPrompt: prompt,
    selectedProfile: profile as import('../src/code-generation-engine/code-generation-engine-types.js').GeneratedAppProfile,
    projectId,
    projectName,
    buildRunId: `build-${projectId}`,
    npmInstallOk: true,
    npmBuildOk: true,
  });
  const ranking = rankBuildProfiles(prompt);
  const resolved = resolveMaterializationProfile(profile as import('../src/code-generation-engine/code-generation-engine-types.js').GeneratedAppProfile, prompt);
  const definition = getProfileFeatureDefinition(resolved, prompt);
  const timings = createEmptyMaterializationTimings();
  timings.materializationDurationMs = 5000;
  timings.generationDurationMs = 5000;
  timings.npmInstallDurationMs = 1000;
  timings.npmBuildDurationMs = 1000;

  completeMaterializationEvidence({
    workspaceDir,
    prompt,
    projectId,
    projectName,
    buildRunId: `build-${projectId}`,
    selectedProfile: profile,
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

async function materializeProfile(
  testRoot: string,
  prompt: string,
  profile: string,
  suffix: string,
): Promise<{ projectId: string; manifest: GeneratedAppManifest; workspaceDir: string }> {
  const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: prompt });
  const contract = assessment.report.buildReadyContract;
  if (!contract) throw new Error('Planning failed');
  const projectId = `${suffix}-${Date.now()}`;
  const engine = materializeGeneratedApplication({
    projectRootDir: testRoot,
    workspaceId: projectId,
    contract: { ...contract, contractId: projectId },
    rawPrompt: prompt,
    profileOverride: profile as import('../src/code-generation-engine/code-generation-engine-types.js').GeneratedAppProfile,
  });
  if (!engine.generated) throw new Error(engine.skippedReason ?? 'materialization failed');
  const workspaceDir = join(testRoot, '.generated-builder-workspaces', projectId);
  const manifest = completeBuild(testRoot, projectId, prompt, profile, suffix);
  return { projectId, manifest, workspaceDir };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Feature Contract Reality V1 — Validation');
  console.log('========================================');
  console.log('');

  const testRoot = join(tmpdir(), `feature-reality-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });

  try {
    const expensePrompt =
      'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, income, expenses, balance, spending reports, charts, and CSV export.';
    const expense = await materializeProfile(testRoot, expensePrompt, 'EXPENSE_TRACKER_WEB_V1', 'expense');
    const expenseDefinition = getProfileFeatureDefinition('EXPENSE_TRACKER_WEB_V1', expensePrompt);
    const expenseModules = materializableFeatureModules(expenseDefinition);

    assert(
      '01. ExpenseTracker reports all expected features with reality records',
      expense.manifest.featureRealityRecords.length === expenseModules.length &&
        expense.manifest.featureContractRealityStatus !== 'FAIL',
      `${expense.manifest.featureRealityRecords.length}/${expenseModules.length}`,
    );

    const crmPrompt =
      'Build a CRM called SalesPulse with customers, leads, pipeline, deals, contacts, and follow-ups.';
    const crm = await materializeProfile(testRoot, crmPrompt, 'CRM_WEB_V1', 'crm');
    const crmDefinition = getProfileFeatureDefinition('CRM_WEB_V1', crmPrompt);
    const crmModules = materializableFeatureModules(crmDefinition);
    assert(
      '02. CRM reports all expected features with reality records',
      crm.manifest.featureRealityRecords.length === crmModules.length,
      `${crm.manifest.featureRealityRecords.length}/${crmModules.length}`,
    );

    const qrPrompt =
      'Build SmartQR with QR code generator, scanner, code history, analytics dashboard, and settings.';
    const qr = await materializeProfile(testRoot, qrPrompt, 'QR_APP', 'qr');
    const qrIds = qr.manifest.featureRealityRecords.map((record) => record.featureId);
    assert(
      '03. QR App reports generator/scanner/history/analytics correctly',
      ['generator', 'scanner', 'code-history', 'analytics', 'settings'].every((id) => qrIds.includes(id)),
      qrIds.join(', '),
    );

    const missingFileRecords = buildFeatureRealityRecords({
      workspaceDir: expense.workspaceDir,
      manifest: expense.manifest,
    });
    rmSync(join(expense.workspaceDir, 'src/features/csv-export'), { recursive: true, force: true });
    const afterMissingFile = buildFeatureRealityRecords({
      workspaceDir: expense.workspaceDir,
      manifest: expense.manifest,
    });
    const csvRecord = afterMissingFile.find((record) => record.featureId === 'csv-export');
    assert(
      '04. missing feature file causes failure',
      Boolean(csvRecord && !csvRecord.filesPresent && csvRecord.score < missingFileRecords.find((r) => r.featureId === 'csv-export')!.score),
      csvRecord?.score.toString() ?? 'missing',
    );

    const registryPath = join(expense.workspaceDir, 'src/features/registry.ts');
    const registryBackup = readFileSync(registryPath, 'utf8');
    writeFileSync(registryPath, registryBackup.replace("id: 'income'", "id: 'income-removed'"), 'utf8');
    const afterRegistry = buildFeatureRealityRecords({ workspaceDir: expense.workspaceDir, manifest: expense.manifest });
    writeFileSync(registryPath, registryBackup, 'utf8');
    assert(
      '05. missing registry entry causes failure',
      afterRegistry.some((record) => record.featureId === 'income' && !record.registryEntryPresent),
      'income registry missing',
    );

    const routesPath = join(expense.workspaceDir, 'src/features/routes.ts');
    const routesBackup = readFileSync(routesPath, 'utf8');
    writeFileSync(routesPath, 'export const APP_ROUTES = [] as const;\n', 'utf8');
    const afterRoutes = buildFeatureRealityRecords({ workspaceDir: expense.workspaceDir, manifest: expense.manifest });
    writeFileSync(routesPath, routesBackup, 'utf8');
    assert(
      '06. missing route causes failure',
      afterRoutes.some((record) => !record.routePresent),
      'routes broken',
    );

    const validationPath = join(expense.workspaceDir, 'src/features/expenses/expenses.validation.ts');
    const validationBackup = readFileSync(validationPath, 'utf8');
    writeFileSync(validationPath, 'export const EXPENSES_VALIDATION = { rules: [] };\n', 'utf8');
    const afterValidation = buildFeatureRealityRecords({ workspaceDir: expense.workspaceDir, manifest: expense.manifest });
    writeFileSync(validationPath, validationBackup, 'utf8');
    assert(
      '07. missing validation metadata causes failure',
      afterValidation.some((record) => record.featureId === 'expenses' && !record.validated),
      'expenses validation broken',
    );

    const expensesComponent = join(expense.workspaceDir, 'src/features/expenses/ExpensesFeature.tsx');
    const componentBackup = readFileSync(expensesComponent, 'utf8');
    writeFileSync(
      expensesComponent,
      componentBackup.replace(/<button[\s\S]*?<\/button>/, ''),
      'utf8',
    );
    const afterInteraction = buildFeatureRealityRecords({ workspaceDir: expense.workspaceDir, manifest: expense.manifest });
    writeFileSync(expensesComponent, componentBackup, 'utf8');
    const expensesInteraction = afterInteraction.find((record) => record.featureId === 'expenses');
    assert(
      '08. missing interaction marker fails interaction reality',
      Boolean(expensesInteraction && !expensesInteraction.interactive),
      String(expensesInteraction?.interactive),
    );

    const reportsRecord = expense.manifest.featureRealityRecords.find((record) => record.featureId === 'reports');
    assert(
      '09. informational feature passes when explicitly marked informational',
      Boolean(reportsRecord?.informationalOnly && reportsRecord.interactive),
      String(reportsRecord?.informationalOnly),
    );

    assert(
      '10. manifest records feature contract reality',
      expense.manifest.featureContractRealityScore > 0 &&
        expense.manifest.featureRealityRecords.length > 0 &&
        Boolean(expense.manifest.featureContractRealityArtifactPath),
      `${expense.manifest.featureContractRealityScore}%`,
    );

    const paths = persistentProjectPaths(testRoot, expense.projectId);
    const persistentArtifact = join(paths.aidev, AIDEV_FEATURE_CONTRACT_REALITY_FILENAME);
    assert(
      '11. persistent project stores feature-contract-reality.json',
      existsSync(persistentArtifact),
      persistentArtifact,
    );

    const traceResult: OnePromptLivePreviewBuildResult = {
      readOnly: true,
      buildId: expense.manifest.buildRunId,
      projectId: expense.projectId,
      projectName: 'expense',
      status: 'READY',
      prompt: expensePrompt,
      requestType: 'BUILD_FROM_PROMPT',
      workspaceId: expense.projectId,
      workspacePath: expense.manifest.persistentProjectSourceRoot,
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
      materializationManifest: expense.manifest,
      updatedAt: expense.manifest.completedAt ?? new Date().toISOString(),
    };
    const traceTitles = buildOnePromptExecutionTraceEvents(traceResult).map((event) => event.eventTitle);
    for (const title of featureContractRealityTraceTitles()) {
      assert(`12. execution trace includes "${title}"`, traceTitles.includes(title), title);
    }

    const chatSummary = materializationEvidenceSummaryForChat(expense.manifest);
    const featureEvidence = chatSummary?.featureContractRealityEvidence as Record<string, unknown> | undefined;
    assert(
      '13. chat summary uses feature reality artifact',
      Boolean(featureEvidence) &&
        typeof featureEvidence!.chatSummary === 'string' &&
        featureEvidence!.chatSummary.includes('Feature Contract Reality'),
      String(featureEvidence?.overallScore ?? featureEvidence?.status),
    );

    const qualityPath = join(paths.aidev, 'materialization-quality-score.json');
    const qualityLinked =
      existsSync(qualityPath) &&
      Boolean(
        (JSON.parse(readFileSync(qualityPath, 'utf8')) as Record<string, unknown>).featureContractRealityPath,
      );
    assert('14. quality score links feature reality result', qualityLinked, String(qualityLinked));

    const registry = getRegistryProject(expense.projectId, testRoot);
    assert(
      '15. registry links feature contract reality artifact',
      Boolean(registry?.featureContractRealityPath),
      registry?.featureContractRealityPath ?? 'missing',
    );

    const artifact = JSON.parse(
      readFileSync(join(expense.workspaceDir, WORKSPACE_FEATURE_CONTRACT_REALITY_FILENAME), 'utf8'),
    ) as FeatureContractRealityReport;
    const chatFromReport = buildFeatureContractRealityChatSummary(artifact);
    assert(
      '16. chat summary does not invent feature counts',
      chatFromReport.includes(`${artifact.provenFeatureCount}/${artifact.plannedFeatureCount}`),
      chatFromReport.slice(0, 80),
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
      console.error('Feature Contract Reality V1 validation FAILED');
      process.exit(1);
    }
    console.log('');
    console.log(FEATURE_CONTRACT_REALITY_V1_PASS_TOKEN);
    console.log('');
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
