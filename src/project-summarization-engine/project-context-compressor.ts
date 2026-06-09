/**
 * Project context compressor — gathers intelligence from all Phase 11–12 sources.
 */

import { getBrainRoadmapContext } from '../command-center-brain/brain-roadmap-awareness.js';
import { buildDependencyGraph } from '../dependency-intelligence/index.js';
import { buildProjectHistorySnapshot } from '../project-history-intelligence/index.js';
import { collectProjectFacts } from '../project-understanding/project-fact-collector.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { recallRelevantMemories } from '../shared-memory/shared-memory-recall.js';
import { buildTimelineState } from '../timeline-intelligence/timeline-state-model.js';
import { getWorkspaceSnapshot } from '../workspace-intelligence/index.js';
import type { SummarizationContext } from './project-summarization-types.js';

export function compressProjectContext(query: string): SummarizationContext {
  const profile = getCurrentProjectProfile();
  const roadmap = getBrainRoadmapContext();
  const reasoning = collectProjectFacts(query);
  const timeline = buildTimelineState();
  const memory = recallRelevantMemories(query);
  buildDependencyGraph();
  getWorkspaceSnapshot();
  buildProjectHistorySnapshot(query);

  const facts = reasoning.snapshot.facts;
  const blockers = facts.filter((f) => f.category === 'blocked');
  const risks = facts.filter((f) => f.category === 'risk');
  const milestones = facts.filter((f) => f.category === 'milestone');

  const sources = [
    'project_understanding_engine',
    'project_profile',
    'roadmap_awareness',
    'timeline_intelligence',
    'shared_memory_layer',
  ];
  if (reasoning.vaultFactCount > 0) sources.push('project_vault_intelligence');
  if (reasoning.dependencyFactCount > 0) sources.push('dependency_intelligence');
  if (reasoning.workspaceFactCount > 0) sources.push('workspace_intelligence');
  if (reasoning.historyFactCount > 0) sources.push('project_history_intelligence');

  return {
    query,
    projectId: profile.projectId,
    projectName: profile.name,
    currentPhase: roadmap.currentPhase,
    nextPhase: roadmap.nextPhase,
    factCount: facts.length,
    vaultFactCount: reasoning.vaultFactCount,
    dependencyFactCount: reasoning.dependencyFactCount,
    workspaceFactCount: reasoning.workspaceFactCount,
    historyFactCount: reasoning.historyFactCount,
    memoryFactCount: memory.matches.length,
    blockerCount: blockers.length + timeline.activeBlockers.length,
    riskCount: risks.length + timeline.activeRisks.length,
    milestoneCount: milestones.length + timeline.completedMilestones.length,
    sources,
  };
}

export function contextLines(ctx: SummarizationContext): string[] {
  return [
    `Project: ${ctx.projectName} (${ctx.projectId})`,
    `Phase: ${ctx.currentPhase}`,
    `Next: ${ctx.nextPhase}`,
    `Facts: ${ctx.factCount} (vault ${ctx.vaultFactCount}, dependency ${ctx.dependencyFactCount}, workspace ${ctx.workspaceFactCount}, history ${ctx.historyFactCount})`,
    `Blockers: ${ctx.blockerCount}, Risks: ${ctx.riskCount}, Milestones: ${ctx.milestoneCount}`,
    `Sources: ${ctx.sources.join(', ')}`,
  ];
}
