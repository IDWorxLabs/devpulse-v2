/**
 * Learning Visibility Engine — orchestrates visible learning advisory.
 */

import { publishLearningVisibilityFeedStages } from '../operator-feed/learning-visibility-feed-bridge.js';
import { analyzeRecurringBlockers } from './learning-blocker-analyzer.js';
import { analyzeRecurringFailures } from './learning-failure-analyzer.js';
import { buildLearningMemory } from './learning-memory-builder.js';
import { buildLearningPatterns } from './learning-pattern-builder.js';
import { analyzeRecurringRecommendations } from './learning-recommendation-analyzer.js';
import { updateLearningVisibilityDiagnostics } from './learning-visibility-diagnostics.js';
import type {
  LearningAnalysis,
  LearningObservation,
  LearningRecord,
  LearningVisibilityResult,
} from './learning-visibility-types.js';

function mergeRecords(...groups: LearningRecord[][]): LearningRecord[] {
  const seen = new Set<string>();
  const merged: LearningRecord[] = [];
  for (const group of groups) {
    for (const r of group) {
      const key = `${r.category}:${r.observation}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(r);
    }
  }
  return merged;
}

function mergeObservations(...groups: LearningObservation[][]): LearningObservation[] {
  return groups.flat();
}

export function analyzeLearning(query: string): LearningAnalysis {
  const blockers = analyzeRecurringBlockers(query);
  const failures = analyzeRecurringFailures(query);
  const recs = analyzeRecurringRecommendations(query);
  const memory = buildLearningMemory(query);

  const baseRecords = mergeRecords(
    blockers.records,
    failures.records,
    recs.records,
    memory.records,
  );

  const patterns = buildLearningPatterns(query, baseRecords);
  const records = mergeRecords(baseRecords, patterns.records);

  const observations = mergeObservations(
    blockers.observations,
    failures.observations,
    recs.observations,
    memory.observations,
  );

  return {
    query,
    records,
    patterns: patterns.patterns,
    observations,
    recommendations: recs.recommendations,
    recurringFailureCount: failures.records.length,
    recurringBlockerCount: blockers.records.length,
    patternCount: patterns.patterns.length,
  };
}

function composeResponse(query: string, analysis: LearningAnalysis): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Learning Visibility Engine Response', ''];

  if (lower.includes('what did we learn') || lower.includes('learned')) {
    lines.push(`Lessons observed: ${analysis.records.length}`);
    for (const r of analysis.records.slice(0, 8)) {
      lines.push(`• [${r.category}] ${r.summary}`);
    }
  } else if (lower.includes('recurring blockers')) {
    lines.push('Recurring blockers:');
    for (const r of analysis.records.filter((x) => x.category === 'BLOCKER').slice(0, 8)) {
      lines.push(`• ${r.observation} (freq: ${r.frequency})`);
    }
  } else if (lower.includes('recurring failures')) {
    lines.push('Recurring failures:');
    for (const r of analysis.records.filter((x) => x.category === 'FAILURE').slice(0, 8)) {
      lines.push(`• ${r.observation} (freq: ${r.frequency})`);
    }
  } else if (lower.includes('recurring recommendations')) {
    lines.push('Recurring recommendations:');
    for (const rec of analysis.recommendations.slice(0, 8)) {
      lines.push(`• ${rec.text} (${rec.sourceSystem}, freq: ${rec.frequency})`);
    }
  } else if (lower.includes('patterns')) {
    lines.push('Patterns observed:');
    for (const p of analysis.patterns.slice(0, 8)) {
      lines.push(`• ${p.title}: ${p.description} (freq: ${p.frequency})`);
    }
  } else if (lower.includes('remember')) {
    lines.push('What should be remembered:');
    for (const r of analysis.records.filter((x) => x.category === 'MEMORY').slice(0, 8)) {
      lines.push(`• ${r.observation}`);
    }
  } else if (lower.includes('improve')) {
    lines.push('What should improve:');
    for (const r of analysis.records.filter((x) => x.category === 'IMPROVEMENT').slice(0, 8)) {
      lines.push(`• ${r.observation}`);
    }
  } else {
    lines.push(`Learning records: ${analysis.records.length}`);
    lines.push(`Patterns: ${analysis.patternCount}`);
    lines.push(`Recurring blockers: ${analysis.recurringBlockerCount}`);
    lines.push(`Recurring failures: ${analysis.recurringFailureCount}`);
    for (const r of analysis.records.slice(0, 5)) {
      lines.push(`• [${r.category}] ${r.pattern}`);
    }
  }

  lines.push('');
  lines.push('Visibility only — observed learning patterns, no self-learning or model modification.');
  return lines.join('\n').trim();
}

export function processLearningVisibilityRequest(query: string): LearningVisibilityResult {
  publishLearningVisibilityFeedStages(query);
  const analysis = analyzeLearning(query);
  updateLearningVisibilityDiagnostics(
    query,
    analysis.records,
    analysis.patternCount,
    analysis.recurringFailureCount,
    analysis.recurringBlockerCount,
  );

  return {
    query,
    analysis,
    responseText: composeResponse(query, analysis),
  };
}

export function getLearningVisibilityContext(query: string): {
  result: LearningVisibilityResult;
  primaryRecord: LearningRecord | null;
} {
  const result = processLearningVisibilityRequest(query);
  const primary = result.analysis.records[0] ?? null;
  return { result, primaryRecord: primary };
}
