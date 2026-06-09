/**
 * History evolution analyzer — project evolution summaries.
 */

import type {
  HistoryCheckpoint,
  HistoryEvent,
  HistoryEvolutionSummary,
  HistoryPhaseTransition,
  HistoryRollback,
} from './project-history-intelligence-types.js';
import { recentChanges } from './history-change-analyzer.js';

export function buildEvolutionSummary(
  projectId: string,
  projectName: string,
  events: HistoryEvent[],
  checkpoints: HistoryCheckpoint[],
  rollbacks: HistoryRollback[],
  phaseTransitions: HistoryPhaseTransition[],
): HistoryEvolutionSummary {
  const recent = recentChanges(events, 6);
  const milestones = events
    .filter((e) => e.changeType === 'MILESTONE' || e.changeType === 'CHECKPOINT_PASSED' || e.changeType === 'PHASE_COMPLETED')
    .map((e) => e.summary);

  const majorMilestones = [
    ...new Set([
      ...milestones,
      ...checkpoints.map((c) => `${c.capability} — ${c.phase} checkpoint`),
      'Phase 11 Command Center intelligence stack complete',
      'Phase 12 intelligence bridge layers (Vault, Dependency, Workspace, History)',
    ]),
  ].slice(0, 12);

  const narrative = [
    `${projectName} evolved from governance foundations through Phase 11 Command Center intelligence.`,
    `Phase 11 introduced Brain, Cross-System Awareness, Shared Memory, Project Understanding, Timeline, and Unified Decision Layer.`,
    `Phase 12 added read-only Vault bridge, Dependency Intelligence, Workspace Intelligence, and Project History Intelligence.`,
    `Execution paths were rolled back and intelligence-only advisory path restored.`,
  ].join(' ');

  return {
    projectId,
    projectName,
    totalEvents: events.length,
    checkpointCount: checkpoints.length,
    rollbackCount: rollbacks.filter((r) => r.summary.toLowerCase().includes('rollback') || r.restoredBy).length,
    phaseTransitionCount: phaseTransitions.length,
    majorMilestones,
    recentChanges: recent.map((e) => e.summary),
    historyConfidence: events.length > 10 ? 'HIGH' : 'MEDIUM',
    evolutionNarrative: narrative,
    readOnly: true,
  };
}

export function analyzeProjectHistory(query: string, snapshot: import('./project-history-intelligence-types.js').ProjectHistorySnapshot) {
  const lower = query.toLowerCase();
  let matchedEvents = snapshot.events;

  if (lower.includes('phase 11') || lower.includes('during phase 11')) {
    matchedEvents = snapshot.events.filter((e) => e.phase.startsWith('11'));
  } else if (lower.includes('phase 12') || lower.includes('during phase 12')) {
    matchedEvents = snapshot.events.filter((e) => e.phase.startsWith('12'));
  } else if (lower.includes('recently') || lower.includes('recent')) {
    matchedEvents = recentChanges(snapshot.events, 8);
  } else if (lower.includes('rollback') || lower.includes('rolled back')) {
    matchedEvents = snapshot.events.filter((e) => e.changeType === 'ROLLBACK');
  } else if (lower.includes('restored') || lower.includes('restore')) {
    matchedEvents = snapshot.events.filter((e) => e.changeType === 'RESTORE');
  } else if (lower.includes('dependency intelligence')) {
    matchedEvents = snapshot.events.filter((e) => e.source === 'dependency_intelligence');
  } else if (lower.includes('workspace intelligence')) {
    matchedEvents = snapshot.events.filter((e) => e.source === 'workspace_intelligence');
  } else if (lower.includes('milestone')) {
    matchedEvents = snapshot.events.filter(
      (e) => e.changeType === 'MILESTONE' || e.changeType === 'CHECKPOINT_PASSED',
    );
  }

  let matchedCheckpoints = snapshot.checkpoints;
  if (lower.includes('checkpoint') || lower.includes('introduced')) {
    const cap = lower.includes('dependency')
      ? snapshot.checkpoints.filter((c) => c.capability.includes('Dependency'))
      : lower.includes('workspace')
        ? snapshot.checkpoints.filter((c) => c.capability.includes('Workspace'))
        : lower.includes('history')
          ? snapshot.checkpoints.filter((c) => c.capability.includes('History'))
          : snapshot.checkpoints;
    matchedCheckpoints = cap;
  }

  return {
    query,
    snapshot,
    matchedEvents,
    matchedCheckpoints,
  };
}
