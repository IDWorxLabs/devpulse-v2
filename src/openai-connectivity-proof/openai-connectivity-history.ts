/**
 * OpenAI Connectivity History — bounded proof history (max 16).
 */

import { MAX_OPENAI_CONNECTIVITY_HISTORY } from './openai-connectivity-registry.js';
import type {
  OpenAiConnectivityAnalysis,
  OpenAiConnectivityHistoryEntry,
} from './openai-connectivity-types.js';

const history: OpenAiConnectivityHistoryEntry[] = [];
const analyses: OpenAiConnectivityAnalysis[] = [];

export function resetOpenAiConnectivityHistoryForTests(): void {
  history.length = 0;
  analyses.length = 0;
}

export function recordOpenAiConnectivityAnalysis(analysis: OpenAiConnectivityAnalysis): void {
  const entry: OpenAiConnectivityHistoryEntry = {
    proofId: analysis.proofId,
    timestamp: analysis.analyzedAt,
    mode: analysis.mode,
    connectivityVerdict: analysis.connectivityVerdict,
    realResponseReceived: analysis.realResponseReceived,
    requestDurationMs: analysis.requestResult.requestDurationMs,
    errorClass: analysis.errorAnalysis?.errorClass ?? null,
  };

  history.unshift(entry);
  analyses.unshift(analysis);

  if (history.length > MAX_OPENAI_CONNECTIVITY_HISTORY) {
    history.length = MAX_OPENAI_CONNECTIVITY_HISTORY;
  }
  if (analyses.length > MAX_OPENAI_CONNECTIVITY_HISTORY) {
    analyses.length = MAX_OPENAI_CONNECTIVITY_HISTORY;
  }
}

export function getOpenAiConnectivityHistorySize(): number {
  return history.length;
}

export function getOpenAiConnectivityHistory(): readonly OpenAiConnectivityHistoryEntry[] {
  return [...history];
}

export function getOpenAiConnectivityAnalyses(): readonly OpenAiConnectivityAnalysis[] {
  return [...analyses];
}

export function getLatestOpenAiConnectivityAnalysis(): OpenAiConnectivityAnalysis | null {
  return analyses[0] ?? null;
}
