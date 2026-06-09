/**
 * Project fact collector — gathers facts from profile, memory, cross-system, roadmap.
 */

import { getBrainRoadmapContext } from '../command-center-brain/brain-roadmap-awareness.js';
import { getRelationshipEdges } from '../command-center-brain/cross-system-awareness/system-relationship-registry.js';
import { recallRelevantMemories } from '../shared-memory/shared-memory-recall.js';
import { getCurrentProjectProfile } from './project-profile-store.js';
import {
  getProjectKnowledgeModel,
  nextProjectFactId,
  type ProjectFact,
  type ProjectReasoningContext,
} from './project-knowledge-model.js';

function fact(
  category: ProjectFact['category'],
  title: string,
  statement: string,
  source: string,
  importance: number,
  tags: string[] = [],
): ProjectFact {
  return {
    factId: nextProjectFactId(),
    category,
    title,
    statement,
    source,
    importance,
    tags,
  };
}

export function collectProjectFacts(query: string): ProjectReasoningContext {
  const profile = getCurrentProjectProfile();
  const roadmap = getBrainRoadmapContext();
  const memoryRecall = recallRelevantMemories(query);
  const edges = getRelationshipEdges();

  const facts: ProjectFact[] = [
    fact('identity', profile.name, profile.summary, 'project_profile', 1.0, ['devpulse', 'project', 'identity']),
    fact('identity', 'Project goal', profile.goal, 'project_profile', 0.9, ['goal', 'purpose']),
    fact('phase', 'Current phase', profile.currentPhase, 'project_profile', 0.95, ['phase', 'maturity']),
    fact('identity', 'Project status', profile.status.replace(/_/g, ' '), 'project_profile', 0.85, ['status']),
    fact('recommendation', 'Recommended next step', profile.nextRecommendedStep, 'project_profile', 0.9, ['next', 'planning']),
  ];

  for (const milestone of profile.completedMilestones) {
    facts.push(
      fact('milestone', milestone, `${milestone} is registered as a completed foundation milestone.`, 'project_profile', 0.7, ['completed', 'milestone', milestone.toLowerCase()]),
    );
  }

  for (const gap of profile.missingCapabilities) {
    facts.push(
      fact('gap', gap, `${gap} is not yet connected or validated in DevPulse V2.`, 'project_profile', 0.8, ['missing', 'gap', gap.toLowerCase()]),
    );
  }

  for (const blocked of profile.blockedItems) {
    facts.push(
      fact('blocked', 'Blocked gate', blocked, 'project_profile', 0.85, ['blocked', 'holding back']),
    );
  }

  for (const risk of profile.riskItems) {
    facts.push(
      fact('risk', 'Project risk', risk, 'project_profile', 0.8, ['risk', 'danger']),
    );
  }

  for (const system of profile.relatedSystems) {
    facts.push(
      fact('system', system, `${system} is registered as related to ${profile.name}.`, 'project_profile', 0.75, ['system', system.toLowerCase()]),
    );
  }

  facts.push(
    fact('roadmap', 'Roadmap current phase', roadmap.currentPhase, 'roadmap_awareness', 0.8, ['roadmap', 'phase']),
    fact('roadmap', 'Roadmap next phase', roadmap.nextPhase, 'roadmap_awareness', 0.85, ['roadmap', 'next']),
    fact('roadmap', 'Stack maturity', roadmap.stackMaturitySummary, 'roadmap_awareness', 0.7, ['maturity', 'foundation']),
  );

  let memoryFactCount = 0;
  for (const mem of memoryRecall.matches.slice(0, 8)) {
    memoryFactCount += 1;
    facts.push(
      fact('memory', mem.title, mem.summary, mem.sourceSystem, 0.65, ['memory', ...mem.tags]),
    );
  }

  let crossSystemFactCount = 0;
  for (const edge of edges.slice(0, 12)) {
    crossSystemFactCount += 1;
    facts.push(
      fact(
        'relationship',
        `${edge.type} relationship`,
        edge.summary,
        'cross_system_awareness',
        0.6,
        [edge.sourceId, edge.targetId, edge.type.toLowerCase()],
      ),
    );
  }

  const model = getProjectKnowledgeModel();
  model.loadFacts(facts);

  return {
    query,
    snapshot: model.snapshot(profile.projectId, profile.name),
    memoryFactCount,
    crossSystemFactCount,
    roadmapPhase: roadmap.currentPhase,
    roadmapNextPhase: roadmap.nextPhase,
  };
}
