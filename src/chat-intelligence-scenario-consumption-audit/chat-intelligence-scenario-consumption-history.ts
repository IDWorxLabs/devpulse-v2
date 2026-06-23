/**
 * Phase 26.95 — Chat Intelligence Scenario Consumption history (V1).
 */

import type { ChatIntelligenceScenarioConsumptionReport } from './chat-intelligence-scenario-consumption-types.js';

const MAX_HISTORY = 32;

export interface ChatIntelligenceScenarioConsumptionHistoryEntry {
  readOnly: true;
  auditId: string;
  generatedAt: string;
  scenariosRun: number;
  scenariosPassed: number;
  chatIntelligenceScore: number;
  contradictionDetected: boolean;
  passToken: string | null;
}

const history: ChatIntelligenceScenarioConsumptionHistoryEntry[] = [];

export function resetChatIntelligenceScenarioConsumptionHistoryForTests(): void {
  history.length = 0;
}

export function recordChatIntelligenceScenarioConsumptionReport(
  report: ChatIntelligenceScenarioConsumptionReport,
): void {
  history.unshift({
    readOnly: true,
    auditId: report.auditId,
    generatedAt: report.generatedAt,
    scenariosRun: report.scenariosRun,
    scenariosPassed: report.scenariosPassed,
    chatIntelligenceScore: report.chatIntelligenceScore,
    contradictionDetected: report.contradictionDetected,
    passToken: report.passToken,
  });
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

export function getChatIntelligenceScenarioConsumptionHistorySize(): number {
  return history.length;
}

export function getChatIntelligenceScenarioConsumptionHistory(): readonly ChatIntelligenceScenarioConsumptionHistoryEntry[] {
  return history;
}
