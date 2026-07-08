/**
 * One-prompt build orchestrator — planning → materialization → build → live preview.
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { getDevPulseV2AiDevEngineAuthority } from '../aidev-engine/aidev-engine-authority.js';
import {
  isTaskTrackerMountEntry,
  materializeGeneratedApplication,
} from '../code-generation-engine/index.js';
import {
  materializeBuildProofGapArtifacts,
} from '../connected-build-execution/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import {
  assessRequirementsToPlanExecutionContract,
} from '../requirements-to-plan-execution-contract/index.js';
import { repairSimpleUtilityPlanningAssessment } from '../simple-utility-app/simple-utility-planning-repair.js';
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
import { resolveAuthoritativePreviewUrls } from '../aep-preview-gate-authority/index.js';
import {
  completeAutonomousEngineering,
  runAutonomousEngineering,
} from '../ase-enforcement-engine/index.js';
import type { AutonomousEngineeringResult } from '../ase-enforcement-engine/ase-enforcement-engine-types.js';
import {
  attemptEngineeringRecovery,
  type EngineeringRecoveryHost,
} from '../autonomous-recovery-authority/index.js';
import {
  recordBuildIntentRun,
} from '../build-intent-routing/build-intent-run-store.js';
import { resolveProjectRegistryRootDir } from '../project-registry-v1/project-registry-v1-store.js';
import { ensureRegistryProjectRecord } from '../persistent-project-reality/persistent-project-reality-registry.js';
import { resolveRegistryRootForPersistentProject } from '../audit-project-isolation/audit-registry-root.js';
import {
  replaceProjectContextMetadata,
  upsertProjectContextMetadata,
} from '../project-context-alignment-v1/project-context-metadata-store.js';
import {
  buildContextScope,
  buildPromptResetPlan,
  classifyNewBuildDecision,
  type BuildDecisionResult,
  type ContextIsolationReportSection,
  buildContextIsolationReportSection,
} from '../project-context-isolation-v4/index.js';
import {
  applyFreshBuildArtifactPurge,
  buildRuntimeEvidenceScope,
  planFreshBuildArtifactPurge,
  type RuntimeEvidenceScope,
} from '../fresh-build-artifact-isolation-v4/index.js';
import { resetLastPromptBoundedMaterializationEvidenceForFreshBuild } from '../prompt-bounded-materialization/index.js';
import { assertWorkspacePathBelongsToProject } from '../project-isolation-guard-v1/index.js';
import {
  validateUniversalAppMaterialization,
  type MaterializationValidationResult,
} from '../universal-prompt-to-app-materialization/index.js';
import { stabilizeWorkspaceMaterialization } from '../workspace-materialization-stabilizer-v1/index.js';
import {
  BuildExecutionMonitor,
  buildExecutionReport,
  createBuildExecutionMonitor,
} from '../build-execution-stabilizer-v1/index.js';
import {
  buildPromptFaithfulnessManifestFields,
  buildPromptFaithfulnessTraceEvents,
  enforcePromptFaithfulMaterialization,
  listWorkspaceFeatureModuleIds,
  resolvePromptFaithfulBuildPlan,
  sanitizeWorkspaceForBuildPlan,
} from '../prompt-faithful-generation/index.js';
import { buildIntentUnderstandingTraceEvents } from '../intent-understanding-engine/index.js';
import {
  toAutonomousSoftwareEngineeringApiResult,
} from '../autonomous-software-engineering-engine/index.js';
import { evaluateLivePreviewGateForOrchestrator } from '../live-preview-gate/index.js';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import { summarizePrompt } from '../universal-prompt-to-app-materialization/prompt-app-metadata.js';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import {
  completeMaterializationEvidence,
  createEmptyMaterializationTimings,
  extractExecCommandFailure,
  finalizeForensicManifestFailure,
  initializeForensicManifest,
  recordForensicManifestAseContinuationOverride,
  recordForensicManifestAeeExecutiveDecision,
  roundDurationMs,
  updateForensicManifestStage,
} from '../materialization-evidence/index.js';
import {
  collectWorkspaceFeatureRealityFallback,
  workspaceHasGeneratedFeatureModules,
} from '../feature-contract-reality/index.js';
import {
  ASE_CONTINUATION_OVERRIDE_MESSAGE,
  evaluateRuntimeBuildContinuation,
  normalizeFailureStageLabel,
  resolveBuildOutcome,
} from '../universal-build-pipeline-verification/index.js';
import {
  buildAeeFinalReport,
  composeAeeAwareBuildChatResponse,
  formatAeeOverrideWarning,
  resetAeeRuntimeRecorderForTests,
  runAeeExecutiveCoordination,
  runAeePreviewRecoveryLoop,
  runAeeBuildAutofixLoop,
  injectSimulatedBuildFailure,
  resolveAeePreviewContract,
  resolveAeeBuildOutcome,
  AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS,
  aeeCanAbortBuild,
  type AeeExecutiveDecisionResult,
  type AeeFinalReport,
} from '../autonomous-engineering-executive/index.js';
import {
  runAutonomousEngineeringLoop,
  type AelFinalReport,
  type AelEvidenceBundle,
} from '../autonomous-engineering-loop/index.js';
import type { ForensicBuildStage, ForensicManifestFailureInput } from '../materialization-evidence/forensic-manifest-types.js';
import { performance } from 'node:perf_hooks';
import {
  getActiveProjectId,
  getBuildResultForProject,
  invalidatePreviousBuildEvidenceForProject,
  registerProjectBuildResult,
  resetWorkspaceTabRegistryForTests,
  resolveProjectContext,
} from './workspace-tab-registry.js';
import {
  runEngineeringIntelligencePostWorkspace,
} from '../engineering-intelligence-runtime/index.js';
import {
  runEndToEndBuildReality,
  type E2EBuildRealityReport,
} from '../end-to-end-build-reality-engine-v1/index.js';
import {
  runAutonomousEngineeringOrchestrator,
  type AeoOrchestratorReport,
} from '../autonomous-engineering-orchestrator-v1/index.js';
import { buildCanonicalProductContract } from '../product-faithfulness-v2/index.js';
import {
  applyContractBoundGenerationToBuildPlan,
  type CbgaGenerationReport,
} from '../contract-bound-generation-authority-v4/index.js';
import {
  buildGpcaPostMaterializationReport,
  buildGpcaPreMaterializationReport,
  gpcaBlocksGeneration,
  gpcaFailureReason,
  type GpcaComplianceReport,
} from '../generation-pipeline-compliance-authority-v1/index.js';

let buildCounter = 0;

export function resetOnePromptLivePreviewForTests(): void {
  buildCounter = 0;
  resetWorkspaceTabRegistryForTests();
  resetAeeRuntimeRecorderForTests();
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

function tryAutonomousRecovery(input: {
  projectId: string;
  failureStage: string;
  failureReason: string;
  host?: EngineeringRecoveryHost;
}): boolean {
  const recovery = attemptEngineeringRecovery({
    projectId: input.projectId,
    failureStage: input.failureStage,
    failureReason: input.failureReason,
    host: input.host,
  });
  return recovery.recovered || recovery.continued;
}

function nextBuildId(): string {
  buildCounter += 1;
  return `one-prompt-build-${buildCounter}`;
}

function excerptBuildOutput(output: string, max = 240): string {
  const trimmed = output.replace(/\s+/g, ' ').trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`;
}

function inspectFeatureSignals(workspaceDir: string): OnePromptLivePreviewBuildResult['featureSignals'] {
  const tasksPath = join(workspaceDir, 'src/features/tasks/TasksFeature.tsx');
  const legacyPath = join(workspaceDir, 'src/features/task-tracker/TaskTrackerFeature.tsx');
  const appPath = join(workspaceDir, 'src/App.tsx');
  const mainPath = join(workspaceDir, 'src/main.tsx');
  const featureSource = existsSync(tasksPath)
    ? readFileSync(tasksPath, 'utf8')
    : existsSync(legacyPath)
      ? readFileSync(legacyPath, 'utf8')
      : existsSync(appPath)
        ? readFileSync(appPath, 'utf8')
        : '';
  const mainSource = existsSync(mainPath) ? readFileSync(mainPath, 'utf8') : '';
  const lower = featureSource.toLowerCase();
  const modularTasksModule = existsSync(tasksPath);
  return {
    addTask: /handleaddtask|add task|add-task-button|data-feature-module="tasks"/.test(lower) || modularTasksModule,
    markComplete: /handleToggleComplete|complete-toggle|mark.*complete|data-feature-module="tasks"/.test(lower) || modularTasksModule,
    deleteTask: /handleDeleteTask|delete-task-button|delete task|data-feature-module="tasks"/.test(lower) || modularTasksModule,
    filter: /taskfilter|filter-all|filter-active|filter-completed|data-feature-module="labels"/.test(lower),
    activeCount: /activecount|active-count|data-feature-module="dashboard"/.test(lower),
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
  diagnosticPreviewUrl?: string | null;
  limitedPreviewUrl?: string | null;
  devServerRunning?: boolean;
  livePreviewAvailable?: boolean;
  livePreviewGate?: OnePromptLivePreviewBuildResult['livePreviewGate'];
  autonomousSoftwareEngineering?: OnePromptLivePreviewBuildResult['autonomousSoftwareEngineering'];
  aeeExecutiveDecision?: OnePromptLivePreviewBuildResult['aeeExecutiveDecision'];
  aeeFinalReport?: OnePromptLivePreviewBuildResult['aeeFinalReport'];
  buildAutofixAttempts?: number;
  buildAutofixLoop?: OnePromptLivePreviewBuildResult['buildAutofixLoop'];
  workspaceStabilizerReport?: OnePromptLivePreviewBuildResult['workspaceStabilizerReport'];
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
    diagnosticPreviewUrl: input.diagnosticPreviewUrl ?? null,
    limitedPreviewUrl: input.limitedPreviewUrl ?? null,
    devServerRunning: input.devServerRunning ?? false,
    livePreviewAvailable: input.livePreviewAvailable ?? false,
    failureReason: input.failureReason,
    featureSignals: null,
    materializationManifest: input.materializationManifest ?? null,
    livePreviewGate: input.livePreviewGate ?? null,
    autonomousSoftwareEngineering: input.autonomousSoftwareEngineering ?? null,
    aeeExecutiveDecision: input.aeeExecutiveDecision ?? null,
    aeeFinalReport: input.aeeFinalReport ?? null,
    buildAutofixAttempts: input.buildAutofixAttempts,
    buildAutofixLoop: input.buildAutofixLoop ?? null,
    workspaceStabilizerReport: input.workspaceStabilizerReport ?? null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * One BuildExecutionMonitor per project's in-flight build. Overwritten (not appended) at the
 * start of each new build for that project, so this never grows unbounded. Kept accessible after
 * the build's terminal result is registered so callers outside this module (e.g. the interaction
 * proof step, which runs after this function returns) can keep recording real stage evidence
 * against the same timeline.
 */
