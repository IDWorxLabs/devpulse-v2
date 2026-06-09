/**
 * Learning pattern builder — aggregates observed patterns across sources.
 */

import { buildProjectHistorySnapshot } from '../project-history-intelligence/index.js';
import { readPortfolioProjects } from '../portfolio-intelligence/index.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import type { LearningPattern, LearningRecord } from './learning-visibility-types.js';

let patternCounter = 0;

function nextPatternId(): string {
  patternCounter += 1;
  return `lpat-${patternCounter.toString().padStart(4, '0')}`;
}

let recordCounter = 0;

function nextLearningId(): string {
  recordCounter += 1;
  return `lrn-p-${recordCounter.toString().padStart(4, '0')}`;
}

export function buildLearningPatterns(
  query: string,
  existingRecords: LearningRecord[],
): { patterns: LearningPattern[]; records: LearningRecord[] } {
  buildProjectHistorySnapshot(query);
  const profile = getCurrentProjectProfile();
  const portfolio = readPortfolioProjects(query);
  const patterns: LearningPattern[] = [];
  const records: LearningRecord[] = [];

  if (profile.blockedItems.length > 0) {
    patterns.push({
      patternId: nextPatternId(),
      title: 'Governance gate recurrence',
      description: 'Blocked items repeat across foundation phases — validate before execution.',
      frequency: profile.blockedItems.length,
      visibilityOnly: true,
    });
  }

  if (profile.completedMilestones.length > 10) {
    patterns.push({
      patternId: nextPatternId(),
      title: 'Foundation milestone accumulation',
      description: 'Intelligence foundations complete in layered phases without execution.',
      frequency: profile.completedMilestones.length,
      visibilityOnly: true,
    });
  }

  const blockedProjects = portfolio.filter((p) => p.blocked);
  if (blockedProjects.length > 0) {
    patterns.push({
      patternId: nextPatternId(),
      title: 'Portfolio blocker pattern',
      description: `${blockedProjects.length} project(s) show recurring blocked gates.`,
      frequency: blockedProjects.length,
      visibilityOnly: true,
    });
  }

  const categoryGroups = new Map<string, number>();
  for (const r of existingRecords) {
    categoryGroups.set(r.category, (categoryGroups.get(r.category) ?? 0) + 1);
  }

  for (const [category, count] of categoryGroups) {
    if (count < 2) continue;
    patterns.push({
      patternId: nextPatternId(),
      title: `${category} recurrence pattern`,
      description: `${count} learning observations in ${category} category.`,
      frequency: count,
      visibilityOnly: true,
    });
  }

  for (const p of patterns) {
    records.push({
      learningId: nextLearningId(),
      category: 'PATTERN',
      observation: p.description,
      pattern: p.title,
      frequency: p.frequency,
      confidence: p.frequency >= 3 ? 'HIGH' : 'MEDIUM',
      recommendation: `Continue visibility-only validation for pattern: ${p.title}`,
      summary: p.description,
      visibilityOnly: true,
    });
  }

  return { patterns, records };
}

export function resetLearningPatternCounterForTests(): void {
  patternCounter = 0;
  recordCounter = 0;
}
