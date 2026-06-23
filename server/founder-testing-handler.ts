/**

 * Founder Testing Mode API — POST /api/founder-test/run (read-only).

 */



import type { IncomingMessage, ServerResponse } from 'node:http';

import { join } from 'node:path';

import { fileURLToPath } from 'node:url';

import {
  runFounderTestingModeV2,
  runFounderTestingModeV3,
  runFounderTestingModeV5,
} from '../src/founder-testing-mode/index.js';

import {

  assessChangeIntelligenceVisibility,

  getChangeIntelligenceHistory,

  recordFounderTestChangeSnapshot,

} from '../src/change-intelligence-visibility/index.js';

import { assessFounderActionCenter } from '../src/founder-action-center/index.js';

import { buildProductWorkspaceSnapshot } from './product-workspace-snapshot.js';

import { setLastVerificationResultsFromV4Report } from '../src/verification-results-visibility/index.js';

import type { LiveScreenResultInput } from '../src/founder-testing-mode/founder-testing-types.js';

import { buildFounderTestLaunchReadinessArtifactsAsync } from '../src/founder-test-launch-readiness/index.js';

import { buildRuntimeFounderExecutionProofInputAsync } from '../src/founder-test-integration/index.js';

import {

  beginFounderTestRuntime,

  advanceFounderTestRuntimeStage,

  completeFounderTestRuntimeStage,

  emitFounderTestRuntimeTrace,

  finishFounderTestRuntime,

  getFounderTestRuntimeStatus,

  getFounderTestRuntimeStatusForRun,

  recordFounderTestRuntimeSubstep,

  runFounderTestRuntimeStageWork,

  buildLaunchReadinessArtifactBuildTraceBridge,

  FOUNDER_TEST_ALREADY_RUNNING,

  markFounderTestHandlerAlive,

  markFounderTestHandlerIdle,

  storeFounderTestRunResult,

  consumeFounderTestRunResult,

  peekFounderTestRunResult,

  listFounderTestRunResultIds,

  buildFounderTestRuntimeFailureReport,

  buildCompleteFounderTestResultPendingResponse,

  isFounderTestCompleteSuccessState,

  buildFounderTestRunHandoffPayload,

  buildCompleteFounderTestResultPendingHandoffResponse,

  resolveStoredFounderTestReportMarkdown,

  shouldReturnCompleteResultHttp200,

  verifyFounderTestCompleteHandoffBoundary,

  canEmitFounderTestRuntimeComplete,

  FOUNDER_TEST_COMPLETE_BLOCKED_REASON_MISSING_MARKDOWN,

  FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY,

  buildFounderTestResultMetadataResponse,

  buildBoundedFounderTestResultDebugResponse,

  buildFounderTestResultSerializationFailureResponse,

  resolveStoredFounderTestReportMarkdownForDelivery,

  buildFounderTestResultDownloadFilename,

  safeStringifyFounderTestJson,

  FOUNDER_TEST_RESULT_REPORT_ROUTE,

  FOUNDER_TEST_RESULT_DOWNLOAD_ROUTE,

  persistFounderTestResultHandoff,

  buildFounderTestRuntimeStatusDeliveryFields,

} from '../src/founder-test-runtime-monitor/index.js';

import {
  recordIntakeValidationCompleteEmitted,
  recordPlanningGateStarted,
} from '../src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';

import type { StoredFounderTestRunResult } from '../src/founder-test-runtime-monitor/founder-test-run-result-store.js';

import type { FounderTestRuntimeSnapshot } from '../src/founder-test-runtime-monitor/founder-test-runtime-types.js';

import { readRequestBody } from './brain-api-handler.js';
import { buildFounderTestPingResponse } from './founder-test-server-process-metadata.js';
import { executeFounderSimulationStageWithCompletionBoundary } from '../src/founder-simulation-completion-boundary-repair/index.js';
import { guardFounderSimulationHandlerResult } from '../src/founder-simulation-payload-guard/index.js';
import { applyFounderSimulationDegradationRootCauseSync } from '../src/founder-simulation-degradation-root-cause-repair/index.js';
import {
  deepDefaultPayloadArrays,
  defaultAuthorityArrayFields,
} from '../src/founder-simulation-payload-guard/founder-simulation-payload-normalizer.js';
import { normalizeRawResultLaunchVerdictGovernanceSource } from '../src/launch-verdict-governance-source-normalization/index.js';
import { buildLaunchBlockerBoardArtifacts } from '../src/launch-blocker-board/index.js';
import {
  enterDeliveryTraceBoundary,
  completeDeliveryTraceBoundary,
  deliveryTraceSource,
  failFirstIncompleteDeliveryBoundary,
  getDeliveryTraceSummaryForDebug,
  recordClientDeliveryTraceEvent,
  startFinalFounderReportDeliveryTrace,
  traceDeliveryStageComplete,
  traceDeliveryStageEnter,
  traceReportGenerationComplete,
  traceResultRetrievalApi,
  writeFinalFounderReportDeliveryTraceReport,
} from '../src/final-founder-report-delivery-trace/index.js';



const __dirname = fileURLToPath(new URL('.', import.meta.url));

const ROOT_DIR = join(__dirname, '..');



