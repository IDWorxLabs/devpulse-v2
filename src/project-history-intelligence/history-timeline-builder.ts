/**
 * History timeline builder — assembles full project history snapshot.
 */

import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { readHistoryCheckpoints, readHistoryEvents } from './history-event-reader.js';
import { buildPhaseTransitions } from './history-checkpoint-analyzer.js';
import { buildHistoryChanges, buildRollbacks } from './history-change-analyzer.js';
import { buildEvolutionSummary } from './history-evolution-analyzer.js';
import type { ProjectHistorySnapshot } from './project-history-intelligence-types.js';

let cachedSnapshot: ProjectHistorySnapshot | null = null;

export function buildProjectHistorySnapshot(query: string): ProjectHistorySnapshot {
  const profile = getCurrentProjectProfile();
  const events = readHistoryEvents(query);
  const checkpoints = readHistoryCheckpoints();
  const phaseTransitions = buildPhaseTransitions(events);
  const changes = buildHistoryChanges(events);
  const rollbacks = buildRollbacks(events);
  const evolution = buildEvolutionSummary(profile.projectId, profile.name, events, checkpoints, rollbacks, phaseTransitions);

  const snapshot: ProjectHistorySnapshot = {
    events,
    checkpoints,
    phaseTransitions,
    changes,
    rollbacks,
    evolution,
    eventCount: events.length,
    checkpointCount: checkpoints.length,
    rollbackCount: rollbacks.length,
    phaseTransitionCount: phaseTransitions.length,
    builtAt: Date.now(),
  };

  cachedSnapshot = snapshot;
  return snapshot;
}

export function getProjectHistorySnapshot(): ProjectHistorySnapshot {
  return cachedSnapshot ?? buildProjectHistorySnapshot('default');
}

export function resetProjectHistorySnapshotForTests(): ProjectHistorySnapshot {
  cachedSnapshot = null;
  return buildProjectHistorySnapshot('reset');
}
