/**
 * DevPulse V2 Phase 12.4 — Project History Intelligence public API.
 */

export {
  PROJECT_HISTORY_INTELLIGENCE_PASS_TOKEN,
  PROJECT_HISTORY_INTELLIGENCE_OWNER_MODULE,
  HISTORY_QUESTION_SIGNALS,
  FORBIDDEN_PROJECT_HISTORY_DUPLICATES,
  isProjectHistoryIntelligenceQuestion,
  isDuplicateHistoryBrainQuestion,
  type HistoryEvent,
  type HistoryCheckpoint,
  type HistoryPhaseTransition,
  type HistoryChange,
  type HistoryRollback,
  type HistoryEvolutionSummary,
  type HistoryChangeType,
  type HistoryConfidence,
  type ProjectHistorySnapshot,
  type ProjectHistoryAnalysis,
  type ProjectHistoryIntelligenceDiagnostics,
  type ProjectHistoryAnswer,
} from './project-history-intelligence-types.js';

export { readHistoryEvents, readHistoryCheckpoints, resetHistoryEventReaderForTests } from './history-event-reader.js';
export { buildProjectHistorySnapshot, getProjectHistorySnapshot, resetProjectHistorySnapshotForTests } from './history-timeline-builder.js';
export {
  buildPhaseTransitions,
  findCheckpointForCapability,
  checkpointsForPhase,
  checkpointForEvent,
} from './history-checkpoint-analyzer.js';
export {
  buildHistoryChanges,
  buildRollbacks,
  filterEventsByPhase,
  recentChanges,
  findCapabilityIntroduction,
} from './history-change-analyzer.js';
export { buildEvolutionSummary, analyzeProjectHistory } from './history-evolution-analyzer.js';
export {
  getProjectHistoryIntelligenceDiagnostics,
  updateProjectHistoryIntelligenceDiagnostics,
  resetProjectHistoryIntelligenceDiagnostics,
  projectHistoryIntelligenceKey,
} from './project-history-intelligence-diagnostics.js';

export {
  processProjectHistoryIntelligenceRequest,
  historyFactsFromAnalysis,
  getProjectHistoryIntelligenceContext,
} from './project-history-intelligence.js';

export function getDevPulseV2ProjectHistoryIntelligence(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_project_history_intelligence',
    passToken: 'DEVPULSE_V2_PROJECT_HISTORY_INTELLIGENCE_FOUNDATION_V1_PASS',
    phase: 12.4,
  };
}