export function sendFounderTestJson(

  res: ServerResponse,

  status: number,

  body: unknown,

  version: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' = 'v1',

  options?: { runId?: string | null; reportMarkdownLength?: number | null },

): void {

  const headers = {

    'Content-Type': 'application/json; charset=utf-8',

    'Cache-Control': 'no-store',

    'X-DevPulse-Surface': 'founder-reality',

    'X-DevPulse-Founder-Test': `${version}-read-only`,

  };

  const serialized = safeStringifyFounderTestJson(body);

  if (!serialized.ok) {

    const fallbackBody = buildFounderTestResultSerializationFailureResponse({

      runId:

        options?.runId ??

        (typeof body === 'object' && body != null && 'runId' in body

          ? (body as { runId?: string | null }).runId ?? null

          : null),

      reportMarkdownLength: options?.reportMarkdownLength ?? null,

      message: serialized.error,

    });

    const fallbackSerialized = safeStringifyFounderTestJson(fallbackBody);

    res.writeHead(500, headers);

    res.end(

      fallbackSerialized.ok

        ? fallbackSerialized.json

        : '{"readOnly":true,"routeReached":true,"errorCode":"RESULT_SERIALIZATION_FAILED"}',

    );

    return;

  }

  res.writeHead(status, headers);

  res.end(serialized.json);

}



function sendFounderTestMarkdown(

  res: ServerResponse,

  status: number,

  markdown: string,

  contentType: 'text/markdown' | 'attachment',

  filename?: string,

): void {

  const headers: Record<string, string> = {

    'Content-Type':

      contentType === 'attachment'

        ? 'text/markdown; charset=utf-8'

        : 'text/markdown; charset=utf-8',

    'Cache-Control': 'no-store',

    'X-DevPulse-Surface': 'founder-reality',

    'X-DevPulse-Founder-Test': 'v5-read-only',

  };

  if (contentType === 'attachment' && filename) {

    headers['Content-Disposition'] = `attachment; filename="${filename}"`;

  }

  res.writeHead(status, headers);

  res.end(markdown);

}



async function parseFounderTestBody(req: IncomingMessage): Promise<{

  liveResults?: LiveScreenResultInput[];

  liveSection?: string;

}> {

  if (req.method !== 'POST') return {};

  const raw = await readRequestBody(req);

  if (!raw.trim()) return {};

  const body = JSON.parse(raw) as {

    liveResults?: LiveScreenResultInput[];

    liveSection?: string;

  };

  return { liveResults: body.liveResults, liveSection: body.liveSection };

}



function executeUnifiedFounderTestV5(

  validatorScripts: string[],

  liveResults?: LiveScreenResultInput[],

  liveSection?: string,

) {

  const report = runFounderTestingModeV5({

    rootDir: ROOT_DIR,

    validatorScripts,

    liveResults,

    liveSection,

  });

  const verificationResults = setLastVerificationResultsFromV4Report(report.v4);

  const workspace = buildProductWorkspaceSnapshot(validatorScripts, { rootDir: ROOT_DIR });

  recordFounderTestChangeSnapshot(

    { ...workspace, verificationResults },

    verificationResults.summary.readinessScore,

    report.v4.launchReadinessReality.launchReadinessRealityScore,

  );

  const changeIntelligence = assessChangeIntelligenceVisibility(getChangeIntelligenceHistory());

  const founderActionCenter = assessFounderActionCenter({

    ...workspace,

    verificationResults,

    changeIntelligence,

  });

  return {

    report,

    verificationResults,

    changeIntelligence,

    founderActionCenter,

    founderSensemaking: report.founderSensemaking,

    founderFrictionHeatmap: report.founderFrictionHeatmap,

    phaseFeedEvents: report.phaseFeedEvents,

  };

}



async function executeFounderTestLaunchReadinessOrchestration() {

  return runFounderTestRuntimeStageWork('INTAKE_VALIDATION', async () => {

    recordFounderTestRuntimeSubstep({

      stageId: 'INTAKE_VALIDATION',

      operationId: 'founder-input-hydrating',

      message: 'Hydrating founder execution proof input',

    });

    const hydrated = await buildRuntimeFounderExecutionProofInputAsync(ROOT_DIR);

    emitFounderTestRuntimeTrace({

      operationId: 'founder-input-hydrated',

      stageId: 'INTAKE_VALIDATION',

      operationLabel: 'Founder input hydrated',

      status: 'PASSED',

    });

    return buildFounderTestLaunchReadinessArtifactsAsync({

      rootDir: ROOT_DIR,

      founderExecutionProofInput: hydrated.input,

      runtimeProofHydration: hydrated.hydration,

      onBuildTrace: buildLaunchReadinessArtifactBuildTraceBridge(),

    });

  });

}



const LAUNCH_READINESS_RUNTIME_STAGES = [

  { stageId: 'PLANNING_GATE', passMessage: 'Planning Gate Passed' },

  { stageId: 'PLANNING_BRIEF', passMessage: 'Planning Brief Generated' },

  { stageId: 'ARCHITECTURE_BRIEF', passMessage: 'Architecture Brief Generated' },

  { stageId: 'BUILD_PLAN', passMessage: 'Build Plan Generated' },

] as const;



const POST_V5_RUNTIME_STAGES = [

  { stageId: 'CROSS_SYSTEM_ORCHESTRATION_PROOF', passMessage: 'Cross-System Orchestration Proof Complete' },

  { stageId: 'EXECUTION_READINESS_GATE', passMessage: 'Execution Readiness Gate Complete' },

  { stageId: 'REPORT_GENERATION', passMessage: 'Report Generation Complete' },

] as const;



