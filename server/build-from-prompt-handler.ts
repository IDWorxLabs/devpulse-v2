/**
 * Build-from-prompt API — one-prompt live preview for AiDevEngine.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BUILD_FROM_PROMPT_API_PATH,
  BUILD_LIVE_PREVIEW_STATUS_API_PATH,
  getActiveBuildExecutionMonitor,
  getLastOnePromptLivePreviewBuildResult,
  getOnePromptLivePreviewPublicState,
  listGeneratedDevServers,
  runOnePromptLivePreviewBuild,
  setActiveProjectId,
} from '../src/one-prompt-live-preview/index.js';
import { buildExecutionReport } from '../src/build-execution-stabilizer-v1/index.js';
import type { BuildExecutionReport } from '../src/build-execution-stabilizer-v1/index.js';
import { listMultiProjectWorkspaces } from '../src/one-prompt-live-preview/workspace-tab-registry.js';
import {
  executeChatToBuildBridge,
  CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
  CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
} from '../src/chat-to-build-execution-bridge-v1/index.js';
import { resolveProjectRegistryRootDir } from '../src/project-registry-v1/project-registry-v1-store.js';
import {
  bootstrapFreshProjectForBuilderTest,
  composeMinimalBuilderTestConsoleResponse,
  resolveBuilderTestProjectName,
  resolveBuilderTestPrompt,
} from '../src/minimal-builder-test-console-v1/index.js';
import { ProjectNameConflictRejectedError } from '../src/project-name-conflict-resolution-v1/index.js';
import {
  enrichBuildPayloadWithProjectSession,
  finalizeProjectSessionAfterBuild,
} from '../src/project-session-continuity-v1/index.js';
import {
  normalizeOnePromptBuildResult,
  deriveMaterializationManifestHints,
  evaluateProductFaithfulnessForBuild,
  evaluateGenerationFaithfulnessForBuild,
} from '../src/build-result-normalizer-v1/index.js';
import {
  runLivePreviewInteractionProof,
  LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT,
} from '../src/live-preview-interaction-proof-v1/index.js';
import type { LivePreviewInteractionProofReport } from '../src/live-preview-interaction-proof-v1/index.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';
import type { ProductFaithfulnessReport } from '../src/product-faithfulness-v1/index.js';
import type { GenerationFaithfulnessReport } from '../src/product-faithfulness-v2/index.js';
import {
  BUILD_MAX_BODY_BYTES,
  RequestBodyTooLargeError,
  readRequestBody,
} from './brain-api-handler.js';
import {
  buildFreshBuildArtifactIsolationReportSection,
  runBuildArtifactStalenessCheck,
  type EvidenceCandidate,
  type FreshBuildArtifactIsolationReportSection,
} from '../src/fresh-build-artifact-isolation-v4/index.js';
import {
  applyRealProductionPathProjectionToBuild,
  applyRealProductionPathProjectionToNormalizedBuild,
  buildRealProductionPathResponseEnvelope,
} from '../src/production-surface-integration/real-production-path-response.js';

/**
 * Product Stabilization Phase 2 — proves whether the generated app is actually usable inside
 * its live preview, not just that a previewUrl exists. Bounded and safe to call unconditionally:
 * the engine itself returns PREVIEW_INTERACTION_BLOCKED immediately when no preview is available,
 * without touching Playwright.
 */
