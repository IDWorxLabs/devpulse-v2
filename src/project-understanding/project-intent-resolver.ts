/**
 * Project intent resolver — broad intent classes only. No per-question routes.
 */

import type { ProjectBroadIntent } from './project-knowledge-model.js';

const INTENT_SIGNALS: Array<{ intent: ProjectBroadIntent; signals: string[]; weight: number }> = [
  { intent: 'IDENTITY', signals: ['what project', 'working on', 'devpulse', 'what is this project', 'trying to become', 'who are we building'], weight: 3 },
  { intent: 'PROGRESS', signals: ['completed', 'milestone', 'mature', 'maturity', 'phase', 'furthest behind', 'weakest', 'progress', 'how far'], weight: 3 },
  { intent: 'DEPENDENCIES', signals: ['relate', 'related system', 'systems matter', 'depend', 'connection', 'which system'], weight: 3 },
  { intent: 'RISKS', signals: ['risk', 'biggest risk', 'stop', 'blocked', 'holding back', 'weakest', 'danger', 'what would stop'], weight: 3 },
  { intent: 'PLANNING', signals: ['next', 'should build', 'should happen', 'six months', 'recommend', 'do next', 'happen next'], weight: 3 },
  { intent: 'STATUS', signals: ['status', 'missing', 'gap', 'not connected', 'execution', 'capability', 'weakest area'], weight: 2 },
  { intent: 'GENERAL_PROJECT', signals: ['project', 'devpulse', 'foundation', 'v2'], weight: 1 },
];

function tokenize(query: string): string[] {
  return query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1);
}

export function resolveProjectIntent(query: string): ProjectBroadIntent {
  const lower = query.toLowerCase();
  const scores = new Map<ProjectBroadIntent, number>();

  for (const entry of INTENT_SIGNALS) {
    let score = 0;
    for (const signal of entry.signals) {
      if (lower.includes(signal)) score += entry.weight;
    }
    if (score > 0) scores.set(entry.intent, (scores.get(entry.intent) ?? 0) + score);
  }

  const tokens = tokenize(query);
  if (tokens.includes('world') && tokens.includes('2')) {
    scores.set('DEPENDENCIES', (scores.get('DEPENDENCIES') ?? 0) + 2);
    scores.set('STATUS', (scores.get('STATUS') ?? 0) + 2);
  }
  if (tokens.includes('execution')) {
    scores.set('STATUS', (scores.get('STATUS') ?? 0) + 3);
    scores.set('RISKS', (scores.get('RISKS') ?? 0) + 1);
  }

  let best: ProjectBroadIntent = 'UNKNOWN';
  let bestScore = 0;
  for (const [intent, score] of scores) {
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }

  if (bestScore === 0) return 'GENERAL_PROJECT';
  return best;
}

export function intentKey(intent: ProjectBroadIntent): string {
  return intent;
}