async function executeFounderTestRunCore(input: {

  validatorScripts: string[];

  liveResults?: LiveScreenResultInput[];

  liveSection?: string;

  runId: string;

}) {

  markFounderTestHandlerAlive();

  enterDeliveryTraceBoundary({
    runId: input.runId,
    boundaryId: 'FOUNDER_TEST_START',
    source: deliveryTraceSource('server/founder-testing-handler.ts', 'executeFounderTestRunCore', 454),
  });

  let launchReadinessArtifacts: Awaited<

    ReturnType<typeof executeFounderTestLaunchReadinessOrchestration>

  > | null = null;



  completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });

  completeDeliveryTraceBoundary({
    runId: input.runId,
    boundaryId: 'FOUNDER_TEST_START',
    outputExists: true,
    nextBoundaryInvoked: 'INTAKE_VALIDATION',
  });

  traceDeliveryStageEnter(input.runId, 'INTAKE_VALIDATION', 476);

  advanceFounderTestRuntimeStage({

    stageId: 'INTAKE_VALIDATION',

    message: 'Intake validation started',

  });

  emitFounderTestRuntimeTrace({

    operationId: 'intake-validation-started',

    stageId: 'INTAKE_VALIDATION',

    operationLabel: 'Intake validation started',

    status: 'RUNNING',

  });



  launchReadinessArtifacts = await executeFounderTestLaunchReadinessOrchestration();



  emitFounderTestRuntimeTrace({

    operationId: 'intake-validation-complete',

    stageId: 'INTAKE_VALIDATION',

    operationLabel: 'Intake validation complete',

    status: 'PASSED',

  });

  recordIntakeValidationCompleteEmitted();

  emitFounderTestRuntimeTrace({

    operationId: 'intake-validation-complete-emitted',

    stageId: 'INTAKE_VALIDATION',

    operationLabel: 'Intake validation complete emitted',

    status: 'PASSED',

  });

  completeFounderTestRuntimeStage({

    stageId: 'INTAKE_VALIDATION',

    message: 'Intake Validation Passed',

  });

  traceDeliveryStageComplete(input.runId, 'INTAKE_VALIDATION', {
    outputExists: launchReadinessArtifacts != null,
    outputSize: launchReadinessArtifacts?.founderTestLaunchReadinessReportMarkdown?.length ?? null,
  });



  for (const stage of LAUNCH_READINESS_RUNTIME_STAGES) {

    if (stage.stageId === 'PLANNING_GATE') {

      emitFounderTestRuntimeTrace({

        operationId: 'planning-gate-entered',

        stageId: 'PLANNING_GATE',

        operationLabel: 'Planning gate entered',

        status: 'RUNNING',

      });

      emitFounderTestRuntimeTrace({

        operationId: 'planning-gate-started',

        stageId: 'PLANNING_GATE',

        operationLabel: 'Planning gate started',

        status: 'PASSED',

      });

      recordPlanningGateStarted();

    }

    traceDeliveryStageEnter(input.runId, stage.stageId, 562);

    advanceFounderTestRuntimeStage({ stageId: stage.stageId });

    completeFounderTestRuntimeStage({

      stageId: stage.stageId,

      message: stage.passMessage,

    });

    traceDeliveryStageComplete(input.runId, stage.stageId, { outputExists: true });

  }



  traceDeliveryStageEnter(input.runId, 'FOUNDER_SIMULATION_ENGINE', 576);

  advanceFounderTestRuntimeStage({

    stageId: 'FOUNDER_SIMULATION_ENGINE',

    message: 'Founder Simulation Running',

  });

  const simulationOutcome = executeFounderSimulationStageWithCompletionBoundary({

    rootDir: ROOT_DIR,

    execute: () => executeUnifiedFounderTestV5(input.validatorScripts, input.liveResults, input.liveSection),

  });

  completeFounderTestRuntimeStage({

    stageId: 'FOUNDER_SIMULATION_ENGINE',

    message: simulationOutcome.completionMessage,

    status: simulationOutcome.stageStatus,

  });

  const baseResult = simulationOutcome.result;
  const reportBuildError =
    simulationOutcome.errorMessage != null &&
    (simulationOutcome.errorMessage.includes("reading 'length'") ||
      simulationOutcome.errorMessage.includes('reading length'))
      ? simulationOutcome.errorMessage
      : undefined;
  const guardedSimulation = guardFounderSimulationHandlerResult({
    rawResult: baseResult ?? {},
    degraded: simulationOutcome.degraded,
    completionEvent: simulationOutcome.completionEventId,
    originalError: simulationOutcome.errorMessage,
    elapsedMs: simulationOutcome.elapsedMs,
    skipHistoryRecording: true,
    runId: input.runId,
    reportBuildError,
  });

  const degradationRootCause = applyFounderSimulationDegradationRootCauseSync({
    simulationElapsedMs: simulationOutcome.elapsedMs,
    completionEventId: simulationOutcome.completionEventId,
    degraded: simulationOutcome.degraded || guardedSimulation.guardAssessment.report.degraded,
    budgetExceeded: simulationOutcome.budgetExceeded,
    errorMessage: simulationOutcome.errorMessage,
    payloadGuardDegraded: guardedSimulation.guardAssessment.report.degraded,
    runId: input.runId,
    skipHistoryRecording: true,
  });

  const governanceHandoff = baseResult?.report
    ? normalizeRawResultLaunchVerdictGovernanceSource({ report: baseResult.report })
    : null;
  const handoffReport = baseResult
    ? governanceHandoff?.patched && typeof governanceHandoff.patched === 'object'
      ? ((governanceHandoff.patched as { report?: NonNullable<typeof baseResult>['report'] }).report ??
        baseResult.report)
      : baseResult.report
    : null;

  const result = baseResult
    ? {
        ...baseResult,
        report: (defaultAuthorityArrayFields(
          deepDefaultPayloadArrays(guardedSimulation.result.report ?? handoffReport ?? baseResult.report),
        ) ?? guardedSimulation.result.report ?? handoffReport ?? baseResult.report) as typeof baseResult.report,
        phaseFeedEvents: guardedSimulation.result.phaseFeedEvents,
      }
    : {
        report: null,
        verificationResults: null,
        changeIntelligence: null,
        founderActionCenter: null,
        founderSensemaking: null,
        founderFrictionHeatmap: null,
        phaseFeedEvents: guardedSimulation.result.phaseFeedEvents,
      };

  const simulationDiagnosticMarkdown =
    guardedSimulation.diagnosticMarkdown ?? simulationOutcome.diagnosticMarkdown;

  traceDeliveryStageComplete(input.runId, 'FOUNDER_SIMULATION_ENGINE', {
    outputExists: baseResult != null,
    outputSize: simulationDiagnosticMarkdown?.length ?? null,
    details: {
      degraded: simulationOutcome.degraded || guardedSimulation.guardAssessment.report.degraded,
      completionEvent: simulationOutcome.completionEventId,
    },
  });



  for (const stage of POST_V5_RUNTIME_STAGES) {

    if (stage.stageId === 'REPORT_GENERATION') {

      emitFounderTestRuntimeTrace({

        operationId: 'report-generation-started',

        stageId: 'REPORT_GENERATION',

        operationLabel: 'Report generation started',

        status: 'RUNNING',

      });

    }

    if (stage.stageId !== 'REPORT_GENERATION') {
      traceDeliveryStageEnter(input.runId, stage.stageId, 682);
    } else {
      traceDeliveryStageEnter(input.runId, stage.stageId, 668);
    }

    advanceFounderTestRuntimeStage({ stageId: stage.stageId });

    completeFounderTestRuntimeStage({

      stageId: stage.stageId,

      message: stage.passMessage,

    });

    if (stage.stageId !== 'REPORT_GENERATION') {
      traceDeliveryStageComplete(input.runId, stage.stageId, { outputExists: true });
    }

  }



  const launchReport = launchReadinessArtifacts.founderTestLaunchReadinessAssessment.report;

  const launchBlockerBoardArtifacts = buildLaunchBlockerBoardArtifacts({
    launchReadiness: launchReport,
    runId: input.runId,
    simulationElapsedMs: simulationOutcome.elapsedMs,
    simulationDegraded:
      simulationOutcome.degraded || guardedSimulation.guardAssessment.report.degraded,
    simulationDiagnosticMarkdown,
    degradationAssessment: degradationRootCause.assessment,
    unifiedLaunchBlockers:
      result.report &&
      typeof result.report === 'object' &&
      'unifiedSummary' in result.report &&
      result.report.unifiedSummary &&
      typeof result.report.unifiedSummary === 'object' &&
      Array.isArray((result.report.unifiedSummary as { launchBlockers?: unknown }).launchBlockers)
        ? ((result.report.unifiedSummary as { launchBlockers: string[] }).launchBlockers as string[])
        : undefined,
    skipHistoryRecording: true,
  });

  if (result.report) {

    result.report.launchReadiness = launchReport;

    result.report.founderTestLaunchReadiness = launchReport;

    (result.report as unknown as Record<string, unknown>).launchBlockerBoard =
      launchBlockerBoardArtifacts.launchBlockerBoardAssessment.report;

    result.report.reportMarkdown =

      launchBlockerBoardArtifacts.launchBlockerBoardReportMarkdown +

      '\n\n---\n\n' +

      launchReadinessArtifacts.founderTestLaunchReadinessReportMarkdown +

      '\n\n---\n\n' +

      (result.report.reportMarkdown ?? '');

  }



  const completedAt = new Date().toISOString();

  const preFinishRuntime = getFounderTestRuntimeStatus();

  const reportMarkdown =
    result.report?.reportMarkdown?.trim() ||
    simulationDiagnosticMarkdown ||
    null;

  emitFounderTestRuntimeTrace({

    operationId: 'final-report-markdown-built',

    stageId: 'REPORT_GENERATION',

    operationLabel: 'Final report markdown built',

    status: reportMarkdown?.trim() ? 'PASSED' : 'FAILED',

  });

  let reportSerializationSucceeded = false;
  let reportSerializationError: string | null = null;
  const serializationProbe = safeStringifyFounderTestJson({
    runId: input.runId,
    reportMarkdownLength: reportMarkdown?.length ?? 0,
    finalReportReady: Boolean(reportMarkdown?.trim()),
    hasReportObject: result.report != null,
  });
  if (serializationProbe.ok) {
    reportSerializationSucceeded = true;
  } else {
    reportSerializationError = serializationProbe.error;
  }

  traceReportGenerationComplete(input.runId, {
    reportObjectExists: result.report != null,
    reportMarkdownExists: Boolean(reportMarkdown?.trim()),
    reportMarkdownLength: reportMarkdown?.length ?? 0,
    launchBlockerBoardExists: Boolean(launchBlockerBoardArtifacts.launchBlockerBoardAssessment?.report),
    serializationSucceeded: reportSerializationSucceeded,
    serializationError: reportSerializationError,
    outputSize: reportMarkdown?.length ?? null,
  });



  if (!reportMarkdown?.trim()) {

    emitFounderTestRuntimeTrace({

      operationId: 'final-report-handoff-blocked',

      stageId: 'REPORT_GENERATION',

      operationLabel: FOUNDER_TEST_COMPLETE_BLOCKED_REASON_MISSING_MARKDOWN,

      status: 'FAILED',

    });

    const runtime = finishFounderTestRuntime({

      state: 'FAILED',

      message: FOUNDER_TEST_COMPLETE_BLOCKED_REASON_MISSING_MARKDOWN,

    });

    persistFounderTestResultHandoff({

      phase: 'complete',

      requestedRunId: input.runId,

      runtimeRunId: runtime.runId,

      ok: false,

      completedAt,

      payload: buildFounderTestRunHandoffPayload({

        runId: input.runId,

        ok: false,

        runtime,

        report: result.report ?? null,

        reportMarkdown: null,

        launchReadiness: launchReport,

        founderTestLaunchReadinessAssessment: launchReadinessArtifacts.founderTestLaunchReadinessAssessment,

        founderTestLaunchReadinessReportMarkdown:

          launchReadinessArtifacts.founderTestLaunchReadinessReportMarkdown,

        finalReportReady: false,

        finalReportPreparing: true,

        finalReportPreparingReason: FOUNDER_TEST_COMPLETE_BLOCKED_REASON_MISSING_MARKDOWN,

        extra: { ...result },

      }),

      errorMessage: FOUNDER_TEST_COMPLETE_BLOCKED_REASON_MISSING_MARKDOWN,

    });

    return {

      ok: false as const,

      payload: null,

      launchReadinessArtifacts,

    };

  }



  const handoffPayload = buildFounderTestRunHandoffPayload({

    runId: input.runId,

    ok: true,

    runtime: preFinishRuntime,

    report: result.report ?? null,

    reportMarkdown,

    launchReadiness: launchReport,

    founderTestLaunchReadinessAssessment: launchReadinessArtifacts.founderTestLaunchReadinessAssessment,

    founderTestLaunchReadinessReportMarkdown:

      launchReadinessArtifacts.founderTestLaunchReadinessReportMarkdown,

    finalReportReady: true,

    finalReportPreparing: false,

    extra: { ...result },

  });



  persistFounderTestResultHandoff({

    phase: 'staging',

    requestedRunId: input.runId,

    runtimeRunId: preFinishRuntime.runId,

    ok: true,

    completedAt,

    payload: handoffPayload,

    errorMessage: null,

  });



  emitFounderTestRuntimeTrace({

    operationId: 'final-report-stored-by-runid',

    stageId: 'REPORT_GENERATION',

    operationLabel: 'Final report stored by runId',

    status: verifyFounderTestCompleteHandoffBoundary(input.runId) ? 'PASSED' : 'FAILED',

  });



  if (!canEmitFounderTestRuntimeComplete({ runId: input.runId, reportMarkdown })) {

    emitFounderTestRuntimeTrace({

      operationId: 'final-report-handoff-blocked',

      stageId: 'REPORT_GENERATION',

      operationLabel: FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY,

      status: 'FAILED',

    });

    const runtime = finishFounderTestRuntime({

      state: 'FAILED',

      message: FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY,

    });

    persistFounderTestResultHandoff({

      phase: 'complete',

      requestedRunId: input.runId,

      runtimeRunId: runtime.runId,

      ok: false,

      completedAt,

      payload: buildFounderTestRunHandoffPayload({

        runId: input.runId,

        ok: false,

        runtime,

        report: result.report ?? null,

        reportMarkdown,

        launchReadiness: launchReport,

        founderTestLaunchReadinessAssessment: launchReadinessArtifacts.founderTestLaunchReadinessAssessment,

        founderTestLaunchReadinessReportMarkdown:

          launchReadinessArtifacts.founderTestLaunchReadinessReportMarkdown,

        finalReportReady: false,

        finalReportPreparing: true,

        finalReportPreparingReason: FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY,

        extra: { ...result },

      }),

      errorMessage: FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY,

    });

    return {

      ok: false as const,

      payload: null,

      launchReadinessArtifacts,

    };

  }



  emitFounderTestRuntimeTrace({

    operationId: 'final-report-handoff-ready',

    stageId: 'COMPLETE',

    operationLabel: 'Final report handoff ready',

    status: 'PASSED',

  });



  const runtime = finishFounderTestRuntime({

    state: 'COMPLETE',

    message: 'Founder Test Complete',

  });



  const finalPayload = buildFounderTestRunHandoffPayload({

    runId: input.runId,

    ok: true,

    runtime,

    report: result.report ?? null,

    reportMarkdown,

    launchReadiness: launchReport,

    founderTestLaunchReadinessAssessment: launchReadinessArtifacts.founderTestLaunchReadinessAssessment,

    founderTestLaunchReadinessReportMarkdown:

      launchReadinessArtifacts.founderTestLaunchReadinessReportMarkdown,

    finalReportReady: true,

    finalReportPreparing: false,

    extra: { ...result },

  });



  persistFounderTestResultHandoff({

    phase: 'complete',

    requestedRunId: input.runId,

    runtimeRunId: runtime.runId,

    ok: true,

    completedAt,

    payload: finalPayload,

    errorMessage: null,

  });



  return {

    ok: true as const,

    payload: finalPayload,

    launchReadinessArtifacts,

  };

}



