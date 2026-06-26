/**
 * Workspace Reality Audit V1 — validation.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { materializeGeneratedApplication } from '../src/code-generation-engine/code-generation-engine-authority.js';
import { assessRequirementsToPlanExecutionContract } from '../src/requirements-to-plan-execution-contract/index.js';
import {
  WORKSPACE_REALITY_AUDIT_V1_PASS_TOKEN,
  WORKSPACE_REALITY_AUDIT_WORKSPACE_FILENAME,
  auditImportGraphReality,
  auditRegistryConsistency,
  auditRouteGraphReality,
  auditExportSafety,
  auditOrphanAndLeakage,
  auditMetadataConsistency,
  buildWorkspaceRealityAuditReport,
  workspaceRealityAuditTraceTitles,
} from '../src/workspace-reality-audit/index.js';
import { AIDEV_WORKSPACE_REALITY_AUDIT_FILENAME } from '../src/persistent-project-reality/persistent-project-reality-types.js';
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
import {
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
  summarizePrompt,
  validateUniversalAppMaterialization,
} from '../src/universal-prompt-to-app-materialization/index.js';
import { calculateMaterializationQualityScore } from '../src/materialization-quality-score/materialization-quality-score-calculator.js';
import type { GeneratedAppManifest } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';

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
  console.log('Workspace Reality Audit V1 — Validation');
  console.log('=======================================');
  console.log('');

  const testRoot = join(tmpdir(), `workspace-reality-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });

  try {
    const expensePrompt =
      'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, income, expenses, balance, spending reports, charts, and CSV export.';
    const expense = await materializeProfile(testRoot, expensePrompt, 'EXPENSE_TRACKER_WEB_V1', 'expense');

    assert(
      '01. Successful generated project passes workspace reality audit',
      expense.manifest.workspaceRealityAuditStatus !== 'FAIL' &&
        expense.manifest.workspaceRealityAuditScore >= 70 &&
        Boolean(expense.manifest.workspaceRealityAuditArtifactPath),
      `${expense.manifest.workspaceRealityAuditStatus} ${expense.manifest.workspaceRealityAuditScore}%`,
    );

    const sourceRoot = join(testRoot, expense.manifest.persistentProjectSourceRoot ?? expense.workspaceDir);
    const mainPath = join(sourceRoot, 'src/main.tsx');
    const mainBackup = readFileSync(mainPath, 'utf8');
    writeFileSync(mainPath, `${mainBackup}\nimport './missing-module.js';\n`, 'utf8');
    const afterMissingImport = auditImportGraphReality(sourceRoot);
    writeFileSync(mainPath, mainBackup, 'utf8');
    assert(
      '02. Missing import causes audit failure',
      afterMissingImport.missingImports.length > 0 && afterMissingImport.dimension.status === 'FAIL',
      afterMissingImport.missingImports[0] ?? 'none',
    );

    const registryPath = join(sourceRoot, 'src/features/registry.ts');
    const registryBackup = readFileSync(registryPath, 'utf8');
    writeFileSync(
      registryPath,
      registryBackup.replace(/sourcePath: 'src\/features\/income\/IncomeFeature\.tsx'/, "sourcePath: 'src/features/income/MissingFeature.tsx'"),
      'utf8',
    );
    const afterRegistry = auditRegistryConsistency(sourceRoot);
    writeFileSync(registryPath, registryBackup, 'utf8');
    assert(
      '03. Missing registry component causes audit failure',
      afterRegistry.dimension.status === 'FAIL',
      afterRegistry.dimension.failureReasons[0] ?? 'none',
    );

    const routesPath = join(sourceRoot, 'src/features/routes.ts');
    const routesBackup = readFileSync(routesPath, 'utf8');
    writeFileSync(routesPath, 'export const APP_ROUTES = [] as const;\n', 'utf8');
    const afterRoutes = auditRouteGraphReality(sourceRoot);
    writeFileSync(routesPath, routesBackup, 'utf8');
    assert(
      '04. Broken route causes audit failure',
      afterRoutes.brokenRoutes.length > 0 && afterRoutes.dimension.status === 'FAIL',
      afterRoutes.brokenRoutes[0] ?? 'none',
    );

    writeFileSync(
      registryPath,
      `${registryBackup}\n// duplicate\n${registryBackup.match(/\{\s*id: 'income'[\s\S]*?\},/)?.[0] ?? ''}`,
      'utf8',
    );
    const afterDupId = auditRegistryConsistency(sourceRoot);
    writeFileSync(registryPath, registryBackup, 'utf8');
    assert(
      '05. Duplicate feature id causes audit failure',
      afterDupId.duplicateModules.some((item) => item.includes('duplicate id')),
      afterDupId.duplicateModules.join(', ') || 'none',
    );

  const dupRouteRegistry = registryBackup.replace(
    /route: '\/reports'/,
    "route: '/income'",
  );
    writeFileSync(registryPath, dupRouteRegistry, 'utf8');
    const afterDupRoute = auditRegistryConsistency(sourceRoot);
    writeFileSync(registryPath, registryBackup, 'utf8');
    assert(
      '06. Duplicate route causes audit failure',
      afterDupRoute.duplicateModules.some((item) => item.includes('duplicate route')),
      afterDupRoute.duplicateModules.join(', ') || 'none',
    );

    const paths = persistentProjectPaths(testRoot, expense.projectId);
    const manifestBackup = existsSync(paths.manifest) ? readFileSync(paths.manifest, 'utf8') : null;
    if (existsSync(paths.manifest)) rmSync(paths.manifest, { force: true });
    const afterMissingMeta = auditMetadataConsistency({
      projectRootDir: testRoot,
      manifest: expense.manifest,
    });
    if (manifestBackup) writeFileSync(paths.manifest, manifestBackup, 'utf8');
    assert(
      '07. Missing metadata artifact causes audit failure',
      afterMissingMeta.dimension.status === 'FAIL',
      afterMissingMeta.staleMetadata.join(', ') || 'none',
    );

    writeFileSync(join(sourceRoot, '.generated-app-manifest.json'), '{}', 'utf8');
    const afterLeak = auditOrphanAndLeakage(sourceRoot);
    rmSync(join(sourceRoot, '.generated-app-manifest.json'), { force: true });
    assert(
      '08. Temporary artifact leakage causes audit failure',
      afterLeak.temporaryArtifactLeaks.includes('.generated-app-manifest.json') &&
        afterLeak.dimension.status === 'FAIL',
      afterLeak.temporaryArtifactLeaks.join(', ') || 'none',
    );

    const indexBackup = existsSync(paths.projectFileIndex)
      ? readFileSync(paths.projectFileIndex, 'utf8')
      : null;
    if (indexBackup) {
      const index = JSON.parse(indexBackup) as { sourceFiles: Array<{ relativePath: string }> };
      if (index.sourceFiles[0]) {
        index.sourceFiles[0] = { ...index.sourceFiles[0], relativePath: 'source/missing-file.tsx' };
      }
      writeFileSync(paths.projectFileIndex, JSON.stringify(index, null, 2), 'utf8');
      const afterIndex = auditMetadataConsistency({
        projectRootDir: testRoot,
        manifest: expense.manifest,
      });
      writeFileSync(paths.projectFileIndex, indexBackup, 'utf8');
      assert(
        '09. Project file index mismatch causes audit warning/failure',
        afterIndex.staleMetadata.some((item) => item.includes('mismatch')) ||
          afterIndex.dimension.status !== 'PASS',
        afterIndex.dimension.status,
      );
    } else {
      assert('09. Project file index mismatch causes audit warning/failure', false, 'index missing');
    }

    const exportBackup = existsSync(paths.exportMetadata) ? readFileSync(paths.exportMetadata, 'utf8') : null;
    if (exportBackup) {
      const exportMeta = JSON.parse(exportBackup) as { exportReady: boolean };
      exportMeta.exportReady = true;
      writeFileSync(paths.exportMetadata, JSON.stringify(exportMeta, null, 2), 'utf8');
      rmSync(join(sourceRoot, 'package.json'), { force: true });
      const afterExport = auditExportSafety({
        sourceRoot,
        projectRootDir: testRoot,
        manifest: expense.manifest,
      });
      if (existsSync(join(sourceRoot, 'package.json')) === false && manifestBackup) {
        writeFileSync(join(sourceRoot, 'package.json'), '{"name":"expense"}', 'utf8');
      }
      writeFileSync(paths.exportMetadata, exportBackup, 'utf8');
      assert(
        '10. Export safety issue causes audit warning/failure',
        afterExport.exportSafetyIssues.length > 0 || afterExport.dimension.status !== 'PASS',
        afterExport.exportSafetyIssues[0] ?? afterExport.dimension.status,
      );
    } else {
      assert('10. Export safety issue causes audit warning/failure', false, 'export metadata missing');
    }

    assert(
      '11. Manifest records audit evidence',
      expense.manifest.workspaceRealityAuditScore > 0 &&
        Boolean(expense.manifest.workspaceRealityAuditArtifactPath) &&
        Boolean(expense.manifest.workspaceRealityRecordedAt),
      `${expense.manifest.workspaceRealityAuditScore}%`,
    );

    const persistentArtifact = join(paths.aidev, AIDEV_WORKSPACE_REALITY_AUDIT_FILENAME);
    assert(
      '12. Persistent project stores audit artifact',
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
    for (const title of workspaceRealityAuditTraceTitles()) {
      assert(`13. execution trace includes "${title}"`, traceTitles.includes(title), title);
    }

    const scorePass = calculateMaterializationQualityScore({
      projectRootDir: testRoot,
      workspaceDir: expense.workspaceDir,
      manifest: expense.manifest,
    }).overallScore;
    const scoreFail = calculateMaterializationQualityScore({
      projectRootDir: testRoot,
      workspaceDir: expense.workspaceDir,
      manifest: { ...expense.manifest, workspaceRealityAuditStatus: 'FAIL' },
    }).overallScore;
    assert(
      '14. Quality score integrates audit result',
      scorePass > scoreFail && expense.manifest.workspaceRealityAuditStatus !== 'FAIL',
      `pass=${scorePass} fail=${scoreFail}`,
    );

    const chatSummary = materializationEvidenceSummaryForChat(expense.manifest);
    const workspaceEvidence = chatSummary?.workspaceRealityAuditEvidence as Record<string, unknown> | undefined;
    assert(
      '15. Chat summary uses workspace audit artifact',
      Boolean(workspaceEvidence) &&
        typeof workspaceEvidence!.chatSummary === 'string' &&
        (workspaceEvidence!.chatSummary as string).includes('Workspace Reality Audit'),
      String(workspaceEvidence?.chatSummary ?? 'missing'),
    );

    const passTokenOk = expense.manifest.workspaceRealityAuditStatus === 'PASS' ||
      expense.manifest.workspaceRealityAuditStatus === 'WARN';
    assert(
      'PASS token',
      passTokenOk,
      WORKSPACE_REALITY_AUDIT_V1_PASS_TOKEN,
    );

    const artifactPath = join(expense.workspaceDir, WORKSPACE_REALITY_AUDIT_WORKSPACE_FILENAME);
    assert(
      'Workspace artifact on disk',
      existsSync(artifactPath),
      artifactPath,
    );
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }

  console.log('');
  let failed = 0;
  for (const check of results) {
    const icon = check.passed ? '✓' : '✗';
    console.log(`${icon} ${check.name}`);
    if (!check.passed) {
      failed += 1;
      console.log(`  → ${check.detail}`);
    }
  }
  console.log('');
  console.log(`${results.length - failed}/${results.length} checks passed`);
  if (failed > 0) process.exit(1);
  console.log('');
  console.log(WORKSPACE_REALITY_AUDIT_V1_PASS_TOKEN);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