async function runInteractionProofForBuild(
  result: OnePromptLivePreviewBuildResult,
): Promise<LivePreviewInteractionProofReport> {
  const monitor = getActiveBuildExecutionMonitor(result.projectId);
  monitor?.startStage('INTERACTION_PROOF');
  try {
    const report = await runLivePreviewInteractionProof({
      previewUrl: result.previewUrl,
      devServerRunning: result.devServerRunning,
      prompt: result.prompt,
      materializationManifestHints: deriveMaterializationManifestHints(result.materializationManifest),
    });
    if (monitor) {
      if (report.result === 'PREVIEW_INTERACTION_FAIL') {
        monitor.failStage('INTERACTION_PROOF', report.summary.headline);
      } else {
        monitor.completeStage('INTERACTION_PROOF', report.summary.headline);
      }
    }
    return report;
  } catch (err) {
    monitor?.failStage('INTERACTION_PROOF', err instanceof Error ? err.message : String(err));
    const message = err instanceof Error ? err.message : String(err);
    return {
      readOnly: true,
      contractVersion: LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT,
      result: 'PREVIEW_INTERACTION_BLOCKED',
      evidence: {
        readOnly: true,
        previewUrl: result.previewUrl,
        pageLoaded: false,
        loadErrorDetail: null,
        consoleErrors: [],
        fatalConsoleErrorDetected: false,
        rootUiFound: false,
        primaryFeatureTextFound: null,
        candidateTermsTried: [],
        plannedInteractions: [],
        interactionAttempts: [],
        durationMs: 0,
        blockedReason: `The live preview proof could not run: ${message}`,
      },
      summary: {
        readOnly: true,
        headline: 'AiDevEngine could not run the live preview proof.',
        whatLoaded: [],
        whatWasTested: [],
        whatWorked: [],
        whatFailed: [`The live preview proof could not run: ${message}`],
        suggestedRepair: [],
      },
    };
  }
}

/**
 * Product Stabilization Phase 4 — the execution report is finalized once interaction proof (which
 * runs after the orchestrator returns) has recorded its stage, so the API response always reflects
 * the full, real execution timeline rather than a snapshot taken mid-build.
 */
function resolveBuildExecutionReport(projectId: string): BuildExecutionReport | null {
  const monitor = getActiveBuildExecutionMonitor(projectId);
  return monitor ? buildExecutionReport(monitor) : null;
}

/**
 * Product Faithfulness Milestone 1 — a build compiling and previewing is a separate question
 * from whether it is the product the user actually asked for. Evaluated after interaction proof
 * so the real running-app evidence (primary feature text, what worked/failed) is available too.
 * Deterministic and evidence-only: never invents evidence, never calls an LLM.
 */
function evaluateProductFaithfulness(
  result: OnePromptLivePreviewBuildResult,
  livePreviewInteractionProof: LivePreviewInteractionProofReport,
): ProductFaithfulnessReport | null {
  return evaluateProductFaithfulnessForBuild(result, livePreviewInteractionProof);
}

/**
 * Product Faithfulness Milestone 2 — goes beyond comparing the finished app: audits every
 * evidenced generation stage (architecture, feature contract, generated modules, routes,
 * navigation, manifest, preview DOM) against the canonical product contract built from the
 * original prompt, and attempts minimal, targeted repair before reporting. Deterministic and
 * evidence-only, same as Milestone 1.
 */
function evaluateGenerationFaithfulness(
  result: OnePromptLivePreviewBuildResult,
  livePreviewInteractionProof: LivePreviewInteractionProofReport,
): GenerationFaithfulnessReport | null {
  return evaluateGenerationFaithfulnessForBuild(result, livePreviewInteractionProof);
}

/**
 * Fresh Build Artifact Isolation V4 — validates the evidence a fresh build's result is about to
 * hand to product faithfulness / live preview proof / report rendering against the runtime
 * evidence scope minted for this exact build, *before* those consumers run. Returns null when the
 * orchestrator did not attach a scope (older/direct call paths) so behavior is unchanged there.
 */
export function finalizeBuildFromPromptPayload(input: {
  build: OnePromptLivePreviewBuildResult;
  livePreviewInteractionProof: LivePreviewInteractionProofReport;
  executionReport: BuildExecutionReport | null;
  productFaithfulness: ProductFaithfulnessReport | null;
  generationFaithfulness: GenerationFaithfulnessReport | null;
}) {
  const projectedBuild = applyRealProductionPathProjectionToBuild(input.build);
  const normalizedBuild = normalizeOnePromptBuildResult(
    projectedBuild,
    input.livePreviewInteractionProof,
    input.executionReport,
    input.productFaithfulness,
    input.generationFaithfulness,
  );
  const productionPath = buildRealProductionPathResponseEnvelope({
    build: projectedBuild,
    normalizedBuild,
    executionReport: input.executionReport,
    generationFaithfulness: input.generationFaithfulness,
  });
  return {
    build: projectedBuild,
    normalizedBuild: applyRealProductionPathProjectionToNormalizedBuild(normalizedBuild, productionPath),
    productionPath,
  };
}

