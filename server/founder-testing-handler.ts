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

} from '../src/founder-test-runtime-monitor/index.js';

import type { StoredFounderTestRunResult } from '../src/founder-test-runtime-monitor/founder-test-run-result-store.js';

import type { FounderTestRuntimeSnapshot } from '../src/founder-test-runtime-monitor/founder-test-runtime-types.js';

import { readRequestBody } from './brain-api-handler.js';
import { buildFounderTestPingResponse } from './founder-test-server-process-metadata.js';



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

  let launchReadinessArtifacts: Awaited<

    ReturnType<typeof executeFounderTestLaunchReadinessOrchestration>

  > | null = null;



  completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });



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

  completeFounderTestRuntimeStage({

    stageId: 'INTAKE_VALIDATION',

    message: 'Intake Validation Passed',

  });



  for (const stage of LAUNCH_READINESS_RUNTIME_STAGES) {

    if (stage.stageId === 'PLANNING_GATE') {

      emitFounderTestRuntimeTrace({

        operationId: 'planning-gate-entered',

        stageId: 'PLANNING_GATE',

        operationLabel: 'Planning gate entered',

        status: 'RUNNING',

      });

    }

    advanceFounderTestRuntimeStage({ stageId: stage.stageId });

    completeFounderTestRuntimeStage({

      stageId: stage.stageId,

      message: stage.passMessage,

    });

  }



  advanceFounderTestRuntimeStage({

    stageId: 'FOUNDER_SIMULATION_ENGINE',

    message: 'Founder Simulation Running',

  });

  markFounderTestHandlerAlive();

  const result = executeUnifiedFounderTestV5(input.validatorScripts, input.liveResults, input.liveSection);

  completeFounderTestRuntimeStage({

    stageId: 'FOUNDER_SIMULATION_ENGINE',

    message: 'Founder Simulation Complete',

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

    advanceFounderTestRuntimeStage({ stageId: stage.stageId });

    completeFounderTestRuntimeStage({

      stageId: stage.stageId,

      message: stage.passMessage,

    });

  }



  const launchReport = launchReadinessArtifacts.founderTestLaunchReadinessAssessment.report;



  if (result.report) {

    result.report.launchReadiness = launchReport;

    result.report.founderTestLaunchReadiness = launchReport;

    result.report.reportMarkdown =

      launchReadinessArtifacts.founderTestLaunchReadinessReportMarkdown +

      '\n\n---\n\n' +

      (result.report.reportMarkdown ?? '');

  }



  const completedAt = new Date().toISOString();

  const preFinishRuntime = getFounderTestRuntimeStatus();

  const reportMarkdown = result.report?.reportMarkdown ?? null;

  emitFounderTestRuntimeTrace({

    operationId: 'final-report-markdown-built',

    stageId: 'REPORT_GENERATION',

    operationLabel: 'Final report markdown built',

    status: reportMarkdown?.trim() ? 'PASSED' : 'FAILED',

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

    storeFounderTestRunResult({

      readOnly: true,

      runId: input.runId,

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



  storeFounderTestRunResult({

    readOnly: true,

    runId: input.runId,

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

    storeFounderTestRunResult({

      readOnly: true,

      runId: input.runId,

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



  storeFounderTestRunResult({

    readOnly: true,

    runId: input.runId,

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

  try {
    await executeFounderTestRunCore(input);
  } catch (err) {

    const message = err instanceof Error ? err.message : 'founder test failed';

    const runtime = finishFounderTestRuntime({

      state: 'FAILED',

      message: 'Founder Test Failed',

    });

    storeFounderTestRunResult({

      readOnly: true,

      runId: input.runId,

      ok: false,

      completedAt: new Date().toISOString(),

      payload: {

        ok: false,

        readOnly: true,

        error: message,

        runtime,

        founderTestLaunchReadinessReportMarkdown: null,
        founderTestLaunchReadinessAssessment: null,

      },

      errorMessage: message,

    });

  } finally {

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

    buildBoundedFounderTestResultDebugResponse({

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

    'v5',

  );

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

    sendFounderTestJson(

      res,

      stored.ok ? 200 : 500,

      buildFounderTestResultMetadataResponse(stored),

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

    sendFounderTestJson(

      res,

      202,

      buildRunningFounderTestResultResponse(runtime, effectiveRunId),

      'v5',

    );

    return;

  }

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


