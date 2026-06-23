/**
 * Phase 26.92 — Chat Capability Answer Quality history (V1).
 */

import type { ChatCapabilityAnswerQualityReport } from './chat-capability-answer-quality-types.js';

const MAX_HISTORY = 32;

export interface ChatCapabilityAnswerQualityHistoryEntry {
  readOnly: true;
  qualityId: string;
  generatedAt: string;
  averageScore: number;
  allScenariosPassed: boolean;
  passToken: string | null;
}

const history: ChatCapabilityAnswerQualityHistoryEntry[] = [];

export function resetChatCapabilityAnswerQualityHistoryForTests(): void {
  history.length = 0;
}

export function recordChatCapabilityAnswerQualityReport(report: ChatCapabilityAnswerQualityReport): void {
  history.unshift({
    readOnly: true,
    qualityId: report.qualityId,
    generatedAt: report.generatedAt,
    averageScore: report.averageScore,
    allScenariosPassed: report.allScenariosPassed,
    passToken: report.passToken,
  });
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

export function getChatCapabilityAnswerQualityHistorySize(): number {
  return history.length;
}

export function getLatestChatCapabilityAnswerQualityHistoryEntry(): ChatCapabilityAnswerQualityHistoryEntry | null {
  return history[0] ?? null;
}

export function getChatCapabilityAnswerQualityHistory(): readonly ChatCapabilityAnswerQualityHistoryEntry[] {
  return history;
}