function buildFreshBuildArtifactIsolationSectionForResult(
  result: OnePromptLivePreviewBuildResult,
): FreshBuildArtifactIsolationReportSection | null {
  const scope = result.runtimeEvidenceScope;
  if (!scope) return null;

  const createdAt = result.updatedAt;
  const candidates: EvidenceCandidate[] = [];
  if (result.materializationManifest) {
    candidates.push({
      evidenceKind: 'MATERIALIZATION_MANIFEST',
      metadata: {
        requestId: scope.requestId,
        buildId: scope.buildId,
        projectId: scope.projectId,
        promptHash: scope.promptHash,
        productIdentity: result.projectName,
        createdAt,
        evidenceKind: 'MATERIALIZATION_MANIFEST',
      },
    });
  }
  if (result.workspacePath) {
    candidates.push({
      evidenceKind: 'WORKSPACE_PATH_REFERENCE',
      metadata: {
        requestId: scope.requestId,
        buildId: scope.buildId,
        projectId: scope.projectId,
        promptHash: scope.promptHash,
        productIdentity: result.projectName,
        createdAt,
        evidenceKind: 'WORKSPACE_PATH_REFERENCE',
      },
      workspacePathReferenced: result.workspacePath,
    });
  }

  const stalenessResult = runBuildArtifactStalenessCheck({ scope, evidenceObjects: candidates });
  return buildFreshBuildArtifactIsolationReportSection({
    scope,
    stalenessResult,
    uiStateClearedForFreshBuild: true,
    productFaithfulnessUsedOnlyCurrentBuildEvidence: stalenessResult.passed,
  });
}

const ROOT_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function sendBuildJson(
  res: ServerResponse,
  status: number,
  payload: unknown,
  extraHeaders?: Record<string, string>,
): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'one-prompt-live-preview',
    'X-DevPulse-Phase': '27.3',
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

