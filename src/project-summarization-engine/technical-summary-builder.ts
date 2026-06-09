/**
 * Technical summary builder — architecture and module summary.
 */

import { getDependencyGraph } from '../dependency-intelligence/index.js';
import { getWorkspaceSnapshot } from '../workspace-intelligence/index.js';
import type { ProjectSummary, SummarizationContext } from './project-summarization-types.js';

let summaryCounter = 0;

function nextId(): string {
  summaryCounter += 1;
  return `sum-tech-${summaryCounter.toString().padStart(4, '0')}`;
}

export function buildTechnicalSummary(ctx: SummarizationContext): ProjectSummary {
  const graph = getDependencyGraph();
  const workspace = getWorkspaceSnapshot();
  const modules = workspace.modules.slice(0, 8).map((m) => m.moduleName);

  const lines = [
    `Technical summary for ${ctx.projectName}:`,
    `Intelligence fact graph: ${ctx.factCount} facts across ${ctx.sources.length} sources.`,
    `Dependency edges: ${graph.dependencyCount} (${graph.blockedCount} blocked future paths).`,
    `Active workspace: ${workspace.activeWorkspace?.workspaceName ?? 'unknown'}.`,
    `Registered modules: ${modules.join(', ')}.`,
    `Vault facts: ${ctx.vaultFactCount}, History facts: ${ctx.historyFactCount}, Workspace facts: ${ctx.workspaceFactCount}.`,
    'Stack is intelligence-only — Command Center Brain orchestrates GQU routing without duplicate brains.',
  ];

  return {
    summaryId: nextId(),
    summaryType: 'TECHNICAL',
    title: 'Technical Summary',
    body: lines.join('\n'),
    confidence: 'HIGH',
    sourceCount: ctx.sources.length,
    sources: [...ctx.sources],
    readOnly: true,
  };
}

export function resetTechnicalSummaryCounterForTests(): void {
  summaryCounter = 0;
}
