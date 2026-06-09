/**
 * Project status builder — status, milestone, dependency, workspace summaries.
 */

import { getDependencyGraph } from '../dependency-intelligence/index.js';
import { buildProjectHistorySnapshot } from '../project-history-intelligence/index.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { getWorkspaceSnapshot } from '../workspace-intelligence/index.js';
import type { ProjectSummary, SummarizationContext } from './project-summarization-types.js';

let summaryCounter = 0;

function nextId(): string {
  summaryCounter += 1;
  return `sum-status-${summaryCounter.toString().padStart(4, '0')}`;
}

export function buildProjectStatusSummary(ctx: SummarizationContext): ProjectSummary {
  const profile = getCurrentProjectProfile();
  const lines = [
    `Project status for ${ctx.projectName}:`,
    `Status: ${profile.status.replace(/_/g, ' ')}`,
    `Phase: ${ctx.currentPhase}`,
    `Goal: ${profile.goal}`,
    `Completed milestones (profile): ${profile.completedMilestones.length}`,
    `Next phase: ${ctx.nextPhase}`,
  ];

  return {
    summaryId: nextId(),
    summaryType: 'PROJECT_STATUS',
    title: 'Project Status Summary',
    body: lines.join('\n'),
    confidence: 'HIGH',
    sourceCount: ctx.sources.length,
    sources: [...ctx.sources],
    readOnly: true,
  };
}

export function buildMilestoneSummary(ctx: SummarizationContext): ProjectSummary {
  const profile = getCurrentProjectProfile();
  const history = buildProjectHistorySnapshot(ctx.query);
  const lines = ['Milestone summary:', 'Completed foundation milestones:'];
  for (const m of profile.completedMilestones.slice(0, 10)) {
    lines.push(`• ${m}`);
  }
  for (const m of history.evolution.majorMilestones.slice(0, 6)) {
    lines.push(`• ${m}`);
  }

  return {
    summaryId: nextId(),
    summaryType: 'MILESTONE',
    title: 'Milestone Summary',
    body: lines.join('\n'),
    confidence: 'HIGH',
    sourceCount: ctx.sources.length,
    sources: [...ctx.sources, 'project_history_intelligence'],
    readOnly: true,
  };
}

export function buildDependencySummary(ctx: SummarizationContext): ProjectSummary {
  const graph = getDependencyGraph();
  const lines = [
    'Dependency summary:',
    `Total dependency edges: ${graph.dependencyCount}`,
    `Blocked dependencies: ${graph.blockedCount}`,
    `Graph health: ${graph.graphHealth}`,
    `Highest-risk paths involve execution runtime and World 2 execution (deferred).`,
  ];

  return {
    summaryId: nextId(),
    summaryType: 'DEPENDENCY',
    title: 'Dependency Summary',
    body: lines.join('\n'),
    confidence: 'HIGH',
    sourceCount: ctx.sources.length,
    sources: [...ctx.sources, 'dependency_intelligence'],
    readOnly: true,
  };
}

export function buildWorkspaceSummary(ctx: SummarizationContext): ProjectSummary {
  const ws = getWorkspaceSnapshot();
  const lines = [
    'Workspace summary:',
    `Active workspace: ${ws.activeWorkspace?.workspaceName ?? 'None'}`,
    `Active project: ${ws.activeProject?.projectName ?? 'None'}`,
    `Workspace count: ${ws.workspaceCount}`,
    `Ownership confidence: ${ws.ownershipConfidence}`,
    `Context leakage risk: ${ws.contextLeakageRisk}`,
  ];

  return {
    summaryId: nextId(),
    summaryType: 'WORKSPACE',
    title: 'Workspace Summary',
    body: lines.join('\n'),
    confidence: 'HIGH',
    sourceCount: ctx.sources.length,
    sources: [...ctx.sources, 'workspace_intelligence'],
    readOnly: true,
  };
}

export function buildAiOnboardingSummary(ctx: SummarizationContext): ProjectSummary {
  const profile = getCurrentProjectProfile();
  const lines = [
    'New AI onboarding summary — what a new AI should know:',
    `1. Project: ${profile.name} — ${profile.summary}`,
    `2. Current phase: ${ctx.currentPhase}; next: ${ctx.nextPhase}.`,
    '3. DevPulse is intelligence-only at this maturity — no execution, code generation, or deployment.',
    '4. Project Understanding (11.4) owns comprehension; summarization compresses all Phase 12 intelligence.',
    '5. Command Center Brain routes questions through GQU — do not create duplicate brains.',
    `6. Blocked: ${profile.blockedItems[0] ?? 'execution deferred'}.`,
    `7. ${ctx.factCount} facts available from ${ctx.sources.length} intelligence sources.`,
    '8. Honor governance, World 2 isolation, and founder approval gates.',
  ];

  return {
    summaryId: nextId(),
    summaryType: 'AI_ONBOARDING',
    title: 'AI Onboarding Summary',
    body: lines.join('\n'),
    confidence: 'HIGH',
    sourceCount: ctx.sources.length,
    sources: [...ctx.sources],
    readOnly: true,
  };
}

export function resetProjectStatusCounterForTests(): void {
  summaryCounter = 0;
}
