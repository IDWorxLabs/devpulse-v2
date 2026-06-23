/**
 * Brain API handler — POST /api/brain/respond only. Local intelligence, no execution.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import type { BrainResponseResult } from '../src/command-center-brain/brain-types.js';
import {
  buildBrainHealthPayload,
  buildBrainRuntimeVerificationReportFromResult,
} from '../src/command-center-brain/runtime-verification/index.js';
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

const MAX_BODY_BYTES = 16_384;

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

export function sendBrainHealth(res: ServerResponse): void {
  const payload = buildBrainHealthPayload();
  const llmStatus = getLlmProviderStatus();
  const llmConfig = loadLlmModelConfig();
  const probeContext = buildDevPulseContextPackage({ message: 'project status and launch readiness' });
  const probeHydration = probeContext.hydration ?? hydrateContextForMessage({ message: 'project status and launch readiness' });
  const fd = probeContext.foundationDiagnostics;
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Brain': 'command-center',
    'X-DevPulse-Phase': '26.3.1',
    'X-DevPulse-Brain-Capability': payload.serverCapability,
    'X-DevPulse-Llm-Connected': llmStatus.connected ? 'yes' : 'no',
  });
  res.end(
    JSON.stringify({
      ...payload,
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

export async function handleBrainRespondRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const raw = await readRequestBody(req);
    const body = JSON.parse(raw) as { message?: string; timestamp?: number };

    if (!body.message?.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'message is required' }));
      return;
    }

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
    res.end(JSON.stringify({ ...result, runtimeReport }));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Invalid brain request' }));
  }
}
