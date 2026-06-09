/**
 * Project fact collector — gathers facts from profile, memory, cross-system, roadmap.
 */

import { getBrainRoadmapContext } from '../command-center-brain/brain-roadmap-awareness.js';
import { getRelationshipEdges } from '../command-center-brain/cross-system-awareness/system-relationship-registry.js';
import { recallRelevantMemories } from '../shared-memory/shared-memory-recall.js';
import { bridgeVaultFactsIntoUnderstanding } from '../project-vault-intelligence/project-vault-understanding-bridge.js';
import {
  analyzeDependencies,
  buildDependencyGraph,
  dependencyFactsFromAnalysis,
} from '../dependency-intelligence/index.js';
import {
  analyzeWorkspace,
  workspaceFactsFromAnalysis,
} from '../workspace-intelligence/index.js';
import {
  buildProjectHistorySnapshot,
  historyFactsFromAnalysis,
  analyzeProjectHistory,
} from '../project-history-intelligence/index.js';
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

  const vaultBridge = bridgeVaultFactsIntoUnderstanding(query);
  let vaultFactCount = 0;
  for (const vaultFact of vaultBridge.normalizedFacts) {
    const duplicate = facts.some(
      (f) => f.statement === vaultFact.statement && f.source === 'project_vault',
    );
    if (!duplicate) {
      facts.push(vaultFact);
      vaultFactCount += 1;
    }
  }

  buildDependencyGraph();
  const depAnalysis = analyzeDependencies(query);
  const depFacts = dependencyFactsFromAnalysis(depAnalysis);
  let dependencyFactCount = 0;
  for (const dep of depFacts) {
    const duplicate = facts.some((f) => f.statement === dep.statement);
    if (!duplicate) {
      facts.push(
        fact('relationship', dep.title, dep.statement, 'dependency_intelligence', 0.75, dep.tags),
      );
      dependencyFactCount += 1;
    }
  }

  const wsAnalysis = analyzeWorkspace(query);
  const wsFacts = workspaceFactsFromAnalysis(wsAnalysis);
  let workspaceFactCount = 0;
  for (const ws of wsFacts) {
    const duplicate = facts.some((f) => f.statement === ws.statement);
    if (!duplicate) {
      facts.push(
        fact('system', ws.title, ws.statement, 'workspace_intelligence', 0.8, ws.tags),
      );
      workspaceFactCount += 1;
    }
  }

  const histSnapshot = buildProjectHistorySnapshot(query);
  const histAnalysis = analyzeProjectHistory(query, histSnapshot);
  const histFacts = historyFactsFromAnalysis(histAnalysis);
  let historyFactCount = 0;
  for (const hf of histFacts) {
    const duplicate = facts.some((f) => f.statement === hf.statement);
    if (!duplicate) {
      facts.push(
        fact('milestone', hf.title, hf.statement, 'project_history_intelligence', 0.78, hf.tags),
      );
      historyFactCount += 1;
    }
  }

  const model = getProjectKnowledgeModel();
  model.loadFacts(facts);

  return {
    query,
    snapshot: model.snapshot(profile.projectId, profile.name),
    memoryFactCount,
    crossSystemFactCount,
    vaultFactCount,
    dependencyFactCount,
    workspaceFactCount,
    historyFactCount,
    roadmapPhase: roadmap.currentPhase,
    roadmapNextPhase: roadmap.nextPhase,
  };
}
