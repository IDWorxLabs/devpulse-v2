/**
 * Learning blocker analyzer — recurring blockers from progress intelligence.
 */

import { analyzeProgressBlockers } from '../progress-intelligence/progress-blocker-analyzer.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import type { LearningObservation, LearningRecord } from './learning-visibility-types.js';

let blockerLearningCounter = 0;

function nextLearningId(): string {
  blockerLearningCounter += 1;
  return `lrn-${blockerLearningCounter.toString().padStart(4, '0')}`;
}

function frequencyFor(text: string, occurrences: number): number {
  return Math.min(10, Math.max(1, occurrences + (text.length > 40 ? 1 : 0)));
}

export function analyzeRecurringBlockers(query: string): {
  observations: LearningObservation[];
  records: LearningRecord[];
} {
  const profile = getCurrentProjectProfile();
  const blockers = analyzeProgressBlockers(query);
  const observations: LearningObservation[] = [];
  const records: LearningRecord[] = [];

  const grouped = new Map<string, number>();
  for (const b of blockers) {
    const key = b.summary.toLowerCase().trim();
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  for (const item of profile.blockedItems) {
    const key = item.toLowerCase().trim();
    grouped.set(key, (grouped.get(key) ?? 0) + 2);
  }

  for (const [text, count] of grouped) {
    if (count < 1) continue;
    const freq = frequencyFor(text, count);
    observations.push({
      observationId: `lobs-${observations.length + 1}`,
      text: `Recurring blocker: ${text}`,
      sourceSystem: 'progress_intelligence',
      visibilityOnly: true,
    });
    records.push({
      learningId: nextLearningId(),
      category: 'BLOCKER',
      observation: `Recurring blocker observed across progress checks: ${text}`,
      pattern: `Governance blocker pattern — ${text.slice(0, 50)}`,
      frequency: freq,
      confidence: freq >= 3 ? 'HIGH' : freq >= 2 ? 'MEDIUM' : 'LOW',
      recommendation: `Validate and clear blocker before advancing: ${text}`,
      summary: `Blocker "${text}" seen ${freq} time(s) in visibility scans.`,
      visibilityOnly: true,
    });
  }

  return { observations, records };
}

export function resetLearningBlockerCounterForTests(): void {
  blockerLearningCounter = 0;
}
