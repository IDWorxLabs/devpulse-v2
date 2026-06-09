/**
 * Learning failure analyzer — recurring failures from failure visibility.
 */

import { buildFailureRecords } from '../failure-visibility-engine/failure-record-builder.js';
import type { LearningObservation, LearningRecord } from './learning-visibility-types.js';

let failureLearningCounter = 0;

function nextLearningId(): string {
  failureLearningCounter += 1;
  return `lrn-f-${failureLearningCounter.toString().padStart(4, '0')}`;
}

export function analyzeRecurringFailures(query: string): {
  observations: LearningObservation[];
  records: LearningRecord[];
} {
  const failures = buildFailureRecords(query);
  const observations: LearningObservation[] = [];
  const records: LearningRecord[] = [];

  const grouped = new Map<string, { count: number; severity: string; source: string }>();
  for (const f of failures) {
    if (f.severity === 'Info' && f.title.includes('No active')) continue;
    const key = f.title.toLowerCase().trim();
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      grouped.set(key, { count: 1, severity: f.severity, source: f.sourceSystem });
    }
  }

  for (const [title, meta] of grouped) {
    const freq = Math.min(10, meta.count + (meta.severity === 'Critical' || meta.severity === 'High' ? 2 : 0));
    observations.push({
      observationId: `lof-${observations.length + 1}`,
      text: `Recurring failure: ${title}`,
      sourceSystem: meta.source,
      visibilityOnly: true,
    });
    records.push({
      learningId: nextLearningId(),
      category: 'FAILURE',
      observation: `Recurring failure pattern from ${meta.source}: ${title}`,
      pattern: `Failure recurrence — ${meta.severity} severity`,
      frequency: freq,
      confidence: freq >= 3 ? 'HIGH' : 'MEDIUM',
      recommendation: `Review root cause and validate foundations before retrying paths related to: ${title}`,
      summary: `Failure "${title}" observed with frequency ${freq}.`,
      visibilityOnly: true,
    });
  }

  return { observations, records };
}

export function resetLearningFailureCounterForTests(): void {
  failureLearningCounter = 0;
}
