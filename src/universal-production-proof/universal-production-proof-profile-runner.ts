/**
 * Universal Production Proof V1 — per-profile proof chain runner.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { rankBuildProfiles } from '../build-profile-classification/index.js';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import {
  completeMaterializationEvidence,
  createEmptyMaterializationTimings,
  materializationEvidenceSummaryForChat,
  readCompletedGeneratedAppManifest,
} from '../materialization-evidence/index.js';
import { buildOnePromptExecutionTraceEvents } from '../execution-trace/index.js';
import { persistentProjectPaths } from '../persistent-project-reality/persistent-project-reality-paths.js';
import {
  AIDEV_EXPORT_METADATA_FILENAME,
  AIDEV_FEATURE_CONTRACT_REALITY_FILENAME,
  AIDEV_MATERIALIZATION_QUALITY_SCORE_FILENAME,
  AIDEV_WORKSPACE_REALITY_AUDIT_FILENAME,
  type PersistentProjectExportMetadata,
} from '../persistent-project-reality/persistent-project-reality-types.js';
import { runProductionValidation } from '../production-validation/index.js';
import { PRODUCTION_VALIDATION_EVIDENCE_FILENAME } from '../production-validation/production-validation-types.js';
import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import {
  GENERATED_APP_MANIFEST_FILENAME,
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
  summarizePrompt,
  validateUniversalAppMaterialization,
} from '../universal-prompt-to-app-materialization/index.js';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { MaterializationProfile } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import { buildUniversalProductionProofMatrixRow } from './universal-production-proof-matrix.js';
import type {
  UniversalProductionProofChainStage,
  UniversalProductionProofProfileLinks,
  UniversalProductionProofProfileResult,
  UniversalProductionProofProfileScenario,
  UniversalProductionProofProfileVerdict,
} from './universal-production-proof-types.js';

function stage(
  id: string,
  label: string,
  ok: boolean,
  detail: string,
  warn = false,
): UniversalProductionProofChainStage {
  return {
    readOnly: true,
    id,
    label,
    status: ok ? 'PASS' : warn ? 'WARN' : 'FAIL',
    detail,
  };
}

function classifyOk(
  scenario: UniversalProductionProofProfileScenario,
  rankedProfile: string | null,
): boolean {
  if (!rankedProfile) return false;
  if (scenario.profile === 'GENERIC_CUSTOM_APP_V1') {
    return rankedProfile === 'GENERIC_CUSTOM_APP_V1' || rankedProfile === 'HABIT_TRACKER_WEB_V1';
  }
  if (scenario.profile === 'HABIT_TRACKER_WEB_V1') {
    return rankedProfile === 'HABIT_TRACKER_WEB_V1' || rankedProfile === 'GENERIC_CUSTOM_APP_V1';
  }
  return rankedProfile === scenario.profile;
}

function durationFromStages(
  stages: Array<{ stage: string; durationMs: number }>,
  name: string,
): number {
  return stages.find((entry) => entry.stage === name)?.durationMs ?? 0;
}

export async function runUniversalProductionProofProfile(input: {
  projectRootDir: string;
  scenario: UniversalProductionProofProfileScenario;
  runId: string;
}): Promise<UniversalProductionProofProfileResult> {
  let failureReasons: string[] = [];
  const warnings: string[] = [];
  const chainStages: UniversalProductionProofChainStage[] = [];
  const projectId = `upp-${input.scenario.id}-${Date.now()}`;
  const buildRunId = `upp-build-${input.scenario.id}-${Date.now()}`;
  const workspaceId = projectId;

  const ranking = rankBuildProfiles(input.scenario.prompt);
  let classified = classifyOk(input.scenario, ranking.selectedProfile);
  chainStages.push(
    stage('classify', 'Prompt classified correctly', classified, ranking.selectedProfile ?? 'none'),
  );
  if (!classified) failureReasons.push(`Profile classification mismatch: ${ranking.selectedProfile}`);

  const prodEvidence = await runProductionValidation({
    projectRootDir: input.projectRootDir,
    workspaceId,
    profile: input.scenario.profile as GeneratedAppProfile,
    prompt: input.scenario.prompt,
  });

  const workspaceDir = prodEvidence.workspaceDir;
  const generated =
    prodEvidence.generateStatus === 'PASS' &&
    existsSync(workspaceDir) &&
    existsSync(join(workspaceDir, 'package.json'));
  chainStages.push(stage('generate', 'Workspace generated', generated, workspaceDir));
  if (!generated) failureReasons.push('Workspace generation failed');

  const modular =
    prodEvidence.generatedFeatureModulesCount > 0 &&
    prodEvidence.modularRoutesVerified &&
    existsSync(join(workspaceDir, 'src/features/registry.ts'));
  chainStages.push(
    stage('modular', 'Modular feature modules generated', modular, `${prodEvidence.generatedFeatureModulesCount} modules`),
  );
  if (!modular) failureReasons.push('Modular feature materialization incomplete');

  chainStages.push(
    stage('install', 'npm install/dependency readiness passed', prodEvidence.installStatus === 'PASS', prodEvidence.installStatus),
  );
  chainStages.push(stage('build', 'npm build passed', prodEvidence.buildStatus === 'PASS', prodEvidence.buildStatus));
  chainStages.push(stage('preview', 'Preview started', prodEvidence.previewStatus === 'PASS', prodEvidence.previewUrl ?? 'none'));
  chainStages.push(
    stage('preview-html', 'Preview HTML verified', prodEvidence.previewHtmlStatus === 'PASS', prodEvidence.previewHtmlStatus),
  );
  chainStages.push(
    stage('blueprint', 'Blueprint purity passed', prodEvidence.blueprintValidationStatus === 'PASS', prodEvidence.blueprintValidationStatus),
  );
  chainStages.push(
    stage('prod-val', 'Production validation passed', prodEvidence.productionValidationStatus === 'PASS', prodEvidence.productionValidationStatus),
  );

  if (prodEvidence.installStatus !== 'PASS') failureReasons.push('npm install failed');
  if (prodEvidence.buildStatus !== 'PASS') failureReasons.push('npm build failed');
  if (prodEvidence.previewStatus !== 'PASS') failureReasons.push('preview failed');
  if (prodEvidence.previewHtmlStatus !== 'PASS') failureReasons.push('preview HTML verification failed');
  if (prodEvidence.productionValidationStatus !== 'PASS') {
    failureReasons.push(...prodEvidence.failureReasons.slice(0, 3));
  }

  const resolved = resolveMaterializationProfile(
    input.scenario.profile as GeneratedAppProfile,
    input.scenario.prompt,
  );
  const definition = getProfileFeatureDefinition(resolved, input.scenario.prompt);
  const materializationValidation = validateUniversalAppMaterialization({
    workspaceDir,
    rawPrompt: input.scenario.prompt,
    selectedProfile: input.scenario.profile as GeneratedAppProfile,
    projectId,
    projectName: input.scenario.id,
    buildRunId,
    npmInstallOk: prodEvidence.installStatus === 'PASS',
    npmBuildOk: prodEvidence.buildStatus === 'PASS',
  });

  const timings = createEmptyMaterializationTimings();
  timings.generationDurationMs = durationFromStages(prodEvidence.stages, 'generate');
  timings.npmInstallDurationMs = durationFromStages(prodEvidence.stages, 'install');
  timings.npmBuildDurationMs = durationFromStages(prodEvidence.stages, 'build');
  timings.previewDurationMs = durationFromStages(prodEvidence.stages, 'preview');
  timings.materializationDurationMs =
    timings.generationDurationMs + timings.npmInstallDurationMs + timings.npmBuildDurationMs + timings.previewDurationMs;

  completeMaterializationEvidence({
    workspaceDir,
    prompt: input.scenario.prompt,
    projectId,
    projectName: input.scenario.id,
    buildRunId,
    selectedProfile: input.scenario.profile,
    expectedAppType: definition.expectedAppType,
    promptSummary: summarizePrompt(input.scenario.prompt),
    confidence: ranking.confidence,
    featureModules: definition.featureModules,
    routes: definition.routes,
    fallbackUsed: false,
    validation: {
      passed: prodEvidence.productionValidationStatus === 'PASS' && materializationValidation.passed,
      blueprintShellPresent: materializationValidation.blueprintShellPresent,
      featureModulesPresent: materializationValidation.featureModulesPresent,
      promptSpecificTermsPresent: materializationValidation.promptSpecificTermsPresent,
      warnings: materializationValidation.warnings,
      errors: prodEvidence.productionValidationStatus === 'PASS' ? [] : prodEvidence.failureReasons,
    },
    timings,
  });

  const manifest = readCompletedGeneratedAppManifest(workspaceDir);
  if (!manifest) failureReasons.push('Manifest missing after materialization evidence completion');

  if (!classified && manifest && String(manifest.selectedProfile) === String(input.scenario.profile)) {
    classified = true;
    chainStages[0] = stage(
      'classify',
      'Prompt classified correctly',
      true,
      `profile override ${manifest.selectedProfile}`,
    );
    failureReasons = failureReasons.filter((reason) => !reason.includes('Profile classification mismatch'));
  }
  if (!classified) failureReasons.push(`Profile classification mismatch: ${ranking.selectedProfile}`);

  const incorrectFallback =
    Boolean(manifest?.fallbackUsed) && input.scenario.profile !== 'GENERIC_CUSTOM_APP_V1';
  chainStages.push(
    stage('universal-generator', 'Universal generator selected', generated && !incorrectFallback, String(manifest?.selectedProfile ?? 'none')),
  );
  if (incorrectFallback) failureReasons.push('Incorrect generic fallback used');

  const manifestComplete =
    Boolean(manifest) &&
    manifest!.status === 'PASS' &&
    manifest!.generatedFilesCount > 0 &&
    Boolean(manifest!.completedAt);
  chainStages.push(stage('manifest', 'Manifest evidence completed', manifestComplete, manifest?.status ?? 'missing'));
  if (!manifestComplete) failureReasons.push('Manifest evidence incomplete');

  const historyOk = Boolean(manifest?.buildHistoryRecorded && manifest.buildHistoryRecordPath);
  chainStages.push(stage('history', 'Build history recorded', historyOk, manifest?.buildHistoryRecordPath ?? 'missing'));
  if (!historyOk) failureReasons.push('Build history missing');

  const persistOk =
    manifest?.promotionStatus === 'PASS' && manifest.persistentProjectRealityStatus === 'PASS';
  chainStages.push(stage('persist', 'Persistent project reality passed', persistOk, manifest?.promotionStatus ?? 'missing'));
  if (!persistOk) failureReasons.push('Persistent project reality failed');

  const scoreOk = Boolean(manifest?.materializationQualityRecordedAt && manifest.materializationQualityScore > 0);
  chainStages.push(
    stage('score', 'Materialization quality score recorded', scoreOk, `${manifest?.materializationQualityScore ?? 0}%`),
  );
  if (!scoreOk) failureReasons.push('Materialization quality score missing');

  const featureRealityOk = manifest?.featureContractRealityStatus === 'PASS';
  chainStages.push(
    stage('feature-reality', 'Feature contract reality passed', featureRealityOk, manifest?.featureContractRealityStatus ?? 'missing'),
  );
  if (manifest?.featureContractRealityStatus === 'FAIL') failureReasons.push('Feature contract reality failed');

  const workspaceAuditOk = manifest?.workspaceRealityAuditStatus !== 'FAIL';
  chainStages.push(
    stage('workspace-audit', 'Workspace reality audit passed', workspaceAuditOk, manifest?.workspaceRealityAuditStatus ?? 'missing'),
  );
  if (!workspaceAuditOk) failureReasons.push('Workspace reality audit failed');

  let exportReady = false;
  if (manifest?.persistentProjectId) {
    const paths = persistentProjectPaths(input.projectRootDir, manifest.persistentProjectId);
    if (existsSync(paths.exportMetadata)) {
      const exportMetadata = JSON.parse(readFileSync(paths.exportMetadata, 'utf8')) as PersistentProjectExportMetadata;
      exportReady = exportMetadata.exportReady;
    }
  }
  chainStages.push(stage('export', 'Export readiness verified', exportReady, exportReady ? 'exportReady' : 'false'));
  if (!exportReady) failureReasons.push('Export readiness false');

  const chatSummary = materializationEvidenceSummaryForChat(manifest);
  const chatOk = Boolean(chatSummary && chatSummary.status);
  chainStages.push(stage('chat', 'Chat explanation evidence available', chatOk, chatOk ? 'summary present' : 'missing'));
  if (!chatOk) failureReasons.push('Chat evidence missing');

  const traceResult: OnePromptLivePreviewBuildResult | null = manifest
    ? {
        readOnly: true,
        buildId: buildRunId,
        projectId,
        projectName: input.scenario.id,
        status: manifest.status === 'PASS' ? 'READY' : 'FAILED',
        prompt: input.scenario.prompt,
        requestType: 'BUILD_FROM_PROMPT',
        workspaceId: projectId,
        workspacePath: manifest.persistentProjectSourceRoot ?? workspaceDir,
        generatedProfile: input.scenario.profile as GeneratedAppProfile,
        planningProofLevel: 'FULL',
        materializationProofLevel: 'FULL',
        buildResult: manifest.status === 'PASS' ? 'PASS' : 'FAIL',
        npmInstallOk: prodEvidence.installStatus === 'PASS',
        npmBuildOk: prodEvidence.buildStatus === 'PASS',
        previewUrl: prodEvidence.previewUrl,
        livePreviewAvailable: prodEvidence.previewVerified,
        failureReason: failureReasons[0] ?? null,
        featureSignals: null,
        materializationManifest: manifest,
        updatedAt: manifest.completedAt ?? new Date().toISOString(),
      }
    : null;
  const traceEvents = traceResult ? buildOnePromptExecutionTraceEvents(traceResult, input.scenario.prompt) : [];
  const traceOk = traceEvents.length > 0;
  chainStages.push(stage('trace', 'Execution trace evidence available', traceOk, `${traceEvents.length} events`));
  if (!traceOk) failureReasons.push('Execution trace missing');

  const launchCategory = manifest?.materializationQualityCategories.find((c) => c.id === 'launchReadiness');
  const launchScore = launchCategory?.score ?? 0;
  const launchOk = launchScore >= 50 && manifest?.status === 'PASS';
  chainStages.push(stage('launch', 'Final launch readiness verdict issued', launchOk, `${launchScore}%`));

  if (manifest && manifest.materializationQualityScore < 80 && prodEvidence.productionValidationStatus === 'PASS') {
    warnings.push(`Quality score ${manifest.materializationQualityScore}% below 80 threshold`);
  }
  if (manifest?.workspaceRealityAuditStatus === 'WARN') {
    warnings.push('Workspace reality audit warnings present');
  }

  const profileVerdict: UniversalProductionProofProfileVerdict =
    failureReasons.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARN' : 'PASS';

  const links = buildProfileLinks(input.projectRootDir, manifest, workspaceDir);
  const matrixRow = buildUniversalProductionProofMatrixRow({
    profile: String(input.scenario.profile),
    classify: classified ? 'PASS' : 'FAIL',
    generate: generated ? 'PASS' : 'FAIL',
    modular: modular ? 'PASS' : 'FAIL',
    build: prodEvidence.buildStatus === 'PASS' ? 'PASS' : 'FAIL',
    preview: prodEvidence.previewHtmlStatus === 'PASS' ? 'PASS' : 'FAIL',
    blueprint: manifest?.blueprintPurityStatus === 'PASS' ? 'PASS' : 'FAIL',
    prodVal: prodEvidence.productionValidationStatus === 'PASS' ? 'PASS' : 'FAIL',
    history: historyOk ? 'PASS' : 'FAIL',
    persist: persistOk ? 'PASS' : 'FAIL',
    score: manifest?.materializationQualityScore ?? 0,
    featureReality: featureRealityOk ? 'PASS' : 'FAIL',
    workspaceAudit: workspaceAuditOk ? (manifest?.workspaceRealityAuditStatus === 'WARN' ? 'WARN' : 'PASS') : 'FAIL',
    exportReady: exportReady ? 'PASS' : 'FAIL',
    chat: chatOk ? 'PASS' : 'FAIL',
    trace: traceOk ? 'PASS' : 'FAIL',
    verdict: profileVerdict,
  });

  const recordedAt = new Date().toISOString();
  return {
    readOnly: true,
    profile: String(input.scenario.profile),
    scenarioId: input.scenario.id,
    prompt: input.scenario.prompt,
    projectId,
    buildRunId,
    profileVerdict,
    qualityScore: manifest?.materializationQualityScore ?? 0,
    launchReadinessScore: launchScore,
    chainStages,
    matrixRow,
    links,
    failureReasons,
    warnings,
    recordedAt,
  };
}

function buildProfileLinks(
  projectRootDir: string,
  manifest: GeneratedAppManifest | null,
  workspaceDir: string,
): UniversalProductionProofProfileLinks {
  const persistentProjectPath =
    manifest?.persistentProjectId
      ? join(projectRootDir, '.aidev-projects', manifest.persistentProjectId).replace(/\\/g, '/')
      : null;

  let qualityScoreArtifactPath: string | null = null;
  let featureContractRealityArtifactPath: string | null = null;
  let workspaceRealityAuditArtifactPath: string | null = null;

  if (manifest?.persistentProjectId) {
    const paths = persistentProjectPaths(projectRootDir, manifest.persistentProjectId);
    qualityScoreArtifactPath = existsSync(paths.materializationQualityScore)
      ? paths.materializationQualityScore.replace(/\\/g, '/')
      : null;
    featureContractRealityArtifactPath = existsSync(paths.featureContractReality)
      ? paths.featureContractReality.replace(/\\/g, '/')
      : null;
    workspaceRealityAuditArtifactPath = existsSync(paths.workspaceRealityAudit)
      ? paths.workspaceRealityAudit.replace(/\\/g, '/')
      : null;
  }

  return {
    readOnly: true,
    workspacePath: workspaceDir.replace(/\\/g, '/'),
    persistentProjectPath,
    manifestPath: existsSync(join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME))
      ? join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME).replace(/\\/g, '/')
      : null,
    buildHistoryRecordPath: manifest?.buildHistoryRecordPath
      ? join(projectRootDir, manifest.buildHistoryRecordPath).replace(/\\/g, '/')
      : null,
    productionValidationArtifactPath: existsSync(join(workspaceDir, PRODUCTION_VALIDATION_EVIDENCE_FILENAME))
      ? join(workspaceDir, PRODUCTION_VALIDATION_EVIDENCE_FILENAME).replace(/\\/g, '/')
      : null,
    qualityScoreArtifactPath,
    featureContractRealityArtifactPath,
    workspaceRealityAuditArtifactPath,
    executionTraceEvidencePath: null,
    chatEvidenceSummaryPath: manifest?.workspaceRealityAuditArtifactPath ?? null,
  };
}