async function runFounderTestInBackground(input: {

  validatorScripts: string[];

  liveResults?: LiveScreenResultInput[];

  liveSection?: string;

  runId: string;

}): Promise<void> {

  markFounderTestHandlerAlive();

  startFinalFounderReportDeliveryTrace(input.runId);

  try {
    await executeFounderTestRunCore(input);
  } catch (err) {

    const message = err instanceof Error ? err.message : 'founder test failed';

    failFirstIncompleteDeliveryBoundary(input.runId, message, {
      file: 'server/founder-testing-handler.ts',
      function: 'runFounderTestInBackground',
      line: 1098,
    });

    const runtime = finishFounderTestRuntime({

      state: 'FAILED',

      message: 'Founder Test Failed',

    });

    const diagnosticMarkdown = buildFounderTestRuntimeFailureReport({

      snapshot: runtime,

      errorMessage: message,

    });

    persistFounderTestResultHandoff({

      phase: 'complete',

      requestedRunId: input.runId,

      runtimeRunId: runtime.runId,

      ok: false,

      completedAt: new Date().toISOString(),

      payload: {

        ok: false,

        readOnly: true,

        runId: input.runId,

        error: message,

        runtime,

        founderTestLaunchReadinessReportMarkdown: diagnosticMarkdown,

        founderTestLaunchReadinessAssessment: null,

        finalReportReady: false,

        finalReportPreparing: false,

        reportMarkdown: diagnosticMarkdown,

      },

      errorMessage: message,

    });

  } finally {

    writeFinalFounderReportDeliveryTraceReport({ runId: input.runId, rootDir: ROOT_DIR });

    markFounderTestHandlerIdle();

  }

}



