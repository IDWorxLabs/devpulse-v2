/**
 * OpenAI Connectivity Proof — real connectivity orchestrator (V1).
 */

import { validateOpenAiClient } from './openai-client-validator.js';
import { analyzeOpenAiError } from './openai-error-analyzer.js';
import {
  getOpenAiConnectivityAnalyses,
  getOpenAiConnectivityHistory,
  recordOpenAiConnectivityAnalysis,
  resetOpenAiConnectivityHistoryForTests,
} from './openai-connectivity-history.js';
import {
  buildOpenAiConnectivityProofReport,
  buildOpenAiConnectivityProofReportMarkdown,
} from './openai-connectivity-report-builder.js';
import { detectOpenAiKey } from './openai-key-detector.js';
import { runOpenAiConnectivityRequest } from './openai-request-runner.js';
import { validateOpenAiResponse } from './openai-response-validator.js';
import type {
  OpenAiConnectivityAnalysis,
  OpenAiConnectivityProofRun,
  OpenAiConnectivityVerdict,
  RunOpenAiConnectivityProofInput,
} from './openai-connectivity-types.js';

let proofCounter = 0;

export function resetOpenAiConnectivityProofCounterForTests(): void {
  proofCounter = 0;
}

export function resetOpenAiConnectivityProofModuleForTests(): void {
  resetOpenAiConnectivityProofCounterForTests();
  resetOpenAiConnectivityHistoryForTests();
}

function nextProofId(): string {
  proofCounter += 1;
  return `openai-connectivity-${proofCounter}`;
}

function deriveConnectivityVerdict(input: {
  keyStatus: import('./openai-connectivity-types.js').OpenAiKeyStatusResult;
  clientStatus: import('./openai-connectivity-types.js').OpenAiClientStatusResult;
  requestResult: import('./openai-connectivity-types.js').OpenAiRequestResult;
  responseStatus: import('./openai-connectivity-types.js').OpenAiResponseStatusResult;
  mode: 'mock' | 'real';
}): { verdict: OpenAiConnectivityVerdict; realResponseReceived: boolean; summary: string } {
  const realResponseReceived =
    input.mode === 'real' &&
    input.requestResult.requestSent &&
    input.responseStatus.status === 'VALID';

  if (input.keyStatus.status !== 'PRESENT') {
    return {
      verdict: 'DISCONNECTED',
      realResponseReceived: false,
      summary: 'No working OpenAI connection — API key missing or invalid.',
    };
  }

  if (input.responseStatus.status === 'VALID' && input.requestResult.requestSent) {
    if (input.mode === 'real') {
      return {
        verdict: 'CONNECTED',
        realResponseReceived: true,
        summary: 'Real OpenAI request succeeded and a valid response was received.',
      };
    }
    return {
      verdict: 'CONNECTED',
      realResponseReceived: false,
      summary: 'Mock connectivity request succeeded with valid response (not a real API proof).',
    };
  }

  if (input.clientStatus.status === 'READY' && input.requestResult.requestSent && !input.requestResult.errorMessage) {
    return {
      verdict: 'PARTIAL',
      realResponseReceived: false,
      summary: 'Client initialized and request sent, but response validation failed.',
    };
  }

  if (input.keyStatus.status === 'PRESENT' && input.clientStatus.status === 'READY' && input.requestResult.requestSent) {
    return {
      verdict: 'PARTIAL',
      realResponseReceived: false,
      summary: 'API key present and client ready, but request failed or response invalid.',
    };
  }

  return {
    verdict: 'DISCONNECTED',
    realResponseReceived: false,
    summary: 'No working OpenAI connection established.',
  };
}

export async function proveOpenAiConnectivity(
  input: RunOpenAiConnectivityProofInput = {},
): Promise<OpenAiConnectivityAnalysis> {
  const env = input.env ?? process.env;
  const mode = input.mode ?? 'real';

  const keyStatus = detectOpenAiKey(env);
  const clientStatus = validateOpenAiClient({ env, keyStatus });

  const { requestResult, response } = await runOpenAiConnectivityRequest({
    env,
    clientStatus,
    mode,
    mockTransport: input.mockTransport ?? null,
    timeoutMs: input.timeoutMs,
  });

  const responseStatus = validateOpenAiResponse(response);
  const errorAnalysis =
    requestResult.errorMessage != null
      ? analyzeOpenAiError({ error: new Error(requestResult.errorMessage), fallbackMessage: requestResult.errorMessage })
      : responseStatus.status !== 'VALID' && requestResult.requestSent
        ? analyzeOpenAiError({
            error: new Error(responseStatus.reason),
            fallbackMessage: responseStatus.reason,
          })
        : null;

  const derived = deriveConnectivityVerdict({
    keyStatus,
    clientStatus,
    requestResult,
    responseStatus,
    mode,
  });

  const analysis: OpenAiConnectivityAnalysis = {
    readOnly: true,
    proofId: nextProofId(),
    analyzedAt: new Date().toISOString(),
    mode,
    keyStatus,
    clientStatus,
    requestResult,
    responseStatus,
    errorAnalysis,
    connectivityVerdict: derived.verdict,
    realResponseReceived: derived.realResponseReceived,
    summary: derived.summary,
  };

  if (!input.skipHistoryRecording) {
    recordOpenAiConnectivityAnalysis(analysis);
  }

  return analysis;
}

export async function runOpenAiConnectivityProof(
  input: RunOpenAiConnectivityProofInput = {},
): Promise<OpenAiConnectivityProofRun> {
  try {
    const analysis = await proveOpenAiConnectivity(input);
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'OPENAI_CONNECTIVITY_PROOF_COMPLETE',
      analysis,
      failureReason: null,
    };
  } catch (error) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'OPENAI_CONNECTIVITY_PROOF_FAILED',
      analysis: null,
      failureReason: error instanceof Error ? error.message : 'CONNECTIVITY_PROOF_FAILED',
    };
  }
}

export function buildOpenAiConnectivityProofArtifacts(input: {
  analyses?: readonly OpenAiConnectivityAnalysis[];
} = {}): {
  report: import('./openai-connectivity-types.js').OpenAiConnectivityProofReport;
  markdown: string;
} {
  const history = getOpenAiConnectivityHistory();
  const storedAnalyses = input.analyses ?? getOpenAiConnectivityAnalyses();
  const report = buildOpenAiConnectivityProofReport({ analyses: storedAnalyses, history });

  const latestAnalyses =
    storedAnalyses.length > 0
      ? storedAnalyses
      : report.latestAnalysis
        ? [report.latestAnalysis]
        : [];

  return {
    report,
    markdown: buildOpenAiConnectivityProofReportMarkdown(report, latestAnalyses),
  };
}
