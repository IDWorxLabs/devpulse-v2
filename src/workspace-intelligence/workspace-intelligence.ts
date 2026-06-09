/**
 * Workspace Intelligence — orchestrates workspace awareness and advisory answers.
 */

import { publishOperatorFeedStage } from '../operator-feed/index.js';
import { buildDependencyGraph } from '../dependency-intelligence/index.js';
import { bridgeVaultFactsIntoUnderstanding } from '../project-vault-intelligence/project-vault-understanding-bridge.js';
import { recallRelevantMemories } from '../shared-memory/shared-memory-recall.js';
import { buildTimelineState } from '../timeline-intelligence/timeline-state-model.js';
import { buildWorkspaceSnapshot } from './workspace-context-builder.js';
import { boundariesForActiveWorkspace, summarizeBoundaries } from './workspace-boundary-detector.js';
import {
  analyzeWorkspaceIsolation,
  listWorkspaceFileAreas,
  listWorkspaceModules,
} from './workspace-isolation-analyzer.js';
import {
  findProjectLinkForWorkspace,
  resolveActiveProject,
  resolveWorkspaceOwner,
} from './workspace-owner-resolver.js';
import { applyRisksToSnapshot } from './workspace-risk-detector.js';
import {
  getWorkspaceIntelligenceDiagnostics,
  updateWorkspaceIntelligenceDiagnostics,
} from './workspace-intelligence-diagnostics.js';
import {
  isDuplicateWorkspaceBrainQuestion,
  type WorkspaceAnalysis,
  type WorkspaceAnswer,
  type WorkspaceBoundaryType,
  type WorkspaceIntelligenceDiagnostics,
  type WorkspaceIntelligenceSnapshot,
} from './workspace-intelligence-types.js';

export function displayBoundaryType(type: WorkspaceBoundaryType): string {
  return type.replace(/_/g, ' ').toLowerCase();
}

function enrichSnapshot(query: string): WorkspaceIntelligenceSnapshot {
  buildDependencyGraph();
  bridgeVaultFactsIntoUnderstanding(query);
  recallRelevantMemories(query);
  buildTimelineState();

  const base = buildWorkspaceSnapshot();
  return applyRisksToSnapshot(base);
}

export function analyzeWorkspace(query: string): WorkspaceAnalysis {
  const snapshot = enrichSnapshot(query);
  const isolation = analyzeWorkspaceIsolation(query, snapshot);
  updateWorkspaceIntelligenceDiagnostics(query, snapshot);

  return {
    query,
    snapshot,
    ...isolation,
  };
}

function composeResponse(query: string, analysis: WorkspaceAnalysis): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Workspace Intelligence Response', ''];
  const { snapshot } = analysis;
  const active = resolveActiveProject(snapshot);

  if (isDuplicateWorkspaceBrainQuestion(query)) {
    lines.push('Recommendation: No.');
    lines.push('Why: Phase 12.3 Workspace Intelligence extends workspace awareness — do not create workspace_brain or workspace_memory_authority.');
    lines.push('Risk level: High if duplicated.');
    lines.push('Next safe action: Extend Workspace Intelligence into existing Command Center routing.');
    return lines.join('\n');
  }

  if (lower.includes('what workspace') || lower.includes('which workspace') || lower.includes('workspace am i')) {
    lines.push(`Active workspace: ${snapshot.activeWorkspace?.workspaceName ?? 'None'}`);
    lines.push(`Workspace ID: ${snapshot.activeWorkspace?.workspaceId ?? 'none'}`);
    lines.push(`Confidence: ${snapshot.activeWorkspace?.confidence ?? 'LOW'}`);
  } else if (lower.includes('project owns') || lower.includes('owns this workspace')) {
    const owner = snapshot.activeWorkspace
      ? resolveWorkspaceOwner(snapshot.activeWorkspace.workspaceId, snapshot)
      : null;
    if (owner?.resolved) {
      lines.push(`Project owner: ${owner.projectName} (${owner.projectId})`);
      lines.push(`Owner source: ${owner.owner}`);
      lines.push(`Reason: ${owner.reason}`);
    } else {
      lines.push('Workspace ownership could not be fully resolved — advisory review required.');
    }
  } else if (lower.includes('modules belong')) {
    lines.push('Modules in active workspace:');
    for (const mod of listWorkspaceModules(snapshot)) {
      lines.push(`• ${mod}`);
    }
  } else if (lower.includes('files appear') || lower.includes('files belong')) {
    lines.push('File areas associated with active workspace:');
    for (const area of listWorkspaceFileAreas(snapshot)) {
      lines.push(`• ${area}`);
    }
  } else if (lower.includes('active project') || lower.includes('project is currently')) {
    lines.push(`Active project: ${active.projectName} (${active.projectId})`);
    lines.push(`Bound to workspace: ${active.workspaceId}`);
    lines.push(`Ownership confidence: ${active.confidence}`);
  } else if (lower.includes('mismatch')) {
    lines.push(`Workspace mismatch risks: ${snapshot.mismatchCount}`);
    for (const risk of snapshot.risks.filter((r) => r.riskType === 'mismatch')) {
      lines.push(`• ${risk.summary}`);
    }
    if (snapshot.mismatchCount === 0) lines.push('• No workspace/project mismatch risks detected.');
  } else if (lower.includes('leakage') || lower.includes('isolated') || lower.includes('isolation')) {
    lines.push(`Context leakage risk: ${snapshot.contextLeakageRisk}`);
    for (const warning of analysis.isolationWarnings) {
      lines.push(`• ${warning}`);
    }
    if (analysis.isolationWarnings.length === 0) {
      lines.push('• Shared Memory, Vault, and Dependency context should remain scoped to active workspace.');
    }
  } else if (lower.includes('work belong') || lower.includes('should this work')) {
    lines.push(`Recommended project: ${analysis.recommendedProject ?? active.projectName}`);
    lines.push(`Safe to reason in active workspace: ${analysis.safeToReason ? 'Yes' : 'Review boundaries first'}`);
  } else if (lower.includes('boundaries')) {
    lines.push('Workspace boundaries:');
    for (const summary of summarizeBoundaries(boundariesForActiveWorkspace(snapshot))) {
      lines.push(`• ${summary}`);
    }
  } else if (lower.includes('workspace intelligence risks') || lower.includes('workspace risk')) {
    lines.push(`Workspace risks (${snapshot.risks.length}):`);
    if (snapshot.risks.length === 0) {
      lines.push('• No workspace intelligence risks detected.');
    } else {
      for (const risk of snapshot.risks.slice(0, 8)) {
        lines.push(`• [${risk.riskType}] ${risk.summary}`);
      }
    }
  } else {
    lines.push(`Workspaces registered: ${snapshot.workspaceCount}`);
    lines.push(`Active workspace: ${snapshot.activeWorkspace?.workspaceName ?? 'None'}`);
    lines.push(`Active project: ${snapshot.activeProject?.projectName ?? 'None'}`);
    lines.push(`Ownership confidence: ${snapshot.ownershipConfidence}`);
    lines.push(`Risk count: ${snapshot.risks.length}`);
  }

  lines.push('');
  lines.push('Advisory only — no execution, file writes, or memory authority replacement performed.');
  return lines.join('\n');
}