export async function handleBuildFromPromptRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const raw = await readRequestBody(req, BUILD_MAX_BODY_BYTES);
    const body = JSON.parse(raw) as {
      prompt?: string;
      message?: string;
      projectId?: string;
      projectName?: string;
      name?: string;
      requestedName?: string;
      forceFreshProject?: boolean;
      confirmProjectContextAlignment?: boolean;
      confirmProjectResume?: boolean;
      confirmFreshCopy?: boolean;
      rejectDuplicates?: boolean;
      resumeAction?: 'RESUME_BUILD' | 'REPAIR_BUILD' | 'CONTINUE_FROM_PROMPT';
      forceBuildIntent?: boolean;
      /**
       * NEW_BUILD_CONFIRMATION_REQUIRED UX V4 — explicit build intent chosen by the user on the
       * "Confirm build context" panel, resubmitted with the same prompt. See
       * src/project-context-isolation-v4/.
       */
      buildIntentOverride?: 'START_NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT';
    };
    const forceFreshProject = body.forceFreshProject === true;
    const rejectDuplicates = body.rejectDuplicates === true;
    let prompt = resolveBuilderTestPrompt(body);

    if (!prompt && !body.projectId && !body.confirmProjectResume && !forceFreshProject) {
      sendBuildJson(res, 400, { error: 'prompt or message is required' });
      return;
    }

    if (forceFreshProject) {
      if (!prompt) {
        sendBuildJson(res, 400, { error: 'prompt is required when forceFreshProject is true' });
        return;
      }

      const registryRoot = resolveProjectRegistryRootDir();
      const sessionBootstrap = bootstrapFreshProjectForBuilderTest({
        rawPrompt: prompt,
        projectName: resolveBuilderTestProjectName(body, prompt),
        rootDir: registryRoot,
      });

      const result = await runOnePromptLivePreviewBuild({
        rawPrompt: prompt,
        projectRootDir: ROOT_DIR,
        source: 'api',
        projectId: sessionBootstrap.projectId,
        projectName: sessionBootstrap.projectName,
        resumeExistingProject: false,
        buildDecisionKind: 'NEW_BUILD',
        freshProjectContextCreated: true,
      });

      finalizeProjectSessionAfterBuild({
        projectId: sessionBootstrap.projectId,
        sessionId: sessionBootstrap.sessionId,
        buildResult: result,
        userMessage: prompt,
        rootDir: registryRoot,
      });

      // Fresh Build Artifact Isolation V4 — the staleness check runs against the freshly-minted
      // runtime evidence scope *before* product faithfulness / live preview proof consume `result`,
      // so any blocked evidence can never reach those downstream evaluators or the UI.
      const freshBuildArtifactIsolation = buildFreshBuildArtifactIsolationSectionForResult(result);
      const livePreviewInteractionProof = await runInteractionProofForBuild(result);
      const executionReport = resolveBuildExecutionReport(result.projectId);
      const productFaithfulness = evaluateProductFaithfulness(result, livePreviewInteractionProof);
      const generationFaithfulness = evaluateGenerationFaithfulness(result, livePreviewInteractionProof);
      const finalized = finalizeBuildFromPromptPayload({
        build: result,
        livePreviewInteractionProof,
        executionReport,
        productFaithfulness,
        generationFaithfulness,
      });
      sendBuildJson(
        res,
        200,
        {
          ...composeMinimalBuilderTestConsoleResponse({
            sessionBootstrap,
            build: finalized.build,
            envelope: {
              endpoint: BUILD_FROM_PROMPT_API_PATH,
              activeProjectId: finalized.build.projectId,
              livePreview: getOnePromptLivePreviewPublicState(finalized.build.projectId),
              multiProjectWorkspaces: listMultiProjectWorkspaces(),
            },
          }),
          build: finalized.build,
          normalizedBuild: finalized.normalizedBuild,
          productionPath: finalized.productionPath,
          progressItems: finalized.productionPath.progressItems,
          executionTimeline: finalized.productionPath.timeline.events.map((event) => ({
            readOnly: true,
            stage: event.stageId,
            state: event.state,
            startedAtMs: 0,
            endedAtMs: null,
            durationMs: null,
            detail: event.detail,
          })),
          livePreviewInteractionProof,
          productFaithfulness,
          generationFaithfulness,
          workspaceMaterializationStatus: result.workspaceStabilizerReport?.status ?? null,
          buildExecutionStatus: finalized.productionPath.executionStatus,
          executionRecovery: executionReport?.recoveryAttempts ?? [],
          freshBuildArtifactIsolation,
        },
      );
      return;
    }

    if (body.projectId) {
      setActiveProjectId(body.projectId);
    }

    const registryRoot = resolveProjectRegistryRootDir();
    const bridgeResult = await executeChatToBuildBridge({
      message: prompt ?? '',
      source: 'api',
      activeProjectId: body.projectId ?? null,
      projectName: body.projectName ?? body.name ?? body.requestedName ?? null,
      confirmProjectContextAlignment: body.confirmProjectContextAlignment === true,
      confirmProjectResume: body.confirmProjectResume === true,
      confirmFreshCopy: body.confirmFreshCopy === true,
      rejectDuplicates,
      resumeAction: body.resumeAction,
      forceBuildIntent: body.forceBuildIntent === true,
      buildIntentOverride: body.buildIntentOverride ?? null,
      rootDir: registryRoot,
      repoRootDir: ROOT_DIR,
    });

    if (bridgeResult.kind === 'ALIGNMENT_REQUIRED' && bridgeResult.alignmentPayload) {
      sendBuildJson(res, 200, bridgeResult.alignmentPayload, {
        'X-DevPulse-Alignment': 'BLOCKED',
        'X-DevPulse-Chat-To-Build-Bridge': CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
      });
      return;
    }

    if (bridgeResult.kind === 'RESUME_REQUIRED' && bridgeResult.resumePayload) {
      sendBuildJson(res, 409, {
        ok: false,
        ...bridgeResult.resumePayload,
        chatToBuildExecutionBridge: {
          contractVersion: CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
          trace: CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
          kind: bridgeResult.kind,
        },
      });
      return;
    }

    if (bridgeResult.kind === 'NEW_BUILD_CONFIRMATION_REQUIRED') {
      // Project Context Isolation V4 — the New Build Decision Authority could not determine
      // whether this is a new app or a continuation from current-request evidence alone (or an
      // explicit buildIntentOverride=CONTINUE_EXISTING_PROJECT was rejected as unsafe). Stop
      // before generation rather than silently building on stale/ambiguous context, and return
      // the deterministic, structured NEW_BUILD_CONFIRMATION_REQUIRED shape (never the generic
      // "Build request failed (HTTP 409)" the frontend would otherwise show for an unknown 409).
      sendBuildJson(res, 409, {
        ok: false,
        ...(bridgeResult.newBuildConfirmationPayload ?? {}),
        chatToBuildExecutionBridge: {
          contractVersion: CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
          trace: CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
          kind: bridgeResult.kind,
        },
      });
      return;
    }

    // Prefer the orchestrator build result; fall back to the synthetic failure result embedded in
    // brainPayload when the bridge catch path could not attach buildResult (still a real acceptance
    // of the prompt — never collapse that into an opaque transport-looking 400).
    const bridgeBuildResult =
      bridgeResult.buildResult ??
      ((bridgeResult.brainPayload?.onePromptLivePreview as OnePromptLivePreviewBuildResult | undefined) ??
        null);

    if (bridgeBuildResult && bridgeResult.brainPayload) {
      const result = bridgeBuildResult;
      // Fresh Build Artifact Isolation V4 — same ordering guarantee as the forceFreshProject path
      // above: freshness is checked before this evidence is handed to faithfulness/proof.
      const freshBuildArtifactIsolation = buildFreshBuildArtifactIsolationSectionForResult(result);
      const livePreviewInteractionProof = await runInteractionProofForBuild(result);
      const executionReport = resolveBuildExecutionReport(result.projectId);
      const productFaithfulness = evaluateProductFaithfulness(result, livePreviewInteractionProof);
      const generationFaithfulness = evaluateGenerationFaithfulness(result, livePreviewInteractionProof);
      const finalized = finalizeBuildFromPromptPayload({
        build: result,
        livePreviewInteractionProof,
        executionReport,
        productFaithfulness,
        generationFaithfulness,
      });
      sendBuildJson(
        res,
        200,
        enrichBuildPayloadWithProjectSession(
          {
            ok: finalized.productionPath.buildStatus === 'READY',
            endpoint: BUILD_FROM_PROMPT_API_PATH,
            activeProjectId: finalized.build.projectId,
            build: finalized.build,
            normalizedBuild: finalized.normalizedBuild,
            productionPath: finalized.productionPath,
            progressItems: finalized.productionPath.progressItems,
            livePreviewInteractionProof,
            productFaithfulness,
            generationFaithfulness,
            workspaceMaterializationStatus: result.workspaceStabilizerReport?.status ?? null,
            buildExecutionStatus: finalized.productionPath.executionStatus,
            executionTimeline: finalized.productionPath.timeline.events.map((event) => ({
              readOnly: true,
              stage: event.stageId,
              state: event.state,
              startedAtMs: 0,
              endedAtMs: null,
              durationMs: null,
              detail: event.detail,
            })),
            executionRecovery: executionReport?.recoveryAttempts ?? [],
            livePreview: getOnePromptLivePreviewPublicState(finalized.build.projectId),
            multiProjectWorkspaces: listMultiProjectWorkspaces(),
            chatToBuildExecutionBridge: {
              contractVersion: CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
              trace: CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
              kind: bridgeResult.kind,
              progressItems: finalized.productionPath.progressItems,
              engineeringReport: bridgeResult.engineeringReport ?? null,
            },
            engineeringReport: bridgeResult.engineeringReport ?? null,
            executionTraceEvents: bridgeResult.brainPayload.executionTraceEvents,
            freshBuildArtifactIsolation,
          },
          registryRoot,
        ),
        { 'X-DevPulse-Chat-To-Build-Bridge': CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE },
      );
      return;
    }

    if (bridgeResult.kind === 'CHAT_ONLY') {
      sendBuildJson(res, 400, {
        ok: false,
        error: 'Build intent was not detected for this prompt.',
        code: 'BUILD_REQUEST_REJECTED',
        bridgeKind: bridgeResult.kind,
        progressItems: bridgeResult.progressItems ?? [],
        recoveryAction: 'Rephrase as an explicit app-build request, or retry Build (forceBuildIntent is already set by the V4 UI).',
      });
      return;
    }

    sendBuildJson(res, 400, {
      ok: false,
      error: 'Build bridge did not produce a build result.',
      code: 'BUILD_REQUEST_REJECTED',
      bridgeKind: bridgeResult.kind,
      progressItems: bridgeResult.progressItems ?? [],
      recoveryAction: 'Check server logs for the bridge failure, then retry Build.',
    });
  } catch (err) {
    if (err instanceof RequestBodyTooLargeError) {
      sendBuildJson(res, 413, {
        ok: false,
        error:
          'Build prompt payload is too large for this server. Shorten the prompt or raise BUILD_MAX_BODY_BYTES.',
        code: 'PAYLOAD_TOO_LARGE',
        maxBodyBytes: err.maxBytes,
        endpoint: BUILD_FROM_PROMPT_API_PATH,
        recoveryAction: 'Reduce prompt size or restart AiDevEngine with the updated body limit, then retry Build.',
      });
      return;
    }
    if (err instanceof ProjectNameConflictRejectedError) {
      sendBuildJson(res, 409, {
        ok: false,
        error: err.message,
        projectIdentity: err.identity,
        rejectDuplicates: true,
      });
      return;
    }
    const message = err instanceof Error ? err.message : 'Invalid build-from-prompt request';
    sendBuildJson(res, 400, { error: message, code: 'BUILD_REQUEST_REJECTED' });
  }
}