/** Lightweight runtime snapshot for founder UI polling. */

export function handleFounderTestRuntimeStatusRequest(req: IncomingMessage, res: ServerResponse): void {

  const url = new URL(req.url ?? '/', 'http://localhost');

  const runId = url.searchParams.get('runId');

  const runtime = getFounderTestRuntimeStatusForRun(runId);

  sendFounderTestJson(

    res,

    200,

    {

      ok: true,

      readOnly: true,

      runId: runtime.runId,

      runtime,

      ...buildFounderTestRuntimeStatusDeliveryFields({

        requestedRunId: runId,

        runtimeRunId: runtime.runId,

      }),

    },

    'v5',

  );

}



/** Bounded metadata response — never spreads full stored payload. */
function buildFounderTestResultResponse(stored: StoredFounderTestRunResult): Record<string, unknown> {
  return buildFounderTestResultMetadataResponse(stored);
}



function buildRunningFounderTestResultResponse(

  runtime: FounderTestRuntimeSnapshot,

  requestedRunId: string | null,

): Record<string, unknown> {

  const runtimeDiagnosticMarkdown = buildFounderTestRuntimeFailureReport({

    snapshot: runtime,

    errorMessage:

      runtime.state === 'STALLED'

        ? 'Founder test stalled — diagnostic snapshot available while result is prepared.'

        : runtime.state === 'FAILED'

          ? 'Founder test failed — diagnostic snapshot available.'

          : 'Founder test still running — diagnostic snapshot available.',

  });

  const isTerminalFailure = runtime.state === 'FAILED' || runtime.state === 'STALLED' || runtime.state === 'CANCELLED';

  return {

    ready: false,

    ok: false,

    readOnly: true,

    runId: requestedRunId || runtime.runId,

    state: runtime.state,

    generatedAt: new Date().toISOString(),

    error: null,

    reportMarkdown: null,

    partialReportMarkdown: null,

    failureReportMarkdown: isTerminalFailure ? runtimeDiagnosticMarkdown : null,

    runtimeDiagnosticMarkdown,

    runtime,

    traceEvents: runtime.traceEvents,

  };

}



