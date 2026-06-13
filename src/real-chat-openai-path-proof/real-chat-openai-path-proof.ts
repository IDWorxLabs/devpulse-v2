/**
 * Real Chat OpenAI Path Proof — chat path orchestrator (V1).
 */

import { detectOpenAiKey } from '../openai-connectivity-proof/openai-key-detector.js';
import { analyzeChatPathError } from './chat-path-error-analyzer.js';
import { buildFounderTestMessage } from './chat-path-message-builder.js';
import { resolveChatPathProvider } from './chat-path-provider-resolver.js';
import {
  getChatPathProofHistory,
  getChatPathProofResults,
  recordChatPathProofResult,
  resetChatPathProofHistoryForTests,
} from './chat-path-proof-history.js';
import {
  buildRealChatOpenAiPathProofReport,
  buildRealChatOpenAiPathProofReportMarkdown,
} from './chat-path-proof-report-builder.js';
import { runChatPathRequest } from './chat-path-request-runner.js';
import { validateChatPathResponse } from './chat-path-response-validator.js';
import type {
  ChatPathVerdict,
  RealChatOpenAiPathProofResult,
  RealChatOpenAiPathProofRun,
  RunRealChatOpenAiPathProofInput,
} from './real-chat-openai-path-types.js';

let proofCounter = 0;

export function resetRealChatOpenAiPathProofCounterForTests(): void {
  proofCounter = 0;
}

export function resetRealChatOpenAiPathProofModuleForTests(): void {
  resetRealChatOpenAiPathProofCounterForTests();
  resetChatPathProofHistoryForTests();
}

function nextProofId(): string {
  proofCounter += 1;
  return `real-chat-openai-path-${proofCounter}`;
}

function deriveChatPathVerdict(input: {
  mode: 'mock' | 'real';
  keyStatus: import('./real-chat-openai-path-types.js').RealChatOpenAiPathProofResult['keyStatus'];
  providerResolution: import('./real-chat-openai-path-types.js').ChatPathProviderResolution;
  requestResult: import('./real-chat-openai-path-types.js').ChatPathRequestResult;
  responseValidation: import('./real-chat-openai-path-types.js').ChatPathResponseValidation;
}): { verdict: ChatPathVerdict; realResponseReceived: boolean; summary: string } {
  const realResponseReceived =
    input.mode === 'real' &&
    input.requestResult.requestSent &&
    input.requestResult.usedLlm &&
    !input.requestResult.fallbackUsed &&
    input.responseValidation.status === 'VALID';

  if (input.keyStatus.status !== 'PRESENT') {
    return {
      verdict: 'CHAT_OPENAI_DISCONNECTED',
      realResponseReceived: false,
      summary: 'Chat path disconnected — API key missing or invalid.',
    };
  }

  if (
    input.responseValidation.status === 'VALID' &&
    input.requestResult.usedLlm &&
    !input.requestResult.fallbackUsed
  ) {
    if (input.mode === 'real' && input.providerResolution.openAiProviderSelected) {
      return {
        verdict: 'CHAT_OPENAI_CONNECTED',
        realResponseReceived: true,
        summary: 'Real chat path received a validated founder-facing OpenAI response.',
      };
    }
    if (input.mode === 'mock') {
      return {
        verdict: 'CHAT_OPENAI_CONNECTED',
        realResponseReceived: false,
        summary: 'Mock chat path succeeded (diagnostic only — not a real API proof).',
      };
    }
  }

  if (
    input.keyStatus.status === 'PRESENT' &&
    (input.requestResult.requestSent || input.providerResolution.connectivityPrerequisitesMet)
  ) {
    return {
      verdict: 'CHAT_OPENAI_PARTIAL',
      realResponseReceived: false,
      summary: 'Chat path partially working — key present but response or routing incomplete.',
    };
  }

  return {
    verdict: 'CHAT_OPENAI_DISCONNECTED',
    realResponseReceived: false,
    summary: 'Chat path disconnected — no validated founder-facing response.',
  };
}

export async function proveRealChatOpenAiPath(
  input: RunRealChatOpenAiPathProofInput = {},
): Promise<RealChatOpenAiPathProofResult> {
  const env = input.env ?? process.env;
  const mode = input.mode ?? 'real';
  const testMessage = buildFounderTestMessage(input.testMessage);

  const keyStatus = detectOpenAiKey(env);
  const providerResolution = resolveChatPathProvider({ env, mode });

  const requestResult = await runChatPathRequest({
    mode,
    testMessage,
    providerResolution,
    rootDir: input.rootDir,
    providerOverride: input.providerOverride ?? null,
  });

  const responseValidation = validateChatPathResponse({ requestResult, mode });
  const errorAnalysis = analyzeChatPathError({ providerResolution, requestResult, responseValidation });
  const derived = deriveChatPathVerdict({
    mode,
    keyStatus,
    providerResolution,
    requestResult,
    responseValidation,
  });

  const result: RealChatOpenAiPathProofResult = {
    readOnly: true,
    proofId: nextProofId(),
    analyzedAt: new Date().toISOString(),
    mode,
    testMessage,
    keyStatus,
    providerResolution,
    requestResult,
    responseValidation,
    errorAnalysis,
    realResponseReceived: derived.realResponseReceived,
    finalVerdict: derived.verdict,
    summary: derived.summary,
  };

  if (!input.skipHistoryRecording) {
    recordChatPathProofResult(result);
  }

  return result;
}

export async function runRealChatOpenAiPathProof(
  input: RunRealChatOpenAiPathProofInput = {},
): Promise<RealChatOpenAiPathProofRun> {
  try {
    const result = await proveRealChatOpenAiPath(input);
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'REAL_CHAT_OPENAI_PATH_PROOF_COMPLETE',
      result,
      failureReason: null,
    };
  } catch (error) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'REAL_CHAT_OPENAI_PATH_PROOF_FAILED',
      result: null,
      failureReason: error instanceof Error ? error.message : 'CHAT_PATH_PROOF_FAILED',
    };
  }
}

export function buildRealChatOpenAiPathProofArtifacts(input: {
  results?: readonly RealChatOpenAiPathProofResult[];
} = {}): {
  report: import('./real-chat-openai-path-types.js').RealChatOpenAiPathProofReport;
  markdown: string;
} {
  const history = getChatPathProofHistory();
  const storedResults = input.results ?? getChatPathProofResults();
  const report = buildRealChatOpenAiPathProofReport({ results: storedResults, history });

  const latestResults =
    storedResults.length > 0 ? storedResults : report.latestResult ? [report.latestResult] : [];

  return {
    report,
    markdown: buildRealChatOpenAiPathProofReportMarkdown(report, latestResults),
  };
}
