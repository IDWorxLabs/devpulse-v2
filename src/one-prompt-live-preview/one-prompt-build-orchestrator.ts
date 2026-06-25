/**
 * One-prompt build orchestrator — planning → materialization → build → live preview.
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { getDevPulseV2AiDevEngineAuthority } from '../aidev-engine/aidev-engine-authority.js';
import {
  isTaskTrackerAppSource,
  isTaskTrackerFeatureSource,
  isTaskTrackerMountEntry,
  materializeGeneratedApplication,
  resolveGeneratedAppProfile,
  TASK_TRACKER_FEATURE_RELATIVE_PATH,
} from '../code-generation-engine/index.js';
import {
  materializeBuildProofGapArtifacts,
} from '../connected-build-execution/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import {
  assessRequirementsToPlanExecutionContract,
} from '../requirements-to-plan-execution-contract/index.js';
import { createPreviewSession } from '../live-preview-runtime/preview-session-manager.js';
import { isOnePromptBuildRequest, resolveBuildIntentProfile } from './build-request-detector.js';
import {
  getActiveGeneratedDevServerState,
  listGeneratedDevServers,
  startGeneratedAppDevServer,
} from './generated-dev-server-manager.js';
import type {
  OnePromptLivePreviewBuildInput,
  OnePromptLivePreviewBuildResult,
  OnePromptLivePreviewPublicState,
} from './one-prompt-live-preview-types.js';
import {
  recordBuildIntentRun,
} from '../build-intent-routing/build-intent-run-store.js';
import { resolveProjectRegistryRootDir } from '../project-registry-v1/project-registry-v1-store.js';
import { upsertProjectContextMetadata } from '../project-context-alignment-v1/project-context-metadata-store.js';
import { assertWorkspacePathBelongsToProject } from '../project-isolation-guard-v1/index.js';
import {
  validateUniversalAppMaterialization,
  type MaterializationValidationResult,
} from '../universal-prompt-to-app-materialization/index.js';
import { rankBuildProfiles } from '../build-profile-classification/index.js';
import {
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
} from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import { summarizePrompt } from '../universal-prompt-to-app-materialization/prompt-app-metadata.js';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import {
  completeMaterializationEvidence,
  createEmptyMaterializationTimings,
  extractExecCommandFailure,
  finalizeForensicManifestFailure,
  initializeForensicManifest,
  roundDurationMs,
  updateForensicManifestStage,
} from '../materialization-evidence/index.js';
import type { ForensicBuildStage, ForensicManifestFailureInput } from '../materialization-evidence/forensic-manifest-types.js';
import { performance } from 'node:perf_hooks';
import {
  getActiveProjectId,
  getBuildResultForProject,
  registerProjectBuildResult,
  resetWorkspaceTabRegistryForTests,
  resolveProjectContext,
} from './workspace-tab-registry.js';

let buildCounter = 0;

export function resetOnePromptLivePreviewForTests(): void {
  buildCounter = 0;
  resetWorkspaceTabRegistryForTests();
}

export function getLastOnePromptLivePreviewBuildResult(
  projectId?: string | null,
): OnePromptLivePreviewBuildResult | null {
  const resolvedProjectId = projectId ?? getActiveProjectId();
  if (resolvedProjectId) {
    return getBuildResultForProject(resolvedProjectId);
  }
  return null;
}

function nextBuildId(): string {
  buildCounter += 1;
  return `one-prompt-build-${buildCounter}`;
}

function inspectFeatureSignals(workspaceDir: string): OnePromptLivePreviewBuildResult['featureSignals'] {
  const appPath = join(workspaceDir, 'src/App.tsx');
  const mainPath = join(workspaceDir, 'src/main.tsx');
  const appSource = existsSync(appPath) ? readFileSync(appPath, 'utf8') : '';
  const mainSource = existsSync(mainPath) ? readFileSync(mainPath, 'utf8') : '';
  const lower = appSource.toLowerCase();
  return {
    addTask: /handleaddtask|add task|add-task-button/.test(lower),
    markComplete: /handleToggleComplete|complete-toggle|mark.*complete/.test(lower),
    deleteTask: /handleDeleteTask|delete-task-button|delete task/.test(lower),
    filter: /taskfilter|filter-all|filter-active|filter-completed/.test(lower),
    activeCount: /activecount|active-count/.test(lower),
    reactMount: isTaskTrackerMountEntry(mainSource),
  };
}

function composeFailureResult(input: {
  buildId: string;
  projectId: string;
  projectName: string;
  prompt: string;
  source: OnePromptLivePreviewBuildInput['source'];
  failureReason: string;
  workspaceId?: string | null;
  workspacePath?: string | null;
  generatedProfile?: OnePromptLivePreviewBuildResult['generatedProfile'];
  planningProofLevel?: string | null;
  materializationProofLevel?: string | null;
  npmInstallOk?: boolean;
  npmBuildOk?: boolean;
  materializationManifest?: GeneratedAppManifest | null;
}): OnePromptLivePreviewBuildResult {
  return {
    readOnly: true,
    buildId: input.buildId,
    projectId: input.projectId,
    projectName: input.projectName,
    status: 'FAILED',
    prompt: input.prompt,
    requestType: input.source === 'chat' ? 'CHAT_BUILD' : 'BUILD_FROM_PROMPT',
    workspaceId: input.workspaceId ?? null,
    workspacePath: input.workspacePath ?? null,
    generatedProfile: input.generatedProfile ?? null,
    planningProofLevel: input.planningProofLevel ?? null,
    materializationProofLevel: input.materializationProofLevel ?? null,
    buildResult: 'FAIL',
    npmInstallOk: input.npmInstallOk ?? false,
    npmBuildOk: input.npmBuildOk ?? false,
    previewUrl: null,
    livePreviewAvailable: false,
    failureReason: input.failureReason,
    featureSignals: null,
    materializationManifest: input.materializationManifest ?? null,
    updatedAt: new Date().toISOString(),
  };
}

function registerFailedBuild(input: {
  projectId: string;
  projectName: string;
  workspaceDir: string;
  failure: ForensicManifestFailureInput;
  result: Parameters<typeof composeFailureResult>[0];
}): OnePromptLivePreviewBuildResult {
  const manifest = finalizeForensicManifestFailure(input.workspaceDir, input.failure);
  return registerBuildOutcome(input.projectId, input.projectName, {
    ...composeFailureResult(input.result),
    materializationManifest: manifest,
  });
}

function touchForensicStage(
  workspaceDir: string,
  update: Parameters<typeof updateForensicManifestStage>[1],
): void {
  updateForensicManifestStage(workspaceDir, update);
}

function inspectUniversalFeatureSignals(
  workspaceDir: string,
  prompt: string,
  generatedProfile: OnePromptLivePreviewBuildResult['generatedProfile'],
  projectId: string,
  projectName: string,
  buildId: string,
): MaterializationValidationResult {
  return validateUniversalAppMaterialization({
    workspaceDir,
    rawPrompt: prompt,
    selectedProfile: generatedProfile,
    projectId,
    projectName,
    buildRunId: buildId,
  });
}

function persistBuildIntentRun(input: {
  buildRunId: string;
  projectId: string;
  projectName: string;
  prompt: string;
  profile: string | null;
  status: 'BUILDING' | 'READY' | 'FAILED' | 'QUEUED';
  stage: string;
  workspacePath: string | null;
  previewUrl: string | null;
  planTaskCount: number | null;
  architectureSummary: string | null;
  failureReason: string | null;
  projectRootDir: string;
  createdAt?: string;
}): void {
  const stamp = new Date().toISOString();
  recordBuildIntentRun(
    {
      readOnly: true,
      buildRunId: input.buildRunId,
      projectId: input.projectId,
      projectName: input.projectName,
      prompt: input.prompt,
      profile: input.profile,
      status: input.status,
      stage: input.stage,
      workspacePath: input.workspacePath,
      previewUrl: input.previewUrl,
      activeProjectId: input.projectId,
      planTaskCount: input.planTaskCount,
      architectureSummary: input.architectureSummary,
      failureReason: input.failureReason,
      createdAt: input.createdAt ?? stamp,
      updatedAt: stamp,
    },
    input.projectRootDir,
  );
}

function registerBuildOutcome(
  projectId: string,
  projectName: string,
  build: OnePromptLivePreviewBuildResult,
  devServerPort?: number | null,
): OnePromptLivePreviewBuildResult {
  registerProjectBuildResult({
    projectId,
    projectName,
    build,
    devServerPort: devServerPort ?? null,
  });
  return build;
}

export async function runOnePromptLivePreviewBuild(
  input: OnePromptLivePreviewBuildInput,
): Promise<OnePromptLivePreviewBuildResult> {
  const buildId = nextBuildId();
  const prompt = input.rawPrompt.trim();
  const source = input.source ?? 'api';
  const projectContext = resolveProjectContext({
    projectId: input.projectId,
    projectName: input.projectName,
    createIfMissing: true,
  });
  const { projectId, projectName } = projectContext;
  const resolvedProfile =
    resolveBuildIntentProfile(prompt) ?? resolveGeneratedAppProfile(prompt);

  const workspaceRel = `${GENERATED_BUILDER_WORKSPACES_DIR}/${projectId}`.replace(/\\/g, '/');
  assertWorkspacePathBelongsToProject(workspaceRel, projectId);
  const workspaceDir = join(input.projectRootDir, workspaceRel);
  mkdirSync(workspaceDir, { recursive: true });

  const ranking = rankBuildProfiles(prompt);
  const materializationProfile = resolveMaterializationProfile(
    resolvedProfile ?? 'GENERIC_CUSTOM_APP_V1',
    prompt,
  );
  const definition = getProfileFeatureDefinition(materializationProfile, prompt);

  if (!isOnePromptBuildRequest(prompt) && !resolvedProfile) {
    initializeForensicManifest({
      workspaceDir,
      workspacePath: workspaceRel,
      projectId,
      projectName,
      buildRunId: buildId,
      prompt,
      selectedProfile: String(materializationProfile),
      expectedAppType: definition.expectedAppType,
      promptSummary: summarizePrompt(prompt),
      confidence: ranking.confidence,
      featureModules: definition.featureModules,
      routes: definition.routes,
      fallbackUsed: Boolean(ranking.fallbackReason),
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'PROFILE_SELECTED',
        failureReason:
          'Build intent detected but no supported application profile matched this prompt. Add product type details (e.g. expense tracker, CRM, task tracker).',
        status: 'ABORTED',
        lastSuccessfulStage: 'STARTED',
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason:
          'Build intent detected but no supported application profile matched this prompt. Add product type details (e.g. expense tracker, CRM, task tracker).',
        workspaceId: projectId,
        workspacePath: workspaceRel,
      },
    });
  }

  const buildStartedAt = performance.now();
  const timings = createEmptyMaterializationTimings();
  let lastSuccessfulStage: ForensicBuildStage = 'STARTED';

  initializeForensicManifest({
    workspaceDir,
    workspacePath: workspaceRel,
    projectId,
    projectName,
    buildRunId: buildId,
    prompt,
    selectedProfile: String(resolvedProfile),
    expectedAppType: definition.expectedAppType,
    promptSummary: summarizePrompt(prompt),
    confidence: ranking.confidence,
    featureModules: definition.featureModules,
    routes: definition.routes,
    fallbackUsed: Boolean(ranking.fallbackReason),
  });
  touchForensicStage(workspaceDir, { stage: 'PROMPT_RECEIVED' });
  touchForensicStage(workspaceDir, {
    stage: 'PROFILE_SELECTED',
    selectedProfile: String(resolvedProfile),
    confidence: ranking.confidence,
  });
  lastSuccessfulStage = 'PROFILE_SELECTED';

  try {
  persistBuildIntentRun({
    buildRunId: buildId,
    projectId,
    projectName,
    prompt,
    profile: resolvedProfile,
    status: 'BUILDING',
    stage: 'PLANNING',
    workspacePath: null,
    previewUrl: null,
    planTaskCount: null,
    architectureSummary: null,
    failureReason: null,
    projectRootDir: resolveProjectRegistryRootDir(),
  });

  registerProjectBuildResult({
    projectId,
    projectName,
    build: {
      readOnly: true,
      buildId,
      projectId,
      projectName,
      status: 'BUILDING',
      prompt,
      requestType: source === 'chat' ? 'CHAT_BUILD' : 'BUILD_FROM_PROMPT',
      workspaceId: null,
      workspacePath: null,
      generatedProfile: resolvedProfile,
      planningProofLevel: null,
      materializationProofLevel: null,
      buildResult: null,
      npmInstallOk: false,
      npmBuildOk: false,
      previewUrl: null,
      livePreviewAvailable: false,
      failureReason: null,
      featureSignals: null,
      materializationManifest: null,
      updatedAt: new Date().toISOString(),
    },
  });

  const aidev = getDevPulseV2AiDevEngineAuthority();
  aidev.intakeBuildRequest(prompt);

  const contractAssessment = assessRequirementsToPlanExecutionContract({ rawPrompt: prompt });
  timings.planningDurationMs = roundDurationMs(buildStartedAt);
  const contract = contractAssessment.report.buildReadyContract;
  const planTaskCount = contractAssessment.report.planContract?.tasks.length ?? null;
  const architectureSummary = contract
    ? `Build-ready contract with ${contract.buildUnits.length} units and ${planTaskCount ?? 0} plan tasks`
    : null;

  persistBuildIntentRun({
    buildRunId: buildId,
    projectId,
    projectName,
    prompt,
    profile: resolvedProfile,
    status: contract ? 'BUILDING' : 'FAILED',
    stage: contract ? 'MATERIALIZATION' : 'PLANNING',
    workspacePath: null,
    previewUrl: null,
    planTaskCount,
    architectureSummary,
    failureReason: contract ? null : 'Planning did not produce a build-ready contract',
    projectRootDir: resolveProjectRegistryRootDir(),
  });

  if (!contract) {
    touchForensicStage(workspaceDir, {
      stage: 'PLANNING',
      durationMs: timings.planningDurationMs,
      timingsPatch: { planningDurationMs: timings.planningDurationMs },
      errors: ['Planning did not produce a build-ready contract'],
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'PLANNING',
        failureReason: 'Planning did not produce a build-ready contract',
        lastSuccessfulStage,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: 'Planning did not produce a build-ready contract',
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: resolvedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
      },
    });
  }

  touchForensicStage(workspaceDir, {
    stage: 'PLANNING',
    durationMs: timings.planningDurationMs,
    timingsPatch: { planningDurationMs: timings.planningDurationMs },
  });
  lastSuccessfulStage = 'PLANNING';

  touchForensicStage(workspaceDir, { stage: 'WORKSPACE_CREATED' });
  lastSuccessfulStage = 'WORKSPACE_CREATED';

  const materializationRoot = input.projectRootDir;

  const materializationStartedAt = performance.now();
  const materialization = materializeBuildProofGapArtifacts({
    projectRootDir: materializationRoot,
    contract: { ...contract, contractId: projectId },
    rawPrompt: prompt,
  });

  const engineResult = materializeGeneratedApplication({
    projectRootDir: materializationRoot,
    workspaceId: projectId,
    contract: { ...contract, contractId: projectId },
    rawPrompt: prompt,
    profileOverride: resolvedProfile,
  });
  timings.materializationDurationMs = roundDurationMs(materializationStartedAt);
  timings.fileGenerationDurationMs = timings.materializationDurationMs;
  timings.generationDurationMs = timings.materializationDurationMs;

  if (!engineResult.generated || !engineResult.profile) {
    const failureReason =
      engineResult.skippedReason ?? 'Code Generation Engine V1 did not materialize application files';
    touchForensicStage(workspaceDir, {
      stage: 'MATERIALIZATION',
      durationMs: timings.materializationDurationMs,
      timingsPatch: {
        materializationDurationMs: timings.materializationDurationMs,
        fileGenerationDurationMs: timings.fileGenerationDurationMs,
        generationDurationMs: timings.generationDurationMs,
      },
      errors: [failureReason],
    });
    persistBuildIntentRun({
      buildRunId: buildId,
      projectId,
      projectName,
      prompt,
      profile: resolvedProfile,
      status: 'FAILED',
      stage: 'MATERIALIZATION',
      workspacePath: workspaceRel,
      previewUrl: null,
      planTaskCount,
      architectureSummary,
      failureReason,
      projectRootDir: resolveProjectRegistryRootDir(),
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'MATERIALIZATION',
        failureReason,
        lastSuccessfulStage,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: engineResult.profile ?? resolvedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
      },
    });
  }

  touchForensicStage(workspaceDir, {
    stage: 'MATERIALIZATION',
    durationMs: timings.materializationDurationMs,
    timingsPatch: {
      materializationDurationMs: timings.materializationDurationMs,
      fileGenerationDurationMs: timings.fileGenerationDurationMs,
      generationDurationMs: timings.generationDurationMs,
    },
  });
  lastSuccessfulStage = 'MATERIALIZATION';

  const isTaskTracker = engineResult.profile === 'TASK_TRACKER_WEB_V1';
  const generatedProfile = engineResult.profile;

  let materializationValidation: MaterializationValidationResult | null = null;

  if (isTaskTracker) {
    const featurePath = join(workspaceDir, TASK_TRACKER_FEATURE_RELATIVE_PATH);
    const appPath = join(workspaceDir, 'src/App.tsx');
    const featureSource = existsSync(featurePath) ? readFileSync(featurePath, 'utf8') : '';
    const appSource = existsSync(appPath) ? readFileSync(appPath, 'utf8') : '';
    const hasTaskTrackerFeature =
      isTaskTrackerFeatureSource(featureSource) || isTaskTrackerAppSource(appSource);
    if (!hasTaskTrackerFeature) {
      const failureReason =
        'Generated app missing Task Tracker features or Universal App Blueprint shell';
      touchForensicStage(workspaceDir, {
        stage: 'MATERIALIZATION_VALIDATION',
        errors: [failureReason],
      });
      return registerFailedBuild({
        projectId,
        projectName,
        workspaceDir,
        failure: {
          failureStage: 'MATERIALIZATION_VALIDATION',
          failureReason,
          lastSuccessfulStage,
        },
        result: {
          buildId,
          projectId,
          projectName,
          prompt,
          source,
          failureReason,
          workspaceId: projectId,
          workspacePath: workspaceRel,
          generatedProfile,
          planningProofLevel: contractAssessment.report.proofLevel,
          materializationProofLevel: materialization.proofLevel,
        },
      });
    }
    touchForensicStage(workspaceDir, { stage: 'MATERIALIZATION_VALIDATION' });
    lastSuccessfulStage = 'MATERIALIZATION_VALIDATION';
  } else {
    const validationStartedAt = performance.now();
    materializationValidation = inspectUniversalFeatureSignals(
      workspaceDir,
      prompt,
      generatedProfile,
      projectId,
      projectName,
      buildId,
    );
    timings.validationDurationMs = roundDurationMs(validationStartedAt);
    if (!materializationValidation.passed) {
      const failureDetail =
        materializationValidation.missingArtifacts.join(', ') ||
        materializationValidation.warnings.join('; ') ||
        'Universal app materialization validation failed';
      const failureReason = `Generated app materialization validation failed: ${failureDetail}`;
      touchForensicStage(workspaceDir, {
        stage: 'MATERIALIZATION_VALIDATION',
        durationMs: timings.validationDurationMs,
        timingsPatch: { validationDurationMs: timings.validationDurationMs },
        errors: [failureReason],
      });
      return registerFailedBuild({
        projectId,
        projectName,
        workspaceDir,
        failure: {
          failureStage: 'MATERIALIZATION_VALIDATION',
          failureReason,
          lastSuccessfulStage,
          warnings: materializationValidation.warnings,
          errors: materializationValidation.missingArtifacts,
        },
        result: {
          buildId,
          projectId,
          projectName,
          prompt,
          source,
          failureReason,
          workspaceId: projectId,
          workspacePath: workspaceRel,
          generatedProfile,
          planningProofLevel: contractAssessment.report.proofLevel,
          materializationProofLevel: materialization.proofLevel,
        },
      });
    }
    touchForensicStage(workspaceDir, {
      stage: 'MATERIALIZATION_VALIDATION',
      durationMs: timings.validationDurationMs,
      timingsPatch: { validationDurationMs: timings.validationDurationMs },
    });
    lastSuccessfulStage = 'MATERIALIZATION_VALIDATION';
  }

  let npmInstallOk = false;
  let npmBuildOk = false;
  touchForensicStage(workspaceDir, { stage: 'NPM_INSTALL' });
  const npmInstallStartedAt = performance.now();
  try {
    execSync('npm install --ignore-scripts', {
      cwd: workspaceDir,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 180_000,
    });
    npmInstallOk = true;
    timings.npmInstallDurationMs = roundDurationMs(npmInstallStartedAt);
    touchForensicStage(workspaceDir, {
      stage: 'NPM_INSTALL',
      durationMs: timings.npmInstallDurationMs,
      timingsPatch: { npmInstallDurationMs: timings.npmInstallDurationMs },
    });
    lastSuccessfulStage = 'NPM_INSTALL';
  } catch (err) {
    timings.npmInstallDurationMs = roundDurationMs(npmInstallStartedAt);
    const commandFailure = extractExecCommandFailure(err, 'npm install --ignore-scripts');
    touchForensicStage(workspaceDir, {
      stage: 'NPM_INSTALL',
      durationMs: timings.npmInstallDurationMs,
      timingsPatch: { npmInstallDurationMs: timings.npmInstallDurationMs },
      errors: [commandFailure.failureMessage],
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'NPM_INSTALL',
        failureReason: `npm install failed: ${commandFailure.failureMessage}`,
        failureMessage: commandFailure.failureMessage,
        lastSuccessfulStage,
        commandFailure,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: `npm install failed: ${commandFailure.failureMessage}`,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
        npmInstallOk: false,
      },
    });
  }

  touchForensicStage(workspaceDir, { stage: 'NPM_BUILD' });
  const npmBuildStartedAt = performance.now();
  try {
    execSync('npm run build', {
      cwd: workspaceDir,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 180_000,
    });
    npmBuildOk = true;
    timings.npmBuildDurationMs = roundDurationMs(npmBuildStartedAt);
    touchForensicStage(workspaceDir, {
      stage: 'NPM_BUILD',
      durationMs: timings.npmBuildDurationMs,
      timingsPatch: { npmBuildDurationMs: timings.npmBuildDurationMs },
    });
    lastSuccessfulStage = 'NPM_BUILD';
  } catch (err) {
    timings.npmBuildDurationMs = roundDurationMs(npmBuildStartedAt);
    const commandFailure = extractExecCommandFailure(err, 'npm run build');
    touchForensicStage(workspaceDir, {
      stage: 'NPM_BUILD',
      durationMs: timings.npmBuildDurationMs,
      timingsPatch: { npmBuildDurationMs: timings.npmBuildDurationMs },
      errors: [commandFailure.failureMessage],
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'NPM_BUILD',
        failureReason: `npm run build failed: ${commandFailure.failureMessage}`,
        failureMessage: commandFailure.failureMessage,
        lastSuccessfulStage,
        commandFailure,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: `npm run build failed: ${commandFailure.failureMessage}`,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
        npmInstallOk: true,
        npmBuildOk: false,
      },
    });
  }

  touchForensicStage(workspaceDir, { stage: 'PREVIEW' });
  const previewStartedAt = performance.now();
  const devServer = await startGeneratedAppDevServer({
    workspaceDir,
    workspaceId: projectId,
  });
  timings.previewDurationMs = roundDurationMs(previewStartedAt);

  if (!devServer.ok || !devServer.url) {
    const failureReason = devServer.error ?? 'Dev server failed to start';
    touchForensicStage(workspaceDir, {
      stage: 'PREVIEW',
      durationMs: timings.previewDurationMs,
      timingsPatch: { previewDurationMs: timings.previewDurationMs },
      errors: [failureReason],
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'PREVIEW',
        failureReason,
        lastSuccessfulStage,
        status: 'PARTIAL',
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
        npmInstallOk: true,
        npmBuildOk: true,
      },
    });
  }

  touchForensicStage(workspaceDir, {
    stage: 'PREVIEW',
    durationMs: timings.previewDurationMs,
    timingsPatch: { previewDurationMs: timings.previewDurationMs },
  });
  lastSuccessfulStage = 'PREVIEW';

  createPreviewSession({
    projectId,
    workspaceId: workspaceRel,
    targetName: `${projectName} Preview`,
    targetType: 'WEB_APP',
    previewUrl: devServer.url,
    previewState: 'PREVIEW_READY',
    allowDuplicate: true,
  });

  const featureSignals = isTaskTracker ? inspectFeatureSignals(workspaceDir) : null;

  if (!materializationValidation) {
    const validationStartedAt = performance.now();
    materializationValidation = validateUniversalAppMaterialization({
      workspaceDir,
      rawPrompt: prompt,
      selectedProfile: generatedProfile,
      projectId,
      projectName,
      buildRunId: buildId,
      npmInstallOk,
      npmBuildOk,
    });
    timings.validationDurationMs = roundDurationMs(validationStartedAt);
  }

  touchForensicStage(workspaceDir, {
    stage: 'FINAL_VALIDATION',
    durationMs: timings.validationDurationMs,
    timingsPatch: { validationDurationMs: timings.validationDurationMs },
  });

  const successDefinition = getProfileFeatureDefinition(
    resolveMaterializationProfile(generatedProfile, prompt),
    prompt,
  );

  const evidenceCompletion = completeMaterializationEvidence({
    workspaceDir,
    prompt,
    projectId,
    projectName,
    buildRunId: buildId,
    selectedProfile: String(generatedProfile),
    expectedAppType: successDefinition.expectedAppType,
    promptSummary: summarizePrompt(prompt),
    confidence: ranking.confidence,
    featureModules: successDefinition.featureModules,
    routes: successDefinition.routes,
    fallbackUsed: Boolean(ranking.fallbackReason),
    validation: {
      passed: materializationValidation.passed && npmInstallOk && npmBuildOk,
      blueprintShellPresent: materializationValidation.blueprintShellPresent,
      featureModulesPresent: materializationValidation.featureModulesPresent,
      promptSpecificTermsPresent: materializationValidation.promptSpecificTermsPresent,
      warnings: materializationValidation.warnings,
      errors: materializationValidation.passed
        ? []
        : [
            ...materializationValidation.missingArtifacts.map((a) => `Missing artifact: ${a}`),
            ...materializationValidation.missingFeatureModules.map(
              (m) => `Missing feature module: ${m}`,
            ),
          ],
    },
    timings,
  });

  const success: OnePromptLivePreviewBuildResult = {
    readOnly: true,
    buildId,
    projectId,
    projectName,
    status: 'READY',
    prompt,
    requestType: source === 'chat' ? 'CHAT_BUILD' : 'BUILD_FROM_PROMPT',
    workspaceId: projectId,
    workspacePath: workspaceRel,
    generatedProfile,
    planningProofLevel: contractAssessment.report.proofLevel,
    materializationProofLevel: materialization.proofLevel,
    buildResult: 'PASS',
    npmInstallOk,
    npmBuildOk,
    previewUrl: devServer.url,
    livePreviewAvailable: true,
    failureReason: null,
    featureSignals,
    materializationManifest: evidenceCompletion.manifest,
    updatedAt: new Date().toISOString(),
  };
  persistBuildIntentRun({
    buildRunId: buildId,
    projectId,
    projectName,
    prompt,
    profile: generatedProfile,
    status: 'READY',
    stage: 'LIVE_PREVIEW',
    workspacePath: workspaceRel,
    previewUrl: devServer.url,
    planTaskCount,
    architectureSummary,
    failureReason: null,
    projectRootDir: resolveProjectRegistryRootDir(),
  });
  upsertProjectContextMetadata(
    {
      projectId,
      name: projectName,
      prompt,
      profile: generatedProfile,
      summary: architectureSummary,
      profileConfidence: 'HIGH',
    },
    resolveProjectRegistryRootDir(),
  );
  return registerBuildOutcome(projectId, projectName, success, devServer.port ?? null);
  } catch (unexpected) {
    const commandFailure = extractExecCommandFailure(unexpected, 'one-prompt-build-orchestrator');
    const failureStage: ForensicBuildStage =
      lastSuccessfulStage === 'PREVIEW'
        ? 'FINAL_VALIDATION'
        : lastSuccessfulStage === 'NPM_BUILD'
          ? 'PREVIEW'
          : lastSuccessfulStage === 'NPM_INSTALL'
            ? 'NPM_BUILD'
            : lastSuccessfulStage === 'MATERIALIZATION_VALIDATION'
              ? 'NPM_INSTALL'
              : lastSuccessfulStage === 'MATERIALIZATION'
                ? 'MATERIALIZATION_VALIDATION'
                : lastSuccessfulStage === 'WORKSPACE_CREATED'
                  ? 'MATERIALIZATION'
                  : lastSuccessfulStage === 'PLANNING'
                    ? 'WORKSPACE_CREATED'
                    : 'PLANNING';
    touchForensicStage(workspaceDir, {
      stage: failureStage,
      errors: [commandFailure.failureMessage],
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage,
        failureReason: `Unexpected build error: ${commandFailure.failureMessage}`,
        failureMessage: commandFailure.failureMessage,
        lastSuccessfulStage,
        commandFailure,
        stackPreview: commandFailure.stackPreview,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: `Unexpected build error: ${commandFailure.failureMessage}`,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: resolvedProfile,
      },
    });
  }
}

export function getOnePromptLivePreviewPublicState(
  projectId?: string | null,
): OnePromptLivePreviewPublicState {
  const resolvedProjectId = projectId ?? getActiveProjectId();
  const latest = resolvedProjectId ? getBuildResultForProject(resolvedProjectId) : null;
  const active =
    (resolvedProjectId
      ? listGeneratedDevServers().find((server) => server.projectId === resolvedProjectId)
      : null) ?? getActiveGeneratedDevServerState();

  if (!latest) {
    return {
      status: 'IDLE',
      projectId: resolvedProjectId,
      projectName: null,
      workspaceId: null,
      workspacePath: null,
      generatedProfile: null,
      buildResult: null,
      previewUrl: active?.url ?? null,
      failureReason: null,
      buildStatusLabel: resolvedProjectId
        ? `No build has run yet for project ${resolvedProjectId}`
        : 'No one-prompt build has run yet',
      connected: Boolean(active?.url),
    };
  }

  const previewUrl = latest.previewUrl ?? active?.url ?? null;
  const connected = latest.status === 'READY' && Boolean(previewUrl);

  let buildStatusLabel: string = latest.status;
  if (latest.status === 'READY') {
    buildStatusLabel = `READY — ${latest.generatedProfile ?? 'app'} at ${latest.workspacePath ?? 'workspace'}`;
  } else if (latest.status === 'FAILED') {
    buildStatusLabel = `FAILED — ${latest.failureReason ?? 'unknown error'}`;
  } else if (latest.status === 'BUILDING') {
    buildStatusLabel = 'BUILDING — generating workspace and starting preview';
  }

  return {
    status: latest.status,
    projectId: latest.projectId,
    projectName: latest.projectName,
    workspaceId: latest.workspaceId,
    workspacePath: latest.workspacePath,
    generatedProfile: latest.generatedProfile,
    buildResult: latest.buildResult,
    previewUrl,
    failureReason: latest.failureReason,
    buildStatusLabel,
    connected,
  };
}

/** Conversational fallback when LLM is unavailable — no mechanical runtime dumps. */
export function composeOnePromptBuildChatResponse(result: OnePromptLivePreviewBuildResult): string {
  const profileLabel = result.generatedProfile ?? 'your application';

  if (result.status === 'READY') {
    const previewNote = result.previewUrl
      ? 'A live preview is available — open Live Preview to review the generated application while validation continues.'
      : 'Live Preview is not yet available; check Execution Trace for preview runtime status.';
    return [
      `I've completed the initial build for "${result.projectName}" using the ${profileLabel} profile.`,
      '',
      result.npmInstallOk && result.npmBuildOk
        ? 'The generated workspace compiled successfully.'
        : 'The workspace was materialized, but one or more compile steps did not fully succeed.',
      previewNote,
      '',
      'See Execution Trace for chronological runtime evidence — profile selection, materialization, npm steps, and validation.',
    ].join('\n');
  }

  if (result.status === 'BUILDING') {
    return [
      `I'm materializing "${result.projectName}" now — generating architecture, plan contracts, and workspace files for ${profileLabel}.`,
      '',
      "Execution Trace will stream each runtime stage as it completes. I'll summarize the outcome here when the build finishes.",
    ].join('\n');
  }

  return [
    `The build for "${result.projectName}" did not complete successfully.`,
    '',
    result.failureReason
      ? `Runtime reported: ${result.failureReason}`
      : 'The orchestrator stopped before reaching a ready state.',
    '',
    'Review Execution Trace for the exact failing stage, then retry or adjust the request.',
  ].join('\n');
}