/** Temporary diagnostic — prove API process reachability (Phase 26.70A). */
export function handleFounderTestPingRequest(req: IncomingMessage, res: ServerResponse): void {
  sendFounderTestJson(res, 200, buildFounderTestPingResponse(), 'v5');
}

/** Debug founder test result handoff for preparing stall diagnostics. */

export function handleFounderTestResultDebugRequest(req: IncomingMessage, res: ServerResponse): void {

  const url = new URL(req.url ?? '/', 'http://localhost');

  const runId = url.searchParams.get('runId');

  const stored = peekFounderTestRunResult(runId);

  const runtime = getFounderTestRuntimeStatusForRun(runId);

  let resultEndpointStatus = 404;

  if (stored) {

    resultEndpointStatus = shouldReturnCompleteResultHttp200(stored)
      ? 200
      : stored.ok
        ? 202
        : 500;

  } else if (runtime.runId && runtime.state !== 'IDLE') {

    resultEndpointStatus =
      runtime.state === 'COMPLETING' ||
      (isFounderTestCompleteSuccessState(runtime.state) &&
        !verifyFounderTestCompleteHandoffBoundary(runId))
        ? 202
        : isFounderTestCompleteSuccessState(runtime.state)
          ? 200
          : 202;

  }

  const ping = buildFounderTestPingResponse();

  sendFounderTestJson(

    res,

    200,

    {

      ...buildBoundedFounderTestResultDebugResponse({

        requestedRunId: runId,

        stored,

        storedRunIds: listFounderTestRunResultIds(),

        runtime,

        resultEndpointStatus,

        serverStartedAt: String(ping.serverStartedAt),

        processId: ping.processId as number,

        uptimeSeconds: ping.uptimeSeconds as number,

        listeningPort: ping.listeningPort as number,

        listeningHost: String(ping.listeningHost),

      }),

      deliveryTrace: getDeliveryTraceSummaryForDebug(runId),

    },

    'v5',

  );

}



/** Client-side delivery trace events (Phase 27.07 diagnostic only). */