export function processWorkspaceIntelligenceRequest(query: string): WorkspaceAnswer {
  publishOperatorFeedStage('Reading Workspace Intelligence', 'workspace_intelligence', { query });
  const analysis = analyzeWorkspace(query);
  return {
    query,
    analysis,
    responseText: composeResponse(query, analysis),
  };
}

export function workspaceFactsFromAnalysis(analysis: WorkspaceAnalysis): Array<{
  title: string;
  statement: string;
  tags: string[];
}> {
  const facts: Array<{ title: string; statement: string; tags: string[] }> = [];
  const snap = analysis.snapshot;

  if (snap.activeWorkspace) {
    facts.push({
      title: 'Active workspace',
      statement: `${snap.activeWorkspace.workspaceName} (${snap.activeWorkspace.workspaceId}) — project ${snap.activeWorkspace.projectName}`,
      tags: ['workspace', 'active', snap.activeWorkspace.workspaceId],
    });
  }

  if (snap.activeProject) {
    facts.push({
      title: 'Active project',
      statement: `${snap.activeProject.projectName} (${snap.activeProject.projectId}) is the active project for workspace reasoning.`,
      tags: ['workspace', 'project', 'active'],
    });
  }

  for (const mod of snap.modules.slice(0, 6)) {
    facts.push({
      title: `Workspace module: ${mod.moduleName}`,
      statement: `${mod.moduleName} belongs to workspace ${mod.workspaceId} — owner ${mod.owner}`,
      tags: ['workspace', 'module', mod.moduleId],
    });
  }

  for (const risk of snap.risks.slice(0, 5)) {
    facts.push({
      title: `Workspace risk: ${risk.riskType}`,
      statement: risk.summary,
      tags: ['workspace', 'risk', risk.riskType],
    });
  }

  return facts;
}

export function getWorkspaceIntelligenceContext(query: string): {
  analysis: WorkspaceAnalysis;
  diagnostics: WorkspaceIntelligenceDiagnostics;
  workspaceRisks: string[];
  workspaceOwnershipConfidence: string;
  workspaceMismatchCount: number;
  contextIsolationWarnings: string[];
} {
  const analysis = analyzeWorkspace(query);
  return {
    analysis,
    diagnostics: getWorkspaceIntelligenceDiagnostics(),
    workspaceRisks: analysis.snapshot.risks.map((r) => r.summary),
    workspaceOwnershipConfidence: analysis.snapshot.ownershipConfidence,
    workspaceMismatchCount: analysis.snapshot.mismatchCount,
    contextIsolationWarnings: analysis.isolationWarnings,
  };
}

export { findProjectLinkForWorkspace };