/**
 * Build submission readiness — used by the V4 builder UI before enabling Build.
 * Confirms the same process that serves `/api/build/from-prompt` is alive and accepting
 * production-sized prompts (not merely that some unrelated runtime authority state exists).
 */
export function handleBuildReadyRequest(_req: IncomingMessage, res: ServerResponse): void {
  sendBuildJson(res, 200, {
    ok: true,
    ready: true,
    submissionReady: true,
    endpoint: BUILD_FROM_PROMPT_API_PATH,
    method: 'POST',
    maxBodyBytes: BUILD_MAX_BODY_BYTES,
    dependencies: {
      buildSubmissionRoute: true,
      livePreviewStatusRoute: true,
      serverProcessAlive: true,
    },
    recoveryAction: null,
    checkedAt: new Date().toISOString(),
  });
}

export function handleBuildLivePreviewStatusRequest(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const projectId = url.searchParams.get('projectId');
  const workspaces = listMultiProjectWorkspaces();
  const activeProjectId = workspaces.find((session) => session.active)?.projectId ?? null;

  if (projectId) {
    const session = workspaces.find((item) => item.projectId === projectId) ?? null;
    const build = getLastOnePromptLivePreviewBuildResult(projectId);
    sendBuildJson(res, 200, {
      ok: true,
      endpoint: BUILD_LIVE_PREVIEW_STATUS_API_PATH,
      activeProjectId,
      projectId,
      session,
      livePreview: getOnePromptLivePreviewPublicState(projectId),
      lastBuild: build,
      previewRuntime: listGeneratedDevServers()
        .filter((server) => server.projectId === projectId)
        .map((server) => ({
          projectId: server.projectId,
          workspaceDir: server.workspaceDir,
          port: server.port,
          url: server.url,
        })),
    });
    return;
  }

  sendBuildJson(res, 200, {
    ok: true,
    endpoint: BUILD_LIVE_PREVIEW_STATUS_API_PATH,
    activeProjectId,
    livePreview: getOnePromptLivePreviewPublicState(activeProjectId),
    lastBuild: activeProjectId ? getLastOnePromptLivePreviewBuildResult(activeProjectId) : null,
    sessions: workspaces,
    previewRuntimes: listGeneratedDevServers().map((server) => ({
      projectId: server.projectId,
      workspaceDir: server.workspaceDir,
      port: server.port,
      url: server.url,
    })),
    multiProjectWorkspaces: workspaces,
  });
}
