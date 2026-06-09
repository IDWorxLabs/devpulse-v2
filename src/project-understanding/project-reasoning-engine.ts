/**
 * Project reasoning engine — fact selection and conclusion generation by intent.
 * No question-specific routes. No hardcoded answer templates.
 */

import type {
  ProjectBroadIntent,
  ProjectFact,
  ProjectFactCategory,
  ProjectReasoningContext,
  ReasoningResult,
} from './project-knowledge-model.js';
import { getCurrentProjectProfile } from './project-profile-store.js';

const INTENT_CATEGORY_PRIORITY: Record<ProjectBroadIntent, ProjectFactCategory[]> = {
  IDENTITY: ['identity', 'phase', 'roadmap', 'milestone'],
  PROGRESS: ['milestone', 'phase', 'roadmap', 'gap'],
  DEPENDENCIES: ['system', 'relationship', 'memory'],
  RISKS: ['risk', 'blocked', 'gap'],
  PLANNING: ['recommendation', 'roadmap', 'gap', 'blocked'],
  STATUS: ['identity', 'phase', 'gap', 'blocked', 'milestone'],
  GENERAL_PROJECT: ['identity', 'phase', 'milestone', 'gap', 'risk', 'recommendation'],
  UNKNOWN: ['identity', 'recommendation', 'phase'],
};

function rankFacts(facts: ProjectFact[], intent: ProjectBroadIntent, query: string): ProjectFact[] {
  const priorities = INTENT_CATEGORY_PRIORITY[intent];
  const lower = query.toLowerCase();
  const tokens = lower.split(/[^a-z0-9]+/).filter((t) => t.length > 2);

  return [...facts]
    .map((fact) => {
      let score = fact.importance;
      const catIndex = priorities.indexOf(fact.category);
      if (catIndex >= 0) score += (priorities.length - catIndex) * 0.15;
      for (const token of tokens) {
        if (fact.tags.some((t) => t.includes(token)) || fact.statement.toLowerCase().includes(token)) {
          score += 0.2;
        }
      }
      return { fact, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((entry) => entry.fact);
}

function buildConclusions(intent: ProjectBroadIntent, facts: ProjectFact[]): string[] {
  const profile = getCurrentProjectProfile();
  const gaps = facts.filter((f) => f.category === 'gap');
  const risks = facts.filter((f) => f.category === 'risk');
  const blocked = facts.filter((f) => f.category === 'blocked');
  const milestones = facts.filter((f) => f.category === 'milestone');
  const systems = facts.filter((f) => f.category === 'system');

  const conclusions: string[] = [];

  conclusions.push(
    `${profile.name} is in ${profile.currentPhase} with status ${profile.status.replace(/_/g, ' ')}.`,
  );

  if (intent === 'IDENTITY' || intent === 'GENERAL_PROJECT') {
    conclusions.push(`Goal: ${profile.goal}`);
  }

  if (intent === 'PROGRESS' || intent === 'STATUS') {
    conclusions.push(
      `Foundation maturity: ${milestones.length} completed milestones registered; ${gaps.length} missing capabilities identified.`,
    );
  }

  if (intent === 'RISKS' || intent === 'STATUS') {
    if (risks.length > 0) {
      conclusions.push(`Primary risk focus: ${risks[0]!.statement}`);
    }
    if (blocked.length > 0) {
      conclusions.push(`Key blocker: ${blocked[0]!.statement}`);
    }
  }

  if (intent === 'DEPENDENCIES') {
    conclusions.push(
      `${systems.length} related systems registered; cross-system relationship facts inform dependency understanding.`,
    );
  }

  if (intent === 'PLANNING') {
    conclusions.push(`Planning should respect ${blocked.length} active blocked gates before execution paths.`);
  }

  if (gaps.some((g) => g.title.toLowerCase().includes('world 2') || g.statement.toLowerCase().includes('world 2'))) {
    conclusions.push('World 2 execution runtime is not connected — planning foundations exist without autonomous execution.');
  }

  if (gaps.some((g) => g.title.toLowerCase().includes('execution'))) {
    conclusions.push('Execution is intentionally not connected until intelligence layers are complete.');
  }

  return conclusions.slice(0, 6);
}

function buildWarnings(facts: ProjectFact[]): string[] {
  return facts
    .filter((f) => f.category === 'blocked' || f.category === 'risk')
    .slice(0, 4)
    .map((f) => f.statement);
}

function computeConfidence(intent: ProjectBroadIntent, factCount: number): ReasoningResult['confidence'] {
  if (intent === 'UNKNOWN') return 'LOW';
  if (factCount >= 8) return 'HIGH';
  if (factCount >= 4) return 'MEDIUM';
  return 'LOW';
}

export function reasonOverProjectFacts(
  query: string,
  context: ProjectReasoningContext,
  intent: ProjectBroadIntent,
): ReasoningResult {
  const profile = getCurrentProjectProfile();
  const selectedFacts = rankFacts(context.snapshot.facts, intent, query);
  const conclusions = buildConclusions(intent, selectedFacts);
  const supportingEvidence = selectedFacts.map((f) => `${f.title}: ${f.statement}`);
  const warnings = buildWarnings(selectedFacts);
  const relatedSystems = profile.relatedSystems;

  const recommendation =
    selectedFacts.find((f) => f.category === 'recommendation')?.statement ?? profile.nextRecommendedStep;

  return {
    intent,
    selectedFacts,
    conclusions,
    supportingEvidence,
    recommendedNextStep: recommendation,
    warnings,
    relatedSystems,
    confidence: computeConfidence(intent, selectedFacts.length),
  };
}
