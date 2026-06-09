/**
 * History checkpoint analyzer — checkpoint and phase transition tracking.
 */

import type {
  HistoryCheckpoint,
  HistoryEvent,
  HistoryPhaseTransition,
} from './project-history-intelligence-types.js';

let transitionCounter = 0;

export function buildPhaseTransitions(events: HistoryEvent[]): HistoryPhaseTransition[] {
  const transitions: HistoryPhaseTransition[] = [];
  const phases = [...new Set(events.map((e) => e.phase))].sort();

  for (let i = 1; i < phases.length; i += 1) {
    const fromPhase = phases[i - 1]!;
    const toPhase = phases[i]!;
    const toEvent = events.find((e) => e.phase === toPhase && e.changeType === 'CAPABILITY_ADDED');
    transitionCounter += 1;
    transitions.push({
      transitionId: `trans-${transitionCounter.toString().padStart(4, '0')}`,
      fromPhase,
      toPhase,
      timestamp: toEvent?.timestamp ?? Date.now(),
      reason: toEvent?.reason ?? `Transition from ${fromPhase} to ${toPhase}`,
      capabilityIntroduced: toEvent?.source ?? null,
      confidence: 'HIGH',
      readOnly: true,
    });
  }
  return transitions;
}

export function findCheckpointForCapability(
  capabilityQuery: string,
  checkpoints: HistoryCheckpoint[],
): HistoryCheckpoint | null {
  const lower = capabilityQuery.toLowerCase();
  return (
    checkpoints.find(
      (c) =>
        c.capability.toLowerCase().includes(lower) ||
        c.passToken.toLowerCase().includes(lower.replace(/\s+/g, '_')) ||
        lower.includes(c.capability.toLowerCase().split(' ')[0] ?? ''),
    ) ?? null
  );
}

export function checkpointsForPhase(phaseQuery: string, checkpoints: HistoryCheckpoint[]): HistoryCheckpoint[] {
  const lower = phaseQuery.toLowerCase();
  return checkpoints.filter(
    (c) => c.phase.toLowerCase().includes(lower) || lower.includes(c.phase.toLowerCase()),
  );
}

export function checkpointForEvent(event: HistoryEvent, checkpoints: HistoryCheckpoint[]): HistoryCheckpoint | null {
  if (!event.checkpointReference) return null;
  return checkpoints.find((c) => c.passToken === event.checkpointReference) ?? null;
}
