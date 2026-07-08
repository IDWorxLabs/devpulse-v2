/**
 * Brain API handler — POST /api/brain/respond.
 * Build-intent prompts route into autonomous builder execution before chat/LLM fallback.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import type { BrainResponseResult } from '../src/command-center-brain/brain-types.js';
import {
  executeChatToBuildBridge,
  CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
  CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
} from '../src/chat-to-build-execution-bridge-v1/index.js';
import { ProjectNameConflictRejectedError } from '../src/project-name-conflict-resolution-v1/index.js';
import { resolveProjectRegistryRootDir } from '../src/project-registry-v1/project-registry-v1-store.js';
import {
  classifyBuildIntentRequest,
  type BuildIntentClassification,
} from '../src/build-intent-routing/index.js';
import {
  buildBrainRuntimeVerificationReportFromResult,
} from '../src/command-center-brain/runtime-verification/index.js';
import {
  buildLocalRuntimeHealthPayload,
  isLocalRuntimeReady,
} from '../src/local-runtime-launcher/index.js';
import { buildRuntimeTruthHealthSummary } from '../src/runtime-truth-authority/index.js';
import { getLiveOperationalTruthDiagnostics } from '../src/chat-operational-self-knowledge/index.js';
import { getLaunchProofDiagnostics } from '../src/connected-launch-readiness-proof/index.js';
import {
  generateLlmBackedChatResponseAsync,
  getLlmProviderStatus,
  loadLlmModelConfig,
  toLlmChatBrainDiagnostics,
  buildDevPulseContextPackage,
  hydrateContextForMessage,
  formatGroundedFactsForDisplay,
} from '../src/llm-chat-brain/index.js';
import {
  attachChatExecutionAuditToPayload,
  COMMAND_CENTER_CHAT_AUDIT_EVENTS,
  finalizeChatExecutionAudit,
  recordChatExecutionAuditEvent,
  startChatExecutionAudit,
} from '../src/command-center-chat-execution-audit-v1/index.js';
import { getChatExecutionAuditTrail } from '../src/command-center-chat-execution-audit-v1/audit-store.js';
import {
  HTTP_ROUTING_FORENSIC_EVENTS,
  recordHttpForensicStage,
} from '../src/command-center-http-routing-forensic-audit-v1/index.js';

const MAX_BODY_BYTES = 16_384;
const ROOT_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export function sendBrainOperationalTruth(res: ServerResponse): void {
  const payload = {
    ...getLiveOperationalTruthDiagnostics(),
    launchProof: getLaunchProofDiagnostics(),
  };
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Brain': 'command-center',
  });
  res.end(JSON.stringify(payload));
}

export function sendBrainHealth(res: ServerResponse, options?: { headOnly?: boolean }): void {
  const payload = buildLocalRuntimeHealthPayload();
  const ready = isLocalRuntimeReady();
  const status = ready ? 200 : 503;
  const llmStatus = getLlmProviderStatus();
  const llmConfig = loadLlmModelConfig();
  const probeContext = buildDevPulseContextPackage({ message: 'project status and launch readiness' });
  const probeHydration = probeContext.hydration ?? hydrateContextForMessage({ message: 'project status and launch readiness' });
  const fd = probeContext.foundationDiagnostics;

  if (options?.headOnly) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-DevPulse-Brain': 'command-center',
      'X-DevPulse-Runtime-Ready': ready ? 'yes' : 'no',
    });
    res.end();
    return;
  }

  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Brain': 'command-center',
    'X-DevPulse-Phase': '27.3',
    'X-DevPulse-Brain-Capability': payload.serverCapability,
    'X-DevPulse-Llm-Connected': llmStatus.connected ? 'yes' : 'no',
    'X-DevPulse-Runtime-Ready': ready ? 'yes' : 'no',
  });
  res.end(
    JSON.stringify({
      ...payload,
      runtimeTruth: buildRuntimeTruthHealthSummary(ROOT_DIR),
      ...(ready
        ? {}
        : {
            error: 'Local runtime not ready',
            operatorMessage:
              'AiDevEngine local runtime is stale or unavailable. Restart using Start-AiDevEngine.',
          }),
      llmConnected: llmStatus.connected,
      llmProvider: llmStatus.provider,
      llmModel: llmStatus.model,
      llmApiKeyConfigured: Boolean(llmConfig.apiKey),
      contextIncluded: probeContext.contextIncluded,
      contextSourcesUsed: probeHydration.selectedSources ?? probeContext.contextSourcesUsed,
      lastContextHydration: probeHydration.status ?? probeContext.hydration?.status ?? null,
      hydratedFactCount: probeContext.hydratedFactCount,
      contextConfidence: probeContext.contextConfidence,
      contextSourcesLabel: formatGroundedFactsForDisplay(probeContext.contextSourcesUsed),
      identityLoaded: fd.identityLoaded,
      founderLoaded: fd.founderLoaded,
      productLoaded: fd.productLoaded,
      historyLoaded: fd.historyLoaded,
      selfEvolutionLoaded: fd.selfEvolutionLoaded,
      identityVersion: fd.identityVersion,
      founderVersion: fd.founderVersion,
      productVersion: fd.productVersion,
      currentProductIdentity: fd.currentProductIdentity,
      founderIdentity: fd.founderIdentity,
      companyIdentity: fd.companyIdentity,
      legacyIdentity: fd.legacyIdentity,
    }),
  );
}

export function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function applyLlmBrainLayer(
  result: BrainResponseResult,
  message: string,
): Promise<BrainResponseResult> {
  const llmStatus = getLlmProviderStatus();
  if (!llmStatus.connected) return result;

  try {
    const llm = await generateLlmBackedChatResponseAsync({
      message,
      draftResponse: result.brainResponse,
    });

    return {
      ...result,
      brainResponse: llm.finalAnswer.trim() || result.brainResponse,
      llmChatBrainDiagnostics: toLlmChatBrainDiagnostics(llm.metadata),
      confirmation: {
        ...result.confirmation,
        noExternalAiCalls: !llm.metadata.usedLlm,
      },
    };
  } catch {
    return result;
  }
}

function sendBuildBrainResponse(
  res: ServerResponse,
  payload: Record<string, unknown>,
  buildStatus: string,
  buildIntentClassification: BuildIntentClassification,
  auditId?: string,
  httpRequestId?: string,
): void {
  const enriched = auditId ? attachChatExecutionAuditToPayload(payload, auditId) : payload;
  if (auditId) {
    recordChatExecutionAuditEvent({
      auditId,
      layer: 'server',
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.HANDLER_RESPONSE_SENT,
      detail: `Build response sent with status ${buildStatus}.`,
      metadata: { buildStatus },
    });
    finalizeChatExecutionAudit({
      auditId,
      outcome: buildStatus === 'FAILED' ? 'BUILD_FAILED' : 'BUILD_STARTED',
    });
  }
  recordHttpForensicStage(
    httpRequestId,
    HTTP_ROUTING_FORENSIC_EVENTS.HANDLER_RESPONSE,
    `Handler response sent with buildStatus=${buildStatus}`,
    'server/brain-api-handler.ts',
    'sendBuildBrainResponse',
    { buildStatus },
  );
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Brain': 'command-center',
    'X-DevPulse-Phase': '27.2',
    'X-DevPulse-Build': buildStatus,
    'X-DevPulse-Build-Response-Source': String(payload.buildResponseSource ?? 'AEE_CONTROLLED_RESULT'),
    'X-DevPulse-Build-Intent': buildIntentClassification.isBuildIntent ? 'yes' : 'no',
    'X-DevPulse-Chat-To-Build-Bridge': CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
  });
  res.end(JSON.stringify({ ...enriched, buildIntentClassification }));
}

export async function handleClassifyBuildIntentRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const raw = await readRequestBody(req);
    const body = JSON.parse(raw) as { message?: string };
    if (!body.message?.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'message is required' }));
      return;
    }

    const classification = classifyBuildIntentRequest(body.message);
    console.log(
      `BRAIN_BUILD_INTENT_CLASSIFY contract=${classification.contractVersion} isBuildIntent=${classification.isBuildIntent} route=${classification.route}`,
    );

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-DevPulse-Brain': 'command-center',
      'X-DevPulse-Build-Intent': classification.isBuildIntent ? 'yes' : 'no',
    });
    res.end(JSON.stringify(classification));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid classify request';
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: message }));
  }
}

export async function handleBrainRespondRequest(
  req: IncomingMessage,
  res: ServerResponse,
  httpRequestId?: string,
): Promise<void> {
  let auditId = `server-audit-${Date.now()}`;
  try {
    recordHttpForensicStage(
      httpRequestId,
      HTTP_ROUTING_FORENSIC_EVENTS.HANDLER_ENTER,
      'brain-api-handler received POST /api/brain/respond',
      'server/brain-api-handler.ts',
      'handleBrainRespondRequest',
    );

    const raw = await readRequestBody(req);
    const body = JSON.parse(raw) as {
      message?: string;
      timestamp?: number;
      activeProjectId?: string;
      projectName?: string;
      confirmProjectContextAlignment?: boolean;
      confirmProjectResume?: boolean;
      confirmFreshCopy?: boolean;
      rejectDuplicates?: boolean;
      resumeAction?: 'RESUME_BUILD' | 'REPAIR_BUILD' | 'CONTINUE_FROM_PROMPT';
      chatExecutionAuditId?: string;
      /** NEW_BUILD_CONFIRMATION_REQUIRED UX V4 — see src/project-context-isolation-v4/. */
      buildIntentOverride?: 'START_NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT';
    };

    auditId = body.chatExecutionAuditId?.trim() || auditId;

    recordHttpForensicStage(
      httpRequestId,
      HTTP_ROUTING_FORENSIC_EVENTS.PAYLOAD_PARSED,
      'Request body parsed for brain respond handler',
      'server/brain-api-handler.ts',
      'handleBrainRespondRequest',
      {
        hasMessage: Boolean(body.message?.trim()),
        activeProjectId: body.activeProjectId ?? null,
      },
    );

    if (!body.message?.trim()) {
      recordChatExecutionAuditEvent({
        auditId,
        layer: 'server',
        name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.HANDLER_EMPTY_MESSAGE,
        detail: 'Brain handler rejected empty message.',
      });
      finalizeChatExecutionAudit({ auditId, outcome: 'NO_OP', noOpReason: 'Empty message' });
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'message is required' }));
      return;
    }

    if (!getChatExecutionAuditTrail(auditId)) {
      startChatExecutionAudit({
        auditId,
        messagePreview: body.message.trim(),
        activeProjectId: body.activeProjectId ?? null,
        projectName: body.projectName ?? null,
      });
    }

    recordChatExecutionAuditEvent({
      auditId,
      layer: 'server',
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.HANDLER_ENTER,
      detail: 'brain-api-handler received POST /api/brain/respond.',
      metadata: {
        activeProjectId: body.activeProjectId ?? null,
        projectName: body.projectName ?? null,
      },
    });

    const registryRoot = resolveProjectRegistryRootDir();

    recordChatExecutionAuditEvent({
      auditId,
      layer: 'server',
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_INVOKE,
      detail: 'Invoking executeChatToBuildBridge for Command Center message.',
    });

    recordHttpForensicStage(
      httpRequestId,
      HTTP_ROUTING_FORENSIC_EVENTS.BRIDGE_ENTER,
      'Invoking executeChatToBuildBridge',
      'server/brain-api-handler.ts',
      'handleBrainRespondRequest',
    );

    let bridgeResult = await executeChatToBuildBridge({
      message: body.message,
      source: 'chat',
      activeProjectId: body.activeProjectId ?? null,
      projectName: body.projectName ?? null,
      confirmProjectContextAlignment: body.confirmProjectContextAlignment === true,
      confirmProjectResume: body.confirmProjectResume === true,
      confirmFreshCopy: body.confirmFreshCopy === true,
      rejectDuplicates: body.rejectDuplicates === true,
      resumeAction: body.resumeAction,
      buildIntentOverride: body.buildIntentOverride ?? null,
      rootDir: registryRoot,
      repoRootDir: ROOT_DIR,
      chatExecutionAuditId: auditId,
      httpRequestId: httpRequestId ?? null,
    });

    recordHttpForensicStage(
      httpRequestId,
      HTTP_ROUTING_FORENSIC_EVENTS.BUILD_INTENT_ANALYZED,
      `Build intent=${bridgeResult.classification.isBuildIntent} route=${bridgeResult.classification.route}`,
      'server/brain-api-handler.ts',
      'handleBrainRespondRequest',
      {
        isBuildIntent: bridgeResult.classification.isBuildIntent,
        route: bridgeResult.classification.route,
      },
    );

    recordChatExecutionAuditEvent({
      auditId,
      layer: 'server',
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BUILD_INTENT_DECISION,
      detail: `Build intent=${bridgeResult.classification.isBuildIntent} route=${bridgeResult.classification.route}`,
      metadata: {
        isBuildIntent: bridgeResult.classification.isBuildIntent,
        route: bridgeResult.classification.route,
      },
    });

    recordChatExecutionAuditEvent({
      auditId,
      layer: 'server',
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_RESULT,
      detail: `Bridge kind=${bridgeResult.kind}`,
      metadata: { bridgeKind: bridgeResult.kind },
    });

    console.log(
      `CHAT_TO_BUILD_BRIDGE kind=${bridgeResult.kind} isBuildIntent=${bridgeResult.classification.isBuildIntent}`,
    );

    if (bridgeResult.kind === 'CHAT_ONLY') {
      const recoveredClassification = classifyBuildIntentRequest(body.message);
      if (recoveredClassification.buildIntentDetected) {
        console.warn(
          'BUILD_INTENT_CLASSIFICATION_RECOVERY_V1: bridge returned CHAT_ONLY for build prompt — forcing BUILD_ORCHESTRATION',
        );
        bridgeResult = await executeChatToBuildBridge({
          message: body.message,
          source: 'chat',
          activeProjectId: body.activeProjectId ?? null,
          projectName: body.projectName ?? null,
          confirmProjectContextAlignment: body.confirmProjectContextAlignment === true,
          confirmProjectResume: body.confirmProjectResume === true,
          confirmFreshCopy: body.confirmFreshCopy === true,
          rejectDuplicates: body.rejectDuplicates === true,
          resumeAction: body.resumeAction,
          buildIntentOverride: body.buildIntentOverride ?? null,
          rootDir: registryRoot,
          repoRootDir: ROOT_DIR,
          chatExecutionAuditId: auditId,
          httpRequestId: httpRequestId ?? null,
          forceBuildIntent: true,
        });
      }
    }

    if (bridgeResult.kind === 'CHAT_ONLY') {
      let result = processBrainRequest({
        message: body.message,
        timestamp: body.timestamp ?? Date.now(),
      });

      result = await applyLlmBrainLayer(result, body.message);

      const runtimeReport = buildBrainRuntimeVerificationReportFromResult(result, {
        endpointReachable: true,
        responseRendered: false,
        notificationActivated: false,
      });

      const llmConnected = result.llmChatBrainDiagnostics?.llmConnected ?? getLlmProviderStatus().connected;

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-DevPulse-Brain': 'command-center',
        'X-DevPulse-Phase': '26',
        'X-DevPulse-Llm-Connected': llmConnected ? 'yes' : 'no',
      });
      finalizeChatExecutionAudit({ auditId, outcome: 'CHAT_ONLY' });
      recordChatExecutionAuditEvent({
        auditId,
        layer: 'server',
        name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.HANDLER_RESPONSE_SENT,
        detail: 'Chat-only response sent.',
      });
      recordHttpForensicStage(
        httpRequestId,
        HTTP_ROUTING_FORENSIC_EVENTS.HANDLER_RESPONSE,
        'Chat-only handler response sent',
        'server/brain-api-handler.ts',
        'handleBrainRespondRequest',
      );
      res.end(
        JSON.stringify(
          attachChatExecutionAuditToPayload(
            { ...result, runtimeReport, buildIntentClassification: bridgeResult.classification },
            auditId,
          ),
        ),
      );
      return;
    }

    if (bridgeResult.kind === 'ALIGNMENT_REQUIRED' && bridgeResult.alignmentPayload) {
      finalizeChatExecutionAudit({ auditId, outcome: 'ALIGNMENT_REQUIRED' });
      recordHttpForensicStage(
        httpRequestId,
        HTTP_ROUTING_FORENSIC_EVENTS.HANDLER_RESPONSE,
        'Alignment-required handler response sent',
        'server/brain-api-handler.ts',
        'handleBrainRespondRequest',
      );
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-DevPulse-Brain': 'command-center',
        'X-DevPulse-Alignment': 'BLOCKED',
        'X-DevPulse-Chat-To-Build-Bridge': CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
      });
      res.end(
        JSON.stringify(
          attachChatExecutionAuditToPayload(
            {
              ...bridgeResult.alignmentPayload,
              buildIntentClassification: bridgeResult.classification,
              chatToBuildExecutionBridge: {
                contractVersion: CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
                trace: CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
                kind: bridgeResult.kind,
                progressItems: bridgeResult.progressItems,
              },
            },
            auditId,
          ),
        ),
      );
      return;
    }

    if (bridgeResult.kind === 'RESUME_REQUIRED' && bridgeResult.resumePayload) {
      finalizeChatExecutionAudit({ auditId, outcome: 'RESUME_REQUIRED' });
      recordHttpForensicStage(
        httpRequestId,
        HTTP_ROUTING_FORENSIC_EVENTS.HANDLER_RESPONSE,
        'Resume-required handler response sent',
        'server/brain-api-handler.ts',
        'handleBrainRespondRequest',
      );
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-DevPulse-Brain': 'command-center',
        'X-DevPulse-Resume': 'DUPLICATE_DETECTED',
        'X-DevPulse-Chat-To-Build-Bridge': CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
      });
      res.end(
        JSON.stringify(
          attachChatExecutionAuditToPayload(
            {
              brainResponse:
                typeof bridgeResult.resumePayload.message === 'string'
                  ? bridgeResult.resumePayload.message
                  : 'Existing project found. Choose how to continue.',
              category: 'BUILD',
              projectResume: bridgeResult.resumePayload,
              buildIntentClassification: bridgeResult.classification,
              chatToBuildExecutionBridge: {
                contractVersion: CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
                trace: CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
                kind: bridgeResult.kind,
                progressItems: bridgeResult.progressItems,
              },
            },
            auditId,
          ),
        ),
      );
      return;
    }

    if (bridgeResult.kind === 'NEW_BUILD_CONFIRMATION_REQUIRED') {
      // Project Context Isolation V4 — New Build Decision Authority could not classify this
      // request as a new build or a continuation from current-request evidence alone.
      finalizeChatExecutionAudit({ auditId, outcome: 'NEW_BUILD_CONFIRMATION_REQUIRED' });
      recordHttpForensicStage(
        httpRequestId,
        HTTP_ROUTING_FORENSIC_EVENTS.HANDLER_RESPONSE,
        'New-build-confirmation-required handler response sent',
        'server/brain-api-handler.ts',
        'handleBrainRespondRequest',
      );
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-DevPulse-Brain': 'command-center',
        'X-DevPulse-New-Build-Confirmation': 'REQUIRED',
        'X-DevPulse-Chat-To-Build-Bridge': CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
      });
      res.end(
        JSON.stringify(
          attachChatExecutionAuditToPayload(
            {
              brainResponse:
                bridgeResult.contextIsolation?.message ??
                'Do you want to start a new app, or continue the existing project?',
              category: 'BUILD',
              newBuildConfirmation: bridgeResult.newBuildConfirmationPayload ?? null,
              contextIsolation: bridgeResult.contextIsolation ?? null,
              buildIntentClassification: bridgeResult.classification,
              chatToBuildExecutionBridge: {
                contractVersion: CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
                trace: CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
                kind: bridgeResult.kind,
                progressItems: bridgeResult.progressItems,
              },
            },
            auditId,
          ),
        ),
      );
      return;
    }

    if (bridgeResult.brainPayload) {
      const buildStatus =
        bridgeResult.buildResult?.status ??
        (bridgeResult.kind === 'BUILD_FAILED' ? 'FAILED' : 'READY');
      sendBuildBrainResponse(
        res,
        bridgeResult.brainPayload,
        buildStatus,
        bridgeResult.classification,
        auditId,
        httpRequestId,
      );
      return;
    }

    recordChatExecutionAuditEvent({
      auditId,
      layer: 'server',
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_SKIP,
      detail: 'Bridge completed without brainPayload — unexpected empty result.',
    });
    finalizeChatExecutionAudit({
      auditId,
      outcome: 'FAILED',
      noOpReason: 'Bridge returned no brainPayload',
    });
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Bridge returned no response payload', chatExecutionAuditId: auditId }));
  } catch (err) {
    if (err instanceof ProjectNameConflictRejectedError) {
      res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message, projectIdentity: err.identity, rejectDuplicates: true }));
      return;
    }
    const message = err instanceof Error ? err.message : 'Invalid brain request';
    if (typeof auditId === 'string') {
      recordChatExecutionAuditEvent({
        auditId,
        layer: 'server',
        name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.HANDLER_ERROR,
        detail: message,
      });
      finalizeChatExecutionAudit({ auditId, outcome: 'FAILED', noOpReason: message });
    }
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: message }));
  }
}
