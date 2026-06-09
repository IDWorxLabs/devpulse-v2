/**
 * DevPulse V2 Phase 12.4 — Project History Intelligence types.
 * Historical evolution awareness — does not replace Timeline Intelligence.
 */

export const PROJECT_HISTORY_INTELLIGENCE_PASS_TOKEN =
  'DEVPULSE_V2_PROJECT_HISTORY_INTELLIGENCE_FOUNDATION_V1_PASS';
export const PROJECT_HISTORY_INTELLIGENCE_OWNER_MODULE =
  'devpulse_v2_project_history_intelligence';

export type HistoryChangeType =
  | 'CAPABILITY_ADDED'
  | 'PHASE_COMPLETED'
  | 'CHECKPOINT_PASSED'
  | 'ROLLBACK'
  | 'RESTORE'
  | 'MILESTONE'
  | 'INTEGRATION'
  | 'VALIDATION';

export type HistoryConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface HistoryEvent {
  eventId: string;
  timestamp: number;
  phase: string;
  changeType: HistoryChangeType;
  source: string;
  summary: string;
  confidence: HistoryConfidence;
  checkpointReference: string | null;
  rollbackReference: string | null;
  reason: string;
  workspaceId: string | null;
  readOnly: true;
}

export interface HistoryCheckpoint {
  checkpointId: string;
  passToken: string;
  phase: string;
  capability: string;
  summary: string;
  timestamp: number;
  confidence: HistoryConfidence;
  readOnly: true;
}

export interface HistoryPhaseTransition {
  transitionId: string;
  fromPhase: string;
  toPhase: string;
  timestamp: number;
  reason: string;
  capabilityIntroduced: string | null;
  confidence: HistoryConfidence;
  readOnly: true;
}

export interface HistoryChange {
  changeId: string;
  eventId: string;
  phase: string;
  changeType: HistoryChangeType;
  summary: string;
  reason: string;
  confidence: HistoryConfidence;
  readOnly: true;
}

export interface HistoryRollback {
  rollbackId: string;
  eventId: string;
  phase: string;
  summary: string;
  reason: string;
  restoredBy: string | null;
  confidence: HistoryConfidence;
  readOnly: true;
}

export interface HistoryEvolutionSummary {
  projectId: string;
  projectName: string;
  totalEvents: number;
  checkpointCount: number;
  rollbackCount: number;
  phaseTransitionCount: number;
  majorMilestones: string[];
  recentChanges: string[];
  historyConfidence: HistoryConfidence;
  evolutionNarrative: string;
  readOnly: true;
}

export interface ProjectHistorySnapshot {
  events: HistoryEvent[];
  checkpoints: HistoryCheckpoint[];
  phaseTransitions: HistoryPhaseTransition[];
  changes: HistoryChange[];
  rollbacks: HistoryRollback[];
  evolution: HistoryEvolutionSummary;
  eventCount: number;
  checkpointCount: number;
  rollbackCount: number;
  phaseTransitionCount: number;
  builtAt: number;
}

export interface ProjectHistoryAnalysis {
  query: string;
  snapshot: ProjectHistorySnapshot;
  matchedEvents: HistoryEvent[];
  matchedCheckpoints: HistoryCheckpoint[];
}

export interface ProjectHistoryIntelligenceDiagnostics {
  projectHistoryIntelligenceActive: boolean;
  historyEventCount: number;
  checkpointCount: number;
  rollbackCount: number;
  lastHistoryQuery: string | null;
  historyConfidence: HistoryConfidence;
  phaseTransitionCount: number;
}

export interface ProjectHistoryAnswer {
  query: string;
  analysis: ProjectHistoryAnalysis;
  responseText: string;
}

export const HISTORY_QUESTION_SIGNALS = [
  'history',
  'evolution',
  'evolved',
  'checkpoint',
  'rollback',
  'rolled back',
  'restored',
  'milestone',
  'introduced',
  'added',
  'removed',
  'what changed recently',
  'what changed during',
  'changed during',
  'when was',
  'when did',
  'how has',
  'major milestones',
  'capability was introduced',
  'introduced by',
  'during phase',
  'changed during',
  'project evolved',
  'history intelligence',
] as const;

export const FORBIDDEN_PROJECT_HISTORY_DUPLICATES = [
  'history_brain',
  'timeline_v2',
  'project_history_brain',
  'brain_v2',
  'project_brain',
  'memory_brain',
  'history_intelligence',
  'change_history_engine',
  'project_evolution_engine',
  'second_project_history',
] as const;

export function isProjectHistoryIntelligenceQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  if (HISTORY_QUESTION_SIGNALS.some((s) => lower.includes(s))) return true;
  if (lower.includes('phase 11') || lower.includes('phase 12')) {
    if (lower.includes('change') || lower.includes('introduced') || lower.includes('capability')) return true;
  }
  return false;
}

export function isDuplicateHistoryBrainQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('create a new timeline system') ||
    lower.includes('timeline v2') ||
    lower.includes('history brain') ||
    lower.includes('second timeline') ||
    lower.includes('replace timeline intelligence') ||
    lower.includes('new history brain')
  );
}
