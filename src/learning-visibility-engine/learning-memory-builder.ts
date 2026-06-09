/**
 * Learning memory builder — what should be remembered and improved (visibility only).
 */

import { buildDecisionContext } from '../unified-decision-layer/decision-context-builder.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import type { LearningObservation, LearningRecord } from './learning-visibility-types.js';

let memoryCounter = 0;

function nextLearningId(): string {
  memoryCounter += 1;
  return `lrn-m-${memoryCounter.toString().padStart(4, '0')}`;
}

export function buildLearningMemory(query: string): {
  observations: LearningObservation[];
  records: LearningRecord[];
} {
  const profile = getCurrentProjectProfile();
  const context = buildDecisionContext(query);
  const observations: LearningObservation[] = [];
  const records: LearningRecord[] = [];

  const memories = [
    'Foundation intelligence phases must complete validation before execution paths.',
    'Governance gates block execution, cloud runtime, and file modification.',
    'Visibility engines describe intelligence — they do not perform actions.',
    `Current phase: ${profile.currentPhase} — ${profile.name} foundation in progress.`,
    ...context.supportingFacts.slice(0, 4),
    ...profile.completedMilestones.slice(-3).map((m) => `Milestone learned: ${m}`),
  ];

  for (const text of memories) {
    observations.push({
      observationId: `lmem-${observations.length + 1}`,
      text,
      sourceSystem: 'learning_visibility_engine',
      visibilityOnly: true,
    });
    records.push({
      learningId: nextLearningId(),
      category: 'MEMORY',
      observation: text,
      pattern: 'Foundation governance memory',
      frequency: 1,
      confidence: 'HIGH',
      recommendation: `Remember: ${text}`,
      summary: text,
      visibilityOnly: true,
    });
  }

  for (const gap of profile.missingCapabilities.slice(0, 4)) {
    records.push({
      learningId: nextLearningId(),
      category: 'IMPROVEMENT',
      observation: `Improvement area: ${gap}`,
      pattern: 'Missing capability gap',
      frequency: 1,
      confidence: 'MEDIUM',
      recommendation: `Improve by completing validation for: ${gap}`,
      summary: `Should improve: address ${gap}`,
      visibilityOnly: true,
    });
  }

  return { observations, records };
}

export function resetLearningMemoryCounterForTests(): void {
  memoryCounter = 0;
}