export async function handleFounderTestClientDeliveryTraceRequest(

  req: IncomingMessage,

  res: ServerResponse,

): Promise<void> {

  try {

    const raw = await readRequestBody(req);

    const parsed = JSON.parse(raw || '{}') as {

      boundaryId?: 'CLIENT_CACHE' | 'FOUNDER_REPORT_RENDER';

      runId?: string;

      succeeded?: boolean;

      details?: Record<string, unknown>;

      exception?: string | null;

      missingArtifact?: string | null;

    };

    if (!parsed.runId || !parsed.boundaryId) {

      sendFounderTestJson(

        res,

        400,

        { ok: false, readOnly: true, error: 'runId and boundaryId required' },

        'v5',

      );

      return;

    }

    recordClientDeliveryTraceEvent({

      boundaryId: parsed.boundaryId,

      runId: parsed.runId,

      succeeded: parsed.succeeded === true,

      details: parsed.details,

      exception: parsed.exception ?? null,

      missingArtifact: parsed.missingArtifact ?? null,

    });

    sendFounderTestJson(res, 200, { ok: true, readOnly: true, recorded: true }, 'v5');

  } catch (err) {

    const message = err instanceof Error ? err.message : 'delivery trace client event failed';

    sendFounderTestJson(res, 500, { ok: false, readOnly: true, error: message }, 'v5');

  }

}



function resolveFounderTestResultReportMarkdown(runId: string | null): string | null {
  return resolveStoredFounderTestReportMarkdownForDelivery(runId, peekFounderTestRunResult);
}



/** Report markdown as text/markdown — avoids JSON stringify crash. */
export function handleFounderTestResultReportRequest(req: IncomingMessage, res: ServerResponse): void {

  const url = new URL(req.url ?? '/', 'http://localhost');

  const runId = url.searchParams.get('runId');

  const markdown = resolveFounderTestResultReportMarkdown(runId);

  if (!markdown?.trim()) {

    sendFounderTestJson(

      res,

      404,

      {

        ok: false,

        readOnly: true,

        routeReached: true,

        error: 'Founder test report markdown not found',

        runId,

      },

      'v5',

      { runId },

    );

    return;

  }

  sendFounderTestMarkdown(res, 200, markdown, 'text/markdown');

}



/** Report markdown download attachment. */
export function handleFounderTestResultDownloadRequest(req: IncomingMessage, res: ServerResponse): void {

  const url = new URL(req.url ?? '/', 'http://localhost');

  const runId = url.searchParams.get('runId');

  if (!runId) {

    sendFounderTestJson(res, 400, { ok: false, routeReached: true, error: 'runId required' }, 'v5');

    return;

  }

  const markdown = resolveFounderTestResultReportMarkdown(runId);

  if (!markdown?.trim()) {

    sendFounderTestJson(

      res,

      404,

      {

        ok: false,

        readOnly: true,

        routeReached: true,

        error: 'Founder test report markdown not found',

        runId,

      },

      'v5',

      { runId },

    );

    return;

  }

  sendFounderTestMarkdown(

    res,

    200,

    markdown,

    'attachment',

    buildFounderTestResultDownloadFilename(runId),

  );

}



/** Async founder test result after background completion. */

export function handleFounderTestResultRequest(req: IncomingMessage, res: ServerResponse): void {

  const url = new URL(req.url ?? '/', 'http://localhost');

  const runId = url.searchParams.get('runId');

  const stored = peekFounderTestRunResult(runId);

  if (stored) {

    if (shouldReturnCompleteResultHttp200(stored)) {

      const metadata = buildFounderTestResultMetadataResponse(stored);
      const storedMarkdown = resolveStoredFounderTestReportMarkdown(stored);
      const reportMarkdownLength = (metadata.reportMarkdownLength as number | null) ?? storedMarkdown?.length ?? 0;

      traceResultRetrievalApi(stored.runId, {
        lookupRunId: runId,
        lookupSuccess: true,
        payloadFound: true,
        reportFound: stored.payload?.report != null || Boolean(storedMarkdown?.trim()),
        reportMarkdownFound: Boolean(storedMarkdown?.trim()) || reportMarkdownLength > 0,
        httpStatus: 200,
        responseSize: reportMarkdownLength,
      });

      sendFounderTestJson(

        res,

        200,

        metadata,

        'v5',

        {

          runId: stored.runId,

          reportMarkdownLength: metadata.reportMarkdownLength as number | null,

        },

      );

      return;

    }

    if (stored.ok) {

      const runtime = getFounderTestRuntimeStatusForRun(runId);

      traceResultRetrievalApi(stored.runId, {
        lookupRunId: runId,
        lookupSuccess: true,
        payloadFound: true,
        reportFound: true,
        reportMarkdownFound: false,
        httpStatus: 202,
        exception: FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY,
      });

      sendFounderTestJson(

        res,

        202,

        buildCompleteFounderTestResultPendingHandoffResponse(

          runtime,

          runId,

          FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY,

        ),

        'v5',

      );

      return;

    }

    const failureMetadata = buildFounderTestResultMetadataResponse(stored);
    const failureMarkdown = resolveStoredFounderTestReportMarkdown(stored);

    traceResultRetrievalApi(stored.runId, {
      lookupRunId: runId,
      lookupSuccess: true,
      payloadFound: true,
      reportFound: stored.payload?.report != null || Boolean(failureMarkdown?.trim()),
      reportMarkdownFound: Boolean(failureMarkdown?.trim()),
      httpStatus: stored.ok ? 200 : 500,
      exception: stored.errorMessage ?? 'stored founder test result failed',
      responseSize: failureMarkdown?.length ?? null,
    });

    sendFounderTestJson(

      res,

      stored.ok ? 200 : 500,

      failureMetadata,

      'v5',

      { runId: stored.runId },

    );

    return;

  }

  const runtime = getFounderTestRuntimeStatusForRun(runId);

  const effectiveRunId = runId || runtime.runId;

  const matchesRun = !runId || runtime.runId === runId;

  if (matchesRun && runtime.runId && runtime.state !== 'IDLE') {

    if (
      runtime.state === 'COMPLETING' ||
      (isFounderTestCompleteSuccessState(runtime.state) && !verifyFounderTestCompleteHandoffBoundary(effectiveRunId))
    ) {

      traceResultRetrievalApi(effectiveRunId, {
        lookupRunId: runId,
        lookupSuccess: Boolean(effectiveRunId),
        payloadFound: false,
        reportFound: false,
        reportMarkdownFound: false,
        httpStatus: 202,
        exception: FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY,
      });

      sendFounderTestJson(

        res,

        202,

        buildCompleteFounderTestResultPendingHandoffResponse(

          runtime,

          effectiveRunId,

          FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY,

        ),

        'v5',

      );

      return;

    }

    traceResultRetrievalApi(effectiveRunId, {
      lookupRunId: runId,
      lookupSuccess: Boolean(effectiveRunId),
      payloadFound: false,
      reportFound: false,
      reportMarkdownFound: false,
      httpStatus: 202,
      exception: `founder test still ${runtime.state}`,
    });

    sendFounderTestJson(

      res,

      202,

      buildRunningFounderTestResultResponse(runtime, effectiveRunId),

      'v5',

    );

    return;

  }

  traceResultRetrievalApi(runId, {
    lookupRunId: runId,
    lookupSuccess: false,
    payloadFound: false,
    reportFound: false,
    reportMarkdownFound: false,
    httpStatus: 404,
    exception: 'Founder test result not ready',
  });

  sendFounderTestJson(

    res,

    404,

    {

      ok: false,

      readOnly: true,

      ready: false,

      error: 'Founder test result not ready',

      runId: runId ?? null,

      runtime,

    },

    'v5',

  );

}



