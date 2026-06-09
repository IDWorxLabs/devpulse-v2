/**
 * Learning recommendation analyzer — recurring recommendations from action, reasoning, decision.
 */

import { buildActionCandidates } from '../action-visibility-engine/action-candidate-builder.js';
import { buildDecisionContext } from '../unified-decision-layer/decision-context-builder.js';
import { buildReasoningEvidence } from '../reasoning-visibility-engine/reasoning-evidence-builder.js';
import type { LearningObservation, LearningRecommendation, LearningRecord } from './learning-visibility-types.js';

let recLearningCounter = 0;

function nextLearningId(): string {
  recLearningCounter += 1;
  return `lrn-r-${recLearningCounter.toString().padStart(4, '0')}`;
}

export function analyzeRecurringRecommendations(query: string): {
  observations: LearningObservation[];
  recommendations: LearningRecommendation[];
  records: LearningRecord[];
} {
  const context = buildDecisionContext(query);
  const actions = buildActionCandidates(query);
  const evidence = buildReasoningEvidence(query);
  const observations: LearningObservation[] = [];
  const recommendations: LearningRecommendation[] = [];
  const records: LearningRecord[] = [];

  const grouped = new Map<string, { count: number; source: string }>();

  for (const action of actions.filter((a) => a.recommended || a.status === 'Recommended')) {
    const key = action.title.toLowerCase().trim();
    const existing = grouped.get(key);
    if (existing) existing.count += 1;
    else grouped.set(key, { count: 1, source: action.sourceSystem });
  }

  for (const fact of context.supportingFacts.slice(0, 6)) {
    const key = fact.toLowerCase().trim().slice(0, 60);
    grouped.set(key, { count: 2, source: 'unified_decision_layer' });
  }

  for (const e of evidence.filter((ev) => ev.statement.includes('recommend')).slice(0, 4)) {
    const key = e.statement.toLowerCase().trim().slice(0, 60);
    grouped.set(key, { count: 2, source: e.sourceSystem });
  }

  for (const [text, meta] of grouped) {
    const freq = Math.min(10, meta.count);
    observations.push({
      observationId: `lor-${observations.length + 1}`,
      text: `Recurring recommendation: ${text}`,
      sourceSystem: meta.source,
      visibilityOnly: true,
    });
    recommendations.push({
      recommendationId: `lrec-${recommendations.length + 1}`,
      text,
      sourceSystem: meta.source,
      frequency: freq,
      visibilityOnly: true,
    });
    records.push({
      learningId: nextLearningId(),
      category: 'RECOMMENDATION',
      observation: `Recurring recommendation from ${meta.source}: ${text}`,
      pattern: 'Advisory recommendation recurrence',
      frequency: freq,
      confidence: freq >= 3 ? 'HIGH' : 'MEDIUM',
      recommendation: text,
      summary: `Recommendation "${text.slice(0, 40)}" seen ${freq} time(s).`,
      visibilityOnly: true,
    });
  }

  return { observations, recommendations, records };
}

export function resetLearningRecommendationCounterForTests(): void {
  recLearningCounter = 0;
}
