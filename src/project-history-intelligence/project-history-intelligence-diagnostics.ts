/**
 * Project History Intelligence diagnostics.
 */

import type {
  HistoryConfidence,
  ProjectHistoryIntelligenceDiagnostics,
  ProjectHistorySnapshot,
} from './project-history-intelligence-types.js';

let diagnostics: ProjectHistoryIntelligenceDiagnostics = {
  projectHistoryIntelligenceActive: false,
  historyEventCount: 0,
  checkpointCount: 0,
  rollbackCount: 0,
  lastHistoryQuery: null,
  historyConfidence: 'LOW',
  phaseTransitionCount: 0,
};

export function getProjectHistoryIntelligenceDiagnostics(): ProjectHistoryIntelligenceDiagnostics {
  return { ...diagnostics };
}

export function updateProjectHistoryIntelligenceDiagnostics(
  query: string,
  snapshot: ProjectHistorySnapshot,
): void {
  diagnostics = {
    projectHistoryIntelligenceActive: true,
    historyEventCount: snapshot.eventCount,
    checkpointCount: snapshot.checkpointCount,
    rollbackCount: snapshot.rollbackCount,
    lastHistoryQuery: query,
    historyConfidence: snapshot.evolution.historyConfidence,
    phaseTransitionCount: snapshot.phaseTransitionCount,
  };
}

export function resetProjectHistoryIntelligenceDiagnostics(): void {
  diagnostics = {
    projectHistoryIntelligenceActive: false,
    historyEventCount: 0,
    checkpointCount: 0,
    rollbackCount: 0,
    lastHistoryQuery: null,
    historyConfidence: 'LOW',
    phaseTransitionCount: 0,
  };
}

export function projectHistoryIntelligenceKey(): string {
  const d = diagnostics;
  return [
    String(d.projectHistoryIntelligenceActive),
    String(d.historyEventCount),
    String(d.checkpointCount),
    String(d.rollbackCount),
    d.historyConfidence,
    String(d.phaseTransitionCount),
  ].join('|');
}