/** Primary founder validation entry — unified V5 orchestration. */

export async function handleFounderTestRunRequest(

  req: IncomingMessage,

  res: ServerResponse,

  validatorScripts: string[],

): Promise<void> {

  const begin = beginFounderTestRuntime();

  if (!begin.accepted) {

    sendFounderTestJson(

      res,

      409,

      {

        ok: false,

        readOnly: true,

        error: FOUNDER_TEST_ALREADY_RUNNING,

        errorCode: FOUNDER_TEST_ALREADY_RUNNING,

        runtime: begin.snapshot,

      },

      'v5',

    );

    return;

  }



  try {

    const { liveResults, liveSection } = await parseFounderTestBody(req);

    const runId = begin.snapshot.runId ?? `founder-test-runtime-${Date.now()}`;



    sendFounderTestJson(

      res,

      202,

      {

        ok: true,

        readOnly: true,

        accepted: true,

        async: true,

        mode: 'founder-testing-v5',

        runId,

        runtime: begin.snapshot,

      },

      'v5',

    );



    void runFounderTestInBackground({

      validatorScripts,

      liveResults,

      liveSection,

      runId,

    });

  } catch (err) {

    const message = err instanceof Error ? err.message : 'founder test failed';

    const runtime = finishFounderTestRuntime({

      state: 'FAILED',

      message: 'Founder Test Failed',

    });

    sendFounderTestJson(

      res,

      500,

      {

        ok: false,

        readOnly: true,

        error: message,

        runtime,

      },

      'v5',

    );

  }

}



export async function handleFounderTestRunV2Request(

  req: IncomingMessage,

  res: ServerResponse,

  validatorScripts: string[],

): Promise<void> {

  try {

    let liveResults: LiveScreenResultInput[] | undefined;

    let liveSection: string | undefined;



    if (req.method === 'POST') {

      const raw = await readRequestBody(req);

      if (raw.trim()) {

        const body = JSON.parse(raw) as {

          liveResults?: LiveScreenResultInput[];

          liveSection?: string;

        };

        liveResults = body.liveResults;

        liveSection = body.liveSection;

      }

    }



    const report = runFounderTestingModeV2({

      rootDir: ROOT_DIR,

      validatorScripts,

      liveResults,

      liveSection,

    });



    sendFounderTestJson(

      res,

      200,

      {

        ok: true,

        readOnly: true,

        mode: 'founder-testing-v2',

        report,

      },

      'v2',

    );

  } catch (err) {

    const message = err instanceof Error ? err.message : 'founder test v2 failed';

    sendFounderTestJson(

      res,

      500,

      {

        ok: false,

        readOnly: true,

        error: message,

      },

      'v2',

    );

  }

}



export async function handleFounderTestRunV3Request(

  req: IncomingMessage,

  res: ServerResponse,

  validatorScripts: string[],

): Promise<void> {

  try {

    let liveResults: LiveScreenResultInput[] | undefined;

    let liveSection: string | undefined;



    if (req.method === 'POST') {

      const raw = await readRequestBody(req);

      if (raw.trim()) {

        const body = JSON.parse(raw) as {

          liveResults?: LiveScreenResultInput[];

          liveSection?: string;

        };

        liveResults = body.liveResults;

        liveSection = body.liveSection;

      }

    }



    const report = runFounderTestingModeV3({

      rootDir: ROOT_DIR,

      validatorScripts,

      liveResults,

      liveSection,

    });



    sendFounderTestJson(

      res,

      200,

      {

        ok: true,

        readOnly: true,

        mode: 'founder-testing-v3',

        report,

      },

      'v3',

    );

  } catch (err) {

    const message = err instanceof Error ? err.message : 'founder test v3 failed';

    sendFounderTestJson(

      res,

      500,

      {

        ok: false,

        readOnly: true,

        error: message,

      },

      'v3',

    );

  }

}



/** Back-compat alias — routes to unified V5 orchestration. */

export async function handleFounderTestRunV4Request(

  req: IncomingMessage,

  res: ServerResponse,

  validatorScripts: string[],

): Promise<void> {

  return handleFounderTestRunRequest(req, res, validatorScripts);

}