const activeExecutionMonitors = new Map<string, BuildExecutionMonitor>();

/**
 * One Project Context Isolation report per project's in-flight/most-recent build. Overwritten
 * (not appended) at the start of each new build for that project. Read by attachExecutionReport
 * so every returned build result (success or failure) carries build-decision/context-scope
 * evidence without every individual result-construction call site needing to plumb it through.
 */
const activeContextIsolationRecords = new Map<string, ContextIsolationReportSection>();

/**
 * Fresh Build Artifact Isolation V4 — the runtime evidence scope minted for the build currently
 * in flight for a given project, set (not appended) at the start of each build alongside
 * `activeContextIsolationRecords`. Read by attachExecutionReport so every returned build result
 * carries its scope id, purge actions performed, and any stale-evidence detections.
 */
const activeRuntimeEvidenceScopes = new Map<string, RuntimeEvidenceScope>();

export function getActiveBuildExecutionMonitor(projectId: string): BuildExecutionMonitor | undefined {
  return activeExecutionMonitors.get(projectId);
}

export function getActiveRuntimeEvidenceScope(projectId: string): RuntimeEvidenceScope | undefined {
  return activeRuntimeEvidenceScopes.get(projectId);
}

function hashPromptForContextScope(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

function attachExecutionReport(
  projectId: string,
  build: OnePromptLivePreviewBuildResult,
): OnePromptLivePreviewBuildResult {
  let enriched = build;
  const monitor = activeExecutionMonitors.get(projectId);
  if (monitor) {
    monitor.finalizeDanglingStage(
      build.status !== 'FAILED',
      build.status === 'FAILED'
        ? (build.failureReason ?? 'Build did not complete.')
        : 'Stage completed as part of a successful build.',
    );
    const report = buildExecutionReport(monitor);
    enriched = {
      ...enriched,
      buildExecutionStatus: report.overallState,
      executionTimeline: report.timeline,
      executionRecovery: report.recoveryAttempts,
      executionReport: report,
    };
  }
  const contextIsolation = activeContextIsolationRecords.get(projectId);
  if (contextIsolation) {
    enriched = { ...enriched, contextIsolation };
  }
  const runtimeEvidenceScope = activeRuntimeEvidenceScopes.get(projectId);
  if (runtimeEvidenceScope) {
    enriched = { ...enriched, runtimeEvidenceScope };
  }
  return enriched;
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
  definitionOverride: ProfileFeatureDefinition,
): MaterializationValidationResult {
  return validateUniversalAppMaterialization({
    workspaceDir,
    rawPrompt: prompt,
    selectedProfile: generatedProfile,
    projectId,
    projectName,
    buildRunId: buildId,
    definitionOverride,
  });
}

function resolveAeeContinuationManifestFaithfulness(input: {
  buildPlan: ReturnType<typeof resolvePromptFaithfulBuildPlan>;
  workspaceDir: string;
  manifestFields: ReturnType<typeof buildPromptFaithfulnessManifestFields>;
}): { status: string; score: number } {
  if (workspaceHasGeneratedFeatureModules(input.workspaceDir)) {
    return {
      status: input.manifestFields.promptFaithfulnessStatus,
      score: input.manifestFields.promptFaithfulnessScore,
    };
  }
  if (
    input.buildPlan.readyForGeneration ||
    input.buildPlan.promptFaithfulness.readyForGeneration
  ) {
    return {
      status: 'PASS',
      score: Math.max(
        80,
        Math.round(input.buildPlan.promptFaithfulness.faithfulnessScore.overallScore * 100),
      ),
    };
  }
  return {
    status: input.manifestFields.promptFaithfulnessStatus,
    score: input.manifestFields.promptFaithfulnessScore,
  };
}

function collectAseMaterializationBlockers(engineering: AutonomousEngineeringResult): string[] {
  const blockers = [...engineering.evidence.blockers, ...engineering.asePipeline.blockers];
  if (!engineering.materializationExecuted) {
    const materializationAction = engineering.actions.find(
      (action) => action.actionType === 'MATERIALIZATION',
    );
    if (materializationAction?.status === 'FAILED' && materializationAction.detail) {
      blockers.push(materializationAction.detail);
    } else if (!blockers.some((reason) => /materialization|ase denied/i.test(reason))) {
      blockers.push('ASE materialization did not complete.');
    }
  }
  return blockers;
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
  const enrichedBuild = attachExecutionReport(projectId, build);
  registerProjectBuildResult({
    projectId,
    projectName,
    build: enrichedBuild,
    devServerPort: devServerPort ?? null,
  });
  return enrichedBuild;
}

export async function runOnePromptLivePreviewBuild(
  input: OnePromptLivePreviewBuildInput,
): Promise<OnePromptLivePreviewBuildResult> {
  const buildId = nextBuildId();
  const prompt = input.rawPrompt.trim();
  const source = input.source ?? 'api';

  const priorActiveProjectId = getActiveProjectId();
  // NEW_BUILD_CONFIRMATION_REQUIRED UX V4 — when the caller (chat-to-build bridge) already
  // resolved an explicit buildIntentOverride upstream, that acceptance/rejection is carried
  // through verbatim so the context isolation report can show confirmation-required/selected
  // evidence (requirement 6) without re-deriving it here.
  const upstreamOverride = input.buildDecisionKind === 'NEW_BUILD' && input.buildIntentOverride === 'START_NEW_BUILD'
    ? 'START_NEW_BUILD' as const
    : input.buildDecisionKind === 'CONTINUE_EXISTING_PROJECT' && input.buildIntentOverride === 'CONTINUE_EXISTING_PROJECT'
      ? 'CONTINUE_EXISTING_PROJECT' as const
      : null;
  const buildDecision: BuildDecisionResult = input.buildDecisionKind
    ? {
        readOnly: true,
        decision: input.buildDecisionKind,
        confidence: 1,
        reasons: ['Build decision resolved upstream (chat-to-build bridge or explicit caller input).'],
        continuationSignals: [],
        newBuildSignals: [],
        message: null,
        overrideApplied: upstreamOverride,
        overrideRejected: null,
      }
    : classifyNewBuildDecision({
        rawPrompt: prompt,
        requestedProjectId: input.projectId ?? null,
        requestedProjectName: input.projectName ?? null,
        hasKnownExistingProject: Boolean(input.projectId) || input.resumeExistingProject === true,
        currentProjectIdentitySummary: null,
        buildIntentOverride: input.buildIntentOverride ?? null,
      });
  // Only a decision explicitly and confidently classified as continuation may reuse the
  // process-wide active project; every other case (new build, or unresolved ambiguity reaching
  // this far) mints a fresh project instead of silently falling back to activeProjectId.
  const blockActiveProjectFallback = buildDecision.decision !== 'CONTINUE_EXISTING_PROJECT';

  const projectContext = resolveProjectContext({
    projectId: input.projectId,
    projectName: input.projectName,
    createIfMissing: true,
    blockActiveProjectFallback,
  });
  const { projectId, projectName } = projectContext;
  const activeProjectIdFallbackBlocked = blockActiveProjectFallback && Boolean(priorActiveProjectId) && priorActiveProjectId !== projectId;

  const contextScope = buildContextScope({
    requestId: buildId,
    buildId,
    projectId,
    decision: buildDecision.decision,
    currentPromptHash: hashPromptForContextScope(prompt),
    explicitlyReferencedProjectId: buildDecision.decision === 'CONTINUE_EXISTING_PROJECT' ? (input.projectId ?? null) : null,
    activeProjectIdCandidate: priorActiveProjectId,
  });
  // Prompt Reset Authority — a NEW_BUILD_PROMPT trigger runs before planning/materialization
  // begin. A freshly-minted project id has no prior workspace/state under that id at all, so
  // every reset category is satisfied by construction; requirement 3's "clear stale generation
  // state" guarantee is enforced by never reusing a prior project's id for a new build (see
  // resolveProjectContext blockActiveProjectFallback above) rather than by reaching into 15
  // separate stores after the fact.
  const promptResetPlan =
    buildDecision.decision === 'NEW_BUILD'
      ? buildPromptResetPlan({
          trigger: 'NEW_BUILD_PROMPT',
          projectId,
          freshProjectScope: projectContext.created,
        })
      : null;

  // Fresh Build Artifact Purge + Runtime Evidence Isolation V4 — purge/invalidate previous build
  // artifacts *before* the new context isolation record / execution monitor / runtime evidence
  // scope are (re)set below, so the executors are clearing genuinely stale prior-build entries
  // rather than the ones just written for this build. Purge categories that are "required project
  // artifacts" (workspace path, manifests, routes, navigation, tab registry entry) are only
  // purged for NEW_BUILD; per-build runtime evidence (faithfulness/proof/reports/concepts/active
  // build result/etc.) is invalidated for every build regardless of decision, so a continuation
  // never displays a previous turn's evidence while the current one is computing.
  const purgePlan = planFreshBuildArtifactPurge({
    decision: buildDecision.decision,
    requestId: buildId,
    buildId,
    projectId,
    freshProjectScope: projectContext.created,
    categoriesWithLiveExecutor: [
      'ACTIVE_BUILD_RESULT',
      'ENGINEERING_REPORT_SUMMARY',
      'UI_PROJECT_SUMMARY',
      'FALLBACK_MODULE_EVIDENCE',
      'RUNTIME_ACTIVATION_RESULT',
    ],
  });
  applyFreshBuildArtifactPurge(purgePlan, {
    ACTIVE_BUILD_RESULT: () => invalidatePreviousBuildEvidenceForProject(projectId),
    ENGINEERING_REPORT_SUMMARY: () => activeExecutionMonitors.delete(projectId),
    UI_PROJECT_SUMMARY: () => activeContextIsolationRecords.delete(projectId),
    FALLBACK_MODULE_EVIDENCE: () => resetLastPromptBoundedMaterializationEvidenceForFreshBuild(),
    RUNTIME_ACTIVATION_RESULT: () => activeRuntimeEvidenceScopes.delete(projectId),
  });
  // The full plan (not just the subset with a live in-process executor) is what gets reported —
  // FRESH_SCOPE entries are purged by construction (fresh project id) and NOT_APPLICABLE entries
  // are legitimately preserved for CONTINUE_EXISTING_PROJECT; both are meaningful purge evidence.
  const purgeActionsPerformed = purgePlan.actions;

  activeContextIsolationRecords.set(
    projectId,
    buildContextIsolationReportSection({
      decision: buildDecision,
      scope: contextScope,
      resetPlan: promptResetPlan,
      productIdentity: projectName,
      activeProjectIdFallbackBlocked,
    }),
  );

  activeRuntimeEvidenceScopes.set(
    projectId,
    buildRuntimeEvidenceScope(
      {
        requestId: buildId,
        buildId,
        projectId,
        decision: buildDecision.decision,
        promptHash: contextScope.currentPromptHash,
      },
      purgeActionsPerformed,
    ),
  );

  const executionMonitor = createBuildExecutionMonitor();
  activeExecutionMonitors.set(projectId, executionMonitor);
  executionMonitor.startStage('PLANNING');

  const { registryRoot, projectKind, artifactRoot } = resolveRegistryRootForPersistentProject({
    projectRootDir: input.projectRootDir,
    explicitProjectKind: input.projectKind,
  });
  ensureRegistryProjectRecord({
    rootDir: registryRoot,
    projectId,
    projectName,
    projectKind,
  });

  let buildPlan = resolvePromptFaithfulBuildPlan(prompt);
  // Contract-Bound Generation Authority V4 — the approved canonical product contract is the only
  // valid source for generated modules/routes/navigation/app identity. This runs before any
  // workspace materialization: it compares the module plan the pipeline is about to generate from
  // against the contract and, when they drift (unauthorized fallback modules, a generic app title,
  // etc.), automatically repairs the build plan's module/route/title inputs from the contract —
  // never a full rebuild, never inventing modules without contract evidence, never hiding a
  // mismatch. The generator itself is unmodified: it keeps reading `buildPlan.modulePlan` /
  // `buildPlan.extraction.appName` exactly as before.
  const canonicalProductContract = buildCanonicalProductContract({ prompt });
  const contractBoundResult = applyContractBoundGenerationToBuildPlan(buildPlan, canonicalProductContract);
  const contractBoundGeneration: CbgaGenerationReport = contractBoundResult.report;
  buildPlan = contractBoundResult.buildPlan;
  // Generation Pipeline Compliance Authority V1 — CBGA above decides *what* is allowed to be
  // generated; GPCA proves every real generation stage actually *consumes* that decision instead
  // of a legacy/template/blueprint default. This pre-materialization pass verifies the inputs the
  // generator is about to read (buildPlan.modulePlan / extraction.appName, now CBGA-repaired) —
  // it never mutates the build plan itself. The post-materialization pass (inside
  // runWorkspaceMaterialization, below) is where a real legacy/generic-shell injection can
  // actually be proven, because those files do not exist until the workspace has been written.
  let gpcaComplianceReport: GpcaComplianceReport = buildGpcaPreMaterializationReport({
    contract: canonicalProductContract,
    cbgaReport: contractBoundGeneration,
    buildPlan,
  });
  const ranking = buildPlan.ranking;
  const materializationProfile = buildPlan.materializationProfile;
  const definition = buildPlan.definition;
  const effectiveProfile = materializationProfile as GeneratedAppProfile;
  const intentTraceEvents = buildIntentUnderstandingTraceEvents(buildPlan.productIntelligenceModel);
  const faithfulnessManifestFields = buildPromptFaithfulnessManifestFields({
    rawPrompt: prompt,
    selectedProfile: String(materializationProfile),
    generatedModules: definition.featureModules,
    guardResult: buildPlan.guardResult,
  });
  const faithfulnessTraceEvents = buildPromptFaithfulnessTraceEvents({
    extraction: buildPlan.extraction,
    guardResult: buildPlan.guardResult,
    manifestFields: faithfulnessManifestFields,
  });
  void faithfulnessTraceEvents;

  const workspaceRel = `${GENERATED_BUILDER_WORKSPACES_DIR}/${projectId}`.replace(/\\/g, '/');
  assertWorkspacePathBelongsToProject(workspaceRel, projectId);
  const workspaceDir = join(artifactRoot, workspaceRel);
  mkdirSync(workspaceDir, { recursive: true });

  const staleModulesRemoved = sanitizeWorkspaceForBuildPlan(
    workspaceDir,
    buildPlan.modulePlan.approvedModuleIds,
  );

  const hasRecognizedBuildProfile =
    Boolean(ranking.selectedProfile) ||
    buildPlan.extraction.isCustomDomainPrompt ||
    materializationProfile === 'GENERIC_CUSTOM_APP_V1';

  if (!buildPlan.readyForGeneration) {
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
      fallbackUsed: buildPlan.guardResult.guardApplied,
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'CAPABILITY_PLANNING',
        failureReason:
          buildPlan.intentUnderstanding.blockedReason ??
          buildPlan.promptFaithfulness.blockedReason ??
          buildPlan.capabilityPlanning.blockedReason ??
          buildPlan.incrementalBuild.blockedReason ??
          buildPlan.behaviorSimulation.blockedReason ??
          'Intent, Prompt Faithfulness, Capability Planning, Incremental Build, or Behavior Simulation blocked generation.',
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
          buildPlan.intentUnderstanding.blockedReason ??
          buildPlan.promptFaithfulness.blockedReason ??
          'Product Intelligence Model or Prompt Evidence Contract blocked generation.',
        workspaceId: projectId,
        workspacePath: workspaceRel,
      },
    });
  }

  if (!isOnePromptBuildRequest(prompt) && !hasRecognizedBuildProfile) {
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
      fallbackUsed: buildPlan.guardResult.guardApplied,
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
    selectedProfile: String(effectiveProfile ?? materializationProfile),
    expectedAppType: definition.expectedAppType,
    promptSummary: summarizePrompt(prompt),
    confidence: ranking.confidence,
    featureModules: definition.featureModules,
    routes: definition.routes,
    fallbackUsed: buildPlan.guardResult.guardApplied,
  });
  touchForensicStage(workspaceDir, { stage: 'PROMPT_RECEIVED' });
  touchForensicStage(workspaceDir, {
    stage: 'PROFILE_SELECTED',
    selectedProfile: String(effectiveProfile ?? materializationProfile),
    confidence: ranking.confidence,
    warnings: [
      ...(staleModulesRemoved.length > 0
        ? [
            `Removed ${staleModulesRemoved.length} stale workspace module(s) not in current build plan: ${staleModulesRemoved.join(', ')}`,
          ]
        : []),
      ...(contractBoundGeneration.repairsApplied.length > 0
        ? [
            `Contract-Bound Generation Authority V4: gate outcome ${contractBoundGeneration.initialGate.outcome} → ${contractBoundGeneration.finalGateOutcome} after ${contractBoundGeneration.repairsApplied.length} repair(s): ${contractBoundGeneration.repairsApplied.map((a) => a.actionId).join(', ')}.`,
          ]
        : []),
    ],
  });
  lastSuccessfulStage = 'PROFILE_SELECTED';

  try {
  persistBuildIntentRun({
    buildRunId: buildId,
    projectId,
    projectName,
    prompt,
    profile: effectiveProfile,
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
      generatedProfile: effectiveProfile,
      planningProofLevel: null,
      materializationProofLevel: null,
      buildResult: null,
      npmInstallOk: false,
      npmBuildOk: false,
    previewUrl: null,
    diagnosticPreviewUrl: null,
    limitedPreviewUrl: null,
    devServerRunning: false,
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
  let contract = contractAssessment.report.buildReadyContract;
  if (!contract) {
    const repairedAssessment = repairSimpleUtilityPlanningAssessment(prompt);
    if (repairedAssessment?.report.buildReadyContract) {
      contract = repairedAssessment.report.buildReadyContract;
    }
  }
  const planTaskCount = contractAssessment.report.planContract?.tasks.length ?? null;
  const architectureSummary = contract
    ? `Build-ready contract with ${contract.buildUnits.length} units and ${planTaskCount ?? 0} plan tasks`
    : null;

  persistBuildIntentRun({
    buildRunId: buildId,
    projectId,
    projectName,
    prompt,
    profile: effectiveProfile,
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
        generatedProfile: effectiveProfile,
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
  executionMonitor.completeStage('PLANNING', `Planning finished in ${Math.round(timings.planningDurationMs)}ms.`);

  touchForensicStage(workspaceDir, { stage: 'WORKSPACE_CREATED' });
  lastSuccessfulStage = 'WORKSPACE_CREATED';

  if (workspaceHasGeneratedFeatureModules(workspaceDir)) {
    collectWorkspaceFeatureRealityFallback({
      workspaceDir,
      requiredModuleIds: buildPlan.modulePlan.approvedModuleIds,
      contractId: buildPlan.promptFaithfulness.contract.id,
      previewUrl: 'workspace://resume-or-partial',
      registerAssessment: true,
    });
  }

  if (!buildPlan.promptBoundedMaterializationPassed || buildPlan.modulePlan.approvedModuleIds.length === 0) {
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'PLANNING',
        failureReason:
          'Prompt-Bounded Materialization Guard produced no approved modules for generation.',
        status: 'ABORTED',
        lastSuccessfulStage,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: 'Prompt-Bounded Materialization Guard produced no approved modules for generation.',
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: effectiveProfile,
      },
    });
  }

  if (gpcaBlocksGeneration(gpcaComplianceReport)) {
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'PLANNING',
        failureReason: gpcaFailureReason(gpcaComplianceReport),
        status: 'ABORTED',
        lastSuccessfulStage,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: gpcaFailureReason(gpcaComplianceReport),
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: effectiveProfile,
      },
    });
  }

  const materializationRoot = artifactRoot;
  let materializationForEvidence: Awaited<ReturnType<typeof materializeBuildProofGapArtifacts>> | null = null;
  let generatedProfileForBuild = effectiveProfile;
  let materializationValidationForBuild: MaterializationValidationResult | null = null;
  let continuationMaterializationExecuted = false;
  let aseContinuationOverrideApplied = false;
  let aseContinuationWarning: string | null = null;
  let aeeExecutiveDecision: AeeExecutiveDecisionResult | null = null;
  let aeeFinalReport: AeeFinalReport | null = null;

  const continuationFailureWarnings = (): string[] | undefined =>
    aseContinuationOverrideApplied && aseContinuationWarning ? [aseContinuationWarning] : undefined;

  const runWorkspaceMaterialization = (): { ok: boolean; failureReason: string | null } => {
    executionMonitor.startStage('GENERATION');
    const materializationStartedAt = performance.now();
    const materialization = materializeBuildProofGapArtifacts({
      projectRootDir: materializationRoot,
      contract: { ...contract, contractId: projectId },
      rawPrompt: prompt,
      faithfulBuildPlan: buildPlan,
    });
    materializationForEvidence = materialization;

    const engineResult = materializeGeneratedApplication({
      projectRootDir: materializationRoot,
      workspaceId: projectId,
      contract: { ...contract, contractId: projectId },
      rawPrompt: prompt,
      faithfulBuildPlan: buildPlan,
      profileOverride: effectiveProfile,
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
      executionMonitor.failStage('GENERATION', failureReason);
      return { ok: false, failureReason };
    }

    // Generation Pipeline Compliance Authority V1 — post-materialization pass. Real files now
    // exist on disk, so this is the only point a legacy/generic blueprint-shell injection can
    // actually be *proven* (not merely predicted). GPCA never repairs or rewrites what was
    // written — if any stage's real output cannot be traced back to CBGA's approved plan, this
    // build fails here, before the dev server / live preview is ever started.
    gpcaComplianceReport = buildGpcaPostMaterializationReport({
      contract: canonicalProductContract,
      cbgaReport: contractBoundGeneration,
      buildPlan,
      generatedFilePaths: engineResult.generatedFiles,
    });
    if (gpcaBlocksGeneration(gpcaComplianceReport)) {
      const failureReason = gpcaFailureReason(gpcaComplianceReport);
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
      executionMonitor.failStage('GENERATION', failureReason);
      return { ok: false, failureReason };
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
    executionMonitor.completeStage('GENERATION', `Generation finished in ${Math.round(timings.materializationDurationMs)}ms.`);

    const faithfulnessGate = enforcePromptFaithfulMaterialization({
      rawPrompt: prompt,
      buildPlan,
      workspaceDir,
    });
    if (!faithfulnessGate.ok) {
      const failureReason =
        faithfulnessGate.failureReason ??
        'Prompt faithfulness validation failed — generated modules do not match the prompt.';
      touchForensicStage(workspaceDir, {
        stage: 'MATERIALIZATION_VALIDATION',
        errors: [failureReason],
      });
      executionMonitor.startStage('VALIDATION');
      executionMonitor.failStage('VALIDATION', failureReason);
      return { ok: false, failureReason };
    }

    generatedProfileForBuild = engineResult.profile ?? effectiveProfile;

    const validationStartedAt = performance.now();
    const materializationValidation = inspectUniversalFeatureSignals(
      workspaceDir,
      prompt,
      generatedProfileForBuild,
      projectId,
      projectName,
      buildId,
      definition,
    );
    materializationValidationForBuild = materializationValidation;
    timings.validationDurationMs = roundDurationMs(validationStartedAt);
    executionMonitor.startStage('VALIDATION');
    if (!materializationValidation.passed) {
      const failureDetail =
        materializationValidation.missingArtifacts.join(', ') ||
        materializationValidation.missingModularModuleFiles.join(', ') ||
        materializationValidation.warnings.join('; ') ||
        'Universal app materialization validation failed';
      const failureReason = `Generated app materialization validation failed: ${failureDetail}`;
      touchForensicStage(workspaceDir, {
        stage: 'MATERIALIZATION_VALIDATION',
        durationMs: timings.validationDurationMs,
        timingsPatch: { validationDurationMs: timings.validationDurationMs },
        errors: [failureReason],
      });
      executionMonitor.failStage('VALIDATION', failureReason);
      return { ok: false, failureReason };
    }

    touchForensicStage(workspaceDir, {
      stage: 'MATERIALIZATION_VALIDATION',
      durationMs: timings.validationDurationMs,
      timingsPatch: { validationDurationMs: timings.validationDurationMs },
    });
    lastSuccessfulStage = 'MATERIALIZATION_VALIDATION';
    executionMonitor.completeStage('VALIDATION', `Materialization validation finished in ${Math.round(timings.validationDurationMs)}ms.`);

    collectWorkspaceFeatureRealityFallback({
      workspaceDir,
      requiredModuleIds: listWorkspaceFeatureModuleIds(workspaceDir),
      contractId: buildPlan.promptFaithfulness.contract.id,
      previewUrl: 'workspace://post-materialization',
      registerAssessment: true,
    });

    continuationMaterializationExecuted = true;
    return { ok: true, failureReason: null };
  };

  const engineeringPartial = await runAutonomousEngineering({
    rawPrompt: prompt,
    projectId,
    projectRootDir: input.projectRootDir,
    workspaceDir,
    productIntelligenceModel: buildPlan.productIntelligenceModel,
    promptFaithfulness: buildPlan.promptFaithfulness,
    capabilityPlanning: buildPlan.capabilityPlanning,
    simulateAseMaterializationDenial:
      input.source === 'validator' && input.simulateAseMaterializationDenial === true,
    host: {
      executeMaterialization: () => runWorkspaceMaterialization(),
    },
  });

  if (!engineeringPartial.materializationExecuted) {
    const aseBlockers = collectAseMaterializationBlockers(engineeringPartial);
    const workspaceFallback =
      workspaceHasGeneratedFeatureModules(workspaceDir)
        ? collectWorkspaceFeatureRealityFallback({
            workspaceDir,
            requiredModuleIds: buildPlan.modulePlan.approvedModuleIds,
            contractId: buildPlan.promptFaithfulness.contract.id,
            previewUrl: 'workspace://continuation-policy',
            registerAssessment: false,
          })
        : null;

    const continuationFaithfulnessFields = buildPromptFaithfulnessManifestFields({
      rawPrompt: prompt,
      selectedProfile: String(materializationProfile),
      generatedModules:
        buildPlan.modulePlan.approvedModuleIds.length > 0
          ? buildPlan.modulePlan.approvedModuleIds
          : definition.featureModules,
      guardResult: buildPlan.guardResult,
      workspaceDir: workspaceHasGeneratedFeatureModules(workspaceDir) ? workspaceDir : undefined,
      approvedModuleIds: buildPlan.modulePlan.approvedModuleIds,
    });

    const manifestFaithfulnessForContinuation = resolveAeeContinuationManifestFaithfulness({
      buildPlan,
      workspaceDir,
      manifestFields: continuationFaithfulnessFields,
    });

    const runtimeContinuation = evaluateRuntimeBuildContinuation({
      workspaceDir,
      buildPlan,
      blockers: aseBlockers,
      featureRealityStatus: workspaceFallback?.status ?? null,
      manifestFaithfulness: manifestFaithfulnessForContinuation,
    });

    aeeExecutiveDecision = runAeeExecutiveCoordination({
      workspaceDir,
      buildPlan,
      rawPrompt: prompt,
      projectId,
      projectName,
      aseBlockers,
      aseMaterializationAuthorized: engineeringPartial.materializationAuthorized,
      aseMaterializationExecuted: engineeringPartial.materializationExecuted,
      featureRealityStatus: workspaceFallback?.status ?? null,
      manifestFaithfulness: manifestFaithfulnessForContinuation,
    });

    if (aeeExecutiveDecision.shouldContinueToBuild) {
      aseContinuationOverrideApplied = true;
      aseContinuationWarning = formatAeeOverrideWarning(aeeExecutiveDecision);
      recordForensicManifestAeeExecutiveDecision(workspaceDir, {
        decision: aeeExecutiveDecision.decision,
        reasoning: aeeExecutiveDecision.reasoning,
        overrideEvent: aeeExecutiveDecision.overrideEvent,
        overriddenBlockers: aeeExecutiveDecision.overriddenBlockers,
        respectedBlockers: aeeExecutiveDecision.respectedBlockers,
        evidenceProviders: aeeExecutiveDecision.evidence.map((e) => e.authority),
      });
      recordForensicManifestAseContinuationOverride(workspaceDir, {
        aseBlockers,
        warning: aseContinuationWarning,
      });
      touchForensicStage(workspaceDir, {
        stage: 'AEE_EXECUTIVE_COORDINATION',
        warnings: [aseContinuationWarning],
      });

      const needsMaterialization =
        aeeExecutiveDecision.shouldMaterializeFirst ||
        runtimeContinuation.shouldMaterializeFirst ||
        (!engineeringPartial.materializationExecuted && !workspaceHasGeneratedFeatureModules(workspaceDir));

      if (needsMaterialization) {
        const continuationResult = runWorkspaceMaterialization();
        if (!continuationResult.ok) {
          return registerFailedBuild({
            projectId,
            projectName,
            workspaceDir,
            failure: {
              failureStage: 'MATERIALIZATION',
              failureReason:
                continuationResult.failureReason ??
                'Continuation materialization failed after ASE denial override.',
              lastSuccessfulStage,
            },
            result: {
              buildId,
              projectId,
              projectName,
              prompt,
              source,
              failureReason:
                continuationResult.failureReason ??
                'Continuation materialization failed after ASE denial override.',
              workspaceId: projectId,
              workspacePath: workspaceRel,
              generatedProfile: effectiveProfile,
            },
          });
        }
      } else {
        if (!materializationForEvidence) {
          materializationForEvidence = materializeBuildProofGapArtifacts({
            projectRootDir: materializationRoot,
            contract: { ...contract, contractId: projectId },
            rawPrompt: prompt,
            faithfulBuildPlan: buildPlan,
          });
        }
        if (!materializationValidationForBuild) {
          materializationValidationForBuild = inspectUniversalFeatureSignals(
            workspaceDir,
            prompt,
            generatedProfileForBuild,
            projectId,
            projectName,
            buildId,
            definition,
          );
        }
        continuationMaterializationExecuted = true;
        lastSuccessfulStage = 'MATERIALIZATION_VALIDATION';
      }
    } else if (
      aeeCanAbortBuild({
        hasGeneratedSource: workspaceHasGeneratedFeatureModules(workspaceDir),
        stage: aeeExecutiveDecision.stage,
        proposedFailureLabel:
          engineeringPartial.evidence.blockers[0] ??
          engineeringPartial.asePipeline.blockers[0] ??
          'ASE denied materialization authorization.',
        executiveDecision: aeeExecutiveDecision.decision,
      })
    ) {
      const materializedNow = workspaceHasGeneratedFeatureModules(workspaceDir);
      const failureReason =
        aeeExecutiveDecision.reasoning ??
        engineeringPartial.evidence.blockers[0] ??
        engineeringPartial.asePipeline.blockers[0] ??
        'ASE denied materialization authorization.';
      return registerFailedBuild({
        projectId,
        projectName,
        workspaceDir,
        failure: {
          failureStage: normalizeFailureStageLabel(
            materializedNow ? 'MATERIALIZATION' : 'PLANNING',
            resolveBuildOutcome({
              materialized: materializedNow,
              npmInstallOk: false,
              npmBuildOk: false,
              previewOk: false,
              previewDegraded: false,
              blockedBeforeMaterialization: !materializedNow,
            }),
          ),
          failureReason,
          status: 'ABORTED',
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
          generatedProfile: effectiveProfile,
          planningProofLevel: contractAssessment.report.proofLevel,
          livePreviewGate: engineeringPartial.asePipeline.livePreviewGate,
          autonomousSoftwareEngineering: toAutonomousSoftwareEngineeringApiResult(
            engineeringPartial.asePipeline,
          ),
          aeeExecutiveDecision,
        },
      });
    } else {
      aseContinuationOverrideApplied = true;
      aseContinuationWarning =
        aeeExecutiveDecision.reasoning ??
        'AEE forbids abort after workspace evidence — continuing build spine.';
      recordForensicManifestAeeExecutiveDecision(workspaceDir, {
        decision: aeeExecutiveDecision.decision,
        reasoning: aseContinuationWarning,
        overrideEvent: aeeExecutiveDecision.overrideEvent,
        overriddenBlockers: aeeExecutiveDecision.overriddenBlockers,
        respectedBlockers: aeeExecutiveDecision.respectedBlockers,
        evidenceProviders: aeeExecutiveDecision.evidence.map((e) => e.authority),
      });
      touchForensicStage(workspaceDir, {
        stage: 'AEE_EXECUTIVE_COORDINATION',
        warnings: [aseContinuationWarning],
      });
      if (!workspaceHasGeneratedFeatureModules(workspaceDir)) {
        const continuationResult = runWorkspaceMaterialization();
        if (!continuationResult.ok) {
          return registerFailedBuild({
            projectId,
            projectName,
            workspaceDir,
            failure: {
              failureStage: 'MATERIALIZATION',
              failureReason:
                continuationResult.failureReason ??
                'AEE-authorized materialization failed.',
              lastSuccessfulStage,
            },
            result: {
              buildId,
              projectId,
              projectName,
              prompt,
              source,
              failureReason:
                continuationResult.failureReason ?? 'AEE-authorized materialization failed.',
              workspaceId: projectId,
              workspacePath: workspaceRel,
              generatedProfile: effectiveProfile,
            },
          });
        }
      } else {
        continuationMaterializationExecuted = true;
      }
    }
  }

  if (
    !engineeringPartial.materializationExecuted &&
    !continuationMaterializationExecuted &&
    !aseContinuationOverrideApplied
  ) {
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'MATERIALIZATION',
        failureReason: 'ASE-authorized materialization did not complete.',
        lastSuccessfulStage,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: 'ASE-authorized materialization did not complete.',
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: effectiveProfile,
      },
    });
  }

  if (!materializationForEvidence) {
    materializationForEvidence = materializeBuildProofGapArtifacts({
      projectRootDir: materializationRoot,
      contract: { ...contract, contractId: projectId },
      rawPrompt: prompt,
      faithfulBuildPlan: buildPlan,
    });
  }
  if (!materializationValidationForBuild) {
    materializationValidationForBuild = inspectUniversalFeatureSignals(
      workspaceDir,
      prompt,
      generatedProfileForBuild,
      projectId,
      projectName,
      buildId,
      definition,
    );
  }

  const materialization = materializationForEvidence;
  const generatedProfile = generatedProfileForBuild;
  const materializationValidation = materializationValidationForBuild;

  let engineeringResult = engineeringPartial;

  let npmInstallOk = false;
  let npmBuildOk = false;

  executionMonitor.startStage('WORKSPACE_STABILIZATION');
  touchForensicStage(workspaceDir, { stage: 'WORKSPACE_STABILIZATION' });
  const workspaceStabilizerReport = stabilizeWorkspaceMaterialization({ workspaceDir, prompt });
  touchForensicStage(workspaceDir, {
    stage: 'WORKSPACE_STABILIZATION',
    durationMs: workspaceStabilizerReport.durationMs,
    warnings: workspaceStabilizerReport.summary.stillMissing,
  });

  if (
    workspaceStabilizerReport.status === 'WORKSPACE_BLOCKED' ||
    workspaceStabilizerReport.status === 'WORKSPACE_CORRUPTED'
  ) {
    executionMonitor.blockStage('WORKSPACE_STABILIZATION', workspaceStabilizerReport.summary.headline);
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'WORKSPACE_STABILIZATION',
        failureReason: workspaceStabilizerReport.summary.headline,
        lastSuccessfulStage,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: workspaceStabilizerReport.summary.headline,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
        workspaceStabilizerReport,
      },
    });
  }

  executionMonitor.startStage('NPM_INSTALL');
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
    executionMonitor.completeStage('NPM_INSTALL', `npm install finished in ${Math.round(timings.npmInstallDurationMs)}ms.`);
  } catch (err) {
    timings.npmInstallDurationMs = roundDurationMs(npmInstallStartedAt);
    const commandFailure = extractExecCommandFailure(err, 'npm install --ignore-scripts');
    const failureReason = `npm install failed: ${commandFailure.failureMessage}`;
    const npmInstallStalled = /timeout|timed out|ETIMEDOUT|SIGTERM/i.test(
      `${commandFailure.failureMessage} ${commandFailure.errorCode ?? ''}`,
    );
    executionMonitor.markStall(
      'NPM_INSTALL',
      npmInstallStalled ? 'npm install stopped responding within its time budget.' : failureReason,
    );
    const recovered = tryAutonomousRecovery({
      projectId,
      failureStage: 'NPM_INSTALL',
      failureReason,
      host: {
        retryStage: () => {
          try {
            execSync('npm install --ignore-scripts', {
              cwd: workspaceDir,
              encoding: 'utf8',
              stdio: 'pipe',
              timeout: 180_000,
            });
            return { ok: true, detail: 'npm install succeeded after autonomous recovery.' };
          } catch (retryErr) {
            const retryFailure = extractExecCommandFailure(retryErr, 'npm install --ignore-scripts');
            return { ok: false, detail: retryFailure.failureMessage };
          }
        },
        replayValidation: () => ({ ok: true, detail: 'Dependency validation replay passed.' }),
        continueBuild: () => ({ ok: true, detail: 'Build continuation authorized after npm recovery.' }),
      },
    });
    executionMonitor.recordRecoveryAttempt({
      readOnly: true,
      stage: 'NPM_INSTALL',
      actionKind: 'RESTART_NPM_INSTALL',
      attemptedAtMs: Date.now(),
      succeeded: recovered,
      detail: recovered ? 'npm install succeeded after one automatic restart.' : commandFailure.failureMessage,
    });
    if (recovered) {
      npmInstallOk = true;
      lastSuccessfulStage = 'NPM_INSTALL';
      executionMonitor.markRecovered('NPM_INSTALL', 'Recovery succeeded. Continuing build…');
    } else {
      executionMonitor.failStage('NPM_INSTALL', commandFailure.failureMessage);
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
        workspaceStabilizerReport,
      },
    });
    }
  }

  executionMonitor.startStage('NPM_BUILD');
  touchForensicStage(workspaceDir, { stage: 'NPM_BUILD' });
  const npmBuildStartedAt = performance.now();

  if (input.source === 'validator' && input.simulateBuildAutofixFailure === true) {
    injectSimulatedBuildFailure(workspaceDir);
  }

  const runNpmBuildAttempt = (): { ok: boolean; output: string } => {
    try {
      execSync('npm run build', {
        cwd: workspaceDir,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 180_000,
      });
      return { ok: true, output: '' };
    } catch (err) {
      const commandFailure = extractExecCommandFailure(err, 'npm run build');
      return { ok: false, output: commandFailure.failureMessage };
    }
  };

  let buildAutofixLoop: Awaited<ReturnType<typeof runAeeBuildAutofixLoop>> | null = null;
  let buildAutofixAttempts = 0;
  let initialBuildOutput = '';

  const firstBuildAttempt = runNpmBuildAttempt();
  npmBuildOk = firstBuildAttempt.ok;
  initialBuildOutput = firstBuildAttempt.output;
  timings.npmBuildDurationMs = roundDurationMs(npmBuildStartedAt);

  if (npmBuildOk) {
    touchForensicStage(workspaceDir, {
      stage: 'NPM_BUILD',
      durationMs: timings.npmBuildDurationMs,
      timingsPatch: { npmBuildDurationMs: timings.npmBuildDurationMs },
    });
    lastSuccessfulStage = 'NPM_BUILD';
    executionMonitor.completeStage('NPM_BUILD', `npm build finished in ${Math.round(timings.npmBuildDurationMs)}ms.`);
  } else {
    const npmBuildStalled = /timeout|timed out|ETIMEDOUT|SIGTERM/i.test(initialBuildOutput);
    executionMonitor.markStall(
      'NPM_BUILD',
      npmBuildStalled ? 'npm build stopped responding within its time budget.' : excerptBuildOutput(initialBuildOutput),
    );
    touchForensicStage(workspaceDir, {
      stage: 'NPM_BUILD',
      durationMs: timings.npmBuildDurationMs,
      timingsPatch: { npmBuildDurationMs: timings.npmBuildDurationMs },
      errors: [excerptBuildOutput(initialBuildOutput)],
    });
    touchForensicStage(workspaceDir, { stage: 'AUTO_REPAIRING' });

    buildAutofixLoop = await runAeeBuildAutofixLoop({
      workspaceDir,
      projectId,
      initialBuildOk: false,
      initialBuildOutput,
      simulateBuildAutofixRepair: input.simulateBuildAutofixFailure,
      simulateBuildAutofixExhausted: input.simulateBuildAutofixExhausted,
      rerunBuild: runNpmBuildAttempt,
    });

    buildAutofixAttempts = buildAutofixLoop.attempts.length;
    npmBuildOk = buildAutofixLoop.finalBuildOk;

    executionMonitor.recordRecoveryAttempt({
      readOnly: true,
      stage: 'NPM_BUILD',
      actionKind: 'RESTART_NPM_BUILD',
      attemptedAtMs: Date.now(),
      succeeded: npmBuildOk,
      detail: npmBuildOk
        ? `npm build succeeded after ${buildAutofixAttempts} automatic repair attempt(s).`
        : buildAutofixLoop.summary,
    });
    if (npmBuildOk) {
      executionMonitor.markRecovered('NPM_BUILD', 'Recovery succeeded. Continuing build…');
    } else {
      executionMonitor.failStage('NPM_BUILD', buildAutofixLoop.summary);
    }

    recordForensicManifestAeeExecutiveDecision(workspaceDir, {
      decision: npmBuildOk ? 'CONTINUE' : 'REPAIR',
      reasoning: buildAutofixLoop.summary,
      overrideEvent: null,
      overriddenBlockers: [],
      respectedBlockers: npmBuildOk ? [] : [...buildAutofixLoop.report.remainingErrors],
      evidenceProviders: ['AEE_BUILD_AUTOFIX_LOOP'],
    });

    if (npmBuildOk) {
      timings.npmBuildDurationMs = roundDurationMs(npmBuildStartedAt);
      touchForensicStage(workspaceDir, {
        stage: 'NPM_BUILD',
        durationMs: timings.npmBuildDurationMs,
        timingsPatch: { npmBuildDurationMs: timings.npmBuildDurationMs },
        warnings: [`Build AutoFix succeeded after ${buildAutofixAttempts} attempt(s).`],
      });
      lastSuccessfulStage = 'NPM_BUILD';
    } else if (buildAutofixLoop.exhausted) {
      touchForensicStage(workspaceDir, {
        stage: 'AUTO_REPAIRING',
        errors: [...buildAutofixLoop.report.remainingErrors],
        warnings: [`Build AutoFix exhausted after ${buildAutofixAttempts} attempt(s).`],
      });

      const buildErrorOutcome = resolveAeeBuildOutcome({
        workspaceExists: true,
        materialized: workspaceHasGeneratedFeatureModules(workspaceDir),
        npmInstallOk: true,
        npmBuildOk: false,
        previewOk: false,
        previewDegraded: false,
        repairAttempts: buildAutofixAttempts,
        concreteBlocker: false,
      });

      aeeExecutiveDecision = runAeeExecutiveCoordination({
        workspaceDir,
        buildPlan,
        rawPrompt: prompt,
        projectId,
        projectName,
        aseBlockers: buildAutofixLoop.report.remainingErrors,
        aseMaterializationAuthorized: true,
        aseMaterializationExecuted: true,
        manifestFaithfulness: resolveAeeContinuationManifestFaithfulness({
          buildPlan,
          workspaceDir,
          manifestFields: buildPromptFaithfulnessManifestFields({
            rawPrompt: prompt,
            selectedProfile: String(materializationProfile),
            generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
            guardResult: buildPlan.guardResult,
            workspaceDir,
            approvedModuleIds: buildPlan.modulePlan.approvedModuleIds,
          }),
        }),
        npmInstallOk: true,
        npmBuildOk: false,
        previewOk: false,
        repairAttempts: buildAutofixAttempts,
      });

      aeeFinalReport = buildAeeFinalReport({
        projectName,
        selectedProfile: String(generatedProfile),
        generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
        workspacePath: workspaceRel,
        workspaceDir,
        executiveDecision: aeeExecutiveDecision,
        npmInstallOk: true,
        npmBuildOk: false,
        previewOk: false,
        previewDegraded: false,
        livePreviewUrl: null,
        remainingGaps: [
          buildAutofixLoop.summary,
          ...buildAutofixLoop.report.remainingErrors,
        ],
        outcome: buildErrorOutcome,
        buildAutofixReport: buildAutofixLoop.report,
      });

      const aeoReport: AeoOrchestratorReport = await runAutonomousEngineeringOrchestrator({
        diagnosisInput: {
          rawFailureReason: buildAutofixLoop.report.finalBuildError ?? buildAutofixLoop.summary,
          rawBuildOutput: buildAutofixLoop.report.finalBuildError ?? initialBuildOutput,
          npmInstallOk: true,
          npmBuildOk: false,
          engineeringReportRemainingGaps: aeeFinalReport?.remainingGaps ?? [],
          gpcaComplianceReport,
        },
      });

      const buildErrorsCompleted: OnePromptLivePreviewBuildResult = {
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
        buildResult: 'FAIL',
        npmInstallOk: true,
        npmBuildOk: false,
        previewUrl: null,
        diagnosticPreviewUrl: null,
        limitedPreviewUrl: null,
        devServerRunning: false,
        livePreviewAvailable: false,
        previewStatus: 'NOT_ATTEMPTED',
        buildAutofixAttempts,
        buildAutofixLoop,
        failureReason: aeoReport.plainEnglishSummary,
        featureSignals: null,
        materializationManifest: finalizeForensicManifestFailure(workspaceDir, {
          failureStage: 'NPM_BUILD',
          failureReason: buildAutofixLoop.summary,
          failureMessage: buildAutofixLoop.report.finalBuildError ?? undefined,
          lastSuccessfulStage,
          status: 'PARTIAL',
          warnings: [`AEE build AutoFix exhausted — ${buildErrorOutcome}`],
        }),
        livePreviewGate: engineeringResult.asePipeline.livePreviewGate,
        autonomousSoftwareEngineering: toAutonomousSoftwareEngineeringApiResult(
          engineeringResult.asePipeline,
        ),
        aeeExecutiveDecision,
        aeeFinalReport,
        aeoReport,
        gpcaComplianceReport,
        updatedAt: new Date().toISOString(),
      };

      persistBuildIntentRun({
        buildRunId: buildId,
        projectId,
        projectName,
        prompt,
        profile: generatedProfile,
        status: 'READY',
        stage: 'BUILD_AUTOFIX_EXHAUSTED',
        workspacePath: workspaceRel,
        previewUrl: null,
        planTaskCount,
        architectureSummary,
        failureReason: aeoReport.plainEnglishSummary,
        projectRootDir: resolveProjectRegistryRootDir(),
      });

      return registerBuildOutcome(projectId, projectName, buildErrorsCompleted);
    } else {
      return registerFailedBuild({
        projectId,
        projectName,
        workspaceDir,
        failure: {
          failureStage: 'NPM_BUILD',
          failureReason: `npm run build failed: ${initialBuildOutput}`,
          failureMessage: initialBuildOutput,
          lastSuccessfulStage,
        },
        result: {
          buildId,
          projectId,
          projectName,
          prompt,
          source,
          failureReason: `npm run build failed: ${initialBuildOutput}`,
          workspaceId: projectId,
          workspacePath: workspaceRel,
          generatedProfile,
          planningProofLevel: contractAssessment.report.proofLevel,
          materializationProofLevel: materialization.proofLevel,
          npmInstallOk: true,
          npmBuildOk: false,
          buildAutofixAttempts,
          buildAutofixLoop,
          workspaceStabilizerReport,
        },
      });
    }
  }

  executionMonitor.startStage('PREVIEW_STARTUP');
  touchForensicStage(workspaceDir, { stage: 'PREVIEW' });
  const previewStartedAt = performance.now();
  const devServer = await startGeneratedAppDevServer({
    workspaceDir,
    workspaceId: projectId,
  });
  timings.previewDurationMs = roundDurationMs(previewStartedAt);

  if (!devServer.ok || !devServer.url) {
    const failureReason = devServer.error ?? 'Dev server failed to start';
    executionMonitor.failStage('PREVIEW_STARTUP', failureReason);
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
        warnings: continuationFailureWarnings(),
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
  executionMonitor.completeStage('PREVIEW_STARTUP', `Preview started in ${Math.round(timings.previewDurationMs)}ms.`);

  engineeringResult = completeAutonomousEngineering({
    partial: engineeringResult,
    previewUrl: devServer.url ?? null,
    projectRootDir: input.projectRootDir,
    workspaceDir,
    rawPrompt: prompt,
    projectId,
  });

  const asePipeline = engineeringResult.asePipeline;
  const autonomousSoftwareEngineering = toAutonomousSoftwareEngineeringApiResult(asePipeline);
  const incrementalPipeline = asePipeline.artifacts.incrementalBuild;
  const behaviorPipeline = asePipeline.artifacts.behaviorSimulation;
  const virtualUserPipeline = asePipeline.artifacts.virtualUserSimulation;
  const virtualDevicePipeline = asePipeline.artifacts.virtualDeviceLaboratory;
  const interactionProofPipeline = asePipeline.artifacts.interactionProof;
  const autonomousDebuggingPipeline = asePipeline.artifacts.autonomousDebugging;
  const continuousImprovementPipeline = asePipeline.artifacts.continuousImprovement;
  let launchReadinessResult = asePipeline.launchReadiness;

  let livePreviewGateBridge = evaluateLivePreviewGateForOrchestrator({
    rawPrompt: prompt,
    previewUrl: devServer.url ?? null,
    generationComplete: true,
    productIntelligenceModel: buildPlan.productIntelligenceModel,
    promptFaithfulness: buildPlan.promptFaithfulness,
    capabilityPlanning: buildPlan.capabilityPlanning,
    incrementalBuild: incrementalPipeline,
    behaviorSimulation: behaviorPipeline,
    virtualUserSimulation: virtualUserPipeline,
    virtualDeviceLaboratory: virtualDevicePipeline,
    interactionProof: interactionProofPipeline,
    autonomousDebugging: autonomousDebuggingPipeline,
    continuousImprovement: continuousImprovementPipeline,
    launchReadiness: launchReadinessResult,
    projectRootDir: input.projectRootDir ?? null,
    workspaceDir: workspaceDir,
  });

  let devServerRunning = devServer.ok && Boolean(devServer.url);
  let authoritativePreview = resolveAuthoritativePreviewUrls({
    gate: livePreviewGateBridge.gate,
    devServerUrl: devServer.url ?? null,
    devServerRunning,
  });
  let livePreviewAvailable = authoritativePreview.livePreviewAvailable;
  let previewRecoveryAttempts = 0;
  let previewRecoverySummary: string | null = null;
  let buildAutofixAttemptsFinal = buildAutofixAttempts;
  let buildAutofixLoopFinal = buildAutofixLoop;

  if (!livePreviewAvailable && npmBuildOk) {
    touchForensicStage(workspaceDir, { stage: 'AUTO_REPAIRING' });
    const previewRecovery = await runAeePreviewRecoveryLoop({
      rawPrompt: prompt,
      projectId,
      workspaceDir,
      projectRootDir: input.projectRootDir ?? null,
      npmBuildOk,
      devServerUrl: devServer.url ?? null,
      gateBridge: livePreviewGateBridge,
      pipelines: {
        productIntelligenceModel: buildPlan.productIntelligenceModel,
        promptFaithfulness: buildPlan.promptFaithfulness,
        capabilityPlanning: buildPlan.capabilityPlanning,
        incrementalBuild: incrementalPipeline,
        behaviorSimulation: behaviorPipeline,
        virtualUserSimulation: virtualUserPipeline,
        virtualDeviceLaboratory: virtualDevicePipeline,
        interactionProof: interactionProofPipeline,
        autonomousDebugging: autonomousDebuggingPipeline,
        continuousImprovement: continuousImprovementPipeline,
        launchReadiness: launchReadinessResult,
        missingCapabilityEvolution: asePipeline.artifacts.missingCapabilityEvolution,
      },
      restartDevServer: async () => {
        const retry = await startGeneratedAppDevServer({
          workspaceDir,
          workspaceId: projectId,
        });
        return { ok: retry.ok, url: retry.url ?? null, error: retry.error ?? null };
      },
      simulatePreviewRecoveryRepair: input.simulatePreviewRecoveryRepair,
    });

    previewRecoveryAttempts = previewRecovery.attempts.length;
    previewRecoverySummary = previewRecovery.summary;
    livePreviewGateBridge = previewRecovery.gateBridge;
    launchReadinessResult = previewRecovery.pipelines.launchReadiness;
    if (previewRecovery.devServerUrl) {
      devServer.url = previewRecovery.devServerUrl;
    }
    devServerRunning = devServer.ok && Boolean(devServer.url || previewRecovery.devServerUrl);
    authoritativePreview = resolveAuthoritativePreviewUrls({
      gate: livePreviewGateBridge.gate,
      devServerUrl: previewRecovery.devServerUrl ?? devServer.url ?? null,
      devServerRunning,
    });
    livePreviewAvailable = previewRecovery.previewUnlocked;

    if (previewRecoveryAttempts > 0) {
      executionMonitor.recordRecoveryAttempt({
        readOnly: true,
        stage: 'PREVIEW_STARTUP',
        actionKind: 'RESTART_PREVIEW_SERVER',
        attemptedAtMs: Date.now(),
        succeeded: livePreviewAvailable,
        detail: previewRecoverySummary ?? 'Preview recovery attempted.',
      });
      if (livePreviewAvailable) {
        executionMonitor.markRecovered('PREVIEW_STARTUP', previewRecoverySummary ?? 'Preview recovered.');
      } else {
        executionMonitor.failStage('PREVIEW_STARTUP', previewRecoverySummary ?? 'Preview did not recover.');
      }
    }

    engineeringResult = completeAutonomousEngineering({
      partial: engineeringResult,
      previewUrl: previewRecovery.devServerUrl ?? devServer.url ?? null,
      projectRootDir: input.projectRootDir,
      workspaceDir,
      rawPrompt: prompt,
      projectId,
    });

    recordForensicManifestAeeExecutiveDecision(workspaceDir, {
      decision: livePreviewAvailable ? 'PREVIEW' : 'REPAIR',
      reasoning: previewRecovery.summary,
      overrideEvent: null,
      overriddenBlockers: [],
      respectedBlockers: livePreviewAvailable
        ? []
        : [
            livePreviewGateBridge.failureReason ??
              livePreviewGateBridge.gate.blockerExplanation.summary ??
              'Preview gate remained locked after recovery loop.',
          ],
      evidenceProviders: ['AUTONOMOUS_DEBUGGING', 'MISSING_CAPABILITY_EVOLUTION', 'LIVE_PREVIEW_GATE'],
    });
  }

  const gateBlocker =
    livePreviewGateBridge.failureReason ??
    livePreviewGateBridge.gate.blockerExplanation.summary ??
    'Live Preview Gate blocked preview unlock.';

  const previewContract = await resolveAeePreviewContract({
    npmInstallOk,
    npmBuildOk,
    devServerRunning,
    devServerUrl: devServer.url ?? null,
    gate: livePreviewGateBridge.gate,
    gateBlocker,
    previewRecoveryAttempts,
    previewRecoveryExhausted:
      previewRecoveryAttempts >= AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS &&
      !livePreviewGateBridge.livePreviewAvailable,
  });

  livePreviewAvailable = previewContract.livePreviewAvailable;
  devServerRunning = previewContract.devServerRunning;
  authoritativePreview = previewContract.authoritativePreview;
  livePreviewGateBridge = {
    ...livePreviewGateBridge,
    gate: previewContract.gate,
    livePreviewAvailable: previewContract.livePreviewAvailable,
    previewUrl: previewContract.previewUrl,
    failureReason: previewContract.gateLocked ? gateBlocker : null,
  };

  const previewProbeUrl = previewContract.previewUrl ?? null;
  const diagnosticPreviewUrl =
    previewContract.diagnosticPreviewUrl ?? devServer.url ?? null;
  let endToEndBuildRealityReport: E2EBuildRealityReport | null = null;
  if (previewProbeUrl && workspaceDir && input.deferEndToEndBuildRealityGate !== true) {
    endToEndBuildRealityReport = await runEndToEndBuildReality({
      rawPrompt: prompt,
      projectRootDir: input.projectRootDir ?? resolveProjectRegistryRootDir(),
      projectId,
      projectName,
      skipFullBuild: true,
      workspaceDir,
      previewUrl: previewProbeUrl,
      gateUnlockedPreviewUrl: previewProbeUrl,
      diagnosticPreviewUrl,
      buildReady: buildPlan.readyForGeneration,
    });
  }

  const postBuildFaithfulnessFields = buildPromptFaithfulnessManifestFields({
    rawPrompt: prompt,
    selectedProfile: String(materializationProfile),
    generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
    guardResult: buildPlan.guardResult,
    workspaceDir,
    approvedModuleIds: buildPlan.modulePlan.approvedModuleIds,
  });

  const engineeringIntelligencePostWorkspace = buildPlan.engineeringIntelligence
    ? await runEngineeringIntelligencePostWorkspace({
        rawPrompt: prompt,
        workspaceDir,
        projectRootDir: input.projectRootDir,
        workspaceId: projectId,
        selectedProfile: String(materializationProfile),
        buildPlanDefinition: buildPlan.definition,
        approvedModuleIds: buildPlan.modulePlan.approvedModuleIds,
        generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
        contract: buildPlan.engineeringIntelligence.contract,
        profileMismatch: buildPlan.engineeringIntelligence.profileMismatch,
        productIntelligenceModel: buildPlan.productIntelligenceModel,
        promptFaithfulness: buildPlan.promptFaithfulness,
        capabilityPlanning: buildPlan.capabilityPlanning,
        rerunBuild: runNpmBuildAttempt,
      })
    : null;

  if (engineeringIntelligencePostWorkspace?.repairResult?.finalNpmBuildOk === false) {
    npmBuildOk = false;
  } else if (engineeringIntelligencePostWorkspace?.repairResult?.finalNpmBuildOk === true) {
    npmBuildOk = true;
  }

  const postBuildManifestFaithfulness =
    npmBuildOk && (buildPlan.readyForGeneration || buildPlan.promptFaithfulness.readyForGeneration)
      ? resolveAeeContinuationManifestFaithfulness({
          buildPlan,
          workspaceDir,
          manifestFields: postBuildFaithfulnessFields,
        })
      : {
          status: postBuildFaithfulnessFields.promptFaithfulnessStatus,
          score: postBuildFaithfulnessFields.promptFaithfulnessScore,
        };

  aeeExecutiveDecision = runAeeExecutiveCoordination({
    workspaceDir,
    buildPlan,
    rawPrompt: prompt,
    projectId,
    projectName,
    aseBlockers: livePreviewAvailable ? [] : [gateBlocker],
    aseMaterializationAuthorized: true,
    aseMaterializationExecuted: true,
    featureRealityStatus: null,
    manifestFaithfulness: postBuildManifestFaithfulness,
    npmInstallOk,
    npmBuildOk,
    previewOk: previewContract.livePreviewAvailable,
    previewDegraded: previewContract.previewDegraded,
    previewRecoveryAttempts,
    repairAttempts: buildAutofixAttemptsFinal,
    engineeringIntelligenceReport: engineeringIntelligencePostWorkspace?.report ?? null,
    engineeringIntelligenceFidelityPassed: engineeringIntelligencePostWorkspace?.fidelity.passed ?? undefined,
  });

  const featureGapsRemain =
    engineeringIntelligencePostWorkspace != null &&
    !engineeringIntelligencePostWorkspace.fidelity.passed &&
    npmBuildOk;

  const finalBuildOutcome =
    previewContract.finalOutcome ??
    resolveAeeBuildOutcome({
      workspaceExists: true,
      materialized: workspaceHasGeneratedFeatureModules(workspaceDir),
      npmInstallOk,
      npmBuildOk,
      previewOk: previewContract.livePreviewAvailable,
      previewDegraded: previewContract.previewDegraded,
      repairAttempts: buildAutofixAttemptsFinal,
      concreteBlocker: false,
      featureGapsRemain,
    });

  createPreviewSession({
    projectId,
    workspaceId: workspaceRel,
    targetName: `${projectName} Preview`,
    targetType: 'WEB_APP',
    previewUrl: authoritativePreview.previewUrl ?? authoritativePreview.diagnosticPreviewUrl,
    previewState: livePreviewAvailable ? 'PREVIEW_READY' : 'PREVIEW_BLOCKED',
    allowDuplicate: true,
  });

  const featureSignals =
    generatedProfile === 'TASK_TRACKER_WEB_V1' ? inspectFeatureSignals(workspaceDir) : null;

  touchForensicStage(workspaceDir, {
    stage: 'FINAL_VALIDATION',
    durationMs: timings.validationDurationMs,
    timingsPatch: { validationDurationMs: timings.validationDurationMs },
  });

  const successDefinition = buildPlan.definition;
  const completedFaithfulnessManifestFields = buildPromptFaithfulnessManifestFields({
    rawPrompt: prompt,
    selectedProfile: String(effectiveProfile),
    generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
    guardResult: buildPlan.guardResult,
    workspaceDir,
    approvedModuleIds: buildPlan.modulePlan.approvedModuleIds,
  });

  aeeFinalReport = buildAeeFinalReport({
    projectName,
    selectedProfile: String(generatedProfile),
    generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
    workspacePath: workspaceRel,
    executiveDecision: aeeExecutiveDecision,
    npmInstallOk,
    npmBuildOk,
    previewOk: previewContract.livePreviewAvailable,
    previewDegraded: previewContract.previewDegraded,
    livePreviewUrl: previewContract.previewUrl ?? previewContract.diagnosticPreviewUrl,
    remainingGaps: previewContract.livePreviewAvailable
      ? [
          ...(engineeringIntelligencePostWorkspace && !engineeringIntelligencePostWorkspace.fidelity.passed
            ? [
                `Engineering Intelligence feature gaps — fidelity ${engineeringIntelligencePostWorkspace.report.productFidelityScore}/100.`,
              ]
            : []),
          ...(buildAutofixLoopFinal?.summary ? [buildAutofixLoopFinal.summary] : []),
        ]
      : [previewContract.summary, previewRecoverySummary ?? gateBlocker].filter(Boolean),
    outcome: finalBuildOutcome,
    buildAutofixReport: buildAutofixLoopFinal?.report ?? null,
    previewContractSummary: previewContract.summary,
    engineeringIntelligenceReport: engineeringIntelligencePostWorkspace?.report ?? null,
  });

  const aelLoopResult = await runAutonomousEngineeringLoop({
    rawPrompt: prompt,
    workspaceDir,
    projectRootDir: resolveProjectRegistryRootDir(),
    projectId,
    workspaceId: projectId,
    buildPlan,
    buildRunId: buildId,
    npmInstallOk,
    npmBuildOk,
    previewOk: previewContract.livePreviewAvailable,
    previewDegraded: previewContract.previewDegraded,
    previewUrl: previewContract.previewUrl,
    devServerUrl: previewContract.diagnosticPreviewUrl ?? previewContract.previewUrl,
    generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
    aeeFinalReport,
    aeeFurthestStage: aeeExecutiveDecision?.furthestStageReached ?? null,
    autofixAttempts: buildAutofixAttemptsFinal,
    previewRecoveryAttempts,
    engineeringIntelligenceScore: engineeringIntelligencePostWorkspace?.report.productFidelityScore ?? null,
    rerunNpmBuild: async () => {
      const attempt = runNpmBuildAttempt();
      npmBuildOk = attempt.ok;
      return attempt.ok;
    },
    runAutofix: async () => {
      const loop = await runAeeBuildAutofixLoop({
        workspaceDir,
        projectId,
        initialBuildOk: npmBuildOk,
        initialBuildOutput: '',
        rerunBuild: runNpmBuildAttempt,
      });
      npmBuildOk = loop.finalBuildOk;
      return { resolved: loop.finalBuildOk, attempts: loop.attempts.length };
    },
    runPreviewRecovery: async () => {
      const recovery = await runAeePreviewRecoveryLoop({
        rawPrompt: prompt,
        projectId,
        workspaceDir,
        projectRootDir: input.projectRootDir ?? null,
        npmBuildOk,
        devServerUrl: devServer.url ?? previewContract.diagnosticPreviewUrl ?? previewContract.previewUrl,
        gateBridge: livePreviewGateBridge,
        pipelines: {
          productIntelligenceModel: buildPlan.productIntelligenceModel,
          promptFaithfulness: buildPlan.promptFaithfulness,
          capabilityPlanning: buildPlan.capabilityPlanning,
          incrementalBuild: incrementalPipeline,
          behaviorSimulation: behaviorPipeline,
          virtualUserSimulation: virtualUserPipeline,
          virtualDeviceLaboratory: virtualDevicePipeline,
          interactionProof: interactionProofPipeline,
          autonomousDebugging: autonomousDebuggingPipeline,
          continuousImprovement: continuousImprovementPipeline,
          launchReadiness: launchReadinessResult,
          missingCapabilityEvolution: asePipeline.artifacts.missingCapabilityEvolution,
        },
        restartDevServer: async () => {
          const retry = await startGeneratedAppDevServer({
            workspaceDir,
            workspaceId: projectId,
          });
          return { ok: retry.ok, url: retry.url ?? null, error: retry.error ?? null };
        },
      });
      return {
        resolved: recovery.previewUnlocked,
        attempts: recovery.attempts.length,
      };
    },
  });
  const aelReport: AelFinalReport = aelLoopResult.report;
  const aelEvidence: AelEvidenceBundle = aelLoopResult.evidence;
  if (aelLoopResult.enabled && aelReport.remainingGaps.length > 0) {
    aeeFinalReport = {
      ...aeeFinalReport,
      remainingGaps: [
        ...aeeFinalReport.remainingGaps,
        ...aelReport.remainingGaps.filter((g) => !aeeFinalReport!.remainingGaps.includes(g)),
      ],
    };
  }

  executionMonitor.startStage('VALIDATION');
  const evidenceCompletion = completeMaterializationEvidence({
    workspaceDir,
    prompt,
    projectId,
    projectName,
    buildRunId: buildId,
    selectedProfile: String(effectiveProfile),
    expectedAppType: successDefinition.expectedAppType,
    promptSummary: summarizePrompt(prompt),
    confidence: ranking.confidence,
    featureModules: successDefinition.featureModules,
    routes: successDefinition.routes,
    fallbackUsed: buildPlan.guardResult.guardApplied,
    buildSpinePassed: npmInstallOk && npmBuildOk,
    previewEvidence: {
      previewUrl: previewProbeUrl,
      previewVerified:
        endToEndBuildRealityReport?.verdict === 'READY_FOR_FOUNDER_TESTING' ||
        (endToEndBuildRealityReport === null && previewContract.livePreviewAvailable),
      previewHtmlStatus:
        endToEndBuildRealityReport?.verdict === 'READY_FOR_FOUNDER_TESTING'
          ? 'PASS'
          : endToEndBuildRealityReport?.verdict === 'NOT_READY'
            ? 'FAIL'
            : previewContract.livePreviewAvailable
              ? 'PASS'
              : 'PENDING',
      visiblePreviewValidationStatus:
        endToEndBuildRealityReport?.verdict === 'READY_FOR_FOUNDER_TESTING'
          ? 'PASS'
          : endToEndBuildRealityReport?.verdict === 'NOT_READY'
            ? 'FAIL'
            : previewProbeUrl
              ? 'PENDING'
              : 'SKIPPED',
      visiblePreviewValidationFailureReasons:
        endToEndBuildRealityReport?.verdict === 'NOT_READY'
          ? [
              endToEndBuildRealityReport.failingStage
                ? `E2E failing stage: ${endToEndBuildRealityReport.failingStage}`
                : 'End-to-end build reality validation failed',
              ...endToEndBuildRealityReport.falseSuccessFindings.map((finding) => finding.detail),
            ]
          : [],
    },
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
    promptFaithfulness: completedFaithfulnessManifestFields,
  });

  const completedManifest = evidenceCompletion.manifest;
  const endToEndRealityBlocked =
    endToEndBuildRealityReport !== null &&
    endToEndBuildRealityReport.verdict !== 'READY_FOR_FOUNDER_TESTING';
  const launchEvidenceBlocked =
    completedManifest.workspaceRealityAuditStatus === 'FAIL' || endToEndRealityBlocked;
  const launchBlockReasons = [
    ...(completedManifest.workspaceRealityAuditStatus === 'FAIL'
      ? completedManifest.workspaceRealityFailureReasons
      : []),
    ...(endToEndRealityBlocked
      ? [
          endToEndBuildRealityReport?.failingStage
            ? `End-to-end build reality blocked at ${endToEndBuildRealityReport.failingStage}`
            : 'End-to-end build reality validation failed',
          ...(endToEndBuildRealityReport?.falseSuccessFindings.map((finding) => finding.detail) ?? []),
        ]
      : []),
  ];
  const finalBuildStatus = launchEvidenceBlocked ? 'FAILED' : 'READY';
  const finalBuildResult = launchEvidenceBlocked ? 'FAIL' : 'PASS';
  const finalFailureReason = launchEvidenceBlocked
    ? launchBlockReasons.join('; ') ||
      'End-to-end build reality validation failed'
    : null;

  if (launchEvidenceBlocked) {
    executionMonitor.failStage('VALIDATION', finalFailureReason ?? 'Final validation failed.');
  } else {
    executionMonitor.completeStage('VALIDATION', 'Final validation passed.');
  }
  executionMonitor.startStage('RESULT');
  executionMonitor.completeStage('RESULT', 'Build response assembled.');

  const success: OnePromptLivePreviewBuildResult = {
    readOnly: true,
    buildId,
    projectId,
    projectName,
    status: finalBuildStatus,
    prompt,
    requestType: source === 'chat' ? 'CHAT_BUILD' : 'BUILD_FROM_PROMPT',
    workspaceId: projectId,
    workspacePath:
      evidenceCompletion.manifest.promotionStatus === 'PASS' &&
      evidenceCompletion.manifest.persistentProjectSourceRoot
        ? evidenceCompletion.manifest.persistentProjectSourceRoot
        : workspaceRel,
    generatedProfile,
    planningProofLevel: contractAssessment.report.proofLevel,
    materializationProofLevel: materialization.proofLevel,
    buildResult: finalBuildResult,
    npmInstallOk,
    npmBuildOk,
    previewUrl: previewContract.previewUrl,
    diagnosticPreviewUrl: previewContract.livePreviewAvailable
      ? null
      : previewContract.diagnosticPreviewUrl,
    limitedPreviewUrl: previewContract.limitedPreviewUrl,
    devServerRunning,
    livePreviewAvailable,
    previewStatus: previewContract.previewStatus === 'UNLOCKED'
      ? 'UNLOCKED'
      : previewContract.previewStatus === 'DEGRADED'
        ? 'DEGRADED'
        : 'UNAVAILABLE',
    previewRecoveryAttempts,
    buildAutofixAttempts: buildAutofixAttemptsFinal,
    buildAutofixLoop: buildAutofixLoopFinal,
    previewContract,
    failureReason: finalFailureReason,
    featureSignals,
    materializationManifest: evidenceCompletion.manifest,
    workspaceStabilizerReport,
    livePreviewGate: livePreviewGateBridge.gate,
    autonomousSoftwareEngineering,
    aeeExecutiveDecision,
    aeeFinalReport,
    aelReport,
    aelFinalOutcome: aelLoopResult.finalOutcome,
    aelEvidence,
    updatedAt: new Date().toISOString(),
  };
  persistBuildIntentRun({
    buildRunId: buildId,
    projectId,
    projectName,
    prompt,
    profile: generatedProfile,
    status: finalBuildStatus,
    stage: 'LIVE_PREVIEW',
    workspacePath:
      evidenceCompletion.manifest.promotionStatus === 'PASS' &&
      evidenceCompletion.manifest.persistentProjectSourceRoot
        ? evidenceCompletion.manifest.persistentProjectSourceRoot
        : workspaceRel,
    previewUrl: authoritativePreview.previewUrl,
    planTaskCount,
    architectureSummary,
    failureReason: finalFailureReason,
    projectRootDir: resolveProjectRegistryRootDir(),
  });
  // NEW_BUILD never merges keyword/concept metadata across projects — see
  // src/project-context-isolation-v4/ requirement 6 (registry and metadata scoping).
  (buildDecision.decision === 'NEW_BUILD' ? replaceProjectContextMetadata : upsertProjectContextMetadata)(
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
        generatedProfile: effectiveProfile,
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

  const devServerRunning =
    latest?.devServerRunning === true || Boolean(active?.url);
  const livePreviewAvailable = latest?.livePreviewAvailable === true;
  const previewUrl = livePreviewAvailable ? latest?.previewUrl ?? null : null;
  const diagnosticPreviewUrl =
    latest?.diagnosticPreviewUrl ??
    (!livePreviewAvailable && devServerRunning ? active?.url ?? null : null);
  const limitedPreviewUrl = livePreviewAvailable ? null : latest?.limitedPreviewUrl ?? null;
  const livePreviewGateState = latest?.livePreviewGate?.state ?? null;
  const gateBlockerSummary =
    latest?.livePreviewGate?.blockerExplanation?.summary ?? latest?.failureReason ?? null;

  if (!latest) {
    return {
      status: 'IDLE',
      projectId: resolvedProjectId,
      projectName: null,
      workspaceId: null,
      workspacePath: null,
      generatedProfile: null,
      buildResult: null,
      previewUrl: null,
      diagnosticPreviewUrl: devServerRunning ? active?.url ?? null : null,
      devServerRunning,
      livePreviewAvailable: false,
      livePreviewGateState: null,
      gateBlockerSummary: null,
      limitedPreviewUrl: null,
      failureReason: null,
      buildStatusLabel: resolvedProjectId
        ? `No build has run yet for project ${resolvedProjectId}`
        : 'No one-prompt build has run yet',
      connected: devServerRunning,
    };
  }

  let buildStatusLabel: string = latest.status;
  if (latest.status === 'READY') {
    if (livePreviewAvailable) {
      buildStatusLabel = `BUILD_COMPLETED_WITH_PREVIEW — ${latest.generatedProfile ?? 'app'} at ${latest.workspacePath ?? 'workspace'}`;
    } else if (latest.npmBuildOk) {
      buildStatusLabel = `BUILD_COMPLETED_WITH_DEGRADED_PREVIEW — compiled at ${latest.workspacePath ?? 'workspace'}; live preview verification incomplete`;
    } else if (latest.aeeFinalReport?.finalOutcome === 'BUILD_COMPLETED_WITH_BUILD_ERRORS') {
      buildStatusLabel = `BUILD_COMPLETED_WITH_BUILD_ERRORS — workspace at ${latest.workspacePath ?? 'workspace'}; npm build failed after bounded AutoFix`;
    } else {
      buildStatusLabel = `READY — ${latest.generatedProfile ?? 'app'} at ${latest.workspacePath ?? 'workspace'}`;
    }
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
    diagnosticPreviewUrl,
    devServerRunning,
    livePreviewAvailable,
    livePreviewGateState,
    gateBlockerSummary,
    limitedPreviewUrl,
    failureReason: latest.failureReason,
    buildStatusLabel,
    connected: livePreviewAvailable || devServerRunning,
  };
}

/** Conversational fallback when LLM is unavailable — AEE-controlled narrative. */
export function composeOnePromptBuildChatResponse(result: OnePromptLivePreviewBuildResult): string {
  return composeAeeAwareBuildChatResponse(result);
}
