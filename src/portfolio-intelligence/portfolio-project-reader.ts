/**
 * Portfolio project reader — gathers multi-project inventory from Phase 11–12 sources.
 */

import { buildDependencyGraph } from '../dependency-intelligence/index.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { buildProjectHistorySnapshot } from '../project-history-intelligence/index.js';
import { compressProjectContext } from '../project-summarization-engine/project-context-compressor.js';
import { buildTimelineState } from '../timeline-intelligence/timeline-state-model.js';
import { getWorkspaceSnapshot } from '../workspace-intelligence/index.js';
import type { PortfolioHealthLevel, PortfolioProject } from './portfolio-intelligence-types.js';
import type { RiskLevel } from '../foundation/types.js';

const SUPPLEMENTAL_PROJECTS: Array<{
  projectId: string;
  projectName: string;
  phase: string;
  summary: string;
  riskLevel: RiskLevel;
  priority: number;
  active: boolean;
  blocked: boolean;
}> = [
  {
    projectId: 'mobile-command-foundation',
    projectName: 'Mobile Command Foundation',
    phase: 'Phase 6 — Mobile Command Foundation',
    summary: 'Mobile chat interface and command routing foundations — intelligence and governance scoped.',
    riskLevel: 'medium',
    priority: 3,
    active: false,
    blocked: false,
  },
  {
    projectId: 'self-evolution-foundation',
    projectName: 'Self-Evolution Foundation',
    phase: 'Phase 5 — Self-Evolution Foundation',
    summary: 'Self-evolution governance and advisory foundations — execution deferred.',
    riskLevel: 'low',
    priority: 4,
    active: false,
    blocked: false,
  },
];

function healthFromSignals(opts: {
  blocked: boolean;
  riskLevel: RiskLevel;
  milestoneCount: number;
  blockerCount: number;
  active: boolean;
}): PortfolioHealthLevel {
  if (opts.blocked && opts.blockerCount > 2) return 'POOR';
  if (opts.riskLevel === 'critical' || opts.riskLevel === 'high') return 'FAIR';
  if (opts.active && opts.milestoneCount > 5 && opts.blockerCount <= 2) return 'EXCELLENT';
  if (opts.milestoneCount > 3) return 'GOOD';
  if (opts.blockerCount > 0) return 'FAIR';
  return 'GOOD';
}

function workspaceCountForProject(projectId: string, workspaceProjectIds: Map<string, number>): number {
  return workspaceProjectIds.get(projectId) ?? 0;
}

export function readPortfolioProjects(query: string): PortfolioProject[] {
  buildDependencyGraph();
  buildTimelineState();
  buildProjectHistorySnapshot(query);
  const ctx = compressProjectContext(query);
  const profile = getCurrentProjectProfile();
  const snapshot = getWorkspaceSnapshot();
  const graph = buildDependencyGraph();

  const workspaceCounts = new Map<string, number>();
  for (const link of snapshot.projectLinks) {
    workspaceCounts.set(link.projectId, (workspaceCounts.get(link.projectId) ?? 0) + 1);
  }

  const projects = new Map<string, PortfolioProject>();

  const primaryHealth = healthFromSignals({
    blocked: profile.blockedItems.length > 0,
    riskLevel: profile.riskItems.length > 3 ? 'medium' : 'low',
    milestoneCount: profile.completedMilestones.length,
    blockerCount: profile.blockedItems.length,
    active: true,
  });

  projects.set(profile.projectId, {
    projectId: profile.projectId,
    projectName: profile.name,
    phase: profile.currentPhase,
    health: primaryHealth,
    riskLevel: profile.riskItems.length > 3 ? 'medium' : 'low',
    priority: 1,
    dependencyCount: graph.edges.length,
    workspaceCount: workspaceCountForProject(profile.projectId, workspaceCounts) || 1,
    summary: profile.summary,
    active: true,
    blocked: profile.blockedItems.length > 0,
    readOnly: true,
  });

  for (const link of snapshot.projectLinks) {
    if (projects.has(link.projectId)) continue;
    const ws = snapshot.workspaces.find((w) => w.projectId === link.projectId);
    const blocked = link.projectId === 'world2-foundation';
    projects.set(link.projectId, {
      projectId: link.projectId,
      projectName: link.projectName,
      phase: link.projectId === 'world2-foundation' ? 'Phase 7 — World 2 Foundation' : 'Foundation',
      health: healthFromSignals({
        blocked,
        riskLevel: ws?.riskLevel ?? 'medium',
        milestoneCount: 2,
        blockerCount: blocked ? 1 : 0,
        active: ws?.active ?? false,
      }),
      riskLevel: ws?.riskLevel ?? 'medium',
      priority: link.projectId === 'world2-foundation' ? 2 : 5,
      dependencyCount: Math.max(1, Math.floor(graph.edges.length / 4)),
      workspaceCount: workspaceCountForProject(link.projectId, workspaceCounts) || 1,
      summary: link.reason,
      active: ws?.active ?? false,
      blocked,
      readOnly: true,
    });
  }

  for (const supplemental of SUPPLEMENTAL_PROJECTS) {
    if (projects.has(supplemental.projectId)) continue;
    projects.set(supplemental.projectId, {
      projectId: supplemental.projectId,
      projectName: supplemental.projectName,
      phase: supplemental.phase,
      health: healthFromSignals({
        blocked: supplemental.blocked,
        riskLevel: supplemental.riskLevel,
        milestoneCount: 2,
        blockerCount: supplemental.blocked ? 1 : 0,
        active: supplemental.active,
      }),
      riskLevel: supplemental.riskLevel,
      priority: supplemental.priority,
      dependencyCount: Math.max(1, Math.floor(graph.edges.length / 6)),
      workspaceCount: 0,
      summary: supplemental.summary,
      active: supplemental.active,
      blocked: supplemental.blocked,
      readOnly: true,
    });
  }

  void ctx;
  return [...projects.values()].sort((a, b) => a.priority - b.priority);
}

export function findPortfolioProject(
  projects: PortfolioProject[],
  nameOrId: string,
): PortfolioProject | null {
  const lower = nameOrId.toLowerCase().trim();
  return (
    projects.find(
      (p) =>
        p.projectId.toLowerCase() === lower ||
        p.projectName.toLowerCase() === lower ||
        p.projectName.toLowerCase().includes(lower) ||
        lower.includes(p.projectName.toLowerCase().split(' ')[0] ?? ''),
    ) ?? null
  );
}
