/**
 * One-prompt build orchestrator — planning → materialization → build → live preview.
 */

import { existsSync, readFileSync } from 'node:fs';
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
    updatedAt: new Date().toISOString(),
  };
}

function inspectUniversalFeatureSignals(workspaceDir: string): boolean {
  const candidates = [
    join(workspaceDir, 'src/App.tsx'),
    join(workspaceDir, 'src/features/universal-feature.tsx'),
    join(workspaceDir, 'src/gpcg/GeneralPurposeManifest.json'),
  ];
  return candidates.some((path) => existsSync(path));
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

  if (!isOnePromptBuildRequest(prompt) && !resolvedProfile) {
    return registerBuildOutcome(
      projectId,
      projectName,
      composeFailureResult({
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason:
          'Build intent detected but no supported application profile matched this prompt. Add product type details (e.g. expense tracker, CRM, task tracker).',
      }),
    );
  }

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
      updatedAt: new Date().toISOString(),
    },
  });

  const aidev = getDevPulseV2AiDevEngineAuthority();
  aidev.intakeBuildRequest(prompt);

  const contractAssessment = assessRequirementsToPlanExecutionContract({ rawPrompt: prompt });
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
    return registerBuildOutcome(
      projectId,
      projectName,
      composeFailureResult({
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: 'Planning did not produce a build-ready contract',
        generatedProfile: resolvedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
      }),
    );
  }

  const workspaceRel = `${GENERATED_BUILDER_WORKSPACES_DIR}/${projectId}`.replace(/\\/g, '/');
  assertWorkspacePathBelongsToProject(workspaceRel, projectId);
  const workspaceDir = join(input.projectRootDir, workspaceRel);

  const materialization = materializeBuildProofGapArtifacts({
    projectRootDir: resolveProjectRegistryRootDir(),
    contract: { ...contract, contractId: projectId },
    rawPrompt: prompt,
  });

  const engineResult = materializeGeneratedApplication({
    projectRootDir: resolveProjectRegistryRootDir(),
    workspaceId: projectId,
    contract: { ...contract, contractId: projectId },
    rawPrompt: prompt,
    profileOverride: resolvedProfile,
  });

  if (!engineResult.generated || !engineResult.profile) {
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
      failureReason:
        engineResult.skippedReason ?? 'Code Generation Engine V1 did not materialize application files',
      projectRootDir: resolveProjectRegistryRootDir(),
    });
    return registerBuildOutcome(
      projectId,
      projectName,
      composeFailureResult({
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason:
          engineResult.skippedReason ?? 'Code Generation Engine V1 did not materialize application files',
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: engineResult.profile ?? resolvedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
      }),
    );
  }

  const isTaskTracker = engineResult.profile === 'TASK_TRACKER_WEB_V1';
  const generatedProfile = engineResult.profile;

  if (isTaskTracker) {
    const featurePath = join(workspaceDir, TASK_TRACKER_FEATURE_RELATIVE_PATH);
    const appPath = join(workspaceDir, 'src/App.tsx');
    const featureSource = existsSync(featurePath) ? readFileSync(featurePath, 'utf8') : '';
    const appSource = existsSync(appPath) ? readFileSync(appPath, 'utf8') : '';
    const hasTaskTrackerFeature =
      isTaskTrackerFeatureSource(featureSource) || isTaskTrackerAppSource(appSource);
    if (!hasTaskTrackerFeature) {
      return registerBuildOutcome(
        projectId,
        projectName,
        composeFailureResult({
          buildId,
          projectId,
          projectName,
          prompt,
          source,
          failureReason: 'Generated app missing Task Tracker features or Universal App Blueprint shell',
          workspaceId: projectId,
          workspacePath: workspaceRel,
          generatedProfile,
          planningProofLevel: contractAssessment.report.proofLevel,
          materializationProofLevel: materialization.proofLevel,
        }),
      );
    }
  } else if (!inspectUniversalFeatureSignals(workspaceDir)) {
    return registerBuildOutcome(
      projectId,
      projectName,
      composeFailureResult({
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: 'Generated app missing Universal App Blueprint shell or feature module',
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
      }),
    );
  }

  let npmInstallOk = false;
  let npmBuildOk = false;
  try {
    execSync('npm install --ignore-scripts', {
      cwd: workspaceDir,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 180_000,
    });
    npmInstallOk = true;
  } catch (err) {
    return registerBuildOutcome(
      projectId,
      projectName,
      composeFailureResult({
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: `npm install failed: ${String(err)}`,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
        npmInstallOk: false,
      }),
    );
  }

  try {
    execSync('npm run build', {
      cwd: workspaceDir,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 180_000,
    });
    npmBuildOk = true;
  } catch (err) {
    return registerBuildOutcome(
      projectId,
      projectName,
      composeFailureResult({
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: `npm run build failed: ${String(err)}`,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
        npmInstallOk: true,
        npmBuildOk: false,
      }),
    );
  }

  const devServer = await startGeneratedAppDevServer({
    workspaceDir,
    workspaceId: projectId,
  });

  if (!devServer.ok || !devServer.url) {
    return registerBuildOutcome(
      projectId,
      projectName,
      composeFailureResult({
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: devServer.error ?? 'Dev server failed to start',
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
        npmInstallOk: true,
        npmBuildOk: true,
      }),
    );
  }

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

export function composeOnePromptBuildChatResponse(result: OnePromptLivePreviewBuildResult): string {
  const profileLabel = result.generatedProfile ?? 'application';
  if (result.status === 'READY') {
    return [
      `Build execution started for project "${result.projectName}" — ${profileLabel} materialization complete.`,
      '',
      `Build run: ${result.buildId}`,
      `Project: ${result.projectId}`,
      `Workspace: ${result.workspacePath ?? result.workspaceId ?? 'unknown'}`,
      `Profile: ${profileLabel}`,
      `Build: ${result.buildResult ?? 'unknown'} (npm install ${result.npmInstallOk ? 'ok' : 'fail'}, npm build ${result.npmBuildOk ? 'ok' : 'fail'})`,
      `Live Preview: ${result.previewUrl ?? 'pending'}`,
      '',
      'Open Live Preview to interact with the generated application.',
    ].join('\n');
  }

  if (result.status === 'BUILDING') {
    return [
      `Build execution started for project "${result.projectName}".`,
      '',
      `Build run: ${result.buildId}`,
      `Stage: materializing ${profileLabel} workspace`,
      '',
      'AiDevEngine is generating architecture, plan, tasks, and workspace files.',
    ].join('\n');
  }

  return [
    `Build execution was started for project "${result.projectName}" but failed during ${profileLabel} build.`,
    '',
    `Build run: ${result.buildId}`,
    `Reason: ${result.failureReason ?? 'Unknown failure'}`,
    result.workspacePath ? `Workspace: ${result.workspacePath}` : '',
    '',
    'Fix the build issue and try again, or check build status in Autonomous Builder / Live Preview.',
  ]
    .filter(Boolean)
    .join('\n');
}
